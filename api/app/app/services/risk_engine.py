"""OSHA & ILO Occupational Heat Safety Engine.

Provides mathematically grounded algorithms for:
- Wet Bulb Globe Temperature (WBGT) approximations (Stull wet-bulb + solar globe model)
- OSHA & ILO Work/Rest ratio cycles (50/10, 30/30, 15/45, 60/0)
- Hydration Rate requirements (Liters/hour)
- Risk level classification & FortyGuard persistence escalation rules
"""

import math
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import Optional, Tuple


class RiskLevel(str, Enum):
    NORMAL = "normal"
    ELEVATED = "elevated"
    EXTREME = "extreme"


class WorkloadCategory(str, Enum):
    LIGHT = "light"
    MODERATE = "moderate"
    HEAVY = "heavy"
    VERY_HEAVY = "very_heavy"


@dataclass
class WorkRestCycle:
    work_minutes: int
    rest_minutes: int
    ratio_str: str
    description: str


@dataclass
class SafetyAssessment:
    risk_level: RiskLevel
    wbgt_f: float
    wbgt_c: float
    temperature_f: float
    temperature_c: float
    relative_humidity: float
    solar_irradiance: float
    work_rest_cycle: WorkRestCycle
    hydration_rate_l_hr: float
    persistence_escalated: bool
    escalation_reason: Optional[str] = None


def fahrenheit_to_celsius(temp_f: float) -> float:
    """Convert Fahrenheit to Celsius."""
    return (temp_f - 32.0) * 5.0 / 9.0


def celsius_to_fahrenheit(temp_c: float) -> float:
    """Convert Celsius to Fahrenheit."""
    return (temp_c * 9.0 / 5.0) + 32.0


def calculate_stull_wet_bulb(temp_c: float, relative_humidity: float) -> float:
    """Calculate natural wet-bulb temperature (°C) using Stull's equation (2011).

    Valid for relative humidity between 5% and 99% and temperatures -20°C to 50°C.
    """
    rh = max(0.0, min(100.0, relative_humidity))
    t = temp_c

    twb = (
        t * math.atan(0.151977 * math.pow(rh + 8.313659, 0.5))
        + math.atan(t + rh)
        - math.atan(rh - 1.676331)
        + 0.00391838 * math.pow(rh, 1.5) * math.atan(0.023101 * rh)
        - 4.686035
    )
    return twb


def calculate_globe_temperature(
    temp_c: float, solar_irradiance: float = 800.0, wind_speed_m_s: float = 1.0
) -> float:
    """Calculate estimated outdoor globe temperature Tg (°C).

    Accounts for dry bulb temp, direct solar radiation (W/m²), and convective cooling from wind.
    """
    s = max(0.0, solar_irradiance)
    v = max(0.2, wind_speed_m_s)
    tg = temp_c + (0.018 * s) - (0.2 * v)
    return max(temp_c, tg)


def calculate_wbgt(
    temperature_f: float,
    relative_humidity: float = 50.0,
    solar_irradiance: float = 800.0,
    wind_speed_m_s: float = 1.0,
) -> Tuple[float, float]:
    """Calculate Outdoor Wet Bulb Globe Temperature (WBGT).

    Formula: WBGT = 0.7 * T_nw + 0.2 * T_g + 0.1 * T_a
    Returns tuple of (wbgt_f, wbgt_c).
    """
    temp_c = fahrenheit_to_celsius(temperature_f)
    t_nw = calculate_stull_wet_bulb(temp_c, relative_humidity)
    t_g = calculate_globe_temperature(temp_c, solar_irradiance, wind_speed_m_s)

    wbgt_c = (0.7 * t_nw) + (0.2 * t_g) + (0.1 * temp_c)
    wbgt_f = celsius_to_fahrenheit(wbgt_c)

    return round(wbgt_f, 2), round(wbgt_c, 2)


def calculate_work_rest_ratio(
    wbgt_f: float, workload: WorkloadCategory | str = WorkloadCategory.MODERATE
) -> WorkRestCycle:
    """Determine OSHA / ILO recommended Work/Rest ratio cycle based on WBGT (°F).

    Standard threshold cycles for moderate outdoor workload:
    - WBGT < 82.4°F (28°C): Continuous Work (60/0)
    - 82.4°F <= WBGT < 86.0°F (28-30°C): 50 min work / 10 min rest (50/10)
    - 86.0°F <= WBGT < 89.6°F (30-32°C): 30 min work / 30 min rest (30/30)
    - WBGT >= 89.6°F (32°C): 15 min work / 45 min rest (15/45)
    """
    if isinstance(workload, str):
        workload = WorkloadCategory(workload.lower())

    offset = 0.0
    if workload == WorkloadCategory.LIGHT:
        offset = 2.0
    elif workload == WorkloadCategory.HEAVY:
        offset = -2.0
    elif workload == WorkloadCategory.VERY_HEAVY:
        offset = -4.0

    t_elevated = 82.4 + offset
    t_high = 86.0 + offset
    t_extreme = 89.6 + offset

    if wbgt_f >= t_extreme:
        return WorkRestCycle(
            work_minutes=15,
            rest_minutes=45,
            ratio_str="15/45",
            description="15 minutes work / 45 minutes rest per hour (Severe heat hazard)",
        )
    elif wbgt_f >= t_high:
        return WorkRestCycle(
            work_minutes=30,
            rest_minutes=30,
            ratio_str="30/30",
            description="30 minutes work / 30 minutes rest per hour (High heat stress)",
        )
    elif wbgt_f >= t_elevated:
        return WorkRestCycle(
            work_minutes=50,
            rest_minutes=10,
            ratio_str="50/10",
            description="50 minutes work / 10 minutes rest per hour (Elevated heat stress)",
        )
    else:
        return WorkRestCycle(
            work_minutes=60,
            rest_minutes=0,
            ratio_str="60/0",
            description="Continuous work allowed with standard hydration",
        )


def calculate_hydration_rate(
    wbgt_f: float,
    temperature_f: float,
    relative_humidity: float = 50.0,
    solar_irradiance: float = 800.0,
) -> float:
    """Calculate recommended fluid intake (Liters per hour) based on OSHA & NIOSH guidelines.

    Bounded between 0.50 L/hr (light heat) and 1.50 L/hr (maximum safe fluid intake rate).
    """
    base = 0.50
    wbgt_delta = max(0.0, wbgt_f - 75.0)
    wbgt_component = wbgt_delta * 0.025

    solar_delta = max(0.0, solar_irradiance - 400.0)
    solar_component = solar_delta * 0.00025

    rh_delta = max(0.0, relative_humidity - 50.0)
    rh_component = rh_delta * 0.003

    rate = base + wbgt_component + solar_component + rh_component
    rate = max(0.50, min(1.50, rate))
    return round(rate, 2)


def classify_risk(
    temperature_f: float,
    elevated_threshold: float = 100.0,
    extreme_threshold: float = 110.0,
    relative_humidity: Optional[float] = None,
    solar_irradiance: Optional[float] = None,
) -> RiskLevel:
    """Classify risk level from raw temperature and optional environmental parameters.

    Thresholds are per-site configurable. If relative humidity or solar irradiance are supplied,
    WBGT upgrades can elevate the risk category under severe atmospheric humidity/sunlight.
    """
    # 1. Base classification on configured site thresholds
    if temperature_f >= extreme_threshold:
        level = RiskLevel.EXTREME
    elif temperature_f >= elevated_threshold:
        level = RiskLevel.ELEVATED
    else:
        level = RiskLevel.NORMAL

    # 2. Environmental WBGT upgrade if relative humidity or solar irradiance are provided
    if relative_humidity is not None or solar_irradiance is not None:
        rh = relative_humidity if relative_humidity is not None else 50.0
        s = solar_irradiance if solar_irradiance is not None else 800.0
        wbgt_f, _ = calculate_wbgt(temperature_f, relative_humidity=rh, solar_irradiance=s)

        if level == RiskLevel.NORMAL and wbgt_f >= 82.4:
            level = RiskLevel.ELEVATED
        elif level == RiskLevel.ELEVATED and wbgt_f >= 92.0:
            level = RiskLevel.EXTREME

    return level


def classify_risk_with_persistence(
    temperature_f: float,
    elevated_threshold: float = 100.0,
    extreme_threshold: float = 110.0,
    elevated_since: Optional[datetime] = None,
    persistence_extreme_minutes: int = 30,
    relative_humidity: Optional[float] = None,
    solar_irradiance: Optional[float] = None,
) -> RiskLevel:
    """Extended classifier that upgrades ELEVATED to EXTREME if heat has persisted.

    Uses FortyGuard persistence layer data: if site has been >= elevated for
    persistence_extreme_minutes, treat as EXTREME even if raw temp is below extreme_threshold.
    """
    base = classify_risk(
        temperature_f=temperature_f,
        elevated_threshold=elevated_threshold,
        extreme_threshold=extreme_threshold,
        relative_humidity=relative_humidity,
        solar_irradiance=solar_irradiance,
    )

    if base == RiskLevel.ELEVATED and elevated_since is not None:
        now = datetime.now(timezone.utc)
        if elevated_since.tzinfo is None:
            elevated_since = elevated_since.replace(tzinfo=timezone.utc)

        duration = now - elevated_since
        if duration >= timedelta(minutes=persistence_extreme_minutes):
            return RiskLevel.EXTREME

    return base


def assess_occupational_heat_risk(
    temperature_f: float,
    relative_humidity: float = 50.0,
    solar_irradiance: float = 800.0,
    elevated_threshold: float = 100.0,
    extreme_threshold: float = 110.0,
    elevated_since: Optional[datetime] = None,
    persistence_extreme_minutes: int = 30,
    workload: WorkloadCategory | str = WorkloadCategory.MODERATE,
    wind_speed_m_s: float = 1.0,
) -> SafetyAssessment:
    """Full comprehensive OSHA & ILO occupational heat safety assessment.

    Calculates WBGT, work/rest cycles, hydration rates, and persistence rules.
    """
    temp_c = fahrenheit_to_celsius(temperature_f)
    wbgt_f, wbgt_c = calculate_wbgt(
        temperature_f=temperature_f,
        relative_humidity=relative_humidity,
        solar_irradiance=solar_irradiance,
        wind_speed_m_s=wind_speed_m_s,
    )

    base_risk = classify_risk(
        temperature_f=temperature_f,
        elevated_threshold=elevated_threshold,
        extreme_threshold=extreme_threshold,
        relative_humidity=relative_humidity,
        solar_irradiance=solar_irradiance,
    )

    final_risk = base_risk
    persistence_escalated = False
    escalation_reason = None

    if base_risk == RiskLevel.ELEVATED and elevated_since is not None:
        now = datetime.now(timezone.utc)
        if elevated_since.tzinfo is None:
            elevated_since = elevated_since.replace(tzinfo=timezone.utc)

        duration = now - elevated_since
        if duration >= timedelta(minutes=persistence_extreme_minutes):
            final_risk = RiskLevel.EXTREME
            persistence_escalated = True
            escalation_reason = (
                f"Elevated heat persisted for {int(duration.total_seconds() / 60)} minutes "
                f"(threshold: {persistence_extreme_minutes} min)."
            )

    work_rest = calculate_work_rest_ratio(wbgt_f=wbgt_f, workload=workload)
    hydration = calculate_hydration_rate(
        wbgt_f=wbgt_f,
        temperature_f=temperature_f,
        relative_humidity=relative_humidity,
        solar_irradiance=solar_irradiance,
    )

    return SafetyAssessment(
        risk_level=final_risk,
        wbgt_f=wbgt_f,
        wbgt_c=wbgt_c,
        temperature_f=round(temperature_f, 2),
        temperature_c=round(temp_c, 2),
        relative_humidity=round(relative_humidity, 2),
        solar_irradiance=round(solar_irradiance, 2),
        work_rest_cycle=work_rest,
        hydration_rate_l_hr=hydration,
        persistence_escalated=persistence_escalated,
        escalation_reason=escalation_reason,
    )

"""Unit tests for the OSHA & ILO Safety Engine (risk_engine.py)."""

from datetime import datetime, timezone, timedelta
import pytest

from app.services.risk_engine import (
    RiskLevel,
    WorkloadCategory,
    fahrenheit_to_celsius,
    celsius_to_fahrenheit,
    calculate_stull_wet_bulb,
    calculate_globe_temperature,
    calculate_wbgt,
    calculate_work_rest_ratio,
    calculate_hydration_rate,
    classify_risk,
    classify_risk_with_persistence,
    assess_occupational_heat_risk,
)


def test_temperature_conversions():
    assert fahrenheit_to_celsius(32.0) == 0.0
    assert fahrenheit_to_celsius(212.0) == 100.0
    assert celsius_to_fahrenheit(0.0) == 32.0
    assert celsius_to_fahrenheit(100.0) == 212.0


def test_stull_wet_bulb():
    # At 30°C and 50% RH, wet bulb is approximately 21-22°C
    twb = calculate_stull_wet_bulb(30.0, 50.0)
    assert 21.0 <= twb <= 23.0


def test_globe_temperature():
    # At 35°C air temp, 800 W/m2 solar, 1 m/s wind -> Tg should be > 35°C
    tg = calculate_globe_temperature(35.0, solar_irradiance=800.0, wind_speed_m_s=1.0)
    assert tg > 35.0
    # Higher solar increases Tg
    tg_high_solar = calculate_globe_temperature(35.0, solar_irradiance=1200.0, wind_speed_m_s=1.0)
    assert tg_high_solar > tg


def test_calculate_wbgt():
    # 95°F, 50% RH, 800 W/m2 solar
    wbgt_f, wbgt_c = calculate_wbgt(95.0, relative_humidity=50.0, solar_irradiance=800.0)
    assert isinstance(wbgt_f, float)
    assert isinstance(wbgt_c, float)
    assert 80.0 <= wbgt_f <= 95.0


def test_work_rest_ratios():
    # Continuous work under low WBGT
    cycle_normal = calculate_work_rest_ratio(75.0)
    assert cycle_normal.ratio_str == "60/0"
    assert cycle_normal.work_minutes == 60
    assert cycle_normal.rest_minutes == 0

    # 50/10 cycle (elevated WBGT: 82.4°F - 86.0°F)
    cycle_elevated = calculate_work_rest_ratio(84.0)
    assert cycle_elevated.ratio_str == "50/10"
    assert cycle_elevated.work_minutes == 50
    assert cycle_elevated.rest_minutes == 10

    # 30/30 cycle (high WBGT: 86.0°F - 89.6°F)
    cycle_high = calculate_work_rest_ratio(88.0)
    assert cycle_high.ratio_str == "30/30"
    assert cycle_high.work_minutes == 30
    assert cycle_high.rest_minutes == 30

    # 15/45 cycle (extreme WBGT >= 89.6°F)
    cycle_extreme = calculate_work_rest_ratio(92.0)
    assert cycle_extreme.ratio_str == "15/45"
    assert cycle_extreme.work_minutes == 15
    assert cycle_extreme.rest_minutes == 45


def test_workload_category_adjustments():
    # Heavy workload lowers WBGT thresholds
    cycle_heavy = calculate_work_rest_ratio(84.0, workload=WorkloadCategory.HEAVY)
    # 84°F under heavy workload triggers 30/30 instead of 50/10
    assert cycle_heavy.ratio_str == "30/30"


def test_hydration_rate():
    # Hydration under mild conditions
    h_mild = calculate_hydration_rate(wbgt_f=70.0, temperature_f=75.0, relative_humidity=40.0, solar_irradiance=300.0)
    assert h_mild == 0.50  # Lower bound

    # Hydration under severe heat
    h_severe = calculate_hydration_rate(wbgt_f=92.0, temperature_f=105.0, relative_humidity=70.0, solar_irradiance=1000.0)
    assert 1.0 <= h_severe <= 1.50


def test_classify_risk():
    assert classify_risk(80.0, relative_humidity=30.0, solar_irradiance=200.0) == RiskLevel.NORMAL
    assert classify_risk(105.0) == RiskLevel.ELEVATED
    assert classify_risk(112.0) == RiskLevel.EXTREME


def test_persistence_escalation():
    now = datetime.now(timezone.utc)
    # Elevated temperature for only 10 minutes -> stays ELEVATED
    elevated_recent = now - timedelta(minutes=10)
    level1 = classify_risk_with_persistence(
        temperature_f=102.0,
        elevated_threshold=100.0,
        extreme_threshold=110.0,
        elevated_since=elevated_recent,
        persistence_extreme_minutes=30,
        relative_humidity=40.0,
        solar_irradiance=500.0,
    )
    assert level1 == RiskLevel.ELEVATED

    # Elevated temperature for 35 minutes -> escalates to EXTREME
    elevated_prolonged = now - timedelta(minutes=35)
    level2 = classify_risk_with_persistence(
        temperature_f=102.0,
        elevated_threshold=100.0,
        extreme_threshold=110.0,
        elevated_since=elevated_prolonged,
        persistence_extreme_minutes=30,
        relative_humidity=40.0,
        solar_irradiance=500.0,
    )
    assert level2 == RiskLevel.EXTREME


def test_full_safety_assessment():
    now = datetime.now(timezone.utc)
    elevated_since = now - timedelta(minutes=40)

    assessment = assess_occupational_heat_risk(
        temperature_f=102.0,
        relative_humidity=40.0,
        solar_irradiance=500.0,
        elevated_threshold=100.0,
        extreme_threshold=110.0,
        elevated_since=elevated_since,
        persistence_extreme_minutes=30,
        workload="moderate",
    )

    assert assessment.risk_level == RiskLevel.EXTREME
    assert assessment.persistence_escalated is True
    assert assessment.wbgt_f > 80.0
    assert assessment.work_rest_cycle.ratio_str in ("50/10", "30/30", "15/45")
    assert 0.6 <= assessment.hydration_rate_l_hr <= 1.50
    assert assessment.escalation_reason is not None
    assert "persisted" in assessment.escalation_reason.lower()

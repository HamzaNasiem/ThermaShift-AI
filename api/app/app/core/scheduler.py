"""Background poller: runs per-site heat checks with strict credit protection and DB caching."""

import asyncio
import logging
from datetime import datetime, timezone, timedelta

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.config import settings
from app.models.site import Site
from app.integrations import fortyguard
from app.services import risk_engine, notifier
from app.models.heat_snapshot import HeatSnapshot

logger = logging.getLogger(__name__)

# CREDIT PROTECTION: Do not re-poll FortyGuard if a snapshot exists within the last 4 hours
CACHE_TTL_HOURS = 4


async def _check_site(site: Site) -> None:
    """Fetch temperature for one site only if no recent cached snapshot exists."""
    async with AsyncSessionLocal() as db:
        try:
            # Check DB cache first to protect FortyGuard API credits
            cutoff = datetime.now(timezone.utc) - timedelta(hours=CACHE_TTL_HOURS)
            snap_res = await db.execute(
                select(HeatSnapshot)
                .where(HeatSnapshot.site_id == site.id, HeatSnapshot.captured_at >= cutoff)
                .order_by(HeatSnapshot.captured_at.desc())
                .limit(1)
            )
            existing = snap_res.scalar_one_or_none()
            if existing:
                logger.info(f"Site {site.name} ({site.id}) has fresh snapshot ({existing.temperature_f}°F, {existing.captured_at}). Skipping API call to conserve credits.")
                return

            logger.info(f"Polling FortyGuard API for site {site.id} ({site.name})")
            raw = await fortyguard.get_site_temperature(site.polygon_geojson)
            temp_f = fortyguard.extract_temperature(raw)
            level = risk_engine.classify_risk(
                temperature_f=temp_f,
                elevated_threshold=float(site.elevated_threshold_f),
                extreme_threshold=float(site.extreme_threshold_f),
            )
            snapshot = HeatSnapshot(
                site_id=site.id,
                fortyguard_activity_id=raw.get("data", {}).get("activity_id") or raw.get("activity_id"),
                temperature_f=temp_f,
                analysis_layer="snapshot",
                risk_level=level.value,
                raw_response=raw,
            )
            db.add(snapshot)
            await db.commit()
            await db.refresh(snapshot)

            if level == risk_engine.RiskLevel.EXTREME:
                await notifier.dispatch(db, site, snapshot)
        except Exception as exc:
            logger.error(f"Error polling site {site.id}: {exc}", exc_info=True)


async def poll_loop() -> None:
    """Poller loop with credit protection — sleeps for 60 minutes between cycles."""
    logger.info("Background poller initialized with Credit-Protection Caching enabled")
    while True:
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Site))
                sites = result.scalars().all()

            for site in sites:
                await _check_site(site)
                # Small delay between sites to avoid bursts
                await asyncio.sleep(2.0)
        except Exception as exc:
            logger.error(f"Poller loop error: {exc}", exc_info=True)

        # Sleep for at least 60 minutes to prevent credit drain
        await asyncio.sleep(3600)


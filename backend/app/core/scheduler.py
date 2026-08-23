"""Background poller: runs per-site heat checks on a configurable interval."""

import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.config import settings
from app.models.site import Site
from app.integrations import fortyguard
from app.services import risk_engine, notifier
from app.models.heat_snapshot import HeatSnapshot

logger = logging.getLogger(__name__)


async def _check_site(site: Site) -> None:
    """Fetch temperature for one site, classify risk, dispatch alerts if needed."""
    async with AsyncSessionLocal() as db:
        try:
            logger.info(f"Polling site {site.id} ({site.name})")
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
    """Continuous asyncio loop that polls all sites at their configured intervals."""
    logger.info("Background poller started")
    while True:
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Site))
                sites = result.scalars().all()

            tasks = [_check_site(site) for site in sites]
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)
        except Exception as exc:
            logger.error(f"Poller loop error: {exc}", exc_info=True)

        await asyncio.sleep(settings.default_poll_interval_minutes * 60)

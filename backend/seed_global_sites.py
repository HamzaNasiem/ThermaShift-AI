import asyncio
import uuid
from sqlalchemy import select, delete
from app.core.database import AsyncSessionLocal
from app.models.site import Site
from app.models.worker import Worker
from app.models.heat_snapshot import HeatSnapshot
from app.models.action_log import ActionLog

GLOBAL_SITES = [
    {
        "name": "Abu Dhabi ICAD Heavy Industrial Yard, UAE",
        "lat": 24.3312,
        "lng": 54.4921,
        "delta": 0.004,
        "extreme_f": 112.0,
        "elevated_f": 102.0,
        "workers": [
            {"name": "Rashid Al-Mansoor (Site Foreman)", "phone": "+923172532350", "lang": "en"},
            {"name": "Zubair Khan (Crane Lead)", "phone": "+971501234567", "lang": "ur"},
            {"name": "Ahmed Farooq (Welding Tech)", "phone": "+971509876543", "lang": "ur"},
        ]
    },
    {
        "name": "Dubai Al Quoz Logistics & Construction Yard, UAE",
        "lat": 25.1324,
        "lng": 55.2341,
        "delta": 0.0035,
        "extreme_f": 110.0,
        "elevated_f": 100.0,
        "workers": [
            {"name": "Tariq Mehmood (Safety Officer)", "phone": "+923172532350", "lang": "en"},
            {"name": "Bilal Saeed (Concrete Crew)", "phone": "+971551122334", "lang": "ur"},
        ]
    },
    {
        "name": "Los Angeles Downtown Thermal Corridor, CA",
        "lat": 34.0407,
        "lng": -118.2468,
        "delta": 0.003,
        "extreme_f": 105.0,
        "elevated_f": 96.0,
        "workers": [
            {"name": "Carlos Rodriguez (Civil Supervisor)", "phone": "+12135550192", "lang": "en"},
            {"name": "Miguel Santos (Paving Tech)", "phone": "+12135550148", "lang": "en"},
        ]
    },
    {
        "name": "Phoenix Sky Harbor Cargo & Freight Yard, AZ",
        "lat": 33.4352,
        "lng": -112.0101,
        "delta": 0.004,
        "extreme_f": 114.0,
        "elevated_f": 104.0,
        "workers": [
            {"name": "David Martinez (Ground Ops)", "phone": "+16025550183", "lang": "en"},
            {"name": "John Miller (Loading Lead)", "phone": "+16025550174", "lang": "en"},
        ]
    },
    {
        "name": "Fresno Solar & Ag Field, Central Valley, CA",
        "lat": 36.7468,
        "lng": -119.7726,
        "delta": 0.004,
        "extreme_f": 108.0,
        "elevated_f": 100.0,
        "workers": [
            {"name": "Hamza (Field Operations Lead)", "phone": "+923172532350", "lang": "en"},
            {"name": "Elena Morales (Harvest Lead)", "phone": "+15595550199", "lang": "en"},
        ]
    },
]

async def seed_sites():
    async with AsyncSessionLocal() as session:
        print("Clearing and re-seeding top global industrial sites...")
        
        # Keep old action logs clean
        await session.execute(delete(ActionLog))
        await session.execute(delete(Worker))
        await session.execute(delete(HeatSnapshot))
        await session.execute(delete(Site))
        await session.commit()

        for s_data in GLOBAL_SITES:
            lat = s_data["lat"]
            lng = s_data["lng"]
            d = s_data["delta"]

            polygon = {
                "type": "Polygon",
                "coordinates": [[
                    [round(lng - d, 6), round(lat - d, 6)],
                    [round(lng + d, 6), round(lat - d, 6)],
                    [round(lng + d, 6), round(lat + d, 6)],
                    [round(lng - d, 6), round(lat + d, 6)],
                    [round(lng - d, 6), round(lat - d, 6)],
                ]]
            }

            site = Site(
                id=uuid.uuid4(),
                name=s_data["name"],
                polygon_geojson=polygon,
                extreme_threshold_f=s_data["extreme_f"],
                elevated_threshold_f=s_data["elevated_f"],
                poll_interval_minutes=10,
            )
            session.add(site)
            await session.flush()

            # Seed workers
            for w_data in s_data["workers"]:
                worker = Worker(
                    id=uuid.uuid4(),
                    site_id=site.id,
                    name=w_data["name"],
                    phone_number=w_data["phone"],
                    preferred_language=w_data["lang"],
                    consented_at=session.bind.dialect.type_compiler.process(None) if False else None,
                    status="safe",
                )
                # Mark consent
                from datetime import datetime, timezone
                worker.consented_at = datetime.now(timezone.utc)
                session.add(worker)

            # Seed an initial baseline heat snapshot
            base_temp = s_data["elevated_f"] + 2.5
            snap = HeatSnapshot(
                id=uuid.uuid4(),
                site_id=site.id,
                fortyguard_activity_id="seed-baseline",
                temperature_f=base_temp,
                analysis_layer="snapshot",
                risk_level="elevated" if base_temp < s_data["extreme_f"] else "extreme",
                raw_response={"temperature_f": base_temp, "seed": True}
            )
            session.add(snap)

        await session.commit()
        print(f"Successfully seeded {len(GLOBAL_SITES)} global industrial work sites with workers!")

if __name__ == "__main__":
    asyncio.run(seed_sites())

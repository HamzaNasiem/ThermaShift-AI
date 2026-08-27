import asyncio
import uuid
from datetime import datetime, timezone
from sqlalchemy import select, delete
from app.core.database import AsyncSessionLocal
from app.models.manager import Manager
from app.models.site import Site
from app.models.worker import Worker
from app.models.heat_snapshot import HeatSnapshot
from app.models.action_log import ActionLog

DEFAULT_MANAGER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

GLOBAL_SITES = [
    {
        "id": uuid.UUID("7eec064d-7724-49b9-b99f-9458017fa542"),
        "name": "Abu Dhabi ICAD Heavy Industrial Yard, UAE",
        "lat": 24.3312,
        "lng": 54.4921,
        "delta": 0.004,
        "extreme_f": 112.0,
        "elevated_f": 102.0,
        "workers": [
            {"id": uuid.UUID("11111111-1111-1111-1111-111111111111"), "name": "Rashid Al-Mansoor (Site Foreman)", "phone": "+923172532350", "lang": "en"},
            {"id": uuid.UUID("11111111-1111-1111-1111-111111111112"), "name": "Zubair Khan (Crane Lead)", "phone": "+971501234567", "lang": "ur"},
            {"id": uuid.UUID("11111111-1111-1111-1111-111111111113"), "name": "Ahmed Farooq (Welding Tech)", "phone": "+971509876543", "lang": "ur"},
        ]
    },
    {
        "id": uuid.UUID("74e05dd1-39ae-449d-b894-729eb166edf8"),
        "name": "Dubai Al Quoz Logistics & Construction Yard, UAE",
        "lat": 25.1324,
        "lng": 55.2341,
        "delta": 0.0035,
        "extreme_f": 110.0,
        "elevated_f": 100.0,
        "workers": [
            {"id": uuid.UUID("22222222-2222-2222-2222-222222222222"), "name": "Tariq Mehmood (Safety Officer)", "phone": "+923172532350", "lang": "en"},
            {"id": uuid.UUID("22222222-2222-2222-2222-222222222223"), "name": "Bilal Saeed (Concrete Crew)", "phone": "+971551122334", "lang": "ur"},
        ]
    },
    {
        "id": uuid.UUID("4c417991-d47a-4f62-a82c-1a9e7aab65fb"),
        "name": "Los Angeles Downtown Thermal Corridor, CA",
        "lat": 34.0407,
        "lng": -118.2468,
        "delta": 0.003,
        "extreme_f": 105.0,
        "elevated_f": 96.0,
        "workers": [
            {"id": uuid.UUID("33333333-3333-3333-3333-333333333333"), "name": "Carlos Rodriguez (Civil Supervisor)", "phone": "+12135550192", "lang": "en"},
            {"id": uuid.UUID("33333333-3333-3333-3333-333333333334"), "name": "Miguel Santos (Paving Tech)", "phone": "+12135550148", "lang": "en"},
        ]
    },
    {
        "id": uuid.UUID("0bce18cc-6a3d-45db-b34b-e89491279632"),
        "name": "Phoenix Sky Harbor Cargo & Freight Yard, AZ",
        "lat": 33.4352,
        "lng": -112.0101,
        "delta": 0.004,
        "extreme_f": 114.0,
        "elevated_f": 104.0,
        "workers": [
            {"id": uuid.UUID("44444444-4444-4444-4444-444444444444"), "name": "David Martinez (Ground Ops)", "phone": "+16025550183", "lang": "en"},
            {"id": uuid.UUID("44444444-4444-4444-4444-444444444445"), "name": "John Miller (Loading Lead)", "phone": "+16025550174", "lang": "en"},
        ]
    },
    {
        "id": uuid.UUID("f6d5e1d6-15f8-4b1b-af71-aabb9df179be"),
        "name": "Fresno Solar & Ag Field, Central Valley, CA",
        "lat": 36.7468,
        "lng": -119.7726,
        "delta": 0.004,
        "extreme_f": 108.0,
        "elevated_f": 100.0,
        "workers": [
            {"id": uuid.UUID("55555555-5555-5555-5555-555555555555"), "name": "Hamza (Field Operations Lead)", "phone": "+923172532350", "lang": "en"},
            {"id": uuid.UUID("55555555-5555-5555-5555-555555555556"), "name": "Elena Morales (Harvest Lead)", "phone": "+15595550199", "lang": "en"},
        ]
    },
]


async def seed_sites():
    from app.core.database import engine, Base
    import app.models  # load all models
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        print("Clearing and re-seeding top global industrial sites...")

        # Keep old records clean
        await session.execute(delete(ActionLog))
        await session.execute(delete(Worker))
        await session.execute(delete(HeatSnapshot))
        await session.execute(delete(Site))
        await session.execute(delete(Manager))
        await session.commit()

        # Seed Default Manager
        manager = Manager(
            id=DEFAULT_MANAGER_ID,
            name="ThermaShift Safety Operations",
            email="ops@thermashift.ai",
        )
        session.add(manager)
        await session.flush()

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
                id=s_data["id"],
                manager_id=DEFAULT_MANAGER_ID,
                name=s_data["name"],
                polygon_geojson=polygon,
                extreme_threshold_f=s_data["extreme_f"],
                elevated_threshold_f=s_data["elevated_f"],
                poll_interval_minutes=10,
            )
            session.add(site)
            await session.flush()

            # Seed workers with deterministic IDs and consent
            for w_data in s_data["workers"]:
                worker = Worker(
                    id=w_data["id"],
                    site_id=site.id,
                    name=w_data["name"],
                    phone_number=w_data["phone"],
                    preferred_language=w_data["lang"],
                    consented_at=datetime.now(timezone.utc),
                    status="safe",
                )
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
                raw_response={"temperature_f": base_temp, "seed": True},
            )
            session.add(snap)

        await session.commit()
        print(f"Successfully seeded {len(GLOBAL_SITES)} global industrial work sites with workers and manager!")


if __name__ == "__main__":
    asyncio.run(seed_sites())

import httpx
import asyncio

async def test_heat_endpoints():
    site_id = "0f42262d-d50d-4aac-93d5-798c62b6da96"
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient() as client:
        print(f"Testing GET /heat/microclimate?site_id={site_id}")
        r1 = await client.get(f"{base_url}/heat/microclimate", params={"site_id": site_id})
        print(f"Status: {r1.status_code}")
        if r1.status_code == 200:
            print("Microclimate endpoint success!")
        else:
            print(f"Response: {r1.text}")
        
        print(f"\nTesting GET /heat/hourly-forecast?site_id={site_id}")
        r2 = await client.get(f"{base_url}/heat/hourly-forecast", params={"site_id": site_id})
        print(f"Status: {r2.status_code}")
        if r2.status_code == 200:
            print("Hourly forecast endpoint success!")
        else:
            print(f"Response: {r2.text}")

if __name__ == "__main__":
    asyncio.run(test_heat_endpoints())

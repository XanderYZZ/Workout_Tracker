from fastapi.testclient import TestClient
import sys
from pathlib import Path
from datetime import datetime, timedelta, timezone
import random

grandparent_dir = Path(__file__).resolve().parents[1]
sys.path.append(str(grandparent_dir))

from api import app

client = TestClient(app)

def test_full_workflow():
    start_date = datetime.now(timezone.utc).isoformat()
    print("\n=== TEST STARTED AT:", start_date, "===\n")

    email = "testingfull8@example.com"
    password = "Thetest123!"

    # Signup
    response = client.post("/auth/signup", json={"email": email, "password": password})
    access_token = ""
    if response.status_code == 201: 
        access_token = response.json()["access_token"]
    else:
        response = client.post("/auth/login", json={"email": email, "password": password})
        assert response.status_code == 200
        access_token = response.json()["access_token"]

    assert access_token != ""

    headers = {"Authorization": f"Bearer {access_token}"}

    for i in range(5):
        # === Use CURRENT TIME for scheduled_date ===
        workout_data = {
            "name": "Push Day",
            "comments": f"Test workout created.",
            "exercises": [
                {"name": "Bench Press", "sets": 3, "reps": 15, "weight": 100,},
                {"name": "Leg Press", "sets": 5, "reps": 15, "weight": 200,},
            ],
            "scheduled_date": datetime.now(timezone.utc).isoformat(),
        }

        response = client.post("/workouts/", json=workout_data, headers=headers)
        assert response.status_code == 201, f"Failed: {response.json()}"
        workout_id = response.json()["id"]
        print("Workout created successfully with ID:", workout_id)

        # List workouts
        response = client.get("/workouts/", headers=headers)
        assert response.status_code == 200
        workouts = response.json()
        assert len(workouts) >= 1
        print(f"Found {len(workouts)} workout(s) in list")

        # Update
        response = client.put(
            f"/workouts/{workout_id}",
            json={"comments": "Updated right after creation!"},
            headers=headers
        )
        assert response.status_code == 200
        assert response.json()["comments"] == "Updated right after creation!"

    response = client.post(f"/reports/contains", json={"exercise": "Bench Press",}, headers=headers)
    assert response.status_code == 200
    print(response.json())

    # Total volume with no exercise filter.
    response = client.post(f"/reports/volume", json={"start_date": start_date, "end_date": datetime.now(timezone.utc).isoformat(), "exercise": ""}, headers=headers)
    assert response.status_code == 200
    print(response.json())

    # Total volume with exercise filter.
    response = client.post(f"/reports/volume", json={"start_date": start_date, "end_date": datetime.now(timezone.utc).isoformat(), "exercise": "Bench Press"}, headers=headers)
    assert response.status_code == 200
    print(response.json())

    response = client.get(f"/workouts/", headers=headers)
    assert response.status_code == 200
    workouts = response.json()
    
    for workout in workouts:
        # Delete
        response = client.delete(f"/workouts/{workout["id"]}", headers=headers)
        assert response.status_code == 204
        print("Workout deleted successfully")

    print("\n=== FULL TEST PASSED ===\n")

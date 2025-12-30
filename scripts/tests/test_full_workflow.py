from fastapi.testclient import TestClient
import sys
from pathlib import Path
from datetime import datetime, timezone
import random

grandparent_dir = Path(__file__).resolve().parents[1]
sys.path.append(str(grandparent_dir))

from api import app

client = TestClient(app)

def test_full_workflow():
    print("\n=== TEST STARTED AT:", datetime.now(timezone.utc).isoformat(), "===\n")

    email = "testingfull@example.com"
    password = "test123"

    # Signup
    response = client.post("/signup", json={"email": email, "password": password})
    token = ""
    if response.status_code == 201: 
        token = response.json()["token"]
    else:
        response = client.post("/login", json={"email": email, "password": password})
        assert response.status_code == 200
        token = response.json()["token"]

    assert token != ""

    headers = {"Authorization": f"Bearer {token}"}
    exercises_to_choose = ("Push-up", "Squat", "Barbell Bench Press", "Barbell Overhead Press")

    for i in range(5):
        # === Use CURRENT TIME for scheduled_date ===
        workout_data = {
            "comments": f"Test workout created.",
            "exercises": [
                {"name": "Squat", "sets": 3, "reps": 15},
                {"name": random.choice(exercises_to_choose), "sets": 4, "reps": 10}
            ]
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

    response = client.get(f"/reports/contains", params={"exercise": "Squat",}, headers=headers)
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
from lib.database_lib.database_config import GetDb
from lib.misc.emails import SendEmail
from datetime import datetime, timezone, timedelta
from bson import ObjectId


def CheckPersonalRecords(user_id: str, workout_id: str):
    db = GetDb()
    workout = db["workouts"].find_one({"_id": ObjectId(workout_id)})
    user = db["users"].find_one({"_id": ObjectId(user_id)})

    if not workout or not user:
        return

    prs_broken = []

    for exercise in workout.get("exercises", []):
        name = exercise["name"]
        weight = exercise["weight"]

        pipeline = [
            {"$match": {"user_id": user_id, "_id": {"$ne": ObjectId(workout_id)}}},
            {"$unwind": "$exercises"},
            {"$match": {"exercises.name": name}},
            {"$group": {"_id": None, "max_weight": {"$max": "$exercises.weight"}}},
        ]

        result = list(db["workouts"].aggregate(pipeline))

        if not result or weight > result[0]["max_weight"]:
            prs_broken.append({"name": name, "weight": weight})

    if prs_broken and user.get("email"):
        lines = "\n".join(f"  - {e['name']}: {e['weight']} lbs" for e in prs_broken)
        body = f"You broke personal records in your latest workout!\n\n{lines}\n\nKeep it up!"
        SendEmail(user["email"], "New Personal Records!", body)


def SendWeeklySummary():
    db = GetDb()
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    for user in db["users"].find({}):
        user_id = str(user["_id"])
        email = user.get("email")

        if not email:
            continue

        weekly_workouts = list(db["workouts"].find({
            "user_id": user_id,
            "scheduled_date": {"$gte": week_ago, "$lte": now}
        }))

        if not weekly_workouts:
            continue

        prs = []
        for workout in weekly_workouts:
            for exercise in workout.get("exercises", []):
                name = exercise["name"]
                weight = exercise["weight"]

                pipeline = [
                    {"$match": {"user_id": user_id, "scheduled_date": {"$lt": week_ago}}},
                    {"$unwind": "$exercises"},
                    {"$match": {"exercises.name": name}},
                    {"$group": {"_id": None, "max_weight": {"$max": "$exercises.weight"}}},
                ]

                result = list(db["workouts"].aggregate(pipeline))

                if not result or weight > result[0]["max_weight"]:
                    prs.append(name)

        all_workout_dates = set(
            w["scheduled_date"].replace(tzinfo=timezone.utc).date()
            if w["scheduled_date"].tzinfo is None
            else w["scheduled_date"].date()
            for w in db["workouts"].find({"user_id": user_id})
        )

        streak = 0
        check_date = now.date()
        while check_date in all_workout_dates:
            streak += 1
            check_date -= timedelta(days=1)

        body = "Here's your workout summary for the past week:\n\n"
        body += f"Workouts logged: {len(weekly_workouts)}\n"

        if prs:
            body += f"Personal records broken: {', '.join(set(prs))}\n"
        else:
            body += "No new personal records this week.\n"

        body += f"Current streak: {streak} day(s)\n\nKeep up the great work!"

        SendEmail(email, "Your Weekly Workout Summary", body)

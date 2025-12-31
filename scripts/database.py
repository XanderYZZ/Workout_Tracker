from datetime import datetime, timezone
from bson import ObjectId
from pymongo import MongoClient
from pymongo.results import InsertOneResult
import config
from typing import Dict, List, Optional

MONGO_URI = config.MONGO_URI
client = MongoClient(MONGO_URI)

def GetDb():
    return client["database"]

def DoesUserExist(email: str) -> bool:
    users = GetDb()["users"]

    return users.find_one({"email": email}) is not None

def CreateUser(email: str, hashed_password: str) -> str:
    if DoesUserExist(email):
        raise ValueError("User already exists") 

    users = GetDb()["users"]
    result = users.insert_one({
        "email": email,
        "password": hashed_password
    })
    
    return str(result.inserted_id)  

def GetUserIdByEmail(email: str) -> str | None:
    users = GetDb()["users"]
    user = users.find_one({"email": email}, {"_id": 1})

    if user:
        return str(user["_id"])
    
    return None

def GetUserHashedPasswordInDB(email: str) -> str:
    user = GetDb()["users"].find_one({"email": email}, {"password": 1})

    if not user:
        raise ValueError("User not found")  
    
    return user["password"]

def CreateWorkout(workout_dict : Dict) -> str:
    workouts_collection = GetDb()["workouts"]
    
    result: InsertOneResult = workouts_collection.insert_one(workout_dict)
    
    return str(result.inserted_id)  

def GetWorkoutsForUser(user_id: str,
    start_date: Optional[datetime   ] = None,
    end_date: Optional[datetime] = None,
    limit: int = 50,
    skip: int = 0
) -> List[Dict]:
    workouts = GetDb()["workouts"]
    
    filter_query = {"user_id": user_id}

    if start_date or end_date:
        filter_query["scheduled_date"] = {}

        if start_date:
            filter_query["scheduled_date"]["$gte"] = start_date

        if end_date:
            filter_query["scheduled_date"]["$lte"] = end_date

    cursor = workouts.find(filter_query) \
                    .sort("scheduled_date", -1  ) \
                    .skip(skip) \
                    .limit(limit)
    
    results = []

    for doc in cursor:
        doc = MakeDatetimeAware(doc)
        doc["id"] = str(doc["_id"])
        del doc["_id"] 
        
        results.append(doc)
    
    return results

def UpdateWorkout(workout_id: str, user_id: str, update_data: Dict) -> bool:
    workouts = GetDb()["workouts"]

    result = workouts.update_one(
        {"_id": ObjectId(workout_id), "user_id": user_id},
        {"$set": update_data}
    )

    return result.modified_count > 0

def DeleteWorkout(workout_id: str, user_id: str) -> bool:
    workouts = GetDb()["workouts"]
    result = workouts.delete_one({"_id": ObjectId(workout_id), "user_id": user_id})

    return result.deleted_count > 0

def MakeDatetimeAware(doc: Optional[Dict]) -> Optional[Dict]:
    if not doc:
        return doc
    
    if doc.get("created_at") and doc["created_at"].tzinfo is None:
        doc["created_at"] = doc["created_at"].replace(tzinfo=timezone.utc)
    if doc.get("scheduled_date") and doc["scheduled_date"].tzinfo is None:
        doc["scheduled_date"] = doc["scheduled_date"].replace(tzinfo=timezone.utc)
    
    return doc

def GetWorkoutById(workout_id: str, user_id: str) -> Optional[Dict]:
    workouts = GetDb()["workouts"]
    workout = workouts.find_one({"_id": ObjectId(workout_id), "user_id": user_id})

    if workout:
        workout = MakeDatetimeAware(workout)
        workout["id"] = str(workout["_id"]) 

    return workout

def GetWorkoutsThatContainExercise(user_id : str, exercise_name : str) -> Optional[Dict]:
    results = []
    workouts = GetDb()["workouts"]
    pipeline = [
        {"$match": {
            "user_id": user_id,
            "exercises.name": exercise_name
        }},
        {"$sort": {"scheduled_date": -1}},
        {"$limit": 50}
    ]
    
    cursor = workouts.aggregate(pipeline)

    for workout in cursor:
        workout = MakeDatetimeAware(workout)
        workout["id"] = str(workout["_id"])
        results.append(workout)
    
    return results
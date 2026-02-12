from datetime import datetime, timezone
from bson import ObjectId
from pymongo.results import InsertOneResult
from typing import Dict, List, Optional
from ..database_config import GetDb, MakeDatetimeAware

def UpdateWorkout(workout_id: str, user_id: str, update_data: Dict) -> bool:
    workouts = GetDb()["workouts"]

    try:
        workouts.update_one(
            {"_id": ObjectId(workout_id), "user_id": user_id},
            {"$set": update_data}
        )

        return True
    except Exception as e:
        return False

def DeleteWorkout(workout_id: str, user_id: str) -> bool:
    workouts = GetDb()["workouts"]
    result = workouts.delete_one({"_id": ObjectId(workout_id), "user_id": user_id})

    return result.deleted_count > 0

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

def GetWorkoutById(workout_id: str, user_id: str) -> Optional[Dict]:
    workouts = GetDb()["workouts"]
    workout = workouts.find_one({"_id": ObjectId(workout_id), "user_id": user_id})

    if workout:
        workout = MakeDatetimeAware(workout)
        workout["id"] = str(workout["_id"]) 

    return workout

def GetNumberOfWorkoutsForUserOnDate(user_id: str, date: datetime) -> int:
    workouts = GetDb()["workouts"]
    
    start_of_day = datetime(date.year, date.month, date.day, tzinfo=timezone.utc)
    end_of_day = datetime(date.year, date.month, date.day, 23, 59, 59, 999999, tzinfo=timezone.utc)
    
    count = workouts.count_documents({
        "user_id": user_id,
        "scheduled_date": {
            "$gte": start_of_day, 
            "$lte": end_of_day
        }
    })
    
    return count
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

# Both the email and the username must be unique at this point in time.
# This might change in the future.
def DoesUserExist(email: str | None = None, username: str | None = None) -> bool:
    users = GetDb()["users"]

    return (email and users.find_one({"email": email}) is not None) or (username and users.find_one({"username": username}) is not None)

def CreateUser(email: str, username: str, hashed_password: str) -> str:
    if DoesUserExist(email, username):
        raise ValueError("User already exists") 

    users = GetDb()["users"]
    result = users.insert_one({
        "email": email,
        "username": username,
        "password": hashed_password
    })
    
    return str(result.inserted_id)  

def GetAllUserDetails(email: str):
    users = GetDb()["users"]

    return users.find_one({"email": email})

def GetUserIdByEmail(email: str) -> str | None:
    users = GetDb()["users"]
    user = users.find_one({"email": email}, {"_id": 1})

    if user:
        return str(user["_id"])
    
    return None

def GetUsernameByEmail(email: str) -> str | None: 
    users = GetDb()["users"]
    user = users.find_one({"email": email})

    if user:
        return user["username"]
    
    return None

def GetUserEmailByEmailOrUsername(email_or_username: str) -> str | None: 
    users = GetDb()["users"]
    user = users.find_one({"email": email_or_username})

    if user:
        return user["email"]
    
    user = users.find_one({"username": email_or_username})

    if user:
        return user["email"]
    
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

def UpdateBodyweight(email: str, bodyweight: float = 0) -> bool:
    users = GetDb()["users"]
    user_filter = {"email": email}
    update = {"$set": {"bodyweight": bodyweight,}}

    try:
        users.update_one(
            user_filter,
            update
        )

        return True
    except Exception as e:
        return False

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

def GetAllExercisesForUser(user_id: str) -> List[str]:
    workouts = GetDb()["workouts"]
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$unwind": "$exercises"},
        {"$group": {"_id": "$exercises.name"}},
        {"$sort": {"_id": 1}}
    ]
    
    cursor = workouts.aggregate(pipeline)
    exercises = [doc["_id"] for doc in cursor]
    
    return exercises

def GetWorkoutsThatContainExercise(user_id: str, exercise_name: str, start_date: datetime | None = None, end_date: datetime | None = None) -> List[Dict]:
    results = []
    workouts = GetDb()["workouts"]
    cursor = None

    if not start_date or not end_date:
        cursor = workouts.find({
            "user_id": user_id,
            "exercises.name": exercise_name,
        }).sort("scheduled_date", -1)
    else:
        cursor = workouts.find({
            "user_id": user_id,
            "exercises.name": exercise_name,
            "scheduled_date": {
                "$gte": start_date,
                "$lte": end_date
            },
        }).sort("scheduled_date", -1)
    
    for workout in cursor:
        workout = MakeDatetimeAware(workout)
        workout["id"] = str(workout["_id"])
        results.append(workout)
    
    return results

def GetAllWorkoutsInPeriod(user_id: str, start_date: datetime, end_date: datetime) -> List[Dict]:
    workouts = GetDb()["workouts"]
    cursor = workouts.find({
        "user_id": user_id,
        "scheduled_date": {
            "$gte": start_date,
            "$lte": end_date
        }
    }).sort("scheduled_date", -1)

    results = []

    for doc in cursor:
        doc = MakeDatetimeAware(doc)
        doc["id"] = str(doc["_id"])
        del doc["_id"] 
        
        results.append(doc)
    
    return results

def StoreRefreshToken(user_id: str, token_hash: str, expires_at: datetime, email: str, username: str, device_fingerprint: Optional[str] = None, parent_token_id: Optional[str] = None) -> str:
    refresh_tokens = GetDb()["refresh_tokens"]

    result = refresh_tokens.insert_one({
        "user_id": user_id,
        "email": email,
        "username": username,
        "token_hash": token_hash,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
        "device_fingerprint": device_fingerprint,
        "parent_token_id": parent_token_id
    })

    return str(result.inserted_id)

def GetRefreshTokenInfo(token_hash: str) -> Optional[Dict]:
    refresh_tokens = GetDb()["refresh_tokens"]
    token = refresh_tokens.find_one({
        "token_hash": token_hash,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })

    if token:
        return {
            "user_id": token["user_id"],
            "email": token["email"],
            "username": token["username"],
            "device_fingerprint": token.get("device_fingerprint"),
            "token_id": str(token["_id"])
        }
    
    return None

def ValidateRefreshToken(user_id: str, token_hash: str) -> bool:
    refresh_tokens = GetDb()["refresh_tokens"]
    token = refresh_tokens.find_one({
        "user_id": user_id,
        "token_hash": token_hash,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })

    return token is not None

def RevokeRefreshToken(token_hash: str) -> bool:
    refresh_tokens = GetDb()["refresh_tokens"]
    result = refresh_tokens.delete_one(
        {"token_hash": token_hash},
    )

    return result.deleted_count > 0

def RevokeAllUserRefreshTokens(user_id: str) -> int:
    refresh_tokens = GetDb()["refresh_tokens"]
    result = refresh_tokens.delete_many(
        {"user_id": user_id},
    )

    return result.deleted_count
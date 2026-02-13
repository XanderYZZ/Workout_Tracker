from datetime import datetime, timezone
from typing import Dict, List, Optional
from ..database_config import GetDb
from . import general_methods as general_methods

def UpdateWorkout(workout_id: str, user_id: str, update_data: Dict) -> bool:
    return general_methods.UpdateCollectionEntry("workouts", workout_id, user_id, update_data)

def DeleteWorkout(workout_id: str, user_id: str) -> bool:
    return general_methods.DeleteCollectionEntry("workouts", workout_id, user_id)

def CreateWorkout(workout_dict : Dict) -> str:
    return general_methods.CreateCollectionEntry("workouts", workout_dict)

def GetWorkoutsForUser(user_id: str, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None,
    limit: int = 50,
    skip: int = 0
) -> List[Dict]:
    return general_methods.GetCollectionEntriesForUser("workouts", user_id, start_date, end_date, limit, skip)

def GetWorkoutById(workout_id: str, user_id: str) -> Optional[Dict]:
    return general_methods.GetCollectionEntryById("workouts", workout_id, user_id)

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

def IsThereAWorkoutWithNameOnSameDate(user_id: str, name: str, date: datetime) -> bool:
    workouts = GetDb()["workouts"]

    start_of_day = datetime(date.year, date.month, date.day, tzinfo=timezone.utc)
    end_of_day = datetime(date.year, date.month, date.day, 23, 59, 59, 999999, tzinfo=timezone.utc)

    existing_workout = workouts.find_one({
        "user_id": user_id,
        "name": name,
        "scheduled_date": {
            "$gte": start_of_day,
            "$lte": end_of_day
        }
    })

    return existing_workout is not None
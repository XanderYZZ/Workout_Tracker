from typing import Dict, List, Optional
from lib.database_lib.database_config import GetDb
from . import general_methods as general_methods 

def UpdateRoutine(routine_id: str, user_id: str, update_data: Dict) -> bool:
    return general_methods.UpdateCollectionEntry("routines", routine_id, user_id, update_data)

def DeleteRoutine(routine_id: str, user_id: str) -> bool:
    return general_methods.DeleteCollectionEntry("routines", routine_id, user_id)

def CreateRoutine(routine_dict : Dict) -> str:
    return general_methods.CreateCollectionEntry("routines", routine_dict)

def GetRoutineById(routine_id: str, user_id: str) -> Optional[Dict]:
    return general_methods.GetCollectionEntryById("routines", routine_id, user_id)

def GetRoutinesForUser(user_id: str, limit: int = 50, skip: int = 0) -> List[Dict]:
    return general_methods.GetCollectionEntriesForUser("routines", user_id, None, None, limit, skip)

def IsThereARoutineWithName(user_id: str, name: str) -> bool:
    routines = GetDb()["routines"]
    existing_routine = routines.find_one({
        "user_id": user_id,
        "$expr": {
            "$eq": [
                {"$toLower": {"$trim": {"input": "$name"}}}, 
                name.strip().lower()                       
            ]
        }
    })

    return existing_routine is not None
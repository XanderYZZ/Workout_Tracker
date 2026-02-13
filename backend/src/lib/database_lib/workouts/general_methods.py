from datetime import datetime, timezone
from bson import ObjectId
from pymongo.results import InsertOneResult
from typing import Dict, List, Optional
from ..database_config import GetDb, MakeDatetimeAware

def UpdateCollectionEntry(collection_name: str, entry_id: str, user_id: str, update_data: Dict) -> bool:
    collection = GetDb()[collection_name]
    update_data["updated_at"] = datetime.now(timezone.utc)

    try:
        collection.update_one(
            {"_id": ObjectId(entry_id), "user_id": user_id},
            {"$set": update_data}
        )

        return True
    except Exception as e:
        return False

def DeleteCollectionEntry(collection_name: str, entry_id: str, user_id: str) -> bool:
    collection = GetDb()[collection_name]
    result = collection.delete_one({"_id": ObjectId(entry_id), "user_id": user_id})

    return result.deleted_count > 0

def CreateCollectionEntry(collection_name: str, entry_dict : Dict) -> str:
    collection = GetDb()[collection_name]
    result: InsertOneResult = collection.insert_one(entry_dict)
    
    return str(result.inserted_id)  

def GetCollectionEntriesForUser(collection_name: str, user_id: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 50,
    skip: int = 0
) -> List[Dict]:
    collection = GetDb()[collection_name]
    filter_query = {"user_id": user_id}

    if start_date or end_date:
        filter_query["scheduled_date"] = {}

        if start_date:
            filter_query["scheduled_date"]["$gte"] = start_date

        if end_date:
            filter_query["scheduled_date"]["$lte"] = end_date

    cursor = None

    if collection_name == "workouts":
        cursor = collection.find(filter_query).sort("scheduled_date", -1).skip(skip).limit(limit)
    else:
        cursor = collection.find(filter_query).skip(skip).limit(limit)
    
    results = []

    for doc in cursor:
        doc = MakeDatetimeAware(doc)
        doc["id"] = str(doc["_id"])
        del doc["_id"] 
        
        results.append(doc)
    
    return results

def GetCollectionEntryById(collection_name: str, entry_id: str, user_id: str) -> Optional[Dict]:
    collection = GetDb()[collection_name]
    entry = collection.find_one({"_id": ObjectId(entry_id), "user_id": user_id})

    if entry:
        entry = MakeDatetimeAware(entry)
        entry["id"] = str(entry["_id"]) 

    return entry
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
from ..database_config import GetDb
import config 

# Both the email and the username must be unique at this point in time.
# This might change in the future.
def IsUserInUsersCollection(users_collection, email: str | None = None, username: str | None = None) -> bool:
    if not email and not username:
        raise ValueError("email or username must be provided to IsUserInUsersCollection!")

    return users_collection.find_one({"email": email}) or users_collection.find_one({"username": username})

def DoesPendingUserExist(email: str | None = None, username: str | None = None) -> bool:
    pending_users = GetDb()["pending_users"]

    return IsUserInUsersCollection(pending_users, email, username)

def DoesVerifiedUserExist(email: str | None = None, username: str | None = None) -> bool:
    users = GetDb()["users"]

    return IsUserInUsersCollection(users, email, username)

def GetPendingUserByEmail(email: str) -> Optional[Dict]:
    pending_users = GetDb()["pending_users"]

    return pending_users.find_one({"email": email})

def DeletePendingUserByEmail(email: str) -> None:
    pending_users = GetDb()["pending_users"]
    pending_users.delete_one({"email": email})

def CreateUser(email: str, username: str, hashed_password: str, verification_token: str | None = None) -> str:
    if verification_token and DoesPendingUserExist(email, username):
        raise ValueError("Pending user already exists") 
    
    if DoesVerifiedUserExist(email, username):
        raise ValueError("Verified user already exists") 

    collection = GetDb()["users"] if not verification_token else GetDb()["pending_users"]
    data = {"email": email, "username": username, "password": hashed_password}

    if verification_token:
        data["verification_token"] = verification_token
        data["expires_at"] = datetime.now(timezone.utc) + timedelta(minutes=config.LINK_EXPIRATION_MINUTES)

    result = collection.insert_one(data)
    
    return str(result.inserted_id)  

def GetVerifiedUserByEmail(email: str) -> Optional[Dict]:
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
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
from .database_config import GetDb
import pymongo
import config 

INDEX_DEFINITIONS = {
    "users": [
        (
            [("email", pymongo.ASCENDING)],
            {"unique": True, "name": "users_email_unique"}
        ),
        (
            [("username", pymongo.ASCENDING)],
            {"unique": True, "name": "users_username_unique"}
        ),
    ],
    "pending_users": [
        (
            [("email", pymongo.ASCENDING)],
            {"unique": True, "name": "pending_users_email_unique"}
        ),
        (
            [("username", pymongo.ASCENDING)],
            {"unique": True, "name": "pending_users_username_unique"}
        ),
        (
            [("verification_token", pymongo.ASCENDING)],
            {"unique": True, "name": "pending_users_verification_token_unique"}
        ),
        (
            [("expires_at", pymongo.ASCENDING)],
            {"expireAfterSeconds": 0, "name": "pending_users_expiration_ttl"}
        ),
    ],
    "refresh_tokens": [
        (
            [("token_hash", pymongo.ASCENDING)],
            {"unique": True, "name": "refresh_tokens_token_hash_unique"}
        ),
        (
            [("user_id", pymongo.ASCENDING)],
            {"name": "refresh_tokens_user_id"}
        ),
        (
            [("expires_at", pymongo.ASCENDING)],
            {"expireAfterSeconds": 0, "name": "refresh_tokens_expiration_ttl"}
        ),
    ],
}

def EnsureIndexes() -> None:
    db = GetDb()

    for collection_name, indexes in INDEX_DEFINITIONS.items():
        collection = db[collection_name]

        for keys, options in indexes:
            collection.create_index(keys, **options)

# Both the email and the username must be unique at this point in time.
# This might change in the future.
def IsUserInUsersCollection(users_collection, email: str | None = None, username: str | None = None) -> bool:
    """
    IsUserInUsersCollection
    
    :param users_collection: users or pending_users
    :param email: email for user (optional)
    :type email: str | None
    :param username: username for user (optional)
    :type username: str | None
    :return: returns if user exists in the users_collection 
    :rtype: bool
    """
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

def SetResetPasswordToken(email: str, token: str) -> None:
    users = GetDb()["users"]
    user = users.find_one({"email": email})

    if not user:
        return None 

    users.update_one({"email": email}, {"$set": {"reset_password_token": token}})

def ResetPassword(email: str, hashed_password: str) -> None:
    users = GetDb()["users"]
    user = users.find_one({"email": email})

    if not user:
        raise ValueError(f"User does not exist for email ${email}!")

    users.update_one(
        {"email": email}, 
        {
            "$set": {
                "password": hashed_password,
            },
            "$unset": {
                "reset_password_token": "",
            },
        }
    )

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

def StoreRefreshToken(user_id: str, token_hash: str, expires_at: datetime, email: str, username: str, device_fingerprint: Optional[str] = None, parent_token_id: Optional[str] = None) -> str:
    """
    StoreRefreshToken
    
    :param user_id: user id
    :type user_id: str
    :param token_hash: token hash
    :type token_hash: str
    :param expires_at: time token expires
    :type expires_at: datetime
    :param email: user email
    :type email: str
    :param username: username
    :type username: str
    :param device_fingerprint: fingerprint of device
    :type device_fingerprint: Optional[str]
    :param parent_token_id: parent token id
    :type parent_token_id: Optional[str]
    :return: inserted id is returned
    :rtype: str
    """
    
    refresh_tokens = GetDb()["refresh_tokens"]

    # This is just to ensure that no user has multiple refresh tokens at a given time.
    RevokeAllUserRefreshTokens(user_id)

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
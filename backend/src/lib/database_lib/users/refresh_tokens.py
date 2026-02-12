from datetime import datetime, timezone
from typing import Dict, Optional
from ..database_config import GetDb
from bson import ObjectId

def StoreRefreshToken(
    user_id: ObjectId,
    token_hash: str,
    expires_at: datetime,
    email: str,
    username: str,
    device_fingerprint: Optional[str] = None,
    parent_token_id: Optional[str] = None
) -> str:
    refresh_tokens = GetDb()["refresh_tokens"]

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

def RevokeAllUserRefreshTokens(user_id: ObjectId) -> int:
    refresh_tokens = GetDb()["refresh_tokens"]
    result = refresh_tokens.delete_many({"user_id": user_id})

    return result.deleted_count

def ConsumeRefreshToken(token_hash: str) -> Optional[Dict]:
    refresh_tokens = GetDb()["refresh_tokens"]

    token = refresh_tokens.find_one_and_delete(
        {
            "token_hash": token_hash,
            "expires_at": {"$gt": datetime.now(timezone.utc)}
        }
    )

    if not token:
        return None

    return {
        "user_id": token["user_id"],
        "email": token["email"],
        "username": token["username"],
        "device_fingerprint": token.get("device_fingerprint"),
    }
from datetime import datetime, timedelta, timezone
from typing import Optional
from ..database_config import GetDb
import config 
from bson import ObjectId
import hashlib
import secrets
from . import general_methods
from . import refresh_tokens

def GetPasswordResetToken(token_hash: str):
    """
    Docstring for GetPasswordResetToken
    
    :param token_hash: token hash
    :type token_hash: str
    """
    collection = GetDb()["password_reset_tokens"]

    return collection.find_one({
        "token_hash": token_hash,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })

def ConsumePasswordResetToken(raw_token: str) -> Optional[ObjectId]:
    collection = GetDb()["password_reset_tokens"]

    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    token = collection.find_one_and_delete({
        "token_hash": token_hash,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })

    if not token:
        return None

    return token["user_id"] 

def StorePasswordResetToken(user_id: ObjectId) -> str:
    collection = GetDb()["password_reset_tokens"]

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    collection.delete_many({"user_id": user_id})

    collection.insert_one({
        "user_id": user_id,
        "token_hash": token_hash,
        "expires_at": datetime.now(timezone.utc) + timedelta(
            minutes=config.LINK_EXPIRATION_MINUTES
        ),
        "created_at": datetime.now(timezone.utc)
    })

    return raw_token

def UserHasResetPasswordToken(email: str) -> bool:
    user = general_methods.GetVerifiedUserByEmail(email)

    if not user:
        return False

    user_id = user["_id"]

    collection = GetDb()["password_reset_tokens"]
    token = collection.find_one({
        "user_id": user_id,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })

    return token is not None

def ResetPassword(user_id: ObjectId, hashed_password: str) -> None:
    users = GetDb()["users"]
    users.update_one(
        {"_id": user_id},
        {"$set": {"password": hashed_password}}
    )
    refresh_tokens.RevokeAllUserRefreshTokens(user_id)
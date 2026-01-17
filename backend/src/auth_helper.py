from fastapi import HTTPException, status, Header
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import database
import models
import jwt 
import datetime
import config
import secrets
import hashlib

SECRET_KEY = config.SECRET_KEY
ph = PasswordHasher()
ALGORITHM = "HS256"

def GetPasswordHash(password : str) -> str:
    return ph.hash(password)

def VerifyPassword(plain_password: str, hashed_password: str) -> bool:
    try:
        ph.verify(hashed_password, plain_password)
        return True
    except VerifyMismatchError:
        return False
    
def CreateRefreshToken() -> str:
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    return raw_token, token_hash
    
def CreateAccessToken(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,       
        "email": email,       
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def CreateTokenPair(user_id: str, email: str) -> tuple:
    """Create both access and refresh tokens"""
    access_token = CreateAccessToken(user_id, email)
    
    # Generate refresh token
    raw_refresh_token, refresh_token_hash = CreateRefreshToken()
    
    # Store refresh token hash in database with expiration (30 days)
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)
    database.StoreRefreshToken(user_id, refresh_token_hash, expires_at, email)
    
    return access_token, raw_refresh_token

def ValidateRefreshTokenAndGetUser(raw_refresh_token: str) -> tuple:
    """Validate refresh token and return user_id and email if valid"""
    token_hash = hashlib.sha256(raw_refresh_token.encode()).hexdigest()
    result = database.GetRefreshTokenInfo(token_hash)
    if result is None:
        raise ValueError("Refresh token is invalid, expired, or revoked")
    return result  # Returns (user_id, email)

def RefreshAccessToken(raw_refresh_token: str) -> tuple:
    """Generate new access token and refresh token pair from valid refresh token"""
    user_id, email = ValidateRefreshTokenAndGetUser(raw_refresh_token)
    
    # Revoke old refresh token
    RevokeRefreshToken(raw_refresh_token)
    
    # Create new token pair
    new_access_token, new_refresh_token = CreateTokenPair(user_id, email)
    
    return new_access_token, new_refresh_token

def RevokeRefreshToken(raw_refresh_token: str) -> bool:
    """Revoke a specific refresh token"""
    token_hash = hashlib.sha256(raw_refresh_token.encode()).hexdigest()
    return database.RevokeRefreshToken(token_hash)


async def GetCurrentUser(authorization : str = Header(...)) -> models.CurrentUser:
    """
    Dependency that extracts and validates the JWT from the Authorization header
    Expected format: "Bearer <token>"
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme"
        )
    
    token = authorization[len("Bearer "):].strip()
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        if user_id is None or email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    if not database.DoesUserExist(email):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists"
        )
    
    return models.CurrentUser(user_id=user_id, email=email)

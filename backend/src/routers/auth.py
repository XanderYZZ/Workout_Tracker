from fastapi import HTTPException, status, APIRouter, Depends, Request, Response
import database
import models
import auth_helper
import os
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(tags=["auth"])
limiter = Limiter(key_func=get_remote_address)

def ResponseSetCookieHelper(response: Response, refresh_token: str): 
    is_production = os.getenv("ENVIRONMENT", "development") == "production"
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_production, 
        samesite="strict",
        max_age=30*24*60*60 
    )

@router.post("/signup", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def SignUp(request: Request, user: models.UserCreate, response: Response):
    if database.DoesUserExist(user.email):
        raise HTTPException(status_code=400, detail="That email is already being used.")
    
    

    hashed_password = auth_helper.GetPasswordHash(user.password)
    user_id = database.CreateUser(user.email, hashed_password)
    device_fingerprint = auth_helper.GenerateDeviceFingerprint(request)
    ip_address = request.client.host if request.client else "unknown"
    
    access_token, refresh_token = auth_helper.CreateTokenPair(user_id, user.email, 
        device_fingerprint, 
        ip_address
    )
    
    ResponseSetCookieHelper(response, refresh_token)
    
    return models.TokenResponse(
        access_token=access_token,
        token_type="bearer"
    )

@router.post("/login", status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
async def Login(request: Request, user: models.UserCreate, response: Response):
    if not database.DoesUserExist(user.email):
        raise HTTPException(status_code=400, detail="That email is not being used in any account.")
    
    hashed_password = database.GetUserHashedPasswordInDB(user.email)

    if not auth_helper.VerifyPassword(user.password, hashed_password):
        raise HTTPException(status_code=401, detail="You sent incorrect authentication details.")
    
    user_id = database.GetUserIdByEmail(user.email)
    
    device_fingerprint = auth_helper.GenerateDeviceFingerprint(request)
    ip_address = request.client.host if request.client else "unknown"
    
    access_token, refresh_token = auth_helper.CreateTokenPair(user_id, user.email, 
        device_fingerprint, 
        ip_address
    )
    
    ResponseSetCookieHelper(response, refresh_token)
    
    return models.TokenResponse(
        access_token=access_token,
        token_type="bearer"
    )

@router.post("/refresh", status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
async def Refresh(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )
    
    try:
        device_fingerprint = auth_helper.GenerateDeviceFingerprint(request)
        ip_address = request.client.host if request.client else "unknown"
        
        access_token, new_refresh_token = auth_helper.RefreshAccessToken(
            refresh_token,
            device_fingerprint,
            ip_address
        )
        
        ResponseSetCookieHelper(response, new_refresh_token)
        
        return models.TokenResponse(
            access_token=access_token,
            token_type="bearer"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

@router.post("/logout", status_code=status.HTTP_200_OK)
async def Logout(current_user: models.CurrentUser = Depends(auth_helper.GetCurrentUser), response: Response = None):
    database.RevokeAllUserRefreshTokens(current_user.user_id)
    
    if response:
        is_production = os.getenv("ENVIRONMENT", "development") == "production"
        response.delete_cookie(
            key="refresh_token",
            httponly=True,
            secure=is_production,
            samesite="strict"
        )

    return {"message": "Logged out successfully"}
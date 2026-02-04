from fastapi import HTTPException, status, APIRouter, Depends, Request, Response
import lib.database_lib.user_methods as user_methods
import lib.database_lib.models as models
import lib.database_lib.auth_helper as auth_helper
import os
from config import limiter
from lib.misc.error_handler import APIError, ErrorMessage

router = APIRouter(tags=["auth"], prefix="/auth")
REFRESH_TOKEN_DAYS = int(os.getenv("REFRESH_TOKEN_DAYS"))

def ResponseSetCookieHelper(response: Response, refresh_token: str):
    is_production = os.getenv("ENVIRONMENT") == "production"

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_production,               
        samesite="none" if is_production else "lax",
        path="/",
        max_age=REFRESH_TOKEN_DAYS * 24 * 60 * 60,
    )

@router.post("/signup", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def SignUp(request: Request, user: models.UserCreate, response: Response):
    if user_methods.DoesUserExist(user.email, user.username):
        raise APIError.conflict(ErrorMessage.USER_ALREADY_EXISTS)
    
    if not auth_helper.IsPasswordStrong(user.password):
        raise APIError.validation_error(ErrorMessage.PASSWORD_WEAK)

    hashed_password = auth_helper.GetPasswordHash(user.password)
    user_id = user_methods.CreateUser(user.email, user.username, hashed_password)
    device_fingerprint = auth_helper.GenerateDeviceFingerprint(request)
    access_token, refresh_token = auth_helper.CreateTokenPair(user_id, user.email, 
                                                              username=user.username, device_fingerprint=device_fingerprint)
    
    ResponseSetCookieHelper(response, refresh_token)
    
    return models.TokenResponse(
        access_token=access_token,
        token_type="bearer"
    )

@router.post("/login", status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
async def Login(request: Request, user: models.UserLogin, response: Response):
    email = user_methods.GetUserEmailByEmailOrUsername(user.email_or_username)
    username = user_methods.GetUsernameByEmail(email)

    if not user_methods.DoesUserExist(email, username):
        raise APIError.validation_error(ErrorMessage.INVALID_CREDENTIALS)

    hashed_password = user_methods.GetUserHashedPasswordInDB(email)

    if not auth_helper.VerifyPassword(user.password, hashed_password):
        raise APIError.unauthorized(ErrorMessage.INVALID_CREDENTIALS)
    
    user_id = user_methods.GetUserIdByEmail(email)
    device_fingerprint = auth_helper.GenerateDeviceFingerprint(request)
    access_token, refresh_token = auth_helper.CreateTokenPair(user_id, email, 
                                                              username=username, device_fingerprint=device_fingerprint)
    
    ResponseSetCookieHelper(response, refresh_token)
    
    return models.TokenResponse(
        access_token=access_token,
        token_type="bearer"
    )

@router.post("/refresh", status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
async def Refresh(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise APIError.unauthorized(ErrorMessage.REFRESH_TOKEN_MISSING)
    
    try:
        device_fingerprint = auth_helper.GenerateDeviceFingerprint(request)
        access_token, new_refresh_token = auth_helper.RefreshAccessToken(refresh_token, device_fingerprint)
        
        ResponseSetCookieHelper(response, new_refresh_token)
        
        return models.TokenResponse(
            access_token=access_token,
            token_type="bearer"
        )
    except ValueError as e:
        raise APIError.unauthorized(ErrorMessage.INVALID_TOKEN)

@router.post("/logout", status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
async def Logout(request: Request, response: Response, current_user: models.CurrentUser = Depends(auth_helper.GetCurrentUser)):
    user_methods.RevokeAllUserRefreshTokens(current_user.user_id)

    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=os.getenv("ENVIRONMENT") == "production",
        samesite="lax"
    )

    return {"message": "Logged out successfully"}
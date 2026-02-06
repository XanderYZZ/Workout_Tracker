from datetime import datetime, timezone
from fastapi import status, APIRouter, Depends, Request, Response
import lib.database_lib.user_methods as user_methods
import lib.database_lib.models as models
import lib.database_lib.auth_helper as auth_helper
from config import limiter
from lib.misc.error_handler import APIError, ErrorMessage
import lib.database_lib.database_config as database_config
import config 

router = APIRouter(tags=["auth"], prefix="/auth")

def ResponseSetCookieHelper(response: Response, refresh_token: str):
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=config.IS_PRODUCTION,               
        samesite="none" if config.IS_PRODUCTION else "lax",
        path="/",
        max_age=config.REFRESH_TOKEN_DAYS * 24 * 60 * 60,
    )

def ResponseDeleteCookieHelper(response: Response):
    response.delete_cookie(
        key="refresh_token",
        path="/",
        secure=config.IS_PRODUCTION,
        samesite="none" if config.IS_PRODUCTION else "lax",
    )

def CreateAccessToken(request: Request, response: Response, user_id: str, email: str, username: str) -> str:
    device_fingerprint = auth_helper.GenerateDeviceFingerprint(request)
    access_token, refresh_token = auth_helper.CreateTokenPair(
        user_id, email, username=username, device_fingerprint=device_fingerprint
    )
    
    ResponseSetCookieHelper(response, refresh_token)

    return access_token

@router.post("/signup", status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def SignUp(request: Request, user: models.UserCreate, response: Response):
    if user_methods.DoesPendingUserExist(user.email, user.username):
        raise APIError.conflict(ErrorMessage.PENDING_USER_ALREADY_EXISTS)

    if user_methods.DoesVerifiedUserExist(user.email, user.username):
        raise APIError.conflict(ErrorMessage.VERIFIED_USER_ALREADY_EXISTS)
    
    if not auth_helper.IsPasswordStrong(user.password):
        raise APIError.validation_error(ErrorMessage.PASSWORD_WEAK)

    hashed_password = auth_helper.GetPasswordHash(user.password)
    success = auth_helper.sendVerificationEmail(user.email, user.username, hashed_password)

    if not success:
        raise APIError.server_error("Failed to send verification email. Please try again later.")
    
    return {"message": "Signup successful! Check your email to verify your account."}

@router.post("/authenticate", response_model=models.TokenResponse, status_code=status.HTTP_200_OK)
@limiter.limit("3/minute")
async def VerifyUser(request: Request, email_verification_model: models.EmailVerificationModel, response: Response):
    verified_user = user_methods.GetVerifiedUserByEmail(email_verification_model.email)

    if verified_user:
        raise APIError.conflict("User already verified")

    pending_user = user_methods.GetPendingUserByEmail(email_verification_model.email)
    
    if not pending_user:
        raise APIError.not_found("Pending user not found")
    
    if pending_user.get("verification_token") != email_verification_model.verification_token:
        raise APIError.unauthorized("Invalid verification token")
    
    pending_user = database_config.MakeDatetimeAware(pending_user)

    if pending_user.get("expires_at") < datetime.now(timezone.utc):
        user_methods.DeletePendingUserByEmail(email_verification_model.email)
        raise APIError.unauthorized("Verification token expired")
    
    user_id = user_methods.CreateUser(
        email=pending_user["email"],
        username=pending_user["username"],
        hashed_password=pending_user["password"]
    )
    
    user_methods.DeletePendingUserByEmail(email_verification_model.email)
    
    return models.TokenResponse(
        access_token=CreateAccessToken(request, response, user_id, email_verification_model.email, pending_user["username"]),
        token_type="bearer"
    )

@router.post("/initial-reset-password", status_code=status.HTTP_200_OK)
@limiter.limit("3/minute")
async def InitialResetPasswordRequest(request: Request, reset_password_model: models.InitialResetPasswordModel, response: Response):
    verified_user = user_methods.GetVerifiedUserByEmail(reset_password_model.email)

    if not verified_user:
        raise APIError.conflict("Could not find account for that email")
    
    success = auth_helper.sendResetPasswordEmail(reset_password_model.email)

    if not success:
        raise APIError.server_error("Failed to send reset password email. Please try again later.")
    
    return {"message": "Check your email to reset your password."}

@router.post("/reset-password", response_model=models.TokenResponse, status_code=status.HTTP_200_OK)
@limiter.limit("3/minute")
async def ResetPasswordRequest(request: Request, reset_password_model: models.ResetPasswordModel, response: Response):
    verified_user = user_methods.GetVerifiedUserByEmail(reset_password_model.email)

    if not verified_user:
        raise APIError.conflict("Could not find account for that email")
    
    if verified_user.get("reset_password_token") != reset_password_model.token:
        raise APIError.unauthorized("Invalid verification token")
    
    hashed_password = auth_helper.GetPasswordHash(reset_password_model.password)
    user_methods.setNewHashedPassword(reset_password_model.email, hashed_password)
    user_id = user_methods.GetUserIdByEmail(reset_password_model.email)
    
    return models.TokenResponse(
        access_token=CreateAccessToken(request, response, user_id, reset_password_model.email, verified_user["username"]),
        token_type="bearer"
    )

@router.post("/login", response_model=models.TokenResponse, status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
async def Login(request: Request, user: models.UserLogin, response: Response):
    email = user_methods.GetUserEmailByEmailOrUsername(user.email_or_username)
    username = user_methods.GetUsernameByEmail(email)

    if not user_methods.DoesVerifiedUserExist(email, username):
        raise APIError.validation_error(ErrorMessage.INVALID_CREDENTIALS)

    hashed_password = user_methods.GetUserHashedPasswordInDB(email)

    if not auth_helper.VerifyPassword(user.password, hashed_password):
        raise APIError.unauthorized(ErrorMessage.INVALID_CREDENTIALS)
    
    user_id = user_methods.GetUserIdByEmail(email)
    
    return models.TokenResponse(
        access_token=CreateAccessToken(request, response, user_id, email, username),
        token_type="bearer"
    )

@router.post("/refresh", response_model=models.TokenResponse, status_code=status.HTTP_200_OK)
@limiter.limit("2/minute")
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
    ResponseDeleteCookieHelper(response)

    return {"message": "Logged out successfully"}
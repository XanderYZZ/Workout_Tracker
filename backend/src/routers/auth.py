from datetime import datetime, timezone
from fastapi import status, APIRouter, Depends, Request, Response
import lib.database_lib.users.general_methods as general_user_methods
import lib.database_lib.users.reset_password as reset_password_methods
import lib.database_lib.users.refresh_tokens as refresh_token_methods
import lib.database_lib.models as models
import lib.database_lib.users.auth_helper as auth_helper
from config import limiter
from lib.misc.error_handler import APIError, ErrorMessage
import lib.database_lib.database_config as database_config
import config 

router = APIRouter(tags=["auth"], prefix="/auth")

def ResponseSetCookieHelper(response: Response, refresh_token: str, device_id: str):
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=config.IS_PRODUCTION,               
        samesite="none" if config.IS_PRODUCTION else "lax",
        path="/",
        max_age=config.REFRESH_TOKEN_DAYS * 24 * 60 * 60,
    )

    response.set_cookie(
        key="device_id",
        value=device_id,
        httponly=True,
        secure=config.IS_PRODUCTION,
        samesite="none" if config.IS_PRODUCTION else "lax",
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
    
    ResponseSetCookieHelper(response, refresh_token, device_fingerprint)

    return access_token

@router.post("/signup", status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def SignUp(request: Request, user: models.UserCreate, response: Response):
    if general_user_methods.DoesPendingUserExist(user.email, user.username):
        raise APIError.conflict(ErrorMessage.PENDING_USER_ALREADY_EXISTS)

    if general_user_methods.DoesVerifiedUserExist(user.email, user.username):
        raise APIError.conflict(ErrorMessage.VERIFIED_USER_ALREADY_EXISTS)
    
    if not auth_helper.IsPasswordStrong(user.password):
        raise APIError.validation_error(ErrorMessage.PASSWORD_WEAK)

    hashed_password = auth_helper.GetPasswordHash(user.password)
    success = auth_helper.InitiateEmailVerification(user.email, user.username, hashed_password)

    if not success:
        raise APIError.server_error("Failed to send verification email. Please try again later.")
    
    return {"message": "Signup successful! Check your email to verify your account."}

@router.post("/authenticate", response_model=models.TokenResponse, status_code=status.HTTP_200_OK)
@limiter.limit("3/minute")
async def VerifyUser(request: Request, email_verification_model: models.EmailVerificationModel, response: Response):
    verified_user = general_user_methods.GetVerifiedUserByEmail(email_verification_model.email)

    if verified_user:
        raise APIError.conflict("User already verified")

    pending_user = general_user_methods.GetPendingUserByEmail(email_verification_model.email)
    
    if not pending_user:
        raise APIError.not_found("Pending user not found")
    
    if pending_user.get("verification_token") != email_verification_model.verification_token:
        raise APIError.unauthorized("Invalid verification token")
    
    pending_user = database_config.MakeDatetimeAware(pending_user)

    if pending_user.get("expires_at") < datetime.now(timezone.utc):
        general_user_methods.DeletePendingUserByEmail(email_verification_model.email)
        raise APIError.unauthorized("Verification token expired")
    
    user_id = general_user_methods.CreateUser(
        email=pending_user["email"],
        username=pending_user["username"],
        hashed_password=pending_user["password"]
    )
    
    general_user_methods.DeletePendingUserByEmail(email_verification_model.email)
    
    return models.TokenResponse(
        access_token=CreateAccessToken(request, response, user_id, email_verification_model.email, pending_user["username"]),
        token_type="bearer"
    )

@router.post("/initial-reset-password", status_code=status.HTTP_200_OK)
@limiter.limit("3/minute")
async def InitialResetPasswordRequest(request: Request, reset_password_model: models.InitialResetPasswordModel, response: Response):
    verified_user = general_user_methods.GetVerifiedUserByEmail(reset_password_model.email)

    if not verified_user:
        raise APIError.conflict("Could not find account for that email")
    
    if reset_password_methods.UserHasResetPasswordToken(reset_password_model.email):
        raise APIError.conflict("A reset password email has already been sent. Please check your email or try again later.")

    success = auth_helper.InitiateResetPassword(reset_password_model.email)

    if not success:
        raise APIError.server_error("Failed to send reset password email. Please try again later.")
    
    return {"message": "Check your email to reset your password."}

@router.post("/reset-password", response_model=models.TokenResponse)
async def ResetPasswordRequest(
    request: Request,
    reset_password_model: models.ResetPasswordModel,
    response: Response
):

    if not auth_helper.IsPasswordStrong(reset_password_model.password):
        raise APIError.validation_error(ErrorMessage.PASSWORD_WEAK)

    user_id = reset_password_methods.ConsumePasswordResetToken(
        reset_password_model.token
    )

    if not user_id:
        raise APIError.unauthorized("Invalid or expired reset token")

    hashed_password = auth_helper.GetPasswordHash(
        reset_password_model.password
    )

    reset_password_methods.ResetPassword(user_id, hashed_password)
    user = general_user_methods.GetVerifiedUserByEmail(reset_password_model.email)

    return models.TokenResponse(
        access_token=CreateAccessToken(request, response, str(user_id), user["email"], user["username"]),
        token_type="bearer"
    )

@router.post("/login", response_model=models.TokenResponse, status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
async def Login(request: Request, user: models.UserLogin, response: Response):
    email = general_user_methods.GetUserEmailByEmailOrUsername(user.email_or_username)
    username = general_user_methods.GetUsernameByEmail(email)

    if not general_user_methods.DoesVerifiedUserExist(email, username):
        raise APIError.validation_error(ErrorMessage.INVALID_CREDENTIALS)

    hashed_password = general_user_methods.GetUserHashedPasswordInDB(email)

    if not auth_helper.VerifyPassword(user.password, hashed_password):
        raise APIError.unauthorized(ErrorMessage.INVALID_CREDENTIALS)
    
    user_id = general_user_methods.GetUserIdByEmail(email)
    
    return models.TokenResponse(
        access_token=CreateAccessToken(request, response, str(user_id), email, username),
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
        
        ResponseSetCookieHelper(response, new_refresh_token, device_fingerprint)
        
        return models.TokenResponse(
            access_token=access_token,
            token_type="bearer"
        )
    except ValueError as e:
        ResponseDeleteCookieHelper(response)

        raise APIError.unauthorized(ErrorMessage.INVALID_TOKEN)

@router.post("/logout", status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
async def Logout(request: Request, response: Response, current_user: models.CurrentUser = Depends(auth_helper.GetCurrentUser)):
    refresh_token_methods.RevokeAllUserRefreshTokens(current_user.user_id)
    ResponseDeleteCookieHelper(response)

    return {"message": "Logged out successfully"}
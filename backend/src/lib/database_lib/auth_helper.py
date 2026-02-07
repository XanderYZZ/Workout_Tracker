from fastapi import HTTPException, status, Header, Request
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from . import user_methods
from . import models
import jwt 
import datetime
import config
import secrets
import hashlib
import config 
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SECRET_KEY = config.SECRET_KEY
ph = PasswordHasher()
ALGORITHM = "HS256"

def SendEmail(email: str, subject: str, body: str) -> bool:
    msg = MIMEMultipart()
    msg['From'] = config.SENDER_EMAIL
    msg['To'] = email
    msg.attach(MIMEText(body, 'plain'))
    msg['Subject'] = subject

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(config.SENDER_EMAIL, config.SENDER_EMAIL_PASSWORD)
            server.sendmail(config.SENDER_EMAIL, email, msg.as_string())
        
            return True
    except Exception as e:
        print(f"Error sending email: {e}")
        # The user is deleted so they can try again.
        user_methods.DeletePendingUserByEmail(email)

        return False

def SendResetPasswordEmail(email: str) -> bool:
    token = secrets.token_urlsafe(32)
    user_methods.SetResetPasswordToken(email, token)
    reset_link = f"{config.FRONTEND_URL}/reset-password?token={token}&email={email}"
    subject = "Reset Your Password"
    body = f"""
            Please click the following link to reset the password for your account: {reset_link}\n
            The token will expire in {config.LINK_EXPIRATION_MINUTES} minutes from the time this email was sent.
            """
    return SendEmail(email, subject, body)

def SendVerificationEmail(email: str, username: str, hashed_password: str) -> bool:
    token = secrets.token_urlsafe(32)
    # The token argument ensures that the user is not verified.
    user_methods.CreateUser(email, username, hashed_password, token)
    verification_link = f"{config.FRONTEND_URL}/authenticate?token={token}&email={email}"
    subject = "Verify Your Account"
    body = f"""
            Please click the following link to verify your email and create your account: {verification_link}\n
            The token will expire in {config.LINK_EXPIRATION_MINUTES} minutes from the time this email was sent.
            """
    return SendEmail(email, subject, body)

def IsPasswordStrong(password: str) -> bool:
    if len(password) < 8:
        return False
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(not c.isalnum() for c in password)

    return has_upper and has_lower and has_digit and has_special

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

def GenerateDeviceFingerprint(request: Request) -> str:
    user_agent = request.headers.get("user-agent", "")
    accept_language = request.headers.get("accept-language", "")
    fingerprint_str = f"{user_agent}|{accept_language}"

    return hashlib.sha256(fingerprint_str.encode()).hexdigest()
    
def CreateAccessToken(user_id: str, email: str, username: str) -> str:
    payload = {
        "sub": user_id,       
        "email": email,       
        "username": username,
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=config.ACCESS_TOKEN_MINUTES)
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def CreateTokenPair(user_id: str, email: str, username: str, device_fingerprint: str) -> tuple:
    access_token = CreateAccessToken(user_id, email, username)
    raw_refresh_token, refresh_token_hash = CreateRefreshToken()
    
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=config.REFRESH_TOKEN_DAYS)
    user_methods.StoreRefreshToken(
        user_id, 
        refresh_token_hash, 
        expires_at, 
        email,
        username=username,
        device_fingerprint=device_fingerprint,
    )
    
    return access_token, raw_refresh_token

def ValidateRefreshTokenAndGetUser(raw_refresh_token: str, device_fingerprint: str) -> dict:
    token_hash = hashlib.sha256(raw_refresh_token.encode()).hexdigest()
    result = user_methods.GetRefreshTokenInfo(token_hash)

    if result is None:
        raise ValueError("Refresh token is invalid, expired, or revoked")
    
    if result.get("device_fingerprint") != device_fingerprint:
        raise ValueError("Token used from different device - potential compromise detected")
    
    return result

def RefreshAccessToken(raw_refresh_token: str, device_fingerprint: str) -> tuple:
    token_info = ValidateRefreshTokenAndGetUser(raw_refresh_token, device_fingerprint)
    
    user_id = token_info["user_id"]
    email = token_info["email"]
    username = token_info["username"]
    
    RevokeRefreshToken(raw_refresh_token)
    
    new_access_token, new_refresh_token = CreateTokenPair(
        user_id=user_id, 
        email=email, 
        username=username,
        device_fingerprint=device_fingerprint, 
    )
    
    return new_access_token, new_refresh_token

def RevokeRefreshToken(raw_refresh_token: str) -> bool:
    token_hash = hashlib.sha256(raw_refresh_token.encode()).hexdigest()
    return user_methods.RevokeRefreshToken(token_hash)

async def GetCurrentUser(authorization : str = Header(...)) -> models.CurrentUser:    
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
    
    if not user_methods.DoesVerifiedUserExist(email):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Verified user does not exist"
        )
    
    return models.CurrentUser(user_id=user_id, email=email)
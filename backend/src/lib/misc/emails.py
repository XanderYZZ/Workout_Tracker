import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import config 

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
        return False

def SendResetPasswordEmail(token: str, email: str) -> bool:
    reset_link = f"{config.FRONTEND_URL}/reset-password?token={token}&email={email}"
    subject = "Reset Your Password"
    body = f"""
            Please click the following link to reset the password for your account: {reset_link}\n
            The token will expire in {config.LINK_EXPIRATION_MINUTES} minutes from the time this email was sent.
            """
    
    return SendEmail(email, subject, body)

def SendVerificationEmail(token: str, email: str, username: str, hashed_password: str) -> bool:
    verification_link = f"{config.FRONTEND_URL}/authenticate?token={token}&email={email}"
    subject = "Verify Your Account"
    body = f"""
            Please click the following link to verify your email and create your account: {verification_link}\n
            The token will expire in {config.LINK_EXPIRATION_MINUTES} minutes from the time this email was sent.
            """
    
    return SendEmail(email, subject, body)
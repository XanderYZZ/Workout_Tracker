from dotenv import load_dotenv
from pathlib import Path
import os
from slowapi import Limiter
from slowapi.util import get_remote_address

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')
MONGO_URI = os.getenv("MONGO_URI")
SECRET_KEY = os.getenv("SECRET_KEY")
LINK_EXPIRATION_MINUTES = os.getenv("LINK_EXPIRATION_MINUTES")
FRONTEND_URL = os.getenv("FRONTEND_URL")
ACCESS_TOKEN_MINUTES = int(os.getenv("ACCESS_TOKEN_MINUTES"))
REFRESH_TOKEN_DAYS = int(os.getenv("REFRESH_TOKEN_DAYS"))
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_EMAIL_PASSWORD = os.getenv("SENDER_EMAIL_PASSWORD")
REFRESH_TOKEN_DAYS = int(os.getenv("REFRESH_TOKEN_DAYS"))
IS_PRODUCTION = os.getenv("ENVIRONMENT") == "production"
MAXIMUM_WORKOUTS_PER_DAY = int(os.getenv("MAXIMUM_WORKOUTS_PER_DAY", 5))

# Centralized rate limiter instance
limiter = Limiter(key_func=get_remote_address)
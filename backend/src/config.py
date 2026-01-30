from dotenv import load_dotenv
from pathlib import Path
import os
from slowapi import Limiter
from slowapi.util import get_remote_address

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')
MONGO_URI = os.getenv("MONGO_URI")
SECRET_KEY = os.getenv("SECRET_KEY")

# Centralized rate limiter instance
limiter = Limiter(key_func=get_remote_address)
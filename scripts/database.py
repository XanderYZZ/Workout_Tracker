from pymongo import MongoClient
from dotenv import  load_dotenv
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')
MONGO_URI = os.getenv("MONGO_URI")

load_dotenv()
client = MongoClient(MONGO_URI)

def GetDb():
    return client["database"]

def AddExercise(exercise):
    GetDb()["exercises"].update_one({"name": exercise["name"],}, {"$set": exercise}, upsert=True)

def DoesUserExist(email : str):
    users = GetDb()["users"]

    if users.find_one({"email": email}):
        return True
    
    return False

def CreateUser(email : str, hashed_password : str):
    if DoesUserExist(email):
        return

    users = GetDb()["users"]
    users.insert_one({"email": email, "password": hashed_password})

def GetUserHashedPasswordInDB(email : str) -> str:
    if not DoesUserExist(email):
        return ""
    
    users = GetDb()["users"]
    user = users.find_one({"email": email})

    return user["password"]
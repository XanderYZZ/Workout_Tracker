from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import database
app = FastAPI(title="Workout Tracker API")
ph = PasswordHasher()

class UserCreate(BaseModel):
    email: EmailStr
    password: str

def GetPasswordHash(password : str) -> str:
    return ph.hash(password)

def VerifyPassword(plain_password: str, hashed_password: str) -> bool:
    try:
        ph.verify(hashed_password, plain_password)
        return True
    except VerifyMismatchError:
        return False

@app.post("/signup", status_code=status.HTTP_201_CREATED)
async def SignUp(user : UserCreate):
    if database.DoesUserExist(user.email):
        raise HTTPException(status_code=400, detail="That email is already being used.")
    
    hashed_password = GetPasswordHash(user.password)
    database.CreateUser(user.email, hashed_password)

    return {"email": user.email}

@app.post("/login", status_code=status.HTTP_202_ACCEPTED)
async def Login(user : UserCreate):
    if not database.DoesUserExist(user.email):
        raise HTTPException(status_code=400, detail="That email is not being used in any account.")
    
    hashed_password = database.GetUserHashedPasswordInDB(user.email)

    if not VerifyPassword(user.password, hashed_password):
        raise HTTPException(status_code=401, detail="You sent incorrect authentication details.")
    
    
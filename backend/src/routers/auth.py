from fastapi import HTTPException, status, APIRouter, Depends
import database
import models
import auth_helper

router = APIRouter(tags=["auth"])

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def SignUp(user : models.UserCreate):
    if database.DoesUserExist(user.email):
        raise HTTPException(status_code=400, detail="That email is already being used.")
    
    hashed_password = auth_helper.GetPasswordHash(user.password)
    user_id = database.CreateUser(user.email, hashed_password)

    access_token, refresh_token = auth_helper.CreateTokenPair(user_id, user.email)
    
    return models.TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )

@router.post("/login", status_code=status.HTTP_200_OK)
async def Login(user : models.UserCreate):
    if not database.DoesUserExist(user.email):
        raise HTTPException(status_code=400, detail="That email is not being used in any account.")
    
    hashed_password = database.GetUserHashedPasswordInDB(user.email)

    if not auth_helper.VerifyPassword(user.password, hashed_password):
        raise HTTPException(status_code=401, detail="You sent incorrect authentication details.")
    
    user_id = database.GetUserIdByEmail(user.email)
    access_token, refresh_token = auth_helper.CreateTokenPair(user_id, user.email)
    
    return models.TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )

@router.post("/refresh", status_code=status.HTTP_200_OK)
async def Refresh(refresh_request: models.RefreshTokenRequest):
    try:
        access_token, new_refresh_token = auth_helper.RefreshAccessToken(
            refresh_request.refresh_token
        )
        
        return models.TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

@router.post("/logout", status_code=status.HTTP_200_OK)
async def Logout(current_user: models.CurrentUser = Depends(auth_helper.GetCurrentUser)):
    database.RevokeAllUserRefreshTokens(current_user.user_id)

    return {"message": "Logged out successfully"}
from fastapi import APIRouter, status, Depends, HTTPException, Request
import lib.database_lib.database as database
import lib.database_lib.models as models
import lib.database_lib.auth_helper as auth_helper
from slowapi import Limiter
from slowapi.util import get_remote_address
from lib.misc import dates

router = APIRouter(tags=["settings"], prefix="/settings")
limiter = Limiter(key_func=get_remote_address)

# GET ALL SETTINGS
@router.get("/", response_model=models.UserSettings, status_code=status.HTTP_200_OK)
@limiter.limit("20/minute")
async def GetAllSettings(
    request: Request,
    current_user = Depends(auth_helper.GetCurrentUser)
):
    user_details = database.GetAllUserDetails(current_user.email)

    if not user_details:
        raise HTTPException(status_code=500, detail="Failed to get settings")

    return models.UserSettings(
        bodyweight=user_details["bodyweight"]
    )

# UPDATE BODYWEIGHT
@router.post("/bodyweight", response_model=models.BodyweightUpdate, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def UpdateBodyweight(
    request: Request,
    payload: models.BodyweightUpdate,
    current_user = Depends(auth_helper.GetCurrentUser)
):
    result = database.UpdateBodyweight(current_user.email, payload.bodyweight)

    if not result:
        raise HTTPException(status_code=500, detail="Failed to update bodyweight") 
    
    return models.BodyweightUpdate(bodyweight=payload.bodyweight)
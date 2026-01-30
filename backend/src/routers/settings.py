from fastapi import APIRouter, status, Depends, Request
import lib.database_lib.database as database
import lib.database_lib.models as models
import lib.database_lib.auth_helper as auth_helper
from config import limiter
from lib.misc import dates
from lib.error_handler import APIError, ErrorMessage

router = APIRouter(tags=["settings"], prefix="/settings")

# GET ALL SETTINGS
@router.get("/", response_model=models.UserSettings, status_code=status.HTTP_200_OK)
@limiter.limit("20/minute")
async def GetAllSettings(
    request: Request,
    current_user = Depends(auth_helper.GetCurrentUser)
):
    user_details = database.GetAllUserDetails(current_user.email)

    if not user_details:
        raise APIError.server_error(ErrorMessage.FAILED_TO_RETRIEVE)

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
        raise APIError.server_error(ErrorMessage.FAILED_TO_UPDATE)
    
    return models.BodyweightUpdate(bodyweight=payload.bodyweight)
from datetime import datetime, timezone
from typing import List
from bson import ObjectId
from fastapi import Query, Request, status, APIRouter, Depends
from lib.database_lib import models 
from lib.database_lib.users import auth_helper 
from lib.database_lib.workouts import routine_methods as routine_methods 
from config import limiter
from lib.misc.error_handler import APIError, ErrorMessage

router = APIRouter(tags=["routines"], prefix="/routines")

# CREATE
@router.post("/", response_model=models.RoutineResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def CreateRoutine(
    request: Request,
    routine: models.Routine,
    current_user = Depends(auth_helper.GetCurrentUser)
):
    routine_dict = routine.model_dump()
    routine_dict["user_id"] = current_user.user_id
    now = datetime.now(timezone.utc)
    routine_dict["created_at"] = now

    routine_id = routine_methods.CreateRoutine(routine_dict)
    created_routine = routine_methods.GetRoutineById(routine_id, current_user.user_id)
    
    if not created_routine:
        raise APIError.server_error(ErrorMessage.FAILED_TO_RETRIEVE)

    return models.RoutineResponse(**created_routine)

# UPDATE
@router.put("/{routine_id}", response_model=models.RoutineResponse, status_code=status.HTTP_200_OK)
@limiter.limit("20/minute")
async def UpdateRoutine(
    request: Request,
    routine_id: str,
    routine_update: models.Routine,
    current_user = Depends(auth_helper.GetCurrentUser)
):
    if not ObjectId.is_valid(routine_id):
        raise APIError.validation_error(ErrorMessage.INVALID_ID)

    updated_data = routine_update.model_dump(exclude_unset=True, exclude_none=True)

    if not updated_data:
        raise APIError.validation_error(ErrorMessage.NO_DATA_PROVIDED)

    success = routine_methods.UpdateRoutine(routine_id, current_user.user_id, updated_data)
    
    if not success:
        raise APIError.not_found(ErrorMessage.RESOURCE_NOT_OWNED)

    updated_routine = routine_methods.GetRoutineById(routine_id, current_user.user_id)

    if not updated_routine:
        raise APIError.server_error(ErrorMessage.FAILED_TO_RETRIEVE)

    return models.RoutineResponse(**updated_routine)

# DELETE
@router.delete("/{routine_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
async def delete_workout(
    request: Request,
    routine_id: str,
    current_user = Depends(auth_helper.GetCurrentUser)
):
    if not ObjectId.is_valid(routine_id):
        raise APIError.validation_error(ErrorMessage.INVALID_ID)

    success = routine_methods.DeleteRoutine(routine_id, current_user.user_id)

    if not success:
        raise APIError.not_found(ErrorMessage.RESOURCE_NOT_OWNED)
    
    return None

@router.get("/", response_model=List[models.RoutineResponse])
@limiter.limit("20/minute")
async def list_workouts(
    request: Request,
    current_user = Depends(auth_helper.GetCurrentUser),
    limit: int = Query(50, le=100),
    skip: int = Query(0, ge=0),
):
    routines = routine_methods.GetRoutinesForUser(
        user_id=current_user.user_id,
        limit=limit,
        skip=skip
    )

    return [models.RoutineResponse(**r) for r in routines]
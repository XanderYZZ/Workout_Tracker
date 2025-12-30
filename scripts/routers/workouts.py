from bson import ObjectId
from fastapi import status, APIRouter, Depends, HTTPException
import database
import models
import auth_helper
import datetime

router = APIRouter(tags=["workouts"], prefix="/workouts")

@router.post("/", response_model=models.WorkoutResponse, status_code=status.HTTP_201_CREATED)
async def CreateWorkout(
    workout: models.WorkoutCreate,
    current_user = Depends(auth_helper.GetCurrentUser)
):
    workout_dict = workout.model_dump()
    workout_dict["user_id"] = current_user.user_id
    workout_dict["created_at"] = datetime.now(datetime.timezone.utc)
    workout_id = database.CreateWorkout(workout_dict) 

    return models.WorkoutResponse(
        id=workout_id,
        user_id=current_user.user_id,
        created_at=datetime.now(datetime.timezone.utc),
        **workout.model_dump()  # Spreads all the client-provided fields.
    )

@router.put("/{workout_id}", response_model=models.WorkoutResponse)
async def UpdateWorkout(
    workout_id : str,
    workout_update : models.WorkoutUpdate,
    current_user = Depends(auth_helper.GetCurrentUser)
):
    if not ObjectId.is_valid(workout_id):
        raise HTTPException(status_code=400, detail="Invalid workout ID")

    updated_data = workout_update.model_dump(exclude_unset=True)

    if not updated_data:
        raise HTTPException(status_code=400, detail="No data provided to update")

    updated_data["updated_at"] = datetime.now(datetime.timezone.utc)
    success = database.update_workout(workout_id, current_user.user_id, updated_data)
    
    if not success:
        raise HTTPException(status_code=404, detail="Workout not found or not owned by user")

    updated_workout = database.get_workout_by_id(workout_id, current_user.user_id)
    
    return models.WorkoutResponse(**updated_workout)
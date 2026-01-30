import os
from typing import List, Optional
from bson import ObjectId
from fastapi import Query, Request, status, APIRouter, Depends, HTTPException
from lib.database_lib import models 
from lib.database_lib import auth_helper 
from lib.database_lib import database 
from datetime import datetime, timezone
from config import limiter

router = APIRouter(tags=["workouts"], prefix="/workouts")
MAXIMUM_WORKOUTS_PER_DAY = os.getenv("MAXIMUM_WORKOUTS_PER_DAY", 5)

# CREATE
@router.post("/", response_model=models.WorkoutResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def CreateWorkout(
    request: Request,
    workout: models.WorkoutCreate,
    current_user = Depends(auth_helper.GetCurrentUser)
):
    workout_dict = workout.model_dump()
    workout_dict["user_id"] = current_user.user_id
    now = datetime.now(timezone.utc)
    workout_dict["created_at"] = now
    
    if "scheduled_date" not in workout_dict or workout_dict["scheduled_date"] is None:
        workout_dict["scheduled_date"] = now

    if workout_dict["scheduled_date"].tzinfo is None:
        workout_dict["scheduled_date"] = workout_dict["scheduled_date"].replace(tzinfo=timezone.utc)

    # I added this for some prevention of spamming workouts on a certain date.
    num_on_date = database.GetNumberOfWorkoutsForUserOnDate(current_user.user_id, workout_dict["scheduled_date"])
    
    if num_on_date >= MAXIMUM_WORKOUTS_PER_DAY:
        raise HTTPException(status_code=400, detail=f"Maximum of {MAXIMUM_WORKOUTS_PER_DAY} workouts per day exceeded.")

    workout_id = database.CreateWorkout(workout_dict)
    created_workout = database.GetWorkoutById(workout_id, current_user.user_id)
    
    if not created_workout:
        raise HTTPException(status_code=500, detail="Failed to retrieve created workout")

    return models.WorkoutResponse(**created_workout)

# UPDATE
@router.put("/{workout_id}", response_model=models.WorkoutResponse, status_code=status.HTTP_200_OK)
@limiter.limit("20/minute")
async def UpdateWorkout(
    request: Request,
    workout_id : str,
    workout_update : models.WorkoutUpdate,
    current_user = Depends(auth_helper.GetCurrentUser)
):
    if not ObjectId.is_valid(workout_id):
        raise HTTPException(status_code=400, detail="Invalid workout ID")

    updated_data = workout_update.model_dump(exclude_unset=True, exclude_none=True)

    if not updated_data:
        raise HTTPException(status_code=400, detail="No data provided to update")

    updated_data["updated_at"] = datetime.now(timezone.utc)
    success = database.UpdateWorkout(workout_id, current_user.user_id, updated_data)
    
    if not success:
        raise HTTPException(status_code=404, detail="Workout not found or not owned by user")

    updated_workout = database.GetWorkoutById(workout_id, current_user.user_id)

    if not updated_workout:
        raise HTTPException(status_code=500, detail="Failed to retrieve updated workout")

    return models.WorkoutResponse(**updated_workout)

# DELETE
@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
async def delete_workout(
    request: Request,
    workout_id: str,
    current_user = Depends(auth_helper.GetCurrentUser)
):
    if not ObjectId.is_valid(workout_id):
        raise HTTPException(status_code=400, detail="Invalid workout ID")

    success = database.DeleteWorkout(workout_id, current_user.user_id)

    if not success:
        raise HTTPException(status_code=404, detail="Workout not found or not owned by user")
    
    return None

# LIST - Sorted by scheduled_date, with filters
@router.get("/", response_model=List[models.WorkoutResponse])
@limiter.limit("20/minute")
async def list_workouts(
    request: Request,
    current_user = Depends(auth_helper.GetCurrentUser),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(50, le=100),
    skip: int = Query(0, ge=0),
):
    workouts = database.GetWorkoutsForUser(
        user_id=current_user.user_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        skip=skip
    )

    return [models.WorkoutResponse(**w) for w in workouts]

# GET SINGLE
@router.get("/{workout_id}", response_model=models.WorkoutResponse)
@limiter.limit("30/minute")
async def GetWorkout(
    request: Request,
    workout_id: str,
    current_user = Depends(auth_helper.GetCurrentUser)
):
    if not ObjectId.is_valid(workout_id):
        raise HTTPException(status_code=400, detail="Invalid workout ID")

    workout = database.GetWorkoutById(workout_id, current_user.user_id)

    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    return models.WorkoutResponse(**workout)
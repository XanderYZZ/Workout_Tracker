from fastapi import APIRouter, Depends, HTTPException, Request
import database
import models
import auth_helper
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(tags=["reports"], prefix="/reports")
limiter = Limiter(key_func=get_remote_address)

# ALL EXERCISES EVER LOGGED
@router.get("/exercises", response_model=models.AllExercisesReport)
@limiter.limit("20/minute")
async def GetAllExercisesReport(
    request: Request, current_user = Depends(auth_helper.GetCurrentUser)
):
    exercises = database.GetAllExercisesForUser(current_user.user_id)

    return models.AllExercisesReport(
        exercises=exercises
    )

# CONTAINS EXERCISE
@router.post("/contains", response_model=models.WorkoutsThatContainExerciseReport)
@limiter.limit("20/minute")
async def GetReport(
    request: Request,
    payload : models.ExerciseRequest,
    current_user = Depends(auth_helper.GetCurrentUser)
):
    exercise = payload.exercise.strip()

    if not exercise.strip():
        raise HTTPException(
            status_code=400,
            detail="Exercise name cannot be empty"
        )

    workouts = database.GetWorkoutsThatContainExercise(current_user.user_id, exercise)

    if not workouts or len(workouts) <= 0:
        raise HTTPException(status_code=404, detail="Workouts not found")
    
    return models.WorkoutsThatContainExerciseReport(
        exercise=exercise,
        workouts=[models.WorkoutResponse(**w) for w in workouts]
    )   

# VOLUME OVER PERIOD
@router.post("/volume", response_model=models.VolumeOverPeriodReport)
@limiter.limit("10/minute")
async def GetVolumeOverPeriodReport(
    request: Request,
    payload : models.VolumeOverPeriodRequest,
    current_user = Depends(auth_helper.GetCurrentUser)
):  
    exercise = ""
    total_volume = 0

    if payload.exercise: 
        exercise = payload.exercise.strip() or ""

    # I might default to using the user's bodyweight later as a fallback.
    def AddToTotalVolume(ex):
        nonlocal total_volume
        total_volume += ex["sets"] * ex["reps"] * (ex.get("weight") or 0)

    if exercise != "":
        workouts = database.GetWorkoutsThatContainExercise(current_user.user_id, exercise)

        if not workouts or len(workouts) <= 0:
            raise HTTPException(status_code=404, detail="Workouts not found")
    
        for workout in workouts:
            for ex in workout["exercises"]:
                if ex["name"].lower() == exercise.lower():
                    AddToTotalVolume(ex)
    else:
        workouts = database.GetAllWorkoutsInPeriod(current_user.user_id, payload.start_date, payload.end_date)

        if not workouts or len(workouts) <= 0:
            raise HTTPException(status_code=404, detail="Workouts not found")
        
        for workout in workouts:
            for ex in workout["exercises"]:
                AddToTotalVolume(ex)

    return models.VolumeOverPeriodReport(
        total_volume=total_volume,
        exercise=exercise
    )
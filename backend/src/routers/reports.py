from fastapi import APIRouter, Depends, Request
import lib.database_lib.workout_methods as workout_methods
import lib.database_lib.models as models
import lib.database_lib.auth_helper as auth_helper
from config import limiter
from lib.misc import dates
from lib.misc.error_handler import APIError, ErrorMessage

router = APIRouter(tags=["reports"], prefix="/reports")

# This has to be removed altogether. 

# VOLUME OVER PERIOD
@router.post("/volume", response_model=models.VolumeOverPeriodReport)
@limiter.limit("10/minute")
async def GetVolumeOverPeriodReport(
    request: Request,
    payload : models.VolumeOverPeriodRequest,
    current_user = Depends(auth_helper.GetCurrentUser)
):  
    if payload.start_date > payload.end_date:
        raise APIError.validation_error("The start date must be equal to or before the end date")
    
    exercise = payload.exercise.strip() if payload.exercise else ""
    start_utc, end_utc = dates.LocalDateRangeToUTC(payload.start_date, payload.end_date, payload.timezone)
    total_volume = 0

    # I might default to using the user's bodyweight later as a fallback.
    def AddToTotalVolume(ex) -> int:
        nonlocal total_volume
        contribution = ex["sets"] * ex["reps"] * (ex.get("weight") or 0)
        total_volume += contribution

        return contribution

    if exercise:
        workouts = workout_methods.GetWorkoutsThatContainExercise(current_user.user_id, exercise, start_utc, end_utc, True)
    else:
        workouts = workout_methods.GetAllWorkoutsInPeriod(current_user.user_id, start_utc, end_utc, True)

    if not workouts:
        return models.VolumeOverPeriodReport(
            total_volume=0,
            exercise=exercise,
        )
    
    per_day = {}

    for workout in workouts:
        volume = 0

        for ex in workout["exercises"]:
            if not exercise or ex["name"].lower() == exercise.lower():
                contribution = AddToTotalVolume(ex)
                volume += contribution

        if volume > 0:
            per_day[workout["scheduled_date"]] = volume

    return models.VolumeOverPeriodReport(
        total_volume=total_volume,
        per_day=per_day,
        exercise=exercise,
    )

@router.post("/onerepmax", response_model=models.OneRepMaxReport)
@limiter.limit("10/minute")
async def GetOneRepMax(
    request: Request,
    payload: models.OneRepMaxRequest,
    current_user = Depends(auth_helper.GetCurrentUser)
):
    if not payload.start_date or not payload.end_date:
        raise APIError.validation_error("Set a start and end date")

    if payload.start_date > payload.end_date:
        raise APIError.validation_error("The start date must be equal to or before the end date")
    
    exercise = payload.exercise.strip() if payload.exercise else ""

    if not exercise or exercise == "":
        raise APIError.validation_error("You must enter an exercise")

    start_utc, end_utc = dates.LocalDateRangeToUTC(payload.start_date, payload.end_date, payload.timezone)
    workouts = workout_methods.GetWorkoutsThatContainExercise(current_user.user_id, exercise, start_utc, end_utc, True)

    if not workouts:
        return models.OneRepMaxReport(
            per_day=None,
            exercise=exercise,
        )
    
    per_day = {}

    for workout in workouts:
        for ex in workout["exercises"]:
            if ex["name"].lower() != exercise.lower():
                continue
            
            # Epley formula
            weight = (ex.get("weight") or 0)
            per_day[workout["scheduled_date"]] = weight * (1 + (ex["reps"] / 30))

    return models.OneRepMaxReport(
        per_day=per_day,
        exercise=exercise,
    )
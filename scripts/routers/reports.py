from fastapi import APIRouter, Depends, HTTPException
import database
import models
import auth_helper

router = APIRouter(tags=["reports"], prefix="/reports")

# REPORTS
@router.get("/contains", response_model=models.ExerciseProgressReport)
async def GetReport(
    exercise : str,
    current_user = Depends(auth_helper.GetCurrentUser)
):
    workouts = database.GetWorkoutsThatContainExercise(current_user.user_id, exercise)

    if not workouts or len(workouts) <= 0:
        raise HTTPException(status_code=404, detail="Workouts not found")
    
    return models.ExerciseProgressReport(
        exercise=exercise,
        total_workouts_found=len(workouts),
        workouts=[models.WorkoutResponse(**w) for w in workouts]
    )
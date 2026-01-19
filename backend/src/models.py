from pydantic import AwareDatetime, BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class CurrentUser(BaseModel):
    user_id: str
    email: str

class ExerciseInWorkout(BaseModel):
    name: str
    sets: int
    reps: int
    weight: Optional[float] = None
    notes: Optional[str] = None

class WorkoutCreate(BaseModel):
    name: str
    scheduled_date: Optional[AwareDatetime] = None
    comments: Optional[str] = None
    exercises: List[ExerciseInWorkout] = Field(..., min_length=1)

class WorkoutResponse(WorkoutCreate):
    id: str
    user_id: str
    created_at: AwareDatetime 

    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }

class WorkoutsThatContainExerciseReport(BaseModel):
    exercise: str
    workouts: List[WorkoutResponse]
    model_config = {"from_attributes": True}

class WorkoutUpdate(BaseModel):
    scheduled_date: Optional[AwareDatetime] = None
    comments: Optional[str] = None
    exercises: Optional[List[ExerciseInWorkout]] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class AllExercisesReport(BaseModel):
    exercises: List[str]

class ExerciseRequest(BaseModel):
    exercise: str

class VolumeOverPeriodRequest(BaseModel):
    start_date: AwareDatetime
    end_date: AwareDatetime
    exercise: str | None = None

class VolumeOverPeriodReport(BaseModel):
    total_volume: float # It's a float since the weight can be a float.
    exercise: str # None gets converted to ""
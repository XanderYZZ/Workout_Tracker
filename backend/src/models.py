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

class ExerciseProgressReport(BaseModel):
    exercise: str
    total_workouts_found: int
    workouts: List[WorkoutResponse]
    model_config = {"from_attributes": True}

class WorkoutUpdate(BaseModel):
    scheduled_date: Optional[AwareDatetime] = None
    comments: Optional[str] = None
    exercises: Optional[List[ExerciseInWorkout]] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshTokenRequest(BaseModel):
    refresh_token: str
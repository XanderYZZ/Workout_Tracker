from pydantic import AwareDatetime, BaseModel, EmailStr, Field
from datetime import date, datetime
from typing import List, Optional

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    email_or_username: str
    password: str

# Only the user id and email are needed for the current user.
class CurrentUser(BaseModel):
    user_id: str
    email: str

class BodyweightUpdate(BaseModel):
    bodyweight: float = 0

class UserSettings(BaseModel):
    bodyweight: float = 0

class ExerciseInWorkout(BaseModel):
    name: str
    sets: int
    reps: int
    weight: float = 0
    notes: Optional[str] = Field(None, max_length=200)

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
    name: str
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
    start_date: date
    end_date: date
    timezone: str
    exercise: str | None = None

class VolumeOverPeriodReport(BaseModel):
    total_volume: float = 0 # It's a float since the weight can be a float.
    per_day: Optional[dict[AwareDatetime, float]] = None
    exercise: str # None gets converted to ""

class OneRepMaxRequest(BaseModel):
    start_date: date
    end_date: date
    timezone: str
    exercise: str

class OneRepMaxReport(BaseModel):
    per_day: Optional[dict[AwareDatetime, float]] = None
    exercise: str 

class EmailVerificationModel(BaseModel):
    email: EmailStr 
    verification_token: str

class InitialResetPasswordModel(BaseModel):
    email: EmailStr

class ResetPasswordModel(BaseModel):
    email: EmailStr
    token: str
    password: str
from pydantic import AwareDatetime, BaseModel, EmailStr, Field
from datetime import datetime, timezone
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

class Exercise(BaseModel):
    name: str
    sets: int = 0
    reps: int = 0
    weight: float = 0

class NameRequired(BaseModel):
    name: str = Field(..., min_length=1, pattern=r"\S")

class ScheduledDateRequired(BaseModel):
    scheduled_date: AwareDatetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

class ExercisesRequired(BaseModel):
    exercises: List[Exercise] = Field(..., min_length=1)

class Workout(NameRequired, ScheduledDateRequired, ExercisesRequired):
    comments: Optional[str] = None

class Routine(NameRequired, ExercisesRequired):
    pass

class UserCreation(BaseModel):
    id: str
    user_id: str
    created_at: AwareDatetime 

    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }

class WorkoutResponse(Workout, UserCreation):
    pass

class RoutineResponse(Routine, UserCreation):
    pass

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class EmailVerificationModel(BaseModel):
    email: EmailStr 
    verification_token: str

class InitialResetPasswordModel(BaseModel):
    email: EmailStr

class ResetPasswordModel(BaseModel):
    email: EmailStr
    token: str
    password: str
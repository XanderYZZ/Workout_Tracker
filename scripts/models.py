from pydantic import BaseModel, EmailStr, Field
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
    scheduled_date: datetime 
    comments: Optional[str] = None
    exercises: List[ExerciseInWorkout]
    
class WorkoutResponse(WorkoutCreate):
    id: str                               
    user_id: str                         
    created_at: datetime = Field(default_factory=datetime.now(datetime.timezone.utc))

class WorkoutUpdate(BaseModel):
    """Partial update model - all fields optional"""
    scheduled_date: Optional[datetime] = None
    comments: Optional[str] = None
    exercises: Optional[List[ExerciseInWorkout]] = None
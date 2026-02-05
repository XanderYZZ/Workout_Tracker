from contextlib import asynccontextmanager
import os
import sys
from pathlib import Path

from lib.misc.error_handler import APIError

sys.path.append(str(Path(__file__).resolve().parent))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from routers import auth, workouts, reports, settings
from config import limiter
from .lib.database_lib import workout_methods, user_methods
from fastapi.responses import JSONResponse

@asynccontextmanager
async def lifespan(app: FastAPI):
    workout_methods.EnsureIndexes()
    user_methods.EnsureIndexes()
    yield    

app = FastAPI(title="Workout Tracker", lifespan=lifespan)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."}
    )

@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message}
    )

origins = [
    "http://localhost:5173",  # Dev frontend
    os.getenv("FRONTEND_URL"),  # Prod frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # only frontend URLs
    allow_credentials=True,
    allow_methods=["*"],         # GET, POST, PUT, DELETE, OPTIONS
    allow_headers=["*"],         # Content-Type, Authorization, etc.
)

app.include_router(auth.router)
app.include_router(workouts.router)
app.include_router(reports.router)
app.include_router(settings.router)

@app.get("/")
async def root():
    return {"Detail": "This is the backend of the workout tracker."}
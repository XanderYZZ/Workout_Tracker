from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from routers import (auth, workouts, reports,)

app = FastAPI(title="Workout Tracker",)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."}
    )

origins = [
    "http://localhost:5173",  # Dev frontend
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, 
    allow_methods=["GET", "POST", "PUT", "DELETE"],  
    allow_headers=["Content-Type", "Authorization"],  
)

app.include_router(auth.router)
app.include_router(workouts.router)
app.include_router(reports.router)

@app.get("/")
async def root():
    return {"Detail": "This is a workout tracker."}

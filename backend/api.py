from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from src.routers import auth, workouts, reports, settings
from src.config import limiter

app = FastAPI(title="Workout Tracker",)

app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."}
    )

origins = [
    "http://localhost:5173",  # Development frontend
    "http://localhost:8000",  # Development backend
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
app.include_router(settings.router)

@app.get("/")
async def root():
    return {"Detail": "This is a workout tracker."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="localhost", port=8000, reload=True)
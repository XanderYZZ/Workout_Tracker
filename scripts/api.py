from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import (auth, workouts, reports,)

app = FastAPI(title="Workout Tracker",)

origins = [
    "http://localhost:3000", # React default for if I create a frontend for this project in the future.
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(workouts.router)
app.include_router(reports.router)

@app.get("/")
async def root():
    return {"Detail": "This is a workout tracker."}
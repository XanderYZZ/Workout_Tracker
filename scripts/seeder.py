import database

EXERCISES = [
    {"name": "Barbell Bench Press", 
     "description": "An upper-body exercise where you bring a barbell down to your chest, and then push it up.",
     "category": "upper",},
    {"name": "Barbell Overhead Press", 
     "description": "An upper-body exercise where you push a barbell above your head using your shoulders.",
     "category": "upper",},
    {"name": "Barbell Row", 
     "description": "An upper-body exercise where you row a barbell to your body while bending over.",
     "category": "upper",},
    {"name": "Barbell Squat", 
     "description": "A lower-body exercise where you squat while holding a barbell on the back of your neck.",
     "category": "lower",},
]

if __name__ == "__main__":
    for exercise in EXERCISES:
        database.AddExercise(exercise)
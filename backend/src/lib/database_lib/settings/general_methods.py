from ..database_config import GetDb

def UpdateBodyweight(email: str, bodyweight: float = 0) -> bool:
    users = GetDb()["users"]
    user_filter = {"email": email}
    update = {"$set": {"bodyweight": bodyweight,}}

    try:
        users.update_one(
            user_filter,
            update
        )

        return True
    except Exception as e:
        return False
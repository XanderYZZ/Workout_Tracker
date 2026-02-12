from .database_config import GetDb
import pymongo

INDEX_DEFINITIONS = {
    "users": [
        (
            [("email", pymongo.ASCENDING)],
            {"unique": True, "name": "users_email_unique"}
        ),
        (
            [("username", pymongo.ASCENDING)],
            {"unique": True, "name": "users_username_unique"}
        ),
    ],
    "pending_users": [
        (
            [("email", pymongo.ASCENDING)],
            {"unique": True, "name": "pending_users_email_unique"}
        ),
        (
            [("username", pymongo.ASCENDING)],
            {"unique": True, "name": "pending_users_username_unique"}
        ),
        (
            [("verification_token", pymongo.ASCENDING)],
            {"unique": True, "name": "pending_users_verification_token_unique"}
        ),
        (
            [("expires_at", pymongo.ASCENDING)],
            {"expireAfterSeconds": 0, "name": "pending_users_expiration_ttl"}
        ),
    ],
    "refresh_tokens": [
        (
            [("token_hash", pymongo.ASCENDING)],
            {"unique": True, "name": "refresh_tokens_token_hash_unique"}
        ),
        (
            [("user_id", pymongo.ASCENDING)],
            {"name": "refresh_tokens_user_id"}
        ),
        (
            [("expires_at", pymongo.ASCENDING)],
            {"expireAfterSeconds": 0, "name": "refresh_tokens_expiration_ttl"}
        ),
    ],
    "password_reset_tokens": [
        (
            [("token_hash", pymongo.ASCENDING)],
            {"unique": True, "name": "password_reset_token_unique"}
        ),
        (
            [("expires_at", pymongo.ASCENDING)],
            {"expireAfterSeconds": 0, "name": "password_reset_token_ttl"}
        ),
        (
            [("user_id", pymongo.ASCENDING)],
            {"name": "password_reset_user_id"}
        )
    ],
    "workouts": [
        (
            [("user_id", pymongo.ASCENDING), ("scheduled_date", pymongo.DESCENDING)],
            {"name": "workouts_user_id_scheduled_date"}
        ),
        (
            [("user_id", pymongo.ASCENDING), ("exercises.name", pymongo.ASCENDING)],
            {"name": "workouts_user_id_exercise_name"}
        ),
        (
            [("_id", pymongo.ASCENDING), ("user_id", pymongo.ASCENDING)],
            {"name": "workouts_id_user_id"}
        ),
    ],
}

def EnsureIndexes() -> None:
    db = GetDb()

    for collection_name, indexes in INDEX_DEFINITIONS.items():
        collection = db[collection_name]
        existing_indexes = collection.index_information()

        for keys, options in indexes:
            index_name = options.get("name")

            if index_name in existing_indexes:
                continue 

            collection.create_index(keys, **options)
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
import secrets

from app.config import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES
)


def create_access_token(data: dict):
    payload = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload["exp"] = expire

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def decode_access_token(token: str):
    try:
        return jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
    except JWTError:
        return None


def create_random_token():
    return secrets.token_urlsafe(32)
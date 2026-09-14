from datetime import datetime, timedelta, timezone
import os

from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
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
import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from jose import jwt
from passlib.context import CryptContext

load_dotenv()

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "my-super-secret-key"
)

ALGORITHM = "HS256"

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    password: str,
    hashed_password: str
) -> bool:
    return pwd_context.verify(
        password,
        hashed_password
    )


def create_access_token(data: dict) -> str:
    payload = data.copy()

    expire = datetime.now(
        timezone.utc
    ) + timedelta(minutes=60)

    payload["exp"] = expire

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )
import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from jose import jwt
from passlib.context import CryptContext

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "my-secret-key")
ALGORITHM = "HS256"

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str):
    return pwd_context.verify(password, hashed_password)


def create_access_token(data: dict):
    payload = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=60
    )

    payload["exp"] = expire

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)
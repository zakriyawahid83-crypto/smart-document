from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    TokenResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from app.utils.security import hash_password, verify_password
from app.utils.token import create_access_token, create_random_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register")
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    verification_token = create_random_token()

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        is_verified=False,
        is_active=True,
        verification_token=verification_token,
        role="user"
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "Registration successful",
        "verification_token": verification_token
    }


@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        form_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Email not verified"
        )

    token = create_access_token({
        "sub": str(user.id)
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.get("/verify-email")
def verify_email(
    token: str,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.verification_token == token
    ).first()

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid verification token"
        )

    user.is_verified = True
    user.verification_token = None

    db.commit()

    return {
        "message": "Email verified successfully"
    }


@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == data.email
    ).first()

    if not user:
        return {
            "message": "If the email exists, a reset token has been generated"
        }

    reset_token = create_random_token()
    user.reset_token = reset_token

    db.commit()

    return {
        "message": "Password reset token generated",
        "reset_token": reset_token
    }


@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.reset_token == data.token
    ).first()

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid reset token"
        )

    user.password_hash = hash_password(data.new_password)
    user.reset_token = None

    db.commit()

    return {
        "message": "Password reset successfully"
    }

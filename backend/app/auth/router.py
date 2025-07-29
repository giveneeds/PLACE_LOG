from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    generate_activation_token
)
from app.core.email import send_activation_email
from app.users.models import User
from app.auth.schemas import UserCreate, UserResponse, Token, LoginRequest
from app.auth.dependencies import get_current_active_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=UserResponse)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    activation_token = generate_activation_token()
    activation_token_expires = datetime.utcnow() + timedelta(hours=24)
    
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        activation_token=activation_token,
        activation_token_expires=activation_token_expires
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    await send_activation_email(user_data.email, activation_token)
    
    return db_user

@router.get("/activate")
async def activate_account(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.activation_token == token,
        User.activation_token_expires > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired activation token"
        )
    
    user.is_active = True
    user.activation_token = None
    user.activation_token_expires = None
    
    db.commit()
    
    return {"message": "Account activated successfully"}

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account not activated. Please check your email."
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_current_user(current_user: User = Depends(get_current_active_user)):
    return current_user
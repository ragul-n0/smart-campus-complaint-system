from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.department import Department
from app.schemas.user import UserRegisterRequest, UserLoginRequest, UserResponse
from app.schemas.token import TokenResponse
from app.auth.security import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_user

router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Registers a new user (student, staff, or admin). Password is encrypted using bcrypt.",
)
def register(
    user_in: UserRegisterRequest,
    db: Session = Depends(get_db)
):
    # 1. Check if username is already taken
    existing_user = db.query(User).filter(User.username == user_in.username.strip().lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already registered. Please choose another username.",
        )

    # 2. Validate department if provided
    if user_in.department_id is not None:
        dept = db.query(Department).filter(Department.id == user_in.department_id).first()
        if not dept:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Department with ID {user_in.department_id} does not exist.",
            )

    # 3. Hash password securely
    hashed_pwd = hash_password(user_in.password)

    # 4. Create and persist user
    new_user = User(
        name=user_in.name.strip(),
        username=user_in.username.strip().lower(),
        password_hash=hashed_pwd,
        role=user_in.role.value,
        department_id=user_in.department_id,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Returns safe UserResponse without password_hash
    return new_user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User login",
    description="Authenticates credentials and returns a signed JWT access token alongside basic user info.",
)
def login(
    credentials: UserLoginRequest,
    db: Session = Depends(get_db)
):
    # 1. Lookup user by username
    user = db.query(User).filter(User.username == credentials.username.strip().lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Verify password hash
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Create signed JWT access token
    access_token = create_access_token(
        subject=user.username,
        role=user.role,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Returns the profile details of the authenticated user. Requires valid Bearer JWT.",
)
def get_me(
    current_user: User = Depends(get_current_user)
):
    # Returns safe UserResponse without password_hash
    return current_user

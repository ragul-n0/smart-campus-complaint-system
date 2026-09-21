from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, departments, locations, complaints, staff, admin

api_router = APIRouter()

# Register endpoint routers
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(departments.router, prefix="/departments", tags=["Departments"])
api_router.include_router(locations.router, prefix="/locations", tags=["Locations"])
api_router.include_router(complaints.router, prefix="/complaints", tags=["Complaints"])
api_router.include_router(staff.router, prefix="/staff", tags=["Staff"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])

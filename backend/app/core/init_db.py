import logging
from sqlalchemy.orm import Session
from app.core.database import Base, engine, SessionLocal
from app.models.department import Department
from app.models.location import Location
import app.models  # Ensure all models are registered with Base metadata

logger = logging.getLogger(__name__)

INITIAL_DEPARTMENTS = [
    {"name": "IT", "description": "Information Technology and Network Infrastructure"},
    {"name": "Electrical", "description": "Campus Electrical Systems and Lighting"},
    {"name": "Maintenance", "description": "Civil Works, Plumbing, and Infrastructure Maintenance"},
    {"name": "Housekeeping", "description": "Sanitation, Cleanliness, and Waste Management"},
    {"name": "Security", "description": "Campus Security and Safety Services"},
]

INITIAL_LOCATIONS = [
    {"name": "Main Block", "description": "Central administrative and academic main block"},
    {"name": "CSE Block", "description": "Computer Science & Engineering block and labs"},
    {"name": "Library", "description": "Central campus library and study halls"},
    {"name": "Hostel", "description": "Student residential hostel buildings"},
    {"name": "Cafeteria", "description": "Campus cafeteria and dining facilities"},
    {"name": "Laboratory", "description": "Science and engineering research laboratories"},
    {"name": "Parking Area", "description": "Campus vehicle parking and transit zones"},
    {"name": "Auditorium", "description": "Main campus auditorium and seminar halls"},
    {"name": "Sports Ground", "description": "Outdoor sports grounds, complex, and gymnasium"},
]


def init_db():
    """
    Creates missing database tables automatically and seeds initial departments
    and campus locations if they do not already exist. Does NOT create fake users.
    """
    # 1. Create all missing tables
    Base.metadata.create_all(bind=engine)

    # 2. Seed default departments and locations
    db: Session = SessionLocal()
    try:
        # Seed departments
        for dept_data in INITIAL_DEPARTMENTS:
            existing = db.query(Department).filter(Department.name == dept_data["name"]).first()
            if not existing:
                dept = Department(
                    name=dept_data["name"],
                    description=dept_data["description"]
                )
                db.add(dept)
                logger.info(f"Seeding department: {dept_data['name']}")

        # Seed locations
        for loc_data in INITIAL_LOCATIONS:
            existing_loc = db.query(Location).filter(Location.name == loc_data["name"]).first()
            if not existing_loc:
                loc = Location(
                    name=loc_data["name"],
                    description=loc_data["description"]
                )
                db.add(loc)
                logger.info(f"Seeding location: {loc_data['name']}")

        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding initial database data: {e}")
        raise
    finally:
        db.close()

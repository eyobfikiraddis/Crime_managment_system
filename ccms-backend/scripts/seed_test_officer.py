
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.config.settings import settings
from app.core.security import hash_password
from app.modules.auth.models import Role, Department, Person, Officer
from app.shared.enums import GenderEnum

async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with async_session() as session:
        from sqlalchemy import select

        # 1. Get the 'investigator' role (already seeded by migration)
        result = await session.execute(select(Role).where(Role.role_name == "investigator"))
        role = result.scalar_one_or_none()
        if not role:
            print("Role 'investigator' not found. Check your DB.")
            return

        # 2. Create a Person (no location/department needed)
        person = Person(
            first_name="John",
            last_name="Doe",
            national_id="TEST123456",      # used for login
            gender=GenderEnum.undisclosed,  # or GenderEnum.male
        )
        session.add(person)
        await session.flush()  # to get person_id

        # 3. Create Officer (department_id = None)
        plain_password = "Strong!Pass1"
        officer = Officer(
            person_id=person.person_id,
            role_id=role.role_id,
            department_id=None,            # skip department
            rank="Sergeant",
            badge_number="BN001",
            password_hash=hash_password(plain_password),
            is_active=True,
        )
        session.add(officer)
        await session.commit()

        print("Test officer created successfully!")
        print(f"National ID: {person.national_id}")
        print(f"Password: {plain_password}")

if __name__ == "__main__":
    asyncio.run(seed())

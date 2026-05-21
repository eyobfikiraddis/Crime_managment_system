from __future__ import annotations

from typing import Any, Generic, TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.inspection import inspect

from app.shared.base_model import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: type[ModelType], session: AsyncSession) -> None:
        self.model = model
        self.session = session

    def _primary_key_column(self) -> Any:
        mapper = inspect(self.model)
        if not mapper.primary_key:
            raise ValueError(f"Model {self.model.__name__} has no primary key")
        return mapper.primary_key[0]

    async def get_by_id(self, record_id: int) -> ModelType | None:
        pk = self._primary_key_column()
        result = await self.session.execute(select(self.model).where(pk == record_id))
        return result.scalar_one_or_none()

    async def get_all(
        self,
        offset: int = 0,
        limit: int = 20,
        filters: list[Any] | None = None,
    ) -> tuple[list[ModelType], int]:
        base_query = select(self.model)
        count_query = select(func.count()).select_from(self.model)

        if filters:
            for f in filters:
                base_query = base_query.where(f)
                count_query = count_query.where(f)

        total_result = await self.session.execute(count_query)
        total: int = total_result.scalar_one()

        result = await self.session.execute(base_query.offset(offset).limit(limit))
        items = list(result.scalars().all())
        return items, total

    async def create(self, instance: ModelType) -> ModelType:
        self.session.add(instance)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def delete(self, instance: ModelType) -> None:
        await self.session.delete(instance)
        await self.session.flush()

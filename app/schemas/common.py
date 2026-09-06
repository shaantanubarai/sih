from typing import Annotated

from fastapi import Depends, Query
from pydantic import BaseModel, Field


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


def pagination(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginationParams:
    return PaginationParams(page=page, page_size=page_size)


Pagination = Annotated[PaginationParams, Depends(pagination)]


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int


def paginate(query, db, params: PaginationParams):
    from sqlalchemy import func, select

    total = db.scalar(select(func.count()).select_from(query.subquery()))
    items = list(
        db.scalars(query.offset((params.page - 1) * params.page_size).limit(params.page_size))
    )
    return items, total

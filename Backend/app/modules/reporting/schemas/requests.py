from __future__ import annotations

from datetime import date

from pydantic import BaseModel


class CaseSummaryFilters(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    department_id: int | None = None


class CaseStatusFilters(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    department_id: int | None = None


class CaseCrimeTypeFilters(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    department_id: int | None = None


class CaseDepartmentFilters(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    status_id: int | None = None


class CaseMonthlyFilters(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    department_id: int | None = None


class ArrestSummaryFilters(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    department_id: int | None = None
    officer_id: int | None = None


class ArrestMonthlyFilters(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    department_id: int | None = None


class ArrestDepartmentFilters(BaseModel):
    date_from: date | None = None
    date_to: date | None = None


class EvidenceSummaryFilters(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    department_id: int | None = None
    case_id: int | None = None


class EvidenceStatusFilters(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    department_id: int | None = None


class EvidenceStorageFilters(BaseModel):
    department_id: int | None = None


class OfficerPerformanceFilters(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    department_id: int | None = None
    officer_id: int | None = None


class OfficerCaseLoadFilters(BaseModel):
    department_id: int | None = None


class OfficerActivityFilters(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    department_id: int | None = None
    officer_id: int | None = None

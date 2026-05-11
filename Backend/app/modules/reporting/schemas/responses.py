from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class CaseSummaryResponse(BaseModel):
    total_cases: int
    open_cases: int
    closed_cases: int
    archived_cases: int
    under_investigation_cases: int
    referred_to_court_cases: int

    model_config = ConfigDict(from_attributes=True)


class CaseStatusCountResponse(BaseModel):
    status_id: int
    status_name: str
    case_count: int

    model_config = ConfigDict(from_attributes=True)


class CaseCrimeTypeCountResponse(BaseModel):
    crime_type_id: int
    crime_type_name: str
    case_count: int

    model_config = ConfigDict(from_attributes=True)


class CaseDepartmentCountResponse(BaseModel):
    department_id: int
    department_name: str
    case_count: int

    model_config = ConfigDict(from_attributes=True)


class CaseMonthlyCountResponse(BaseModel):
    year: int
    month: int
    case_count: int

    model_config = ConfigDict(from_attributes=True)


class ArrestSummaryResponse(BaseModel):
    total_arrests: int
    active_arrests: int
    released_arrests: int
    arrests_with_bail: int

    model_config = ConfigDict(from_attributes=True)


class ArrestMonthlyCountResponse(BaseModel):
    year: int
    month: int
    arrest_count: int

    model_config = ConfigDict(from_attributes=True)


class ArrestDepartmentCountResponse(BaseModel):
    department_id: int
    department_name: str
    arrest_count: int

    model_config = ConfigDict(from_attributes=True)


class EvidenceSummaryResponse(BaseModel):
    total_evidence_items: int
    sensitive_items: int
    items_submitted_to_court: int
    items_with_forensic_reports: int

    model_config = ConfigDict(from_attributes=True)


class EvidenceStatusCountResponse(BaseModel):
    custody_action: str
    item_count: int

    model_config = ConfigDict(from_attributes=True)


class EvidenceStorageUtilizationResponse(BaseModel):
    storage_location: str
    item_count: int

    model_config = ConfigDict(from_attributes=True)


class OfficerPerformanceResponse(BaseModel):
    officer_id: int
    officer_name: str
    cases_assigned: int
    cases_as_lead: int
    arrests_made: int
    evidence_collected: int
    reports_filed: int

    model_config = ConfigDict(from_attributes=True)


class OfficerCaseLoadResponse(BaseModel):
    officer_id: int
    officer_name: str
    active_case_count: int
    lead_case_count: int

    model_config = ConfigDict(from_attributes=True)


class OfficerActivityResponse(BaseModel):
    officer_id: int
    officer_name: str
    activity_date: date
    activity_count: int

    model_config = ConfigDict(from_attributes=True)


class RecentActivityResponse(BaseModel):
    update_id: int
    case_id: int
    update_type: str
    description: str
    created_at: datetime
    officer_id: int
    officer_name: str

    model_config = ConfigDict(from_attributes=True)


class DepartmentStatisticsResponse(BaseModel):
    department_id: int
    department_name: str
    case_count: int
    open_case_count: int
    officer_count: int

    model_config = ConfigDict(from_attributes=True)


class DashboardResponse(BaseModel):
    total_cases: int
    open_cases: int
    closed_cases: int
    active_investigations: int
    total_arrests: int
    active_arrests: int
    total_evidence_items: int
    sensitive_evidence_items: int
    recent_activities: list[RecentActivityResponse]
    department_statistics: list[DepartmentStatisticsResponse]

    model_config = ConfigDict(from_attributes=True)

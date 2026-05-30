# CCMS Frontend Breakdown

This scan is focused on the current state of `ccms-frontend` so the next agent can plan the next execution phase quickly.

## Made

These areas have real implementation work, not just route shells:

- **Auth Flow**: Implemented with actual forms, schemas, state management, and hooks for login, forgot password, and reset password.
  - Routes:
    - [src/app/(auth)/login/page.tsx](src/app/(auth)/login/page.tsx)
    - [src/app/(auth)/forgot-password/page.tsx](src/app/(auth)/forgot-password/page.tsx)
    - [src/app/(auth)/reset-password/page.tsx](src/app/(auth)/reset-password/page.tsx)
  - Feature Module: Code under `src/features/auth/` handles authentication forms, Zod validation schemas, API hooks, and session management.

- **Case Management**: Core screens and interactive tabs are fully operational:
  - Case List: [src/app/(dashboard)/cases/page.tsx](src/app/(dashboard)/cases/page.tsx) (filters, sorting, pagi
  nation, and React Table configuration)
  - New Case Creation: [src/app/(dashboard)/cases/new/page.tsx](src/app/(dashboard)/cases/new/page.tsx) (multi-step wizard with validation)
  - Case Details Page: [src/app/(dashboard)/cases/[caseId]/page.tsx](src/app/(dashboard)/cases/[caseId]/page.tsx) (header card, status transition drawer, tabbed navigation)
  - Case Timeline: [src/app/(dashboard)/cases/[caseId]/timeline/page.tsx](src/app/(dashboard)/cases/[caseId]/timeline/page.tsx) (30s polling, add-note, diff viewer, print)
  - Feature Module: Code under `src/features/cases/` manages list view components, detail components, timeline, creation wizard, status transitions, and custom hooks.

- **Evidence Management**: Fully integrated module operating within the case detail context:
  - Case Evidence Tab: [src/app/(dashboard)/cases/[caseId]/evidence/page.tsx](src/app/(dashboard)/cases/[caseId]/evidence/page.tsx) (DataTable with list/gallery toggle, filters, row actions, EmptyState)
  - Evidence Detail Route: [src/app/(dashboard)/cases/[caseId]/evidence/[evidenceId]/page.tsx](src/app/(dashboard)/cases/[caseId]/evidence/[evidenceId]/page.tsx) (renders dedicated full-page view for non-photo evidence)
  - Feature Module: Code under `src/features/evidence/` contains components, hooks, schemas, and types:
    - `EvidenceTab`: Manages filters (search, type multiselect, date ranges, collected-by officer) and list/gallery view mode.
    - `EvidenceUploadDrawer`: Implements a 2-step media upload orchestrating backend signature retrieval, direct upload to Cloudinary (using Axios with progress mapping), and backend record creation.
    - `EvidenceDetailDrawer`: Displays metadata, a forensic report section (roles-guarded), and a Chain of Custody timeline.
    - `CustodyChainTimeline`: Visual custody event timeline with gap detection (flags a custody transfer gap when >24 hours elapse between events).
    - `RecordCustodyEventDrawer`: Form drawer to log new custody transfers/events.
    - `EvidenceGallery` & `EvidenceLightbox`: Visual masonry grid for photo evidence and fullscreen overlay image slideshow with swipe support, zoom, keyboard navigation, and download guarding.
    - Hooks: List, detail, upload, update, delete, and custody-transfer operations under `src/features/evidence/hooks/`.
    - Schemas & Types: Zod validation schemas for forms and API validation, and full TypeScript model schemas.

- **Shared Frontend Infrastructure**:
  - Reusable UI elements (table, skeleton loaders, custom inputs, DatePicker, SearchableSelect, EmptyState, PageHeader) under `src/components/ui/` and `src/shared/components/`.
  - Application layout structures (Sidebar, TopBar, App Shell, Dashboard Shell) under `src/app/` and `src/shared/layouts/`.
  - Shared global stores: Auth store (`auth.store.ts`), notification toast system (`notification.store.ts`), UI/sidebar toggle store (`ui.store.ts`).
  - Axios client (`client.ts`) with a token refresh queue to handle session timeouts and silent token updates.
  - Multi-language support (EN + AM) translation schemas located in `messages/`.

## Left Untouched

These areas do not have dedicated feature implementations yet. They are mostly route folders with minimal page bodies rendering translation-based headers, but no business logic, domain models, or interactive components:

- **Dashboard Landing Page**: [src/app/(dashboard)/dashboard/page.tsx](src/app/(dashboard)/dashboard/page.tsx)
- **Departments**: [src/app/(dashboard)/departments/page.tsx](src/app/(dashboard)/departments/page.tsx)
- **Personnel List and Detail**:
  - Officers: [src/app/(dashboard)/personnel/officers/page.tsx](src/app/(dashboard)/personnel/officers/page.tsx)
  - Officer Detail: [src/app/(dashboard)/personnel/officers/[officerId]/page.tsx](src/app/(dashboard)/personnel/officers/[officerId]/page.tsx)
  - Persons: [src/app/(dashboard)/personnel/persons/page.tsx](src/app/(dashboard)/personnel/persons/page.tsx)
  - Person Detail: [src/app/(dashboard)/personnel/persons/[personId]/page.tsx](src/app/(dashboard)/personnel/persons/[personId]/page.tsx)
- **Legal Court Cases**: [src/app/(dashboard)/legal/court-cases/page.tsx](src/app/(dashboard)/legal/court-cases/page.tsx)
- **Reports Landing Pages**: [src/app/(dashboard)/reports/page.tsx](src/app/(dashboard)/reports/page.tsx)
- **Admin**: Route files exist but there is no admin feature module under `src/features/`.

## Explicit Placeholders

These routes intentionally show `EmptyState` content and specify that implementation is scheduled or deferred to future phases:

- **Admin Pages** (`EmptyState` for deferred development):
  - System Health: [src/app/(dashboard)/admin/health/page.tsx](src/app/(dashboard)/admin/health/page.tsx)
  - Locations: [src/app/(dashboard)/admin/locations/page.tsx](src/app/(dashboard)/admin/locations/page.tsx)
  - Crime Types: [src/app/(dashboard)/admin/crime-types/page.tsx](src/app/(dashboard)/admin/crime-types/page.tsx)
- **Settings Pages** (`EmptyState` for deferred development):
  - Profile: [src/app/(dashboard)/settings/profile/page.tsx](src/app/(dashboard)/settings/profile/page.tsx)
  - Password: [src/app/(dashboard)/settings/password/page.tsx](src/app/(dashboard)/settings/password/page.tsx)
- **Case Tabs (Sub-tabs scheduled for future phases)**:
  - Arrests: [src/app/(dashboard)/cases/[caseId]/arrests/page.tsx](src/app/(dashboard)/cases/[caseId]/arrests/page.tsx) (scheduled for **Phase 6**)
  - Interrogations: [src/app/(dashboard)/cases/[caseId]/interrogations/page.tsx](src/app/(dashboard)/cases/[caseId]/interrogations/page.tsx) (scheduled for **Phase 6**)
  - Legal (Court Cases): [src/app/(dashboard)/cases/[caseId]/legal/page.tsx](src/app/(dashboard)/cases/[caseId]/legal/page.tsx) (scheduled for **Phase 7**)
  - Officers: [src/app/(dashboard)/cases/[caseId]/officers/page.tsx](src/app/(dashboard)/cases/[caseId]/officers/page.tsx) (scheduled for **Phase 8**)
  - Permissions: [src/app/(dashboard)/cases/[caseId]/permissions/page.tsx](src/app/(dashboard)/cases/[caseId]/permissions/page.tsx) (scheduled for **Phase 8**)
  - Case Reports: [src/app/(dashboard)/cases/[caseId]/reports/page.tsx](src/app/(dashboard)/cases/[caseId]/reports/page.tsx) (scheduled for **Phase 10**)

## Planning Notes For The Next Agent

- **Next Recommended Features**: Focus on implementation of the case sub-tabs scheduled for the upcoming phases, starting with Phase 6 (Arrests and Interrogations) as they sit inside the otherwise fully functional case detail flow.
- **Conversion to Feature Modules**: Turn the minimal route shells (Departments, Personnel, Legal court cases, and Reports) into interactive features with their corresponding hooks, services, and components under `src/features/`.
- **Zustand & React Query Consistency**: Match any new feature architecture (Zod schemas, domain services, React Query hooks, and components) to the patterns established in `src/features/evidence/` and `src/features/cases/`.
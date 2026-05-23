# CCMS Frontend — Phase 2: Authentication Module & Internationalisation
## Execution Specification for AI Agent
### Year: 2026 | Runtime: Modern 2026 Ecosystem | Package Manager: pnpm | Target: Production-Grade Enterprise Frontend

---

# 1. Mission Overview

## 1.1 Objective

You are continuing the CCMS (Criminal Case Management System) frontend build. Phase 1 established the complete foundational infrastructure: the project scaffold, design token system, all three Zustand stores, the Axios API client, React Query infrastructure, the App Shell layout system, all shared components, route skeletons, and the testing/tooling stack.

**Phase 2 has two equal-priority deliverables:**

1. **Full Authentication Module** — Complete, production-ready implementation of login, logout, forgot-password, and reset-password flows. All UI must be visually exceptional: this is the first screen every officer sees. It must be authoritative, professional, and polished. No placeholder styling.

2. **Global Internationalisation (i18n) System** — The CCMS serves Ethiopian law enforcement. All user-visible text in the application must support both **English (en)** and **Amharic (am)**. This is not a retrofit. It is architected now and applied to every component from this phase forward. All text previously written in Phase 1 skeleton pages must be migrated to the i18n system as part of this phase.

## 1.2 Package Manager

**All commands in this document use `pnpm`.** Do not use `npm` or `yarn`. If Phase 1 scaffold used npm, do not change the lock file format — but all new install commands issued in this phase use `pnpm add` and `pnpm dlx`.

## 1.3 What Must Be Completed in This Run

**Internationalisation:**
- Install and configure `next-intl` as the i18n framework
- Define the complete message file architecture under `/messages/`
- Create English and Amharic message files for all routes and shared UI covered in Phase 1 and Phase 2
- Configure Next.js middleware to detect and persist locale preference
- Implement a language toggle component mountable in both AuthShell and TopBar
- Migrate all Phase 1 skeleton pages to consume localised strings
- Configure TypeScript types for all message keys (type-safe translations)

**Authentication — UI & Logic:**
- Login page: full pixel-perfect implementation with badge number + password form
- Forgot password page: full implementation with email submission and success state
- Reset password page: full implementation with password + confirm password and strength indicator
- Logout flow: triggered from TopBar dropdown, calls auth service, clears session, redirects
- Auth service: wire `login`, `logout`, `forgotPassword`, `resetPassword`, `getSession` to real API calls (replacing the `throw new Error('Not yet implemented')` stubs from Phase 1)
- Auth hooks: fully implement `useLogin`, `useLogout`, `useSession`, `useForgotPassword`, `useResetPassword`
- AuthProvider: implement session hydration on app mount using `useSession`
- Middleware: upgrade from cookie-presence-only check to cookie + role extraction (still no full JWT verification on edge — document where that goes)
- Auth error handling: map API error codes to localised user-facing messages
- Idle session timeout: detect inactivity, show a warning dialog at T-2 minutes, force logout at T
- Session expiry: silent token refresh logic in the Axios interceptor (replace stub)
- "Remember me" checkbox: controls session cookie duration via a request header
- CSRF protection header: attach `X-Requested-With` header on all state-changing requests

**Auth UI Polish:**
- Loading states: skeleton pulse on initial session check; spinner within the login button during submission
- Error states: inline field errors (from Zod) and banner errors (from API)
- Transition animations: form entrance animation, error shake animation, success redirect animation — all respecting `prefers-reduced-motion`
- Accessibility: full keyboard navigation, ARIA labels, `aria-live` error regions, focus management on modal dialogs
- Responsive: perfect layout on mobile, tablet, and desktop

**Security:**
- All tokens handled via httpOnly cookies exclusively
- No sensitive data written to `localStorage` or `sessionStorage`
- Badge number field: `autocomplete="username"`; password field: `autocomplete="current-password"` and `autocomplete="new-password"` where appropriate
- Rate limit error from API (429) renders a clear lockout message with a countdown timer

## 1.4 What Must NOT Be Implemented in This Run

- OAuth / SSO integration
- Two-factor authentication (2FA) UI
- Biometric login
- Any feature module screens beyond auth
- Case, evidence, personnel, or dashboard screens
- PWA / offline capability
- Full JWT cryptographic verification in middleware (edge runtime constraint — documented placeholder only)

## 1.5 Handoff Standard

When this run finishes:
- `pnpm dev` starts, navigating to `/` redirects to `/login`
- The login page is visually complete and functionally wired to the API
- Switching language between English and Amharic updates all visible text instantly
- `pnpm type-check` exits with zero errors
- `pnpm lint` exits with zero warnings
- `pnpm test` passes all auth-related unit and component tests
- Every text string visible on screen comes from a message file — no hardcoded strings anywhere

---

# 2. Internationalisation Architecture

## 2.1 Framework Choice: next-intl

Use **`next-intl`** (latest stable, v3.x+). It is the authoritative i18n solution for Next.js App Router. It provides:
- Server Component support (no client-side bundle penalty for message loading)
- Type-safe message keys via generated types
- Pluralisation, number formatting, date formatting
- Locale detection via middleware
- Named parameter interpolation

## 2.2 Installation

```bash
pnpm add next-intl
```

No other i18n packages are required. Do not install `i18next`, `react-i18next`, or `react-intl`.

## 2.3 Supported Locales

| Locale Code | Language | Script | Direction |
|-------------|----------|--------|-----------|
| `en` | English | Latin | LTR |
| `am` | Amharic | Ethiopic (Ge'ez) | LTR |

Default locale: `en`. The system is LTR for both locales. Amharic uses the Ge'ez script (ፊደል). The Inter font does not cover Ethiopic glyphs — see Section 2.9 for the Amharic font solution.

## 2.4 Message File Architecture

Create the `/messages/` directory at the project root (sibling to `src/`). Organise messages into **namespace files** per feature domain, with separate files per locale. Every locale directory mirrors the exact same file structure.

```
messages/
├── en/
│   ├── common.json          # Buttons, labels, status, actions shared everywhere
│   ├── auth.json            # All auth screen text (login, logout, forgot, reset)
│   ├── navigation.json      # Sidebar labels, section headers, breadcrumb labels
│   ├── errors.json          # Error messages, validation errors, API error codes
│   ├── accessibility.json   # aria-label strings, screen-reader-only text
│   ├── cases.json           # Cases module (skeleton now, content in Phase 4)
│   ├── evidence.json        # Evidence module (skeleton)
│   ├── personnel.json       # Personnel module (skeleton)
│   ├── departments.json     # Departments module (skeleton)
│   ├── legal.json           # Legal module (skeleton)
│   ├── reports.json         # Reports module (skeleton)
│   ├── dashboard.json       # Dashboard module (skeleton)
│   ├── admin.json           # Admin module (skeleton)
│   ├── settings.json        # Settings module (skeleton)
│   └── audit.json           # Audit/timeline module (skeleton)
└── am/
    ├── common.json          # Amharic equivalents — exact same key structure
    ├── auth.json
    ├── navigation.json
    ├── errors.json
    ├── accessibility.json
    ├── cases.json
    ├── evidence.json
    ├── personnel.json
    ├── departments.json
    ├── legal.json
    ├── reports.json
    ├── dashboard.json
    ├── admin.json
    ├── settings.json
    └── audit.json
```

**Rule:** Every key that exists in `en/*.json` must exist in `am/*.json` with an identical key path. Missing keys cause a TypeScript error at build time.

## 2.5 Message File Content Specification

### 2.5.1 `common.json`

```json
{
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "delete": "Delete",
    "edit": "Edit",
    "view": "View",
    "create": "Create",
    "search": "Search",
    "filter": "Filter",
    "export": "Export",
    "print": "Print",
    "retry": "Try Again",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "close": "Close",
    "submit": "Submit",
    "clear": "Clear",
    "refresh": "Refresh",
    "loading": "Loading...",
    "submitting": "Submitting...",
    "saving": "Saving..."
  },
  "status": {
    "open": "Open",
    "closed": "Closed",
    "archived": "Archived",
    "active": "Active",
    "inactive": "Inactive",
    "pending": "Pending",
    "underInvestigation": "Under Investigation",
    "referredToCourt": "Referred to Court",
    "protected": "Protected"
  },
  "pagination": {
    "showing": "Showing {from}–{to} of {total}",
    "rowsPerPage": "Rows per page",
    "goToPage": "Go to page",
    "firstPage": "First page",
    "lastPage": "Last page",
    "nextPage": "Next page",
    "previousPage": "Previous page"
  },
  "table": {
    "noResults": "No results found.",
    "noResultsDescription": "Try adjusting your search or filter criteria.",
    "selectAll": "Select all rows",
    "selectRow": "Select row",
    "clearSelection": "Clear selection",
    "selectedCount": "{count} row(s) selected"
  },
  "time": {
    "justNow": "Just now",
    "minutesAgo": "{count} minute(s) ago",
    "hoursAgo": "{count} hour(s) ago",
    "daysAgo": "{count} day(s) ago",
    "today": "Today",
    "yesterday": "Yesterday"
  },
  "classification": "Authorised personnel only. All access is logged.",
  "systemName": "CCMS",
  "systemFullName": "Criminal Case Management System",
  "notFound": "Not found",
  "forbidden": "Access denied"
}
```

Amharic `common.json` uses identical keys with Amharic values. Example:
```json
{
  "actions": {
    "save": "አስቀምጥ",
    "cancel": "ሰርዝ",
    "confirm": "አረጋግጥ",
    "delete": "ሰርዝ",
    "edit": "አርትዕ",
    "view": "ተመልከት",
    "create": "ፍጠር",
    "search": "ፈልግ",
    "filter": "አጣራ",
    "export": "ላክ",
    "print": "አትም",
    "retry": "እንደገና ሞክር",
    "back": "ተመለስ",
    "next": "ቀጣይ",
    "previous": "ቀዳሚ",
    "close": "ዝጋ",
    "submit": "አስረከብ",
    "clear": "አጽዳ",
    "refresh": "አድስ",
    "loading": "እየጫነ ነው...",
    "submitting": "እያስረከበ ነው...",
    "saving": "እያስቀመጠ ነው..."
  },
  "status": {
    "open": "ክፍት",
    "closed": "ዝግ",
    "archived": "ማህደር",
    "active": "ንቁ",
    "inactive": "ንቁ ያልሆነ",
    "pending": "በመጠባበቅ ላይ",
    "underInvestigation": "በምርመራ ላይ",
    "referredToCourt": "ለፍርድ ቤት ቀርቧል",
    "protected": "የተጠበቀ"
  },
  "pagination": {
    "showing": "{total} ከ {from}–{to} አሳይቷል",
    "rowsPerPage": "በገጽ ረድፎች",
    "goToPage": "ወደ ገጽ ሂድ",
    "firstPage": "የመጀመሪያ ገጽ",
    "lastPage": "የመጨረሻ ገጽ",
    "nextPage": "ቀጣዩ ገጽ",
    "previousPage": "ቀዳሚ ገጽ"
  },
  "table": {
    "noResults": "ምንም ውጤት አልተገኘም።",
    "noResultsDescription": "ፍለጋ ወይም ማጣሪያ ሁኔታዎን ያስተካክሉ።",
    "selectAll": "ሁሉንም ረድፎች ምረጥ",
    "selectRow": "ረድፍ ምረጥ",
    "clearSelection": "ምርጫ አጽዳ",
    "selectedCount": "{count} ረድፍ ተመርጧል"
  },
  "time": {
    "justNow": "ሀዲስ",
    "minutesAgo": "ከ{count} ደቂቃ በፊት",
    "hoursAgo": "ከ{count} ሰዓት በፊት",
    "daysAgo": "ከ{count} ቀን በፊት",
    "today": "ዛሬ",
    "yesterday": "ትናንት"
  },
  "classification": "ፈቃደኛ ሰራተኞች ብቻ። ሁሉም መዳረሻ ተመዝግቧል።",
  "systemName": "CCMS",
  "systemFullName": "የወንጀል ጉዳይ አስተዳደር ስርዓት",
  "notFound": "አልተገኘም",
  "forbidden": "ፈቃድ የለም"
}
```

### 2.5.2 `auth.json` — English

```json
{
  "login": {
    "pageTitle": "Sign In",
    "heading": "Welcome back",
    "subheading": "Sign in to your CCMS account to continue.",
    "badgeNumberLabel": "Badge Number",
    "badgeNumberPlaceholder": "e.g. BD-00142",
    "passwordLabel": "Password",
    "passwordPlaceholder": "Enter your password",
    "rememberMe": "Remember me for 30 days",
    "forgotPassword": "Forgot password?",
    "submitButton": "Sign In",
    "submittingButton": "Signing in...",
    "noAccount": "Need access? Contact your administrator.",
    "errors": {
      "invalidCredentials": "Invalid badge number or password. Please try again.",
      "accountInactive": "This account has been deactivated. Contact your administrator.",
      "rateLimited": "Too many failed attempts. Your account is locked for {minutes} minute(s).",
      "networkError": "Cannot reach the server. Check your connection and try again.",
      "sessionExpired": "Your session has expired. Please sign in again."
    }
  },
  "logout": {
    "menuLabel": "Sign Out",
    "confirmTitle": "Sign Out?",
    "confirmDescription": "You will be signed out of this session. Any unsaved changes will be lost.",
    "confirmButton": "Sign Out",
    "cancelButton": "Stay Signed In",
    "successMessage": "You have been signed out successfully."
  },
  "forgotPassword": {
    "pageTitle": "Reset Password",
    "heading": "Forgot your password?",
    "subheading": "Enter your registered email address and we will send you a reset link.",
    "emailLabel": "Email Address",
    "emailPlaceholder": "officer@ccms.gov.et",
    "submitButton": "Send Reset Link",
    "submittingButton": "Sending...",
    "backToLogin": "Back to Sign In",
    "successTitle": "Reset link sent",
    "successDescription": "If an account exists for {email}, a password reset link has been sent. Check your inbox and spam folder.",
    "errors": {
      "emailNotFound": "No account found with this email address.",
      "rateLimited": "Too many requests. Please wait before requesting another reset link.",
      "networkError": "Cannot reach the server. Please try again."
    }
  },
  "resetPassword": {
    "pageTitle": "Set New Password",
    "heading": "Set a new password",
    "subheading": "Choose a strong password for your account.",
    "newPasswordLabel": "New Password",
    "newPasswordPlaceholder": "Minimum 8 characters",
    "confirmPasswordLabel": "Confirm New Password",
    "confirmPasswordPlaceholder": "Re-enter your new password",
    "submitButton": "Set New Password",
    "submittingButton": "Saving...",
    "backToLogin": "Back to Sign In",
    "passwordStrength": {
      "label": "Password strength",
      "weak": "Weak",
      "fair": "Fair",
      "strong": "Strong",
      "veryStrong": "Very Strong"
    },
    "requirements": {
      "title": "Password must contain:",
      "minLength": "At least 8 characters",
      "uppercase": "At least one uppercase letter",
      "digit": "At least one number",
      "special": "At least one special character (!@#$%^&*)"
    },
    "successTitle": "Password updated",
    "successDescription": "Your password has been changed successfully. You can now sign in with your new password.",
    "errors": {
      "tokenInvalid": "This reset link is invalid or has expired. Request a new one.",
      "passwordMismatch": "Passwords do not match.",
      "passwordTooWeak": "Password does not meet the strength requirements.",
      "networkError": "Cannot reach the server. Please try again."
    }
  },
  "session": {
    "idleWarningTitle": "Are you still there?",
    "idleWarningDescription": "You will be automatically signed out in {minutes} minute(s) due to inactivity.",
    "idleStayButton": "Stay Signed In",
    "idleLogoutButton": "Sign Out Now",
    "autoLogoutMessage": "You were signed out due to inactivity."
  }
}
```

### 2.5.3 `auth.json` — Amharic

```json
{
  "login": {
    "pageTitle": "ግባ",
    "heading": "እንኳን ደህና መጡ",
    "subheading": "ለቀጠለ ተሳትፎ ወደ CCMS መለያዎ ይግቡ።",
    "badgeNumberLabel": "የባጅ ቁጥር",
    "badgeNumberPlaceholder": "ለምሳሌ BD-00142",
    "passwordLabel": "የይለፍ ቃል",
    "passwordPlaceholder": "የይለፍ ቃልዎን ያስገቡ",
    "rememberMe": "ለ30 ቀናት አስታዉሰኝ",
    "forgotPassword": "የይለፍ ቃል ረሳህ?",
    "submitButton": "ግባ",
    "submittingButton": "እየገባ ነው...",
    "noAccount": "ፈቃድ ያስፈልጋል? አስተዳዳሪዎን ያናጋ።",
    "errors": {
      "invalidCredentials": "የባጅ ቁጥር ወይም የይለፍ ቃል ትክክል አይደለም። እንደገና ይሞክሩ።",
      "accountInactive": "ይህ መለያ ተሰናክሏል። አስተዳዳሪዎን ያናጋ።",
      "rateLimited": "ብዙ ጊዜ ስህተት ተሞክሯል። መለያዎ ለ{minutes} ደቂቃ ተቆልፏል።",
      "networkError": "አገልጋዩ ላይ መድረስ አልተቻለም። ግንኙነትዎን ያረጋግጡ።",
      "sessionExpired": "ክፍለ ጊዜዎ አብቅቷል። እንደገና ይግቡ።"
    }
  },
  "logout": {
    "menuLabel": "ውጣ",
    "confirmTitle": "ልትወጣ?",
    "confirmDescription": "ከዚህ ክፍለ ጊዜ ትወጣለህ። ያልተቀመጡ ለውጦች ይጠፋሉ።",
    "confirmButton": "ውጣ",
    "cancelButton": "ግባ ቆይ",
    "successMessage": "በተሳካ ሁኔታ ወጥተሃል።"
  },
  "forgotPassword": {
    "pageTitle": "የይለፍ ቃል ዳግም ያስጀምሩ",
    "heading": "የይለፍ ቃልዎን ረሱ?",
    "subheading": "የተመዘገበ ኢሜይልዎን ያስገቡ — የዳግም ማስጀመሪያ ሊንክ እንልካለን።",
    "emailLabel": "የኢሜይል አድራሻ",
    "emailPlaceholder": "officer@ccms.gov.et",
    "submitButton": "የዳግም ማስጀመሪያ ሊንክ ላክ",
    "submittingButton": "እየላከ ነው...",
    "backToLogin": "ወደ መግቢያ ተመለስ",
    "successTitle": "ሊንክ ተልኳል",
    "successDescription": "ለ{email} መለያ ካለ፣ የዳግም ማስጀመሪያ ሊንክ ተልኳል። ሳጥንዎን ያረጋግጡ።",
    "errors": {
      "emailNotFound": "በዚህ ኢሜይል መለያ አልተገኘም።",
      "rateLimited": "ብዙ ጥያቄዎች። ሌላ ሊንክ ከመጠየቅዎ በፊት ይጠብቁ።",
      "networkError": "አገልጋዩ ላይ መድረስ አልተቻለም። እንደገና ይሞክሩ።"
    }
  },
  "resetPassword": {
    "pageTitle": "አዲስ የይለፍ ቃል ያስጀምሩ",
    "heading": "አዲስ የይለፍ ቃል ያዘጋጁ",
    "subheading": "ለመለያዎ ጠንካራ የይለፍ ቃል ይምረጡ።",
    "newPasswordLabel": "አዲስ የይለፍ ቃል",
    "newPasswordPlaceholder": "ቢያንስ 8 ቁምፊዎች",
    "confirmPasswordLabel": "አዲስ የይለፍ ቃል አረጋግጥ",
    "confirmPasswordPlaceholder": "አዲሱን የይለፍ ቃል እንደገና ያስገቡ",
    "submitButton": "አዲስ የይለፍ ቃል ያስቀምጡ",
    "submittingButton": "እያስቀመጠ ነው...",
    "backToLogin": "ወደ መግቢያ ተመለስ",
    "passwordStrength": {
      "label": "የይለፍ ቃል ጥንካሬ",
      "weak": "ደካማ",
      "fair": "መካከለኛ",
      "strong": "ጠንካራ",
      "veryStrong": "በጣም ጠንካራ"
    },
    "requirements": {
      "title": "የይለፍ ቃሉ መያዝ ያለበት:",
      "minLength": "ቢያንስ 8 ቁምፊዎች",
      "uppercase": "ቢያንስ አንድ ትልቅ ፊደል",
      "digit": "ቢያንስ አንድ ቁጥር",
      "special": "ቢያንስ አንድ ልዩ ቁምፊ (!@#$%^&*)"
    },
    "successTitle": "የይለፍ ቃል ተቀይሯል",
    "successDescription": "የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል። አዲሱን የይለፍ ቃልዎን ተጠቅመው ይግቡ።",
    "errors": {
      "tokenInvalid": "ይህ ሊንክ ልክ አይደለም ወይም አብቅቷል። አዲስ ያዘዙ።",
      "passwordMismatch": "የይለፍ ቃሎቹ አይዛመዱም።",
      "passwordTooWeak": "የይለፍ ቃሉ መስፈርቶችን አያሟላም።",
      "networkError": "አገልጋዩ ላይ መድረስ አልተቻለም። እንደገና ይሞክሩ።"
    }
  },
  "session": {
    "idleWarningTitle": "አሁንም እዚህ አሉ?",
    "idleWarningDescription": "ንቁ ስላልሆኑ ከ{minutes} ደቂቃ በኋላ ተዘጋ ይባላሉ።",
    "idleStayButton": "ቆይ ፈቀድ",
    "idleLogoutButton": "አሁን ውጣ",
    "autoLogoutMessage": "ስለ ንቃት ማጣት ወጥቷል።"
  }
}
```

### 2.5.4 `navigation.json` — English

```json
{
  "sections": {
    "operations": "Operations",
    "evidence": "Evidence",
    "legal": "Legal",
    "personnel": "Personnel",
    "organisation": "Organisation",
    "intelligence": "Intelligence",
    "system": "System",
    "account": "Account"
  },
  "items": {
    "dashboard": "Dashboard",
    "cases": "Cases",
    "arrests": "Arrests",
    "courtCases": "Court Cases",
    "persons": "Persons",
    "officers": "Officers",
    "departments": "Departments",
    "reports": "Reports",
    "locations": "Locations",
    "crimeTypes": "Crime Types",
    "systemHealth": "System Health",
    "audit": "Audit Log",
    "settings": "Settings",
    "profile": "My Profile",
    "password": "Change Password",
    "logout": "Sign Out"
  },
  "breadcrumbs": {
    "home": "Home",
    "cases": "Cases",
    "newCase": "New Case",
    "evidence": "Evidence",
    "officers": "Officers",
    "persons": "Persons",
    "departments": "Departments",
    "reports": "Reports",
    "admin": "Admin",
    "settings": "Settings",
    "legal": "Legal",
    "arrests": "Arrests",
    "interrogations": "Interrogations",
    "timeline": "Timeline",
    "permissions": "Permissions"
  },
  "sidebar": {
    "collapseLabel": "Collapse sidebar",
    "expandLabel": "Expand sidebar",
    "openMobileMenu": "Open navigation menu"
  }
}
```

### 2.5.5 `navigation.json` — Amharic

```json
{
  "sections": {
    "operations": "ስራዎች",
    "evidence": "ማስረጃ",
    "legal": "ህጋዊ",
    "personnel": "ሰራተኞች",
    "organisation": "ድርጅት",
    "intelligence": "ስለላ",
    "system": "ስርዓት",
    "account": "መለያ"
  },
  "items": {
    "dashboard": "ዳሽቦርድ",
    "cases": "ጉዳዮች",
    "arrests": "እስሮች",
    "courtCases": "የፍርድ ቤት ጉዳዮች",
    "persons": "ሰዎች",
    "officers": "መኮንኖች",
    "departments": "ክፍሎች",
    "reports": "ሪፖርቶች",
    "locations": "ቦታዎች",
    "crimeTypes": "የወንጀል ዓይነቶች",
    "systemHealth": "የስርዓት ጤና",
    "audit": "የኦዲት ምዝገባ",
    "settings": "ቅንብሮች",
    "profile": "መገለጫዬ",
    "password": "የይለፍ ቃል ቀይር",
    "logout": "ውጣ"
  },
  "breadcrumbs": {
    "home": "መነሻ",
    "cases": "ጉዳዮች",
    "newCase": "አዲስ ጉዳይ",
    "evidence": "ማስረጃ",
    "officers": "መኮንኖች",
    "persons": "ሰዎች",
    "departments": "ክፍሎች",
    "reports": "ሪፖርቶች",
    "admin": "አስተዳዳሪ",
    "settings": "ቅንብሮች",
    "legal": "ህጋዊ",
    "arrests": "እስሮች",
    "interrogations": "ምርመራዎች",
    "timeline": "ጊዜ ሰሌዳ",
    "permissions": "ፈቃዶች"
  },
  "sidebar": {
    "collapseLabel": "ሳይድባር አሳንስ",
    "expandLabel": "ሳይድባር አሳፋ",
    "openMobileMenu": "የናቪጌሽን ምናሌ ክፈት"
  }
}
```

### 2.5.6 `errors.json` — English

```json
{
  "validation": {
    "required": "This field is required.",
    "email": "Enter a valid email address.",
    "minLength": "Must be at least {min} characters.",
    "maxLength": "Must be no more than {max} characters.",
    "passwordMismatch": "Passwords do not match.",
    "invalidFormat": "Invalid format.",
    "badgeNumberFormat": "Badge number must be in the format BD-XXXXX."
  },
  "api": {
    "generic": "An unexpected error occurred. Please try again.",
    "network": "Network error. Check your connection.",
    "unauthorized": "You are not authorised to perform this action.",
    "forbidden": "You do not have permission to access this resource.",
    "notFound": "The requested resource was not found.",
    "serverError": "A server error occurred. Please contact support if the problem persists.",
    "rateLimited": "You have made too many requests. Please wait before trying again.",
    "validationFailed": "Please correct the highlighted errors and try again."
  },
  "pages": {
    "404": {
      "title": "Page Not Found",
      "description": "The page you are looking for does not exist or has been moved.",
      "action": "Go to Dashboard"
    },
    "403": {
      "title": "Access Denied",
      "description": "You do not have permission to view this page. If you believe this is an error, contact your administrator.",
      "action": "Go to Dashboard"
    },
    "500": {
      "title": "Something Went Wrong",
      "description": "An unexpected error occurred. Our team has been notified.",
      "action": "Reload Page"
    }
  }
}
```

### 2.5.7 `errors.json` — Amharic

```json
{
  "validation": {
    "required": "ይህ ሜዳ ያስፈልጋል።",
    "email": "ትክክለኛ ኢሜይል አድራሻ ያስገቡ።",
    "minLength": "ቢያንስ {min} ቁምፊዎች መሆን አለበት።",
    "maxLength": "ከ{max} ቁምፊዎች አልበልጥ።",
    "passwordMismatch": "የይለፍ ቃሎቹ አይዛመዱም።",
    "invalidFormat": "ልክ ያልሆነ ቅርጸት።",
    "badgeNumberFormat": "የባጅ ቁጥር BD-XXXXX መልክ መሆን አለበት።"
  },
  "api": {
    "generic": "ያልተጠበቀ ስህተት ተከስቷል። እንደገና ይሞክሩ።",
    "network": "የአውታረ መረብ ስህተት። ግንኙነትዎን ያረጋግጡ።",
    "unauthorized": "ይህን ድርጊት ለማከናወን ፈቃድ የለዎትም።",
    "forbidden": "ይህን ምንጭ ለማስተናገድ ፈቃድ የለዎትም።",
    "notFound": "የጠየቁት ምንጭ አልተገኘም።",
    "serverError": "የአገልጋይ ስህተት ተከስቷል። ችግሩ ከቀጠለ ድጋፍን ያናጋ።",
    "rateLimited": "ብዙ ጥያቄዎች ተደርገዋል። ከመሞከርዎ በፊት ይጠብቁ።",
    "validationFailed": "የተጠቀሱ ስህተቶችን አርምዕ እንደገና ይሞክሩ።"
  },
  "pages": {
    "404": {
      "title": "ገጽ አልተገኘም",
      "description": "የሚፈልጉት ገጽ የለም ወይም ተዘዋውሯል።",
      "action": "ወደ ዳሽቦርድ ሂድ"
    },
    "403": {
      "title": "ፈቃድ የለም",
      "description": "ይህን ገጽ ለማየት ፈቃድ የለዎትም። ስህተት ይመስልዎት ከሆነ አስተዳዳሪዎን ያናጋ።",
      "action": "ወደ ዳሽቦርድ ሂድ"
    },
    "500": {
      "title": "ችግር ተፈጥሯል",
      "description": "ያልተጠበቀ ስህተት ተከስቷል። ቡድናችን ተወካካ ነው።",
      "action": "ገጽ አድስ"
    }
  }
}
```

All remaining namespace files (`cases.json`, `evidence.json`, `personnel.json`, `departments.json`, `legal.json`, `reports.json`, `dashboard.json`, `admin.json`, `settings.json`, `audit.json`, `accessibility.json`) must be created for both `en/` and `am/`. For Phase 2 these are skeleton files containing at minimum the page title, loading message, and skeleton placeholder text for every route under that namespace. They will be completed in the phases where those modules are fully implemented.

Example skeleton `cases.json` (English):
```json
{
  "pageTitle": "Cases",
  "list": {
    "heading": "All Cases",
    "skeleton": "Loading cases...",
    "newCase": "New Case",
    "searchPlaceholder": "Search cases..."
  },
  "detail": {
    "skeleton": "Loading case details...",
    "tabs": {
      "overview": "Overview",
      "evidence": "Evidence",
      "arrests": "Arrests",
      "interrogations": "Interrogations",
      "legal": "Legal",
      "officers": "Officers",
      "timeline": "Timeline",
      "reports": "Reports",
      "permissions": "Permissions"
    }
  }
}
```

Amharic equivalent with same key structure must be present.

## 2.6 next-intl Configuration

### 2.6.1 `src/config/i18n.ts`

Create this file. It is the single source of truth for locale configuration.

```typescript
export const locales = ['en', 'am'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  am: 'አማርኛ',
}

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  am: '🇪🇹',
}
```

### 2.6.2 `src/i18n/request.ts`

This is the next-intl server-side configuration file:

```typescript
import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, type Locale, locales } from '@config/i18n'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const rawLocale = cookieStore.get('ccms_locale')?.value
  const locale: Locale =
    rawLocale && locales.includes(rawLocale as Locale)
      ? (rawLocale as Locale)
      : defaultLocale

  return {
    locale,
    messages: {
      ...(await import(`../../messages/${locale}/common.json`)).default,
      // Individual namespaces are loaded per-layout/page via next-intl's
      // namespace scoping. This root config loads only common.
    },
  }
})
```

**Note on message loading strategy:** Use next-intl's namespace approach — each layout and page imports only the namespaces it needs via `getTranslations('namespace')` on the server and `useTranslations('namespace')` on the client. Do not load all namespaces globally. This keeps server component bundles lean.

The actual message loading with multiple namespaces:

```typescript
// In src/i18n/request.ts — load all namespaces at request time
import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, type Locale, locales } from '@config/i18n'

const NAMESPACES = [
  'common', 'auth', 'navigation', 'errors', 'accessibility',
  'cases', 'evidence', 'personnel', 'departments', 'legal',
  'reports', 'dashboard', 'admin', 'settings', 'audit',
] as const

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const rawLocale = cookieStore.get('ccms_locale')?.value
  const locale: Locale =
    rawLocale && locales.includes(rawLocale as Locale)
      ? (rawLocale as Locale)
      : defaultLocale

  const messages: Record<string, unknown> = {}
  for (const ns of NAMESPACES) {
    messages[ns] = (await import(`../../messages/${locale}/${ns}.json`)).default
  }

  return { locale, messages }
})
```

### 2.6.3 `next.config.ts` Update

Add next-intl plugin wrapping to the Next.js config:

```typescript
import createNextIntlPlugin from 'next-intl/plugin'
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig = {
  // ... existing config
}

export default withNextIntl(nextConfig)
```

### 2.6.4 TypeScript Message Types

Create `src/types/messages.d.ts` (or let next-intl CLI generate it):

Run after setup:
```bash
pnpm dlx next-intl generate-types
```

This generates type-safe message key types so that `t('auth.login.heading')` is type-checked against the message files. Add this to the CI pipeline. If using generated types, add the output file to `.gitignore` and regenerate on CI.

Add to `package.json` scripts:
```json
"i18n:types": "next-intl generate-types"
```

## 2.7 Middleware Locale Handling

Update `src/middleware.ts` to handle locale cookie detection alongside the existing auth logic. The middleware must:

1. Read `ccms_locale` cookie — if present and valid, use it. If absent, detect from `Accept-Language` header and fall back to `en`.
2. Do NOT redirect to locale-prefixed URLs (e.g., `/en/login`) — this application does NOT use URL-based locale routing. Locale is entirely cookie-driven. This simplifies URL structure for a closed enterprise system.
3. Set `ccms_locale` cookie on the response if it was absent, establishing the detected default.

The existing auth redirect logic is unchanged. Locale detection runs before auth checks.

## 2.8 Language Toggle Component

Create `src/shared/components/i18n/LocaleToggle.tsx`.

This is a Client Component. It renders a compact toggle/dropdown showing the current locale name and flag, allowing the user to switch. On selection, it:
1. Calls a server action (or API route) that sets the `ccms_locale` cookie
2. Calls `router.refresh()` to reload the page with the new locale

**Implementation:**

```typescript
// src/shared/components/i18n/LocaleToggle.tsx
'use client'

// Uses shadcn DropdownMenu. Shows current locale with flag emoji.
// Two items: English / አማርኛ
// On select: POST to /api/locale with { locale }
// then router.refresh()
```

Create the locale API route at `src/app/api/locale/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale, type Locale } from '@config/i18n'

export async function POST(request: NextRequest) {
  const { locale } = await request.json() as { locale: string }
  const validLocale: Locale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale

  const response = NextResponse.json({ locale: validLocale })
  response.cookies.set('ccms_locale', validLocale, {
    httpOnly: false, // must be readable client-side for the toggle initial state
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  })
  return response
}
```

**Placement:**
- In `AuthShell.tsx` — show in the top-right corner of the auth card, above the form
- In `TopBar.tsx` — show in the right zone, between the notification bell and avatar menu

Create `src/shared/components/i18n/index.ts` exporting `LocaleToggle`.

## 2.9 Amharic Font Support

Inter does not include Ethiopic Unicode glyphs (U+1200–U+137F). Without a proper font, Amharic text renders as tofu (empty squares).

**Solution:** Add **Noto Sans Ethiopic** via `next/font/google` alongside Inter.

In `src/app/layout.tsx`:

```typescript
import { Inter, Noto_Sans_Ethiopic, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSansEthiopic = Noto_Sans_Ethiopic({
  subsets: ['ethiopic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ethiopic',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})
```

Apply both font variables to `<html>`:
```tsx
<html
  lang={locale}
  className={`${inter.variable} ${notoSansEthiopic.variable} ${jetbrainsMono.variable} dark`}
>
```

Update `tokens.css` and global CSS font stack:
```css
:root {
  --font-sans: var(--font-inter), var(--font-ethiopic), system-ui, sans-serif;
  --font-mono: var(--font-mono), monospace;
}
```

This ensures Inter renders Latin characters and Noto Sans Ethiopic renders Amharic characters — both in the same font stack with no visible gap.

Also update `tailwind.config.ts`:
```typescript
fontFamily: {
  sans: ['var(--font-inter)', 'var(--font-ethiopic)', 'system-ui', 'sans-serif'],
  mono: ['var(--font-mono)', 'monospace'],
}
```

## 2.10 Using Translations in Components

### Server Components

```typescript
import { getTranslations } from 'next-intl/server'

export default async function LoginPage() {
  const t = await getTranslations('auth')
  return <h1>{t('login.heading')}</h1>
}
```

### Client Components

```typescript
'use client'
import { useTranslations } from 'next-intl'

export function LoginForm() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  return <button>{tCommon('actions.submit')}</button>
}
```

### Interpolation

```typescript
t('auth.login.errors.rateLimited', { minutes: 5 })
// → "Your account is locked for 5 minute(s)."
// → "መለያዎ ለ5 ደቂቃ ተቆልፏል።" (Amharic)
```

## 2.11 Migration of Phase 1 Skeleton Pages

All existing `page.tsx` skeleton files under `src/app/(dashboard)/` must be updated to use `getTranslations` for their `<h1>` content and `metadata.title`. Replace all hardcoded strings like `"Cases — List [Skeleton]"` with:

```typescript
const t = await getTranslations('cases')
// title: t('pageTitle') → "Cases" / "ጉዳዮች"
```

The `metadata` export:
```typescript
export async function generateMetadata() {
  const t = await getTranslations('cases')
  return { title: t('pageTitle') }
}
```

---

# 3. Auth Module — Full Implementation

## 3.1 Auth Service (`src/services/domain/auth.service.ts`)

Replace all `throw new Error('Not yet implemented')` stubs with real Axios calls. All responses are validated against Zod schemas before being returned to callers. All calls use the `apiClient` from `src/services/api/client.ts`.

```typescript
import { apiClient } from '@services/api/client'
import type {
  LoginCredentials,
  AuthSession,
  ResetPasswordPayload,
} from '@shared/types/auth.types'
import { authSessionSchema } from '@features/auth/schemas/auth-session.schema'

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  const response = await apiClient.post<AuthSession>(
    '/api/v1/auth/login',
    credentials,
  )
  return authSessionSchema.parse(response)
}

export async function logout(): Promise<void> {
  await apiClient.post('/api/v1/auth/logout')
}

export async function refreshToken(): Promise<AuthSession> {
  const response = await apiClient.post<AuthSession>('/api/v1/auth/refresh')
  return authSessionSchema.parse(response)
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return apiClient.post('/api/v1/auth/forgot-password', { email })
}

export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<{ message: string }> {
  return apiClient.post('/api/v1/auth/reset-password', payload)
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const response = await apiClient.get<AuthSession>('/api/v1/auth/session')
    return authSessionSchema.parse(response)
  } catch {
    return null
  }
}
```

Create `src/features/auth/schemas/auth-session.schema.ts` with a Zod schema matching `AuthSession`. This is the shape returned by the backend:

```typescript
import { z } from 'zod'
import { OfficerRole } from '@shared/constants/roles'

export const officerProfileSchema = z.object({
  id: z.string().uuid(),
  badgeNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(OfficerRole),
  departmentId: z.string().uuid(),
  permissions: z.array(z.string()),
  isActive: z.boolean(),
  lastLoginAt: z.string().datetime().nullable(),
})

export const authSessionSchema = z.object({
  officer: officerProfileSchema,
  sessionId: z.string(),
  expiresAt: z.string().datetime(),
})
```

## 3.2 Auth Hooks — Full Implementation

### 3.2.1 `useLogin.ts`

```typescript
'use client'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { login } from '@services/domain/auth.service'
import { useAuthStore } from '@shared/stores/auth.store'
import { useNotificationStore } from '@shared/stores/notification.store'
import { ApiError } from '@services/api/errors'
import type { LoginCredentials } from '@shared/types/auth.types'

export function useLogin() {
  const router = useRouter()
  const { setSession } = useAuthStore()
  const { addToast } = useNotificationStore()
  const tAuth = useTranslations('auth')
  const tErrors = useTranslations('errors')

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: (session) => {
      setSession(session.officer, session.officer.permissions, session.sessionId)
      router.push('/dashboard')
      router.refresh()
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        if (error.isUnauthorized()) {
          // Return the error message for inline form display
          // Do NOT add a toast — the form renders inline errors
          return
        }
        if (error.statusCode === 403) {
          addToast({
            message: tAuth('login.errors.accountInactive'),
            variant: 'error',
          })
          return
        }
        if (error.isRateLimited()) {
          addToast({
            message: tAuth('login.errors.rateLimited', { minutes: 5 }),
            variant: 'error',
          })
          return
        }
      }
      addToast({ message: tErrors('api.network'), variant: 'error' })
    },
  })
}
```

### 3.2.2 `useLogout.ts`

```typescript
'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { logout } from '@services/domain/auth.service'
import { useAuthStore } from '@shared/stores/auth.store'
import { useNotificationStore } from '@shared/stores/notification.store'

export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { clearSession } = useAuthStore()
  const { addToast } = useNotificationStore()
  const t = useTranslations('auth')

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearSession()
      queryClient.clear() // Purge all cached server data on logout
      addToast({ message: t('logout.successMessage'), variant: 'success' })
      router.push('/login')
      router.refresh()
    },
    onError: () => {
      // Force local logout even on network failure
      clearSession()
      queryClient.clear()
      router.push('/login')
      router.refresh()
    },
  })
}
```

### 3.2.3 `useSession.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { getSession } from '@services/domain/auth.service'
import { useAuthStore } from '@shared/stores/auth.store'
import { authKeys } from '@services/query/keys/authKeys'

export function useSession() {
  const { setSession, clearSession } = useAuthStore()

  return useQuery({
    queryKey: authKeys.session(),
    queryFn: async () => {
      const session = await getSession()
      if (session) {
        setSession(session.officer, session.officer.permissions, session.sessionId)
      } else {
        clearSession()
      }
      return session
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    refetchOnWindowFocus: true,
  })
}
```

### 3.2.4 `useForgotPassword.ts`

```typescript
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { forgotPassword } from '@services/domain/auth.service'
import { ApiError } from '@services/api/errors'

export function useForgotPassword() {
  const [successEmail, setSuccessEmail] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (email: string) => forgotPassword(email),
    onSuccess: (_, email) => {
      setSuccessEmail(email)
    },
  })

  return { ...mutation, successEmail }
}
```

### 3.2.5 `useResetPassword.ts`

```typescript
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resetPassword } from '@services/domain/auth.service'
import type { ResetPasswordPayload } from '@shared/types/auth.types'

export function useResetPassword() {
  const router = useRouter()
  const [isSuccess, setIsSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: (payload: ResetPasswordPayload) => resetPassword(payload),
    onSuccess: () => {
      setIsSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    },
  })

  return { ...mutation, isSuccess }
}
```

## 3.3 authKeys Update

Add the `session` key to `src/services/query/keys/authKeys.ts`:

```typescript
export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
}
```

## 3.4 AuthProvider — Full Implementation

`src/shared/providers/AuthProvider.tsx` — replace the stub with a working implementation:

```typescript
'use client'
import { useEffect } from 'react'
import { useSession } from '@features/auth/hooks/useSession'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoading } = useSession()

  // While the session check is in flight on the very first mount,
  // render children anyway — the middleware has already validated the
  // cookie. This avoids a full-page loading flash on protected routes.
  // The authStore is populated by useSession's onSuccess callback.

  return <>{children}</>
}
```

## 3.5 Idle Session Timeout

Create `src/features/auth/hooks/useIdleTimeout.ts`.

**Logic:**
- Track last user interaction (mouse move, keyboard, click, scroll) via `document` event listeners attached with `{ passive: true }`
- Configurable `timeoutMs` (default: read from `env.SESSION_TIMEOUT_MS`, fallback `15 * 60 * 1000` = 15 minutes)
- Warning threshold: `timeoutMs - 2 * 60 * 1000` (warn at T-2 minutes)
- On warning threshold: open the idle warning dialog via `uiStore.openModal('idle-warning')`
- On timeout: call `useLogout` mutation, add a timeout toast

```typescript
export function useIdleTimeout(timeoutMs = 15 * 60 * 1000) {
  // Implementation detail: use a single setInterval that checks elapsed
  // time since last activity, rather than resetting a timeout on every
  // event (avoids creating thousands of timers).
  // Reset lastActivity on any user interaction.
  // Only active when isAuthenticated === true.
}
```

Mount `useIdleTimeout` inside `AuthProvider` so it is active for all authenticated sessions.

Create the `IdleWarningModal` component in `src/features/auth/components/IdleWarningModal.tsx`. Register it in the `ModalRenderer` registry under the key `'idle-warning'`.

## 3.6 Token Refresh in Axios Interceptor

In `src/services/api/client.ts`, replace the 401 handling stub with the real implementation:

```typescript
// In the response error interceptor:
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: unknown) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(null)))
  failedQueue = []
}

// On 401 response:
// 1. If already refreshing, queue this request
// 2. If not refreshing, attempt refresh
// 3. On refresh success: retry all queued requests
// 4. On refresh failure: clear session, redirect to /login
```

Implement the queue pattern to prevent multiple simultaneous refresh calls when several requests 401 at the same time. The pattern is a standard implementation — do not over-abstract it.

---

# 4. Auth UI — Visual Design Specification

## 4.1 Design Philosophy for Auth Screens

The auth screens are the entry point to a law enforcement system. They must convey:
- **Authority**: This is a serious operational tool
- **Security**: The UI signals that access is controlled and monitored
- **Clarity**: Officers under operational stress must understand the interface instantly
- **Polish**: The quality of the entry experience sets expectations for the entire system

The auth screens are the CCMS brand. Invest heavily in their visual execution.

## 4.2 Auth Shell — Enhanced Implementation

Rebuild `src/shared/layouts/AuthShell.tsx` to match this specification precisely.

**Full viewport layout:**
```
┌──────────────────────────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← Background: #0F172A with subtle radial gradient
│                                                          │
│                    ┌──────────────────────┐              │  ← Shield icon (30px, primary blue, above mark)
│                    │  🛡  CCMS            │              │  ← Logotype: "CCMS" in semibold + shield icon
│                    │                      │              │
│                    │  ┌────────────────┐  │              │  ← Locale toggle (top-right of card)
│                    │  │   Form Area    │  │              │
│                    │  └────────────────┘  │              │
│                    └──────────────────────┘              │
│                                                          │
│  ─────────────────────────────────────────────────────── │  ← Separator
│  "Authorised personnel only. All access is logged."      │  ← Classification footer (xs, muted, centred)
└──────────────────────────────────────────────────────────┘
```

**Background:** `background: radial-gradient(ellipse at 50% -20%, rgba(59, 130, 246, 0.08) 0%, transparent 60%), var(--color-background)`. This adds a very subtle blue glow emanating from the top — not decorative, it echoes the primary colour for a sense of depth.

**Card:** `background: var(--color-card)`, `border: 1px solid var(--color-border)`, `border-radius: var(--radius-xl)`, `box-shadow: var(--shadow-xl)`. Width: `420px` fixed on desktop; `100vw` minus `32px` margin on mobile.

**CCMS Logotype:** Rendered entirely in text + icon. No image asset. Layout: shield icon from Lucide (`Shield`, size 28, `text-primary`) + text `"CCMS"` in `font-size: 22px, font-weight: 700, letter-spacing: 0.05em, color: var(--color-foreground)`. Below the logotype: `"Criminal Case Management System"` in `xs, muted, tracking-wide, uppercase`. 

**Locale toggle:** Positioned in the top-right corner of the auth card, inside the card padding. Uses `LocaleToggle` component. Renders as a compact pill with flag + language code (`EN` / `አማ`).

**Classification footer:** Fixed at the bottom of the viewport. `position: fixed; bottom: 0; width: 100%; padding: 12px; text-align: center`. Text: `xs, var(--color-muted)`. The footer does not scroll with content.

## 4.3 Login Page — `src/app/(auth)/login/page.tsx`

This is a Server Component that renders the `<LoginForm>` Client Component inside the AuthShell.

### 4.3.1 LoginForm Visual Layout

The form card content (inside the AuthShell card, below the logotype) follows this layout:

```
┌─────────────────────────────────────────────────────┐
│  🛡  CCMS                                  [EN | አማ] │  ← Logotype + locale toggle
│  Criminal Case Management System                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Welcome back                                        │  ← h2, 20px, semibold, foreground
│  Sign in to your CCMS account to continue.          │  ← p, sm, muted
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Badge Number                                 │   │  ← Label
│  │  [  BD-00142                               ] │   │  ← Input with left icon (badge icon)
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Password                          [Forgot?] │   │  ← Label row with inline link
│  │  [  ••••••••••••                   [👁]    ] │   │  ← Password input with reveal toggle
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ☐  Remember me for 30 days                         │  ← Checkbox
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  [Error banner — only visible on error]      │   │  ← Inline error card (destructive)
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │            Sign In               [→]         │   │  ← Primary button, full width
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Need access? Contact your administrator.            │  ← Footer note, xs, muted, centred
└─────────────────────────────────────────────────────┘
```

### 4.3.2 Input Field Design

**Badge Number field:**
- Left icon: `BadgeCheck` (Lucide) inside the input, 16px, `var(--color-muted)`. Icon turns `var(--color-primary)` on focus.
- Input `autocomplete="username"`
- Uppercase transform on input (badge numbers are uppercase)
- On error: border turns `var(--color-destructive)`, icon turns destructive

**Password field:**
- Left icon: `Lock` (Lucide), same behaviour as above
- Right side: eye icon toggle button (`Eye` / `EyeOff`) — reveals/hides password. Button has `aria-label` from `accessibility.json`
- Input `autocomplete="current-password"`
- No password strength meter on the login page (only on reset password)

### 4.3.3 Error Handling

Two types of errors on the login form:

1. **Field validation errors** (Zod, triggered on blur): Red helper text below each field. `aria-live="assertive"`. Inline, no banner.
2. **API errors** (401, 403, 429): Rendered as a banner error card that appears between the checkbox row and the submit button. The card has: a `AlertCircle` icon (destructive colour), the error message text, and an optional countdown timer for rate-limited responses. The card entrance is a smooth slide-down animation (200ms, respects reduced motion).

### 4.3.4 Submit Button States

| State | Appearance |
|-------|-----------|
| Default | Full-width, primary blue, "Sign In" + arrow icon |
| Hover | `var(--color-primary-hover)` background, slight lift (box-shadow) |
| Loading | Spinner (left) + "Signing in..." text, button disabled, opacity 0.85 |
| Error | Returns to default state after error toast/banner appears |
| Success | Brief green checkmark flash (150ms) before redirect |

The submit button never re-enables during an in-flight mutation. This is enforced by `mutation.isPending`.

### 4.3.5 Form Animations

All animations must check `prefers-reduced-motion`:

- **Card entrance**: The auth card fades in from `opacity: 0, translateY: 8px` to final state over 300ms on mount. Reduced motion: instant appearance.
- **Error banner entrance**: Slides down from `height: 0` over 200ms. Reduced motion: immediate visibility.
- **Error shake**: On API error, the form card plays a horizontal shake animation (`keyframes` with `transform: translateX`). Reduced motion: no shake, only the error banner appears.
- **Success flash**: Button background briefly flashes `var(--color-success)` before redirect.

### 4.3.6 Rate Limit Countdown

When a `429` response includes a `retryAfter` value (seconds), display a countdown timer in the error banner:
```
Too many failed attempts. Account locked for 4:32
```
Use `setInterval` to count down. When the timer reaches zero, the error banner disappears and the form becomes interactive again. The countdown renders in monospace (`var(--font-mono)`).

## 4.4 Forgot Password Page — `src/app/(auth)/forgot-password/page.tsx`

### 4.4.1 Two-State Design

**State 1 — Email Entry Form:**
```
┌─────────────────────────────────────────────────────┐
│  🛡  CCMS                                  [EN | አማ] │
│  Criminal Case Management System                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Forgot your password?                               │  ← h2
│  Enter your registered email address and we will     │  ← p, muted
│  send you a reset link.                              │
│                                                      │
│  Email Address                                       │
│  [ officer@ccms.gov.et                            ] │  ← Input with Mail icon
│                                                      │
│  [        Send Reset Link           ]                │  ← Primary button
│                                                      │
│  ← Back to Sign In                                  │  ← Link, sm, muted
└─────────────────────────────────────────────────────┘
```

**State 2 — Success State (replaces form after submission):**
```
┌─────────────────────────────────────────────────────┐
│  🛡  CCMS                                  [EN | አማ] │
│  Criminal Case Management System                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ✅  Reset link sent                                 │  ← Success icon (green check circle, 48px)
│                                                      │
│  If an account exists for                            │
│  officer@example.com, a password reset link          │
│  has been sent. Check your inbox and spam folder.    │
│                                                      │
│  [        Back to Sign In           ]                │  ← Secondary button (outline)
└─────────────────────────────────────────────────────┘
```

The transition from Form state to Success state is an animated crossfade (200ms). In reduced motion: instant swap.

**Security note on the success message:** Even if the email does not exist in the system, the success state is shown. The error message for email not found is intentionally vague: `"If an account exists..."`. Do not leak whether an email is registered. This is standard security practice.

## 4.5 Reset Password Page — `src/app/(auth)/reset-password/page.tsx`

### 4.5.1 Token Handling

The reset password page receives the token via URL query param: `/reset-password?token=xxxxx`. The page must:
1. Extract the token from `searchParams` (server component)
2. Pass it to the client form component as a prop
3. If `token` is absent, immediately show an invalid-token error state

### 4.5.2 Form Layout

```
┌─────────────────────────────────────────────────────┐
│  🛡  CCMS                                  [EN | አማ] │
│  Criminal Case Management System                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Set a new password                                  │  ← h2
│  Choose a strong password for your account.         │  ← p, muted
│                                                      │
│  New Password                                        │
│  [ ••••••••••                          [👁]       ] │
│                                                      │
│  ████████░░░░  Strong                               │  ← Password strength bar
│  ✓ At least 8 characters                            │  ← Requirement checklist
│  ✓ At least one uppercase letter                    │
│  ✓ At least one number                              │
│  ✗ At least one special character                   │
│                                                      │
│  Confirm New Password                                │
│  [ ••••••••••                          [👁]       ] │
│                                                      │
│  [      Set New Password              ]              │
│                                                      │
│  ← Back to Sign In                                  │
└─────────────────────────────────────────────────────┘
```

### 4.5.3 Password Strength Indicator

Implement a real-time password strength analyser:

```typescript
type PasswordStrength = 'weak' | 'fair' | 'strong' | 'veryStrong'

function analysePasswordStrength(password: string): {
  strength: PasswordStrength
  score: number // 0–4
  requirements: {
    minLength: boolean
    uppercase: boolean
    digit: boolean
    special: boolean
  }
}
```

Scoring rules:
- 1 point: 8+ characters
- 1 point: contains uppercase
- 1 point: contains digit
- 1 point: contains special character (`!@#$%^&*()_+-=[]{}|;':\",./<>?`)

Score → Strength mapping: `0-1: weak`, `2: fair`, `3: strong`, `4: veryStrong`

**Strength bar visual:**
- 4 equal segments in a row
- `weak`: first segment `var(--color-destructive)`, rest muted
- `fair`: first two segments `var(--color-warning)`, rest muted
- `strong`: first three segments `var(--color-success)`, last muted
- `veryStrong`: all four segments `var(--color-success)`
- Segments transition colour smoothly (150ms) as the user types

**Requirements checklist:**
- Each requirement shows a `CheckCircle` (green) or `XCircle` (muted/red) Lucide icon
- Icons animate from `XCircle` to `CheckCircle` as requirements are met (150ms fade swap)

### 4.5.4 Success State

After successful reset, show the same two-state pattern as forgot password:
- Large success icon
- "Password updated" heading
- Description with a "Back to Sign In" button
- Auto-redirect to `/login` after 3 seconds (with a visible countdown: "Redirecting in 3s...")

### 4.5.5 Invalid Token State

If the token is invalid or expired (API returns an error), show:
```
┌─────────────────────────────────────────────────────┐
│  🛡  CCMS                                            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  🔗  Link Expired                                    │  ← AlertTriangle icon, warning colour, 48px
│                                                      │
│  This reset link is invalid or has expired.          │
│  Reset links are valid for 60 minutes.               │
│                                                      │
│  [      Request a New Link          ]                │  ← Links to /forgot-password
└─────────────────────────────────────────────────────┘
```

## 4.6 Logout Confirmation Dialog

The logout action in the TopBar dropdown does not immediately log the user out. It opens a `ConfirmDialog`. 

**Implementation:**
1. TopBar "Sign Out" item calls `uiStore.openModal('logout-confirm')`
2. Register `LogoutConfirmModal` in `ModalRenderer` registry under `'logout-confirm'`
3. `LogoutConfirmModal` renders a `ConfirmDialog` with the logout confirmation text from `auth.json`
4. On confirm: call `useLogout().mutate()`
5. On cancel: call `uiStore.closeModal()`

The dialog must respect the `useTranslations('auth')` hook for all text.

---

# 5. Shared Components — i18n Integration

All shared components created in Phase 1 that render user-visible text must be updated to accept their text via props (as React nodes or strings) rather than hardcoding English. The text is passed from the consuming page/layout which uses `getTranslations`.

This approach is better for shared components than calling `useTranslations` inside them, because:
1. Shared components do not know which namespace their text lives in
2. Passing text as props makes components fully reusable and testable
3. Server and client components can both pass translated text

**Pattern:**

```typescript
// Before (hardcoded):
function ForbiddenState() {
  return <div><h2>Access Denied</h2></div>
}

// After (translated text via props):
interface ForbiddenStateProps {
  title?: string
  description?: string
  action?: React.ReactNode
}
function ForbiddenState({ title, description, action }: ForbiddenStateProps) {
  return <div><h2>{title}</h2><p>{description}</p>{action}</div>
}

// Usage in a page:
const t = await getTranslations('errors')
<ForbiddenState
  title={t('pages.403.title')}
  description={t('pages.403.description')}
/>
```

Apply this pattern to: `ForbiddenState`, `NotFoundState`, `ErrorState`, `EmptyState`, `TableEmptyState`, `FormActions` (button labels), `ConfirmDialog` (all text props).

---

# 6. Updated Middleware

## 6.1 Combined Locale + Auth Middleware

`src/middleware.ts` must now handle two responsibilities in one pass:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { defaultLocale, locales, type Locale } from '@config/i18n'

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password']
const ADMIN_ROUTES = ['/admin']
const API_ROUTES = ['/api/locale']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files, API locale route
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next()
  }

  // Step 1: Locale detection
  const response = NextResponse.next()
  const localeCookie = request.cookies.get('ccms_locale')?.value
  const locale: Locale =
    localeCookie && locales.includes(localeCookie as Locale)
      ? (localeCookie as Locale)
      : detectLocaleFromHeader(request) ?? defaultLocale

  if (!localeCookie) {
    response.cookies.set('ccms_locale', locale, {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    })
  }

  // Step 2: Auth check
  const sessionCookie = request.cookies.get('ccms_session')?.value
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))

  if (!sessionCookie && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (sessionCookie && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Step 3: Admin route check (basic role extraction — NOT cryptographic verification)
  // TODO: Replace with full JWT verification using jose library when edge-compatible
  // JWT verification is implemented (deferred: requires careful key management setup).
  // Current implementation reads a plain role claim cookie set by the auth service.
  const roleCookie = request.cookies.get('ccms_role')?.value
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r))

  if (isAdminRoute && roleCookie !== 'admin' && roleCookie !== 'superadmin') {
    return NextResponse.redirect(new URL('/403', request.url))
  }

  return response
}

function detectLocaleFromHeader(request: NextRequest): Locale | null {
  const acceptLanguage = request.headers.get('accept-language') ?? ''
  if (acceptLanguage.includes('am')) return 'am'
  return null
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
```

---

# 7. Testing Requirements

## 7.1 Auth Hook Tests

Create `src/features/auth/hooks/useLogin.test.ts`. Test:
- Successful login calls `authStore.setSession` and navigates to `/dashboard`
- 401 response does not add a toast (form handles inline display)
- 429 response adds a toast with rate-limit message
- Network error adds a network error toast

Create `src/features/auth/hooks/useLogout.test.ts`. Test:
- Successful logout clears session and navigates to `/login`
- Failed logout still clears local session and redirects

## 7.2 Auth Schema Tests

Create `src/features/auth/schemas/login.schema.test.ts`. Test:
- Valid badge number and password pass
- Empty badge number fails with required error
- Password shorter than 8 chars fails
- Invalid email format in forgot-password schema fails

Create `src/features/auth/schemas/reset-password.schema.test.ts`. Test:
- Mismatched passwords fail the `.refine()` check
- Password missing uppercase fails
- Password missing special character fails
- Valid strong password passes

## 7.3 i18n Tests

Create `src/config/i18n.test.ts`. Test:
- Both `locales` entries are valid strings
- `defaultLocale` is included in `locales`
- `localeNames` has an entry for every locale

Create `tests/integration/i18n-completeness.test.ts`. This test dynamically reads all `en/*.json` and `am/*.json` files and asserts that:
- Every key present in `en/` exists in `am/` (no missing translations)
- No `am/` file has keys absent from `en/` (no orphaned translations)

This test is the automated safety net against translation drift.

## 7.4 Password Strength Tests

Create `src/features/auth/utils/password-strength.test.ts`. Test every scoring combination with example passwords.

## 7.5 Component Tests

Create `src/features/auth/components/LoginForm.test.tsx`. Test:
- Form renders with correct ARIA labels
- Badge number field has `autocomplete="username"`
- Password field has `autocomplete="current-password"`
- Submit button is disabled when form is invalid
- Error banner appears when `mutation.error` is set
- Password reveal toggle changes input type between `password` and `text`

## 7.6 E2E Tests

Update `tests/e2e/auth.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Login flow', () => {
  test('redirects to /login from /', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/login')
  })

  test('login page renders in English by default', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  })

  test('switching to Amharic updates login heading', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /EN/i }).click()
    await page.getByText('አማርኛ').click()
    await expect(page.getByRole('heading', { name: 'እንኳን ደህና መጡ' })).toBeVisible()
  })

  test('shows inline error on invalid credentials', async ({ page }) => {
    // Mock API 401 response via route intercept
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({ status: 401, json: { message: 'Invalid credentials' } }),
    )
    await page.goto('/login')
    await page.getByLabel('Badge Number').fill('BD-99999')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
  })

  test('forgot password shows success state after submission', async ({ page }) => {
    await page.route('**/api/v1/auth/forgot-password', (route) =>
      route.fulfill({ status: 200, json: { message: 'ok' } }),
    )
    await page.goto('/forgot-password')
    await page.getByLabel('Email Address').fill('officer@ccms.gov.et')
    await page.getByRole('button', { name: 'Send Reset Link' }).click()
    await expect(page.getByText('Reset link sent')).toBeVisible()
  })
})
```

---

# 8. New Files to Create

The following files must be created (in addition to updating files from Phase 1):

## 8.1 i18n Infrastructure

- `src/config/i18n.ts`
- `src/i18n/request.ts`
- `src/app/api/locale/route.ts`
- `src/shared/components/i18n/LocaleToggle.tsx`
- `src/shared/components/i18n/index.ts`
- All `messages/en/*.json` files (15 files)
- All `messages/am/*.json` files (15 files)

## 8.2 Auth Feature — New Files

- `src/features/auth/schemas/auth-session.schema.ts`
- `src/features/auth/schemas/login.schema.ts` *(update stub)*
- `src/features/auth/schemas/forgot-password.schema.ts` *(update stub)*
- `src/features/auth/schemas/reset-password.schema.ts` *(update stub)*
- `src/features/auth/hooks/useLogin.ts` *(full implementation)*
- `src/features/auth/hooks/useLogout.ts` *(full implementation)*
- `src/features/auth/hooks/useSession.ts` *(full implementation)*
- `src/features/auth/hooks/useForgotPassword.ts` *(new)*
- `src/features/auth/hooks/useResetPassword.ts` *(new)*
- `src/features/auth/hooks/useIdleTimeout.ts` *(new)*
- `src/features/auth/utils/password-strength.ts` *(new)*
- `src/features/auth/components/LoginForm.tsx` *(new — Client Component)*
- `src/features/auth/components/ForgotPasswordForm.tsx` *(new)*
- `src/features/auth/components/ResetPasswordForm.tsx` *(new)*
- `src/features/auth/components/IdleWarningModal.tsx` *(new)*
- `src/features/auth/components/LogoutConfirmModal.tsx` *(new)*
- `src/features/auth/components/PasswordStrengthIndicator.tsx` *(new)*
- `src/features/auth/components/LocaleAwareAuthShell.tsx` *(if AuthShell needs client-side locale info)*

## 8.3 Updated Files

- `src/shared/layouts/AuthShell.tsx` — full redesign
- `src/shared/layouts/TopBar.tsx` — add `LocaleToggle` + logout confirm flow
- `src/shared/providers/AuthProvider.tsx` — full implementation
- `src/services/api/client.ts` — real token refresh interceptor
- `src/services/domain/auth.service.ts` — real API calls
- `src/services/query/keys/authKeys.ts` — add `session` key
- `src/middleware.ts` — locale + auth combined
- `src/app/layout.tsx` — Noto Sans Ethiopic font + locale on `<html lang>`
- `src/shared/components/modals/ModalRenderer.tsx` — register `idle-warning` + `logout-confirm`
- `next.config.ts` — next-intl plugin
- All `src/app/(dashboard)/*/page.tsx` skeleton files — migrate to i18n strings
- `src/app/(auth)/login/page.tsx` — full implementation
- `src/app/(auth)/forgot-password/page.tsx` — full implementation
- `src/app/(auth)/reset-password/page.tsx` — full implementation

---

# 9. Step-by-Step Execution Order

Execute in precisely this order. Do not skip steps.

**Step 1 — Install next-intl**
```bash
pnpm add next-intl
```
Verify installation: `pnpm why next-intl` shows it is in `dependencies`.

**Step 2 — Create i18n Config**
Create `src/config/i18n.ts`. Create `src/i18n/request.ts`.

**Step 3 — Create All Message Files**
Create `messages/en/` and `messages/am/` directories. Create all 15 JSON files in each. Start with `common.json`, `auth.json`, `navigation.json`, and `errors.json` as fully populated files. Create the remaining 11 namespace files as skeletons with at minimum the page title, heading, and skeleton loading text keys.

**Step 4 — Update next.config.ts**
Add `createNextIntlPlugin` wrapper. Verify `pnpm build` does not break.

**Step 5 — Update Root Layout**
Add Noto Sans Ethiopic font. Add `lang={locale}` to `<html>`. Add both font variables to the className.

**Step 6 — Update Middleware**
Add locale detection logic to the existing auth middleware. Test that navigating to `/login` still works and the `ccms_locale` cookie is set.

**Step 7 — Create Locale API Route**
Create `src/app/api/locale/route.ts`. Test with a manual POST request that the cookie is set correctly.

**Step 8 — Create LocaleToggle Component**
Implement and render it in AuthShell temporarily to verify locale switching works end-to-end before building the full auth UI.

**Step 9 — Generate TypeScript Message Types**
```bash
pnpm i18n:types
```
Verify no TypeScript errors from message key access.

**Step 10 — Migrate Phase 1 Skeleton Pages**
Update all `(dashboard)` page.tsx files to use `getTranslations`. Verify `pnpm type-check` passes.

**Step 11 — Implement Auth Service**
Replace all stubs in `auth.service.ts` with real Axios calls. Implement `auth-session.schema.ts`.

**Step 12 — Implement Auth Hooks**
Implement all five hooks (`useLogin`, `useLogout`, `useSession`, `useForgotPassword`, `useResetPassword`). Run `pnpm type-check` after each.

**Step 13 — Implement useIdleTimeout**
Create the hook and mount it in `AuthProvider`. Test by temporarily setting a 10-second timeout in dev.

**Step 14 — Implement Token Refresh**
Update Axios interceptor with the real refresh logic and request queue.

**Step 15 — Rebuild AuthShell**
Implement the new visual design. Add LocaleToggle. Add classification footer.

**Step 16 — Build LoginForm**
Implement the full login form component. Wire to `useLogin`. Add all animations. Test field validation, API errors, rate-limit countdown.

**Step 17 — Build ForgotPasswordForm**
Implement both states (form + success). Wire to `useForgotPassword`.

**Step 18 — Build ResetPasswordForm**
Implement with token extraction from searchParams. Add PasswordStrengthIndicator. Wire to `useResetPassword`. Build success and invalid-token states.

**Step 19 — Build LogoutConfirmModal + IdleWarningModal**
Register both in ModalRenderer. Wire TopBar logout action to open the confirm modal.

**Step 20 — Auth Tests**
Write all unit and component tests from Section 7. Run `pnpm test` and confirm all pass.

**Step 21 — i18n Completeness Test**
Implement and run `tests/integration/i18n-completeness.test.ts`. Fix any missing keys.

**Step 22 — E2E Auth Tests**
Update `tests/e2e/auth.spec.ts` with the full test suite from Section 7.6.

**Step 23 — Final Verification**
Run all four commands:
```bash
pnpm dev          # Dev server starts, routes render, locale switching works
pnpm lint         # Zero errors, zero warnings
pnpm type-check   # Zero errors
pnpm build        # Production build succeeds
```

---

# 10. Final Verification Checklist

## 10.1 i18n

- [ ] Visiting `/login` shows English by default
- [ ] Clicking the locale toggle and selecting Amharic reloads the page in Amharic
- [ ] `ccms_locale=am` cookie is set after switching to Amharic
- [ ] Refreshing the page after switching preserves the Amharic locale
- [ ] All text on the login, forgot-password, and reset-password pages is localised
- [ ] Amharic text renders correctly using Noto Sans Ethiopic (no tofu boxes)
- [ ] `<html lang="am">` is set when the locale is Amharic
- [ ] All Phase 1 skeleton pages render their titles from i18n message files
- [ ] The i18n completeness test passes with zero missing keys
- [ ] `pnpm type-check` catches an invalid translation key (verify type safety is working)

## 10.2 Auth — Functional

- [ ] Submitting valid credentials calls POST `/api/v1/auth/login` and redirects to `/dashboard`
- [ ] Submitting invalid credentials shows the inline error banner (not a toast)
- [ ] After 5 failed attempts, the 429 error shows with a countdown timer
- [ ] "Forgot password?" link navigates to `/forgot-password`
- [ ] Submitting an email on forgot-password shows the success state
- [ ] Visiting `/reset-password` without a token shows the invalid token state
- [ ] Visiting `/reset-password?token=xxx` shows the reset form
- [ ] Password strength bar updates in real-time as the user types
- [ ] All four password requirements animate from ✗ to ✓ as they are met
- [ ] Mismatched confirm password shows a validation error
- [ ] Successful password reset shows the success state and redirects to `/login` after 3s
- [ ] Clicking "Sign Out" in the TopBar opens the logout confirmation dialog
- [ ] Confirming logout calls the logout API, clears the session, and redirects to `/login`
- [ ] Cancelling logout closes the dialog and preserves the session
- [ ] After 13 minutes of inactivity, the idle warning dialog appears (with 2-minute countdown)
- [ ] Clicking "Stay Signed In" in the idle dialog resets the idle timer
- [ ] After the full 15-minute idle period, the user is automatically logged out

## 10.3 Auth — Visual

- [ ] The auth card has the radial-gradient background on the page
- [ ] The CCMS logotype is visible with the shield icon and full system name
- [ ] The classification footer is fixed at the bottom of the viewport
- [ ] The locale toggle is visible in the top-right corner of the auth card
- [ ] The login form card entrance animation plays on page load (unless reduced motion is active)
- [ ] Error shake animation plays on API error (unless reduced motion is active)
- [ ] The submit button shows a spinner and "Signing in..." text while the mutation is pending
- [ ] The password field has a working show/hide toggle with the eye icon
- [ ] Badge number input auto-uppercases the entered value
- [ ] All focus states use the `var(--color-focus-ring)` outline
- [ ] The form is fully usable on a 375px mobile viewport with no horizontal overflow

## 10.4 Auth — Accessibility

- [ ] Tab order on the login form: Badge Number → Password → Reveal toggle → Remember me → Forgot password → Submit
- [ ] API error banner has `role="alert"` and is announced by screen readers
- [ ] Field validation errors have `aria-live="assertive"`
- [ ] Password reveal button has a descriptive `aria-label` that updates on toggle
- [ ] The rate-limit countdown timer is accessible (`aria-live="polite"`)
- [ ] The idle warning modal traps focus correctly
- [ ] All auth pages have a single `<h1>` (no heading hierarchy violations)

## 10.5 Build & Tooling

- [ ] `pnpm dev` — no errors, locale switching works
- [ ] `pnpm lint` — zero errors
- [ ] `pnpm type-check` — zero errors
- [ ] `pnpm test` — all auth tests pass, i18n completeness test passes
- [ ] `pnpm build` — production build succeeds with no type errors

---

# 11. Anti-Patterns Specific to This Phase

In addition to the anti-patterns from Phase 1, the following are prohibited in Phase 2:

**i18n violations:**
- Hardcoding any user-visible English or Amharic string in a `.tsx` or `.ts` file instead of using a message file
- Calling `useTranslations` in a shared component (pass text as props instead)
- Creating a new namespace that is not listed in the namespace list (add to the list first)
- Forgetting to add a key to both `en/` and `am/` simultaneously — treat them as a pair

**Auth violations:**
- Calling `useLogin` or `useLogout` from a Server Component (these are Client Component hooks)
- Reading the `authStore` on the server (it is client-only Zustand state)
- Showing a toast for a 401 error on the login form (the form handles inline display)
- Navigating after logout using `window.location.href` instead of `router.push` + `router.refresh`
- Allowing the reset password form to submit when the two passwords do not match (Zod must catch this)
- Implementing logout by clearing the cookie on the client (the server must clear the httpOnly cookie via the logout API)

**Font violations:**
- Not testing Amharic text rendering in the actual browser (always visually verify Ethiopic glyphs render correctly)
- Loading Noto Sans Ethiopic for Latin content (the CSS font-stack handles this automatically)

---

*End of CCMS Phase 2 Instruction — Authentication Module & Internationalisation*
*Prepared for AI Agent execution — 2026 production-grade engineering standards*
*Package manager: pnpm throughout*
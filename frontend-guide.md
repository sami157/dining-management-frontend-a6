# Frontend API Reference

This document is the frontend integration reference for the Dining Management backend.

It is written for a Next.js frontend using Firebase Authentication and calling this backend over HTTP.

## Base URL

Use:

```txt
{BACKEND_BASE_URL}/api/v1
```

Example:

```txt
http://localhost:5000/api/v1
```

## Authentication

The frontend must authenticate users with Firebase on the client side, then send the Firebase ID token to the backend.

Send this header for every protected request:

```http
Authorization: Bearer <firebase_id_token>
```

Example in Next.js:

```ts
import { getAuth } from 'firebase/auth';

export async function getAuthHeader() {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User is not signed in');
  }

  const token = await user.getIdToken();

  return {
    Authorization: `Bearer ${token}`,
  };
}
```

## Important Auth Notes

- Do not send operator ids like `createdById`, `updatedById`, `recordedById`, `loggedById`, `registeredById`, or `finalizedById` from the frontend for protected actions.
- The backend derives the acting user from the Firebase token.
- The backend also loads the application user from PostgreSQL and applies role checks there.
- Roles are:
  - `ADMIN`
  - `MANAGER`
  - `MEMBER`

## Timezone Rules

This backend uses GMT+6 / Dhaka business time for dining logic.

This matters for:

- meal registration deadline cutoffs
- default deposit dates
- default expense dates

Frontend recommendation:

- Treat all dining-related dates as Dhaka calendar dates
- Use `YYYY-MM-DD` for date input values
- Use `YYYY-MM` for month filters and finalization actions
- Do not rely on the browser local timezone for deadline UX if users may be outside GMT+6

## Response Shape

Successful responses follow this shape:

```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "meta": null,
  "data": {}
}
```

Error responses follow this shape:

```json
{
  "success": false,
  "message": "Error message",
  "errorSources": [
    {
      "path": "fieldName",
      "message": "Specific validation or business-rule message"
    }
  ],
  "stack": null
}
```

## Frontend Conventions

For Next.js, keep a single API wrapper instead of calling `fetch()` ad hoc from many components.

Recommended:

- one shared `apiFetch()` helper
- attach Firebase token automatically
- centralize 401 and 403 handling
- keep route strings in one file

Example:

```ts
type ApiFetchOptions = RequestInit & {
  auth?: boolean;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}) {
  const headers = new Headers(options.headers || {});

  headers.set('Content-Type', 'application/json');

  if (options.auth) {
    const authHeader = await getAuthHeader();
    headers.set('Authorization', authHeader.Authorization);
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1${path}`, {
    ...options,
    headers,
  });

  const json = await res.json();

  if (!res.ok) {
    throw json;
  }

  return json as T;
}
```

## Route Summary

PRD-style route prefixes are available and should be preferred by the frontend:

- `/auth`
- `/users`
- `/templates`
- `/schedules`
- `/registrations`
- `/deadlines`
- `/deposits`
- `/expenses`
- `/finalize`

## 1. Authentication

### Register App User

Creates or updates the user record in PostgreSQL after Firebase signup/login.

- Method: `POST`
- Path: `/auth/register`
- Auth: Public

Request body:

```json
{
  "firebaseUid": "firebase_uid_from_firebase",
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "01700000000",
  "profileImage": "https://example.com/photo.jpg"
}
```

Frontend note:

- Call this after Firebase signup or after first login if you need to ensure the backend user exists.

## 2. Users

### Get All Users

- Method: `GET`
- Path: `/users`
- Auth: `ADMIN`, `MANAGER`

### Get User By ID

- Method: `GET`
- Path: `/users/:id`
- Auth: `ADMIN`, `MANAGER`

### Update Own Profile

- Method: `PATCH`
- Path: `/users/me`
- Auth: Any authenticated user

Request body:

```json
{
  "name": "Updated Name",
  "mobile": "01700000001",
  "profileImage": "https://example.com/new-image.jpg"
}
```

### Update User Role

- Method: `PATCH`
- Path: `/users/:id/role`
- Auth: `ADMIN`

Request body:

```json
{
  "role": "MANAGER"
}
```

### Update User By ID

- Method: `PATCH`
- Path: `/users/:id`
- Auth: `ADMIN`, `MANAGER`

Request body:

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "mobile": "01700000002",
  "profileImage": "https://example.com/profile.jpg"
}
```

Note:

- This route does not handle role changes. Use `/users/:id/role` for role updates.

### Deactivate User

- Method: `DELETE`
- Path: `/users/:id`
- Auth: `ADMIN`

## 3. Weekly Meal Template

### Get Template

- Method: `GET`
- Path: `/templates`
- Auth: `ADMIN`, `MANAGER`

### Update Template

- Method: `PATCH`
- Path: `/templates`
- Auth: `ADMIN`, `MANAGER`

Request body:

```json
{
  "dayOfWeek": "MONDAY",
  "meals": ["BREAKFAST", "LUNCH", "DINNER"]
}
```

Notes:

- Update one day at a time.
- `updatedById` is not needed from the frontend.

## 4. Meal Deadlines

### Get Deadlines

- Method: `GET`
- Path: `/deadlines`
- Auth: Public

### Update Deadline By Meal Type

- Method: `PATCH`
- Path: `/deadlines/:mealType`
- Auth: `ADMIN`, `MANAGER`

Example path:

```txt
/deadlines/BREAKFAST
```

Request body:

```json
{
  "time": "22:00",
  "offsetDays": -1
}
```

Meaning:

- `time: "22:00"` and `offsetDays: -1` for breakfast means the breakfast deadline is previous day 10:00 PM in GMT+6.

### Create Or Upsert Deadline

- Method: `POST`
- Path: `/deadlines`
- Auth: `ADMIN`, `MANAGER`

Request body:

```json
{
  "type": "DINNER",
  "time": "12:00",
  "offsetDays": 0
}
```

## 5. Meal Schedules

### Get Schedules

- Method: `GET`
- Path: `/schedules`
- Auth: Public

Supported query params:

- `date=YYYY-MM-DD`
- `month=YYYY-MM`

Examples:

```txt
/schedules
/schedules?date=2026-04-05
/schedules?month=2026-04
```

### Get Schedule By ID

- Method: `GET`
- Path: `/schedules/:id`
- Auth: Public

### Get Daily Registration Summary

- Method: `GET`
- Path: `/schedules/:date/registrations`
- Auth: Public

Example:

```txt
/schedules/2026-04-05/registrations
```

### Create Schedule

- Method: `POST`
- Path: `/schedules`
- Auth: `ADMIN`, `MANAGER`

Request body:

```json
{
  "date": "2026-04-05",
  "meals": [
    {
      "type": "BREAKFAST",
      "isAvailable": true,
      "weight": 1,
      "menu": "Paratha and egg"
    },
    {
      "type": "LUNCH",
      "weight": 1.5,
      "menu": "Rice and beef"
    }
  ]
}
```

### Generate Month Schedules From Template

- Method: `POST`
- Path: `/schedules/generate`
- Auth: `ADMIN`, `MANAGER`

Request body:

```json
{
  "month": "2026-04"
}
```

Notes:

- Only non-existing schedules for that month are created.
- Generation uses the weekly meal template.
- Finalized months are locked.

### Add Meal To Existing Schedule

- Method: `POST`
- Path: `/schedules/:scheduleId/meals`
- Auth: `ADMIN`, `MANAGER`

Request body:

```json
{
  "type": "DINNER",
  "isAvailable": true,
  "weight": 1,
  "menu": "Khichuri"
}
```

### Update Scheduled Meal

- Method: `PATCH`
- Path: `/schedules/:scheduleId/meals/:mealType`
- Auth: `ADMIN`, `MANAGER`

Request body:

```json
{
  "isAvailable": false,
  "weight": 1.25,
  "menu": "Updated menu"
}
```

### Delete Scheduled Meal

- Method: `DELETE`
- Path: `/schedules/:scheduleId/meals/:mealType`
- Auth: `ADMIN`, `MANAGER`

### Delete Schedule

- Method: `DELETE`
- Path: `/schedules/:id`
- Auth: `ADMIN`, `MANAGER`

## 6. Meal Registrations

### Get Registrations

- Method: `GET`
- Path: `/registrations`
- Auth: Authenticated

Supported query params:

- `userId`

Behavior:

- `MEMBER` users are automatically restricted to their own registrations
- `ADMIN` and `MANAGER` may query any user

### Create Or Upsert Registration

- Method: `POST`
- Path: `/registrations`
- Auth: Authenticated

Request body for self-registration:

```json
{
  "scheduledMealId": "cm123",
  "count": 2
}
```

Request body for manager/admin registering on behalf of a member:

```json
{
  "scheduledMealId": "cm123",
  "userId": "target_member_user_id",
  "count": 2
}
```

Rules:

- `MEMBER` can only register for themselves
- `MEMBER` is blocked after deadline
- `MANAGER` and `ADMIN` can register for any user even after deadline
- finalized months are locked
- unavailable meals cannot be registered

### Update Registration

- Method: `PATCH`
- Path: `/registrations/:id`
- Auth: Authenticated

Request body:

```json
{
  "count": 3
}
```

Rules:

- `MEMBER` can only update their own registration
- `MEMBER` is blocked after deadline
- `MANAGER` and `ADMIN` can update any registration
- finalized months are locked

### Delete Registration

- Method: `DELETE`
- Path: `/registrations/:id`
- Auth: Authenticated

Rules:

- `MEMBER` can only delete their own registration
- `MEMBER` is blocked after deadline
- `MANAGER` and `ADMIN` can delete any registration
- finalized months are locked

## 7. Deposits

### Get Deposits

- Method: `GET`
- Path: `/deposits`
- Auth: Authenticated

Supported query params:

- `userId`

Behavior:

- `MEMBER` always gets only their own deposits
- `ADMIN` and `MANAGER` may request all or filter by `userId`

### Get My Monthly Deposit Total

- Method: `GET`
- Path: `/deposits/my-total`
- Auth: Authenticated

Query params:

```txt
month=2026-04
```

Example:

```txt
/deposits/my-total?month=2026-04
```

### Create Deposit

- Method: `POST`
- Path: `/deposits`
- Auth: `ADMIN`, `MANAGER`

Request body:

```json
{
  "userId": "member_user_id",
  "amount": 500,
  "month": "2026-04",
  "note": "Cash deposit",
  "date": "2026-04-03"
}
```

Rules:

- finalized months are locked
- if `date` is omitted, backend uses current Dhaka date

### Update Deposit

- Method: `PATCH`
- Path: `/deposits/:id`
- Auth: `ADMIN`, `MANAGER`

Request body:

```json
{
  "amount": 700,
  "note": "Updated note"
}
```

Rules:

- finalized source month is locked
- if month is changed, target month must also be non-finalized

### Delete Deposit

- Method: `DELETE`
- Path: `/deposits/:id`
- Auth: `ADMIN`, `MANAGER`

Rules:

- finalized months are locked

## 8. Expenses

### Get Expenses

- Method: `GET`
- Path: `/expenses`
- Auth: `ADMIN`, `MANAGER`

Supported query params:

- `month`

### Create Expense

- Method: `POST`
- Path: `/expenses`
- Auth: `ADMIN`, `MANAGER`

Request body:

```json
{
  "date": "2026-04-03",
  "amount": 1800,
  "category": "BAZAR",
  "personName": "Rakib",
  "description": "Vegetables and fish",
  "month": "2026-04"
}
```

Rules:

- finalized months are locked
- if `date` is omitted, backend uses current Dhaka date

### Update Expense

- Method: `PATCH`
- Path: `/expenses/:id`
- Auth: `ADMIN`, `MANAGER`

Request body:

```json
{
  "amount": 2000,
  "description": "Updated description"
}
```

Rules:

- finalized source month is locked
- if month is changed, target month must also be non-finalized

### Delete Expense

- Method: `DELETE`
- Path: `/expenses/:id`
- Auth: `ADMIN`, `MANAGER`

Rules:

- finalized months are locked

## 9. Monthly Finalization

### Get Finalized Months

- Method: `GET`
- Path: `/finalize`
- Auth: Authenticated

Behavior:

- `MEMBER` gets only their own summary per month
- `ADMIN` and `MANAGER` get the full finalization list

### Get Finalization Details By Month

- Method: `GET`
- Path: `/finalize/:month`
- Auth: Authenticated

Example:

```txt
/finalize/2026-04
```

Behavior:

- `MEMBER` gets only their own breakdown
- `ADMIN` and `MANAGER` get full member breakdown

### Finalize Month

- Method: `POST`
- Path: `/finalize`
- Auth: `ADMIN`, `MANAGER`

Request body:

```json
{
  "month": "2026-04"
}
```

Business rules:

- month must not already be finalized
- month must contain at least one expense
- month must contain at least one meal registration
- once finalized, month becomes locked for deposits, expenses, and meal-registration-related mutations

## Data Shapes The Frontend Will Commonly Use

### User

```ts
type User = {
  id: string;
  firebaseUid: string;
  name: string;
  email: string;
  mobile?: string | null;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  profileImage?: string | null;
  balance: string | number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
```

### Meal Schedule

```ts
type ScheduledMeal = {
  id: string;
  scheduleId: string;
  type: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  isAvailable: boolean;
  weight: string | number;
  menu?: string | null;
  updatedAt: string;
};

type MealSchedule = {
  id: string;
  date: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  meals: ScheduledMeal[];
};
```

### Registration

```ts
type MealRegistration = {
  id: string;
  scheduledMealId: string;
  userId: string;
  count: number;
  registeredById: string;
  createdAt: string;
  updatedAt: string;
};
```

### Deposit

```ts
type Deposit = {
  id: string;
  userId: string;
  amount: string | number;
  recordedById: string;
  month: string;
  note?: string | null;
  date: string;
  createdAt: string;
};
```

### Expense

```ts
type Expense = {
  id: string;
  date: string;
  amount: string | number;
  category: 'GAS' | 'TRANSPORT' | 'BAZAR' | 'OTHER';
  personName: string;
  description?: string | null;
  loggedById: string;
  month: string;
  createdAt: string;
};
```

## Suggested Frontend Route Guards

Recommended frontend behavior:

- if user not logged in:
  - redirect to login for protected pages
- if role is `MEMBER`:
  - hide manager/admin pages and actions
- if role is `MANAGER`:
  - allow operational pages but hide admin-only role controls
- if role is `ADMIN`:
  - allow full access

## Suggested Frontend Pages

### Member

- dashboard
- my profile
- my meal registrations
- meal schedule viewer
- my deposits
- my monthly summary

### Manager

- all schedules
- meal template management
- deadline management
- registrations management
- deposits management
- expenses management
- monthly finalization

### Admin

- all manager pages
- user list
- role management
- user deactivation

## Integration Checklist

- configure Firebase Auth in Next.js
- store backend base URL in `NEXT_PUBLIC_API_BASE_URL`
- create a shared authenticated fetch helper
- call `/auth/register` after account creation / first login
- fetch current user context for role-aware UI
- use PRD-style routes:
  - `/templates`
  - `/schedules`
  - `/deadlines`
  - `/finalize`
- keep all dining date inputs in `YYYY-MM-DD`
- keep all month inputs in `YYYY-MM`
- display deadline and schedule times in GMT+6 semantics

## Final Notes

- The backend currently supports frontend development well enough to build the app UI and flows.
- The frontend should treat business dates as Dhaka dates, not browser-local dates.
- If you add admin dashboards, plan the UI around role-based visibility because the backend will enforce those rules.

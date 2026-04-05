# Stats Frontend Integration

This document summarizes all stats-related APIs currently available for frontend implementation.

## Base Routes

All stats endpoints are exposed under:

```ts
/stats
```

Route registration:

- [src/routes/index.ts](/abs/path/c:/Users/sami_/Downloads/p-hero/NextLevel/dining-management-prisma-server/src/routes/index.ts)
- [src/modules/Stats/stats.route.ts](/abs/path/c:/Users/sami_/Downloads/p-hero/NextLevel/dining-management-prisma-server/src/modules/Stats/stats.route.ts)

## Endpoints

### 1. Public Homepage Stats

```http
GET /stats/public
GET /stats/public?month=YYYY-MM
```

Auth:

- No authentication required

Purpose:

- Public homepage cards
- Landing page community highlights
- Public monthly summary widgets

Behavior:

- `month` is optional
- If `month` is omitted, backend uses the current Dhaka month
- Does not expose balances, deposits, expenses, or user lists

### 2. Internal Overview Stats

```http
GET /stats/overview
```

Auth:

- `ADMIN`
- `MANAGER`

Purpose:

- Internal dashboard summary cards

### 3. Manager List

```http
GET /stats/managers
```

Auth:

- `ADMIN`
- `MANAGER`

Purpose:

- Manager directory
- Manager selector or contact list

### 4. Monthly Operational Stats

```http
GET /stats/monthly?month=YYYY-MM
```

Auth:

- `ADMIN`
- `MANAGER`

Purpose:

- Internal monthly dashboard
- Reports and charts
- Finalization-aware analytics

Behavior:

- `month` is required
- Must be in `YYYY-MM` format

## TypeScript Interfaces

These interfaces represent the `data` field returned by each API response.

### Public Stats

```ts
export interface PublicStatsResponse {
  asOfDate: string;
  month: string;
  community: {
    activeMembers: number;
    activeManagers: number;
  };
  meals: {
    totalRegistrations: number;
    totalMealsRegistered: number;
    totalWeightedMeals: number;
    scheduleCount: number;
  };
  finalization: {
    isFinalized: boolean;
    finalizedAt: string | null;
    rolledBackAt: string | null;
    mealRate: number | null;
  };
}
```

### Overview Stats

```ts
export interface OverviewStatsResponse {
  asOfDate: string;
  currentMonth: string;
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  roles: {
    admins: number;
    managers: number;
    members: number;
    activeMembers: number;
  };
  finalization: {
    lockedMonths: number;
  };
}
```

### Manager List

```ts
export interface ManagerSummary {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  profileImage: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ManagersResponse = ManagerSummary[];
```

### Monthly Stats

```ts
export interface MonthlyStatsResponse {
  month: string;
  deposits: {
    totalAmount: number;
    count: number;
    uniqueDepositors: number;
  };
  expenses: {
    totalAmount: number;
    count: number;
  };
  meals: {
    totalRegistrations: number;
    totalMealsRegistered: number;
    totalWeightedMeals: number;
    uniqueMembersWithRegistrations: number;
    scheduleCount: number;
    availableMealCount: number;
  };
  finalization:
    | {
        isFinalized: true;
        finalizedAt: string;
        rolledBackAt: string | null;
        mealRate: number;
        totalExpenses: number;
        totalWeightedMealCount: number;
      }
    | {
        isFinalized: false;
        finalizedAt: null;
        rolledBackAt: null;
        mealRate: null;
        totalExpenses: null;
        totalWeightedMealCount: null;
      };
}
```

## Generic API Envelope

All endpoints follow the existing API envelope:

```ts
export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}
```

Example usage:

```ts
type PublicStatsApiResponse = ApiResponse<PublicStatsResponse>;
type OverviewStatsApiResponse = ApiResponse<OverviewStatsResponse>;
type ManagersApiResponse = ApiResponse<ManagersResponse>;
type MonthlyStatsApiResponse = ApiResponse<MonthlyStatsResponse>;
```

## Frontend Mapping Suggestions

### Homepage

Use:

```ts
GET /stats/public
```

Suggested cards:

- Active members
- Active managers
- Total meals registered this month
- Weighted meals this month
- Number of scheduled days
- Finalized or not finalized state
- Meal rate if finalized

### Admin or Manager Dashboard

Use:

```ts
GET /stats/overview
```

Suggested cards:

- Total users
- Active users
- Inactive users
- Total members
- Total managers
- Total admins
- Active members
- Locked months count

### Manager Directory

Use:

```ts
GET /stats/managers
```

Suggested UI:

- Simple card/grid/list of active managers
- Name, email, phone, avatar

### Monthly Analytics Page

Use:

```ts
GET /stats/monthly?month=2026-04
```

Suggested cards/charts:

- Deposit total
- Expense total
- Number of deposits
- Number of unique depositors
- Total registration records
- Total meals registered
- Weighted meals
- Unique participating members
- Schedule count
- Available meal count
- Finalization status
- Finalized date
- Rolled back date
- Meal rate

## Important UI Semantics

### `totalRegistrations` vs `totalMealsRegistered`

- `totalRegistrations` = number of registration rows
- `totalMealsRegistered` = sum of `count` across registrations

Example:

- If one user registers `count: 3` for a meal, that is:
  - `totalRegistrations = 1`
  - `totalMealsRegistered = 3`

### `totalWeightedMeals`

- This applies the scheduled meal weight to each registration count
- Use this for analytics tied to meal rate and finalization
- This is the most meaningful operational total for monthly meal consumption

### Finalization Object

For public and internal monthly stats:

- `isFinalized = true` means the month is currently locked/finalized
- `rolledBackAt !== null` means it had been rolled back
- For public stats, finalization is intentionally minimal
- For internal monthly stats, finalization includes financial totals and weighted totals

## Permission Rules

### Public

- `/stats/public` is safe for unauthenticated use

### Protected

- `/stats/overview` requires `ADMIN` or `MANAGER`
- `/stats/managers` requires `ADMIN` or `MANAGER`
- `/stats/monthly` requires `ADMIN` or `MANAGER`

Frontend should:

- Hide protected stats for `MEMBER`
- Hide protected stats for unauthenticated users
- Handle `403` gracefully if access is attempted without permission

## Query Validation Rules

### Public Stats Query

```ts
month?: string; // YYYY-MM
```

### Monthly Stats Query

```ts
month: string; // YYYY-MM, required
```

## Suggested Frontend Fetch Helpers

```ts
export const getPublicStats = async (month?: string) => {
  const query = month ? `?month=${month}` : "";
  return fetch(`/stats/public${query}`).then((res) => res.json());
};

export const getOverviewStats = async (token: string) => {
  return fetch(`/stats/overview`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((res) => res.json());
};

export const getManagers = async (token: string) => {
  return fetch(`/stats/managers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((res) => res.json());
};

export const getMonthlyStats = async (month: string, token: string) => {
  return fetch(`/stats/monthly?month=${month}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((res) => res.json());
};
```

## Source Files

- [src/modules/Stats/stats.route.ts](/abs/path/c:/Users/sami_/Downloads/p-hero/NextLevel/dining-management-prisma-server/src/modules/Stats/stats.route.ts)
- [src/modules/Stats/stats.controller.ts](/abs/path/c:/Users/sami_/Downloads/p-hero/NextLevel/dining-management-prisma-server/src/modules/Stats/stats.controller.ts)
- [src/modules/Stats/stats.service.ts](/abs/path/c:/Users/sami_/Downloads/p-hero/NextLevel/dining-management-prisma-server/src/modules/Stats/stats.service.ts)
- [src/modules/Stats/stats.validation.ts](/abs/path/c:/Users/sami_/Downloads/p-hero/NextLevel/dining-management-prisma-server/src/modules/Stats/stats.validation.ts)
- [src/routes/index.ts](/abs/path/c:/Users/sami_/Downloads/p-hero/NextLevel/dining-management-prisma-server/src/routes/index.ts)

## Verification

Backend build status:

```ts
npm run build
```

Current status:

- Passing

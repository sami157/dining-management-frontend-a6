# Dining Management Next.js Reference

This document maps the current Vite + React Router app to a Next.js App Router implementation.

## 1. Current Route Map

| Current route | Current React entry | Access | Main responsibility | Suggested Next.js target |
| --- | --- | --- | --- | --- |
| `/` | `src/Home.jsx` inside `src/layouts/HomeLayout.jsx` | Public, but UI changes if logged in | Landing view for guests, meal sheet + upcoming meals for signed-in users | `app/page.tsx` |
| `/login` | `src/pages/Login.jsx` | Public | Sign in and password reset | `app/login/page.tsx` |
| `/register` | `src/pages/Registration.jsx` | Public | Create Firebase auth user and register app user profile | `app/register/page.tsx` |
| `/user-dashboard` | `src/pages/UserDashboard.jsx` | Private | Member meal registration, stats, deposit/balance overview | `app/user-dashboard/page.tsx` |
| `/user-profile` | `src/pages/UserProfile.jsx` | Private | Placeholder profile page | `app/user-profile/page.tsx` |
| `/admin-dashboard` | `src/layouts/AdminDashboardLayout.jsx` + index child | Private | Admin dashboard shell, defaults to meal schedule | `app/admin-dashboard/layout.tsx` and `app/admin-dashboard/page.tsx` |
| `/admin-dashboard/meal-schedule` | `src/pages/MealSchedule.jsx` | Private | Weekly meal schedule CRUD | `app/admin-dashboard/meal-schedule/page.tsx` |
| `/admin-dashboard/fund-management` | `src/pages/FundManagement.jsx` | Private | Monthly finance, deposits, expenses, finalization | `app/admin-dashboard/fund-management/page.tsx` |
| `/admin-dashboard/member-management` | `src/pages/MemberManagement.jsx` | Private | Member role/settings updates and weekly meal control | `app/admin-dashboard/member-management/page.tsx` |
| `/admin-dashboard/history` | `src/pages/PreviousData.jsx` | Private | Read-only finalized monthly history | `app/admin-dashboard/history/page.tsx` |
| `*` | `src/components/NotFound.jsx` | Public | 404 page | `app/not-found.tsx` |

## 2. Recommended Next.js App Structure

```text
app/
  layout.tsx
  providers.tsx
  page.tsx
  login/page.tsx
  register/page.tsx
  user-dashboard/page.tsx
  user-profile/page.tsx
  admin-dashboard/
    layout.tsx
    page.tsx
    meal-schedule/page.tsx
    fund-management/page.tsx
    member-management/page.tsx
    history/page.tsx
  not-found.tsx
components/
  layout/
  home/
  admin/
  user/
  shared/
lib/
  auth/
  api/
  hooks/
```

## 3. Layouts and Route Guards

### Root layout

- Current source: `src/layouts/HomeLayout.jsx`
- Shared UI:
  - `src/components/Navbar.jsx`
  - `src/components/Footer.jsx`
  - `react-hot-toast` toaster
- Next.js note:
  - Put the global shell in `app/layout.tsx`
  - Put React Query, auth context, and toaster into `app/providers.tsx`

### Admin dashboard layout

- Current source: `src/layouts/AdminDashboardLayout.jsx`
- Shared UI:
  - `src/components/Sidebar.jsx`
  - `Outlet` content area
- Next.js note:
  - Use `app/admin-dashboard/layout.tsx`
  - Keep sidebar persistent for all admin child routes

### Private route behavior

- Current source: `src/components/PrivateRoute.jsx`
- Current behavior:
  - shows `Loading`
  - redirects unauthenticated users to `/login`
- Next.js note:
  - If auth remains Firebase client-side, create a client guard wrapper
  - If auth tokens are moved to cookies/session, prefer server redirects in layouts/pages

## 4. Page Reference

### Home

- Current file: `src/Home.jsx`
- Depends on:
  - `src/hooks/useAuth.js`
  - `src/components/Loading.jsx`
  - `src/components/MealSheet.jsx`
  - `src/components/UpcomingMeals.jsx`
  - `src/components/MealSheetRamadan.jsx` is present but commented out
- Behavior:
  - guest users see a welcome/login CTA
  - authenticated users see meal sheet plus upcoming meals
- Next.js implementation:
  - likely a client page because it depends on auth state and interactive data queries

### Login

- Current file: `src/pages/Login.jsx`
- Depends on:
  - `src/hooks/useAuth.js`
  - `src/hooks/useAxiosSecure.js`
  - `react-hook-form`
  - React Query for `users/check-user/:email`
- Key actions:
  - sign in via Firebase
  - password reset with pre-check for user existence

### Registration

- Current file: `src/pages/Registration.jsx`
- Depends on:
  - `src/hooks/useAuth.js`
  - `src/hooks/useAxiosSecure.js`
  - `src/utils/registerUser.js`
- Key actions:
  - create Firebase auth user
  - POST app user registration data

### User dashboard

- Current file: `src/pages/UserDashboard.jsx`
- Depends on:
  - `src/components/UserDashboard/UserMonthlyStats.jsx`
  - `src/hooks/useAuth.js`
  - `src/hooks/useAxiosSecure.js`
- Major responsibilities:
  - monthly navigation
  - meal registration/cancellation
  - bulk registration
  - quantity adjustment
  - menu modal
  - deposit, balance, finalization, and meal-count display
- Next.js note:
  - this page should stay a client component unless the auth/data flow is redesigned

### User profile

- Current file: `src/pages/UserProfile.jsx`
- Status:
  - placeholder only
- Next.js note:
  - can be scaffolded as a minimal page and filled later

### Meal schedule

- Current file: `src/pages/MealSchedule.jsx`
- Depends on:
  - `src/components/MealCard.jsx`
  - `src/components/Loading.jsx`
  - `src/hooks/useAxiosSecure.js`
- Major responsibilities:
  - week navigation
  - schedule generation
  - schedule update/delete

### Member management

- Current file: `src/pages/MemberManagement.jsx`
- Depends on:
  - `src/hooks/useAuth.js`
  - `src/hooks/useAxiosSecure.js`
  - `src/components/Loading.jsx`
- Major responsibilities:
  - edit member role/fixed deposit/mosque fee
  - inspect weekly registrations
  - toggle meals for any member
  - change registered quantity
- Next.js note:
  - contains inline modal and heavy interaction, so this should be a client page or broken into client subcomponents

### Fund management

- Current file: `src/pages/FundManagement.jsx`
- Depends on:
  - `src/components/ManagerDashboard/MemberInfoTable.jsx`
  - `src/components/ManagerDashboard/MonthlySummary.jsx`
  - `src/components/ManagerDashboard/MonthlyExpense.jsx`
  - `src/hooks/useAxiosSecure.js`
- Major responsibilities:
  - month selection
  - total deposits and expenses
  - running meal rate
  - month finalization
  - deposit and expense CRUD

### Previous data

- Current file: `src/pages/PreviousData.jsx`
- Depends on:
  - `src/components/ManagerDashboard/MonthlySummaryHistory.jsx`
  - `src/hooks/useAxiosSecure.js`
- Major responsibilities:
  - select a finalized month
  - show read-only financial summary
  - show expense history and member closing balances

## 5. Component Inventory

### Shared layout and utility components

| Component | Current file | Purpose | Next.js note |
| --- | --- | --- | --- |
| `Navbar` | `src/components/Navbar.jsx` | top navigation, auth menu, dashboard links, logout, theme toggle | client component |
| `Footer` | `src/components/Footer.jsx` | site footer | can be server or client |
| `Loading` | `src/components/Loading.jsx` | loading indicator | shared UI component |
| `NotFound` | `src/components/NotFound.jsx` | 404 screen | adapt into `app/not-found.tsx` |
| `PrivateRoute` | `src/components/PrivateRoute.jsx` | auth guard wrapper | replace with layout/page redirect strategy |
| `Sidebar` | `src/components/Sidebar.jsx` | admin navigation | client component if active-link logic stays client-side |
| `GeneralInfo` | `src/components/GeneralInfo.jsx` | manager contact info block | reusable child component |

### Home and meal browsing components

| Component | Current file | Purpose | Notes |
| --- | --- | --- | --- |
| `MealSheet` | `src/components/MealSheet.jsx` | daily member meal matrix with manager contact info | signed-in home view |
| `MealSheetRamadan` | `src/components/MealSheetRamadan.jsx` | Ramadan-specific meal sheet | currently optional/commented |
| `UpcomingMeals` | `src/components/UpcomingMeals.jsx` | weekly schedule browser for upcoming meals | signed-in home view |
| `UpcomingMealCard` | `src/components/UpcomingMealCard.jsx` | per-day interactive meal registration card | used by `UpcomingMeals` |
| `UpcomingMealCardRamadan` | `src/components/UpcomingMealCardRamadan.jsx` | Ramadan card variant | imported but not primary path |

### Admin scheduling and finance components

| Component | Current file | Purpose | Notes |
| --- | --- | --- | --- |
| `MealCard` | `src/components/MealCard.jsx` | edit/delete one schedule card | used in meal schedule page |
| `MealCardRamadan` | `src/components/MealCardRamadan.jsx` | Ramadan schedule card variant | present but not wired in router |
| `MemberInfoTable` | `src/components/ManagerDashboard/MemberInfoTable.jsx` | per-member monthly deposits and balances | used in fund management |
| `MonthlyExpense` | `src/components/ManagerDashboard/MonthlyExpense.jsx` | expense CRUD and category summary | used in fund management |
| `MonthlySummary` | `src/components/ManagerDashboard/MonthlySummary.jsx` | monthly fund overview and finalize action | used in fund management |
| `MonthlySummaryHistory` | `src/components/ManagerDashboard/MonthlySummaryHistory.jsx` | finalized-month summary | used in history page |

### User dashboard components

| Component | Current file | Purpose | Notes |
| --- | --- | --- | --- |
| `UserMonthlyStats` | `src/components/UserDashboard/UserMonthlyStats.jsx` | monthly financial stats presentation | imported in user dashboard |

## 6. Auth, Data, and Hook Reference

| Module | Current file | Responsibility | Next.js migration note |
| --- | --- | --- | --- |
| `AuthContext` | `src/auth/AuthContext.jsx` | auth context object | keep in `lib/auth` or `components/providers` |
| `AuthProvider` | `src/auth/AuthProvider.jsx` | Firebase auth state and auth actions | mount inside `app/providers.tsx` |
| `useAuth` | `src/hooks/useAuth.js` | read auth context | stays client-only |
| `useAxiosSecure` | `src/hooks/useAxiosSecure.js` | axios instance with Firebase bearer token interceptor | replace with `lib/api/axiosSecure.ts` or a fetch wrapper |
| `useRole` | `src/hooks/useRole.js` | fetch logged-in user role | useful for admin navigation and route protection |
| `registerUser` | `src/utils/registerUser.js` | backend registration helper | move into `lib/api/users.ts` or equivalent |

## 7. Providers Needed in Next.js

Recommended root provider stack:

1. `QueryClientProvider`
2. `AuthProvider`
3. `Toaster`

Current source for this composition:

- `src/main.jsx`

Suggested pattern:

```tsx
// app/providers.tsx
'use client'
```

Then wrap children from `app/layout.tsx`.

## 8. Suggested Client vs Server Boundary

Use client components for:

- all authenticated dashboards
- `Navbar`
- `Sidebar`
- forms (`Login`, `Registration`)
- any component using React Query, state, or Firebase user access

Can remain server components if rewritten without client hooks:

- footer
- static wrappers
- simple non-interactive sections

## 9. Backend Endpoints Used by the Current UI

These routes are not frontend pages, but they drive the current components and should be accounted for during migration:

- `/users`
- `/users/profile`
- `/users/get-role/:email`
- `/users/check-user/:email`
- `/users/meals/available`
- `/users/meals/total/:email`
- `/users/meals/register`
- `/users/meals/register/:registrationId`
- `/users/meals/register/cancel/:registrationId`
- `/users/meals/bulk-register`
- `/users/role/:userId`
- `/users/fixedDeposit/:userId`
- `/users/mosqueFee/:userId`
- `/managers/schedules`
- `/managers/schedules/generate`
- `/managers/schedules/:scheduleId`
- `/managers/registrations`
- `/finance/balances`
- `/finance/deposits`
- `/finance/expenses`
- `/finance/meal-rate`
- `/finance/finalization/:month`
- `/finance/finalize`
- `/finance/user-finalization`
- `/finance/user-deposit`
- `/finance/my-balance`

## 10. Migration Notes and Gaps

- `src/pages/UserProfile.jsx` is not implemented yet.
- `MealSheetRamadan`, `MealCardRamadan`, and `UpcomingMealCardRamadan` exist as alternate seasonal variants; document whether they belong in feature flags, a config toggle, or separate components in Next.js.
- `PrivateRoute` currently protects every admin and user dashboard route, but there is no explicit role-based admin route guard in the router itself; admin access is implied mainly through navigation and backend behavior.
- `useAxiosSecure` is tightly coupled to client-side Firebase tokens, so a pure server-component migration is not realistic without changing auth/session handling.

## 11. Minimal Next.js Build Order

1. Create `app/layout.tsx` and `app/providers.tsx`
2. Port root shell: navbar, footer, toaster
3. Port public pages: home, login, register, not-found
4. Port auth provider and secure API client
5. Port `user-dashboard`
6. Port `admin-dashboard` layout and sidebar
7. Port admin child pages: meal schedule, member management, fund management, history
8. Add auth and admin guards
9. Fill `user-profile`

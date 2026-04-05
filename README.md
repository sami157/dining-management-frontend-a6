# Dining Management Frontend

A role-based meal and finance management frontend for a shared dining system. The application helps members register meals, while managers and admins control schedules, templates, deadlines, user access, and monthly operational data.

Built with Next.js App Router, React, TypeScript, TanStack Query, and a REST API backend.

## Live Link

https://dining-management-frontend-a6.vercel.app/

## Overview

This project is the frontend for a dining management platform designed for hostels, dormitories, shared communities, or similar organizations where daily meal planning and monthly accounting need to stay organized.

The system supports:

- member meal booking
- daily and monthly meal schedule management
- weekly meal template configuration
- universal meal deadline setup
- deposit and expense tracking
- monthly finalization and rollback workflows
- role-based administrative control

## User Roles

### Member

Members use the system to:

- browse available meal schedules by date
- register or cancel breakfast, lunch, and dinner
- update meal quantity before the deadline
- check balance and monthly bookings
- view their profile and personal dashboard

### Manager

Managers handle day-to-day dining operations:

- generate daily or monthly meal schedules
- repair incomplete schedules by adding missing meals
- edit meal weight, availability, and menu
- manage members and their meal-related data
- configure weekly templates and meal deadlines
- track analytics, registrations, deposits, expenses, and history

### Admin

Admins have all manager-level operational visibility plus elevated controls:

- assign or change user roles
- deactivate and reactivate user accounts
- manage protected admin actions
- roll back finalized months when required

## Core Features

### Authentication and Access Control

- protected routes for authenticated users
- role-based access for member, manager, and admin areas
- Firebase-based authentication integration

### Meal Scheduling

- generate a single day schedule manually
- generate full month schedules from weekly templates
- add missing meal types to existing schedules
- update meal menu, weight, and availability
- delete meals or entire schedule days

### Meal Booking

- monthly calendar-based browsing for members
- register meals by scheduled slot
- cancel registrations
- update meal count within allowed deadline windows
- clear unavailable and deadline-passed states in the UI

### Configuration

- maintain universal meal deadlines by meal type
- define weekly meal templates by day of week
- use templates to automate future schedule generation

### Finance and Operations

- manage deposits and expenses
- inspect daily and monthly statistics
- review meal analytics and operational summaries
- finalize months and support rollback from admin tools

### User and Role Management

- view system users
- manage role assignments
- deactivate or reactivate users
- inspect manager directory and registration summaries

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- TanStack Query
- Axios
- React Hot Toast
- Lucide React
- React Day Picker

### UI / Architecture

- App Router
- client-side interactive dashboard pages
- reusable UI primitives in `components/ui`
- API abstraction layer in `lib/api`
- typed domain models in `lib/types`

### External Services

- Firebase Authentication
- REST API backend via `NEXT_PUBLIC_API_BASE_URL`

## Project Structure

```text
app/                    App Router pages and layouts
components/             Shared UI and layout components
lib/api/                API client and endpoint wrappers
lib/types/              Shared TypeScript domain types
providers/              Auth, query, and theme providers
firebase/               Firebase initialization
public/                 Static assets
```

## Main Application Areas

- `/` public landing page
- `/login` login page
- `/register` registration page
- `/user-dashboard` member booking dashboard
- `/user-profile` member profile page
- `/admin-dashboard` manager overview dashboard
- `/admin-dashboard/meal-schedule` meal schedule control
- `/admin-dashboard/member-management` member management
- `/admin-dashboard/fund-management` finance management
- `/admin-dashboard/history` historical activity and summaries
- `/admin-dashboard/configuration` deadline and template configuration
- `/admin-dashboard/admin-actions` admin-only actions

## Getting Started

### Prerequisites

- Node.js 20+ recommended
- npm
- a running backend API
- Firebase project credentials configured in the environment

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file and provide the required client environment values.

```env
NEXT_PUBLIC_API_BASE_URL=your_backend_base_url
```

If your local setup also depends on Firebase client configuration, add the matching Firebase public environment variables used by the project.

### Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### Lint

```bash
npm run lint
```

## API Integration

This frontend communicates with a versioned backend API and organizes requests through dedicated modules such as:

- `lib/api/auth.ts`
- `lib/api/schedules.ts`
- `lib/api/registrations.ts`
- `lib/api/stats.ts`
- `lib/api/users.ts`
- `lib/api/finance.ts`
- `lib/api/templates.ts`
- `lib/api/deadlines.ts`

Axios interceptors are used to:

- attach auth headers
- normalize API errors
- surface permission and session issues in the UI

## Highlights

- Dhaka timezone-aware date handling for meal and monthly flows
- role-protected operational dashboards
- configurable meal templates and deadlines
- schedule repair support for incomplete days
- live data synchronization with TanStack Query
- typed API and domain model structure

## Repository Purpose

This repository contains the frontend client only. It is intended to be used with a compatible backend service that provides authentication, schedules, registrations, stats, finance, and admin endpoints.

## License

Add your preferred license information here.

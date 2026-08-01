# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start development server (host: 0.0.0.0)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run Playwright E2E tests
- `npm run testui` - Run Playwright in interactive UI mode
- `npm run format` - Format code with Prettier

## Architecture

This is a Vue 3 application using Vite, Quasar UI framework, and Pinia for state management. The app manages instructor programs, schedules, judgments (novedades), and reports for a training center (REPFORA).

### State Management (Pinia)
- Store: `src/store/users.js` handles authentication and user data
- Persistence: Uses `pinia-plugin-persistedstate` with sessionStorage
- Token automatically expires after 1 day (checked in App.vue and routes.js)

### Authentication & Authorization
- JWT-based authentication with roles: `PROGRAMADOR`, `COORDINADOR`, `EVALUADOR`, `NOVEDADES`, `USER`
- Routes protected by `auth` guard in `src/routes/routes.js` - checks token validity and role access
- Token stored in `token` field in sessionStorage, sent as `token` header in all API requests
- Token decoded using `jwt-decode` to extract role and super user flag

### API Layer
- Base axios instance: `src/common/axios.js` - handles token injection and error notifications
- API utilities: `src/services/api.js` - wraps get/post/put/del/postRaw methods
- API URL configured via `VITE_API_URL` environment variable

### Routing
- Hash-based routing (`createWebHashHistory`)
- Role-based access control via `meta.rol` on each route
- All routes except `/` (login) require authentication

### Layout Structure
- `src/layouts/` contains reusable layout components
- `src/App.vue` wraps router-view with HeaderLayout, DrawerLayout, and FooterLayout
- Drawer toggle state managed as local ref in App.vue

### Key Features
- **Schedules**: Schedule management for instructors (new/edit views)
- **Judgments (Novedades)**: Evaluations and reports
- **Reports**: Various report types with Chart.js integration and PDF export (html2pdf.js, jspdf)
- **Bulk Load**: File upload functionality
- **Users**: CRUD operations restricted to COORDINADOR role
- **Audit**: Audit logs for tracking changes

### Testing
- E2E tests using Playwright in `tests/` directory
- Configured for Chromium only (Firefox/WebKit commented out)
- Run specific test: `npx playwright test <filename>`
- Debug mode: `npx playwright test --debug`

### Environment Variables
- `VITE_APP_TITLE` - Application title (defaults to "REPFORA")
- `VITE_API_URL` - Backend API base URL

### Notes
- The app uses Quasar's components (Notify, Dialog, Loading) throughout
- Sessions expire automatically if date changes (checked on each route/navigation)
- Token header key is `token` (not `Authorization`)

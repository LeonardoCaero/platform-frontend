# Platform Dashboard

Multi-tenant web dashboard with authentication, company management, time tracking, permission control, and real-time notifications.

## Features

- **Authentication**: Login/register with JWT and automatic refresh tokens
- **Multi-company**: Active company selector, member and role management
- **Company Requests**: Request/review flow for company creation
- **Permission Management**: Request and manage global permissions
- **Time Tracking**: Log entries with projects, clients, categories, and summaries
- **Clients**: Client management with sites and rate rules
- **Calendar**: Company calendar notes
- **Real-Time Notifications**: Notification bell via SSE
- **Dark / Light Mode**: Persistent theme toggle
- **Internationalization**: Multi-language support (i18n)
- **Protected Routes**: Permission-based access control
- **Responsive Design**: shadcn-ui components with Tailwind CSS

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn-ui (Radix UI)
- **Routing**: React Router v6
- **Server State**: TanStack React Query v5
- **Client State**: Context API (Auth, Theme, Language)
- **HTTP**: Axios with automatic refresh token interceptors
- **Forms**: React Hook Form + Zod
- **Notifications**: Sonner (toasts)
- **Charts**: Recharts
- **Dates**: date-fns
- **Testing**: Vitest + Testing Library

## Prerequisites

- Node.js v18+
- Bun or npm
- Backend API running at `http://localhost:4000`

## Getting Started

```bash
# Install dependencies
bun install
# or
npm install

# Start development server
bun run dev
# or
npm run dev
```

The application will be available at `http://localhost:8080`

## Available Scripts

| Script | Description |
|---|---|
| `bun run dev` | Start development server |
| `bun run build` | Production build |
| `bun run build:dev` | Build in development mode |
| `bun run preview` | Preview production build |
| `bun run lint` | Run ESLint |
| `bun run test` | Run tests |
| `bun run test:watch` | Run tests in watch mode |

## Pages

| Page | Route | Description |
|---|---|---|
| Login | `/login` | User login |
| Register | `/register` | User registration |
| Dashboard | `/` | Main dashboard |
| Companies | `/companies` | Company listing |
| Company Detail | `/companies/:id` | Company detail |
| Create Company | `/companies/new` | Create company |
| Edit Company | `/companies/:id/edit` | Edit company |
| Request Company | `/request-company` | Request company creation |
| Clients | `/clients` | Client management |
| Time Tracker | `/time-tracker` | Time tracking |
| Company Calendar | `/calendar` | Calendar notes |
| Permissions | `/permissions` | Permission management (admin) |
| Profile | `/profile` | User profile |
| My Requests | `/my-requests` | My company requests |
| My Permission Requests | `/my-permission-requests` | My permission requests |
| Request Permission | `/request-permission` | Request a permission |
| Admin Company Requests | `/admin/company-requests` | (Admin) Company requests |
| Admin Permission Requests | `/admin/permission-requests` | (Admin) Permission requests |

## Project Structure

```
src/
├── App.tsx                  # Route configuration and providers
├── main.tsx                 # Entry point
├── components/
│   ├── ui/                  # shadcn-ui components
│   ├── company/             # Company-specific components
│   ├── DashboardLayout.tsx  # Main layout
│   ├── Navbar.tsx           # Navigation bar
│   ├── CompanySelector.tsx  # Active company selector
│   ├── NotificationBell.tsx # Real-time notifications
│   ├── ProtectedRoute.tsx   # Route guard
│   ├── StatusBadge.tsx      # Status badge
│   ├── ThemeToggle.tsx      # Theme toggle
│   ├── LanguageToggle.tsx   # Language toggle
│   └── ReviewRequestModal.tsx
├── contexts/
│   ├── AuthContext.tsx      # Authentication state
│   ├── ThemeContext.tsx     # Light/dark theme
│   └── LanguageContext.tsx  # UI language
├── hooks/
│   ├── useSSE.ts            # Server-Sent Events connection
│   ├── useSlugValidation.ts # Real-time slug validation
│   └── use-toast.ts         # Toast hook
├── lib/
│   ├── axios.ts             # Axios instance with interceptors
│   ├── i18n.ts              # Internationalization configuration
│   └── utils.ts             # General utilities
├── pages/                   # Page components
├── schemas/                 # Zod validation schemas
├── services/                # API service layer
│   ├── auth.service.ts
│   ├── companies.service.ts
│   ├── company-members.service.ts
│   ├── company-requests.service.ts
│   ├── clients.service.ts
│   ├── time-entries.service.ts
│   ├── projects.service.ts
│   ├── categories.service.ts
│   ├── calendar-notes.service.ts
│   ├── invitations.service.ts
│   ├── permission-requests.service.ts
│   ├── permissions.service.ts
│   └── users.service.ts
└── types/                   # Shared TypeScript types
```

## Backend Integration

Connects to the API at `http://localhost:4000/api`. The Axios client includes interceptors that automatically renew the access token using the refresh token when it expires.

Real-time notifications are received via an SSE connection at `/api/sse`, managed by the `useSSE` hook.

## Author

Leonardo Caero Ledezma

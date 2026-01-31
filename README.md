# Platform Dashboard

Multi-tenant SaaS Dashboard with authentication, user management, and time tracking capabilities.

## 🚀 Features

- **Authentication System**: Secure JWT-based authentication with refresh tokens
- **User Management**: Profile management with avatar support
- **Time Tracking**: Track and manage time entries
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Mobile-first design with shadcn-ui components
- **Protected Routes**: Role-based access control

## 🛠️ Technologies

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn-ui
- **Routing**: React Router v6
- **State Management**: React Query + Context API
- **HTTP Client**: Axios
- **Form Validation**: React Hook Form + Zod
- **Testing**: Vitest + Testing Library

## 📋 Prerequisites

- Node.js (v18 or higher recommended)
- Bun or npm
- Backend API running on `http://localhost:4000`

## 🏃 Getting Started

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

## 📜 Available Scripts

```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run preview      # Preview production build
bun run lint         # Run ESLint
bun run test         # Run tests
bun run test:watch   # Run tests in watch mode
```

## 🔌 Backend Integration

This frontend application connects to a backend API at `http://localhost:4000/api`

Required endpoints:
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user
- Time tracking endpoints for managing time entries

## 📁 Project Structure

```
src/
├── components/       # Reusable components
│   ├── ui/          # shadcn-ui components
│   ├── Navbar.tsx
│   ├── DashboardLayout.tsx
│   └── ProtectedRoute.tsx
├── contexts/        # React contexts (Auth, Theme)
├── hooks/           # Custom React hooks
├── lib/             # Utilities (axios config, utils)
├── pages/           # Page components
├── services/        # API service layer
└── test/            # Test files and setup
```

## 👤 Author

Leonardo Caero Ledezma

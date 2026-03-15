import { useRef, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RequireAdmin } from '@/components/RequireAdmin';
import { useSSE } from '@/hooks/useSSE';
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import TimeTracker from "./pages/TimeTracker";
import Profile from "./pages/Profile";
import Companies from "./pages/Companies";
import CreateCompany from "./pages/CreateCompany";
import CompanyDetail from "./pages/CompanyDetail";
import EditCompany from "./pages/EditCompany";
import RequestCompany from "./pages/RequestCompany";
import MyRequests from "./pages/MyRequests";
import AdminCompanyRequests from "./pages/AdminCompanyRequests";
import RequestPermission from "./pages/RequestPermission";
import MyPermissionRequests from "./pages/MyPermissionRequests";
import AdminPermissionRequests from "./pages/AdminPermissionRequests";
import Permissions from "./pages/Permissions";
import Clients from "./pages/Clients";
import CompanyCalendar from "./pages/CompanyCalendar";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/**
 * Inner component that lives inside AuthProvider so it can access
 * useAuth. It opens a single SSE connection for the whole app
 * whenever the user is authenticated.
 */
function AppRealtimeLayer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  useSSE(isAuthenticated);

  const updateRef = useRef<((reloadPage?: boolean) => Promise<void>) | undefined>(undefined);
  const { updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_, registration) {
      // Poll every 60 min — installed PWAs don't do navigation-based SW checks
      setInterval(() => registration?.update(), 60 * 60 * 1000);
    },
    onNeedRefresh() {
      updateRef.current?.(true);
    },
  });
  useEffect(() => {
    updateRef.current = updateServiceWorker;
  }, [updateServiceWorker]);

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <AppRealtimeLayer>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/time-tracker"
                element={
                  <ProtectedRoute>
                    <TimeTracker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/companies"
                element={
                  <ProtectedRoute>
                    <Companies />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/companies/new"
                element={
                  <ProtectedRoute>
                    <CreateCompany />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/companies/:id"
                element={
                  <ProtectedRoute>
                    <CompanyDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/companies/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditCompany />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/request-company"
                element={
                  <ProtectedRoute>
                    <RequestCompany />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-requests"
                element={
                  <ProtectedRoute>
                    <MyRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/company-requests"
                element={
                  <ProtectedRoute>
                    <RequireAdmin>
                      <AdminCompanyRequests />
                    </RequireAdmin>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/request-permission"
                element={
                  <ProtectedRoute>
                    <RequestPermission />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-permission-requests"
                element={
                  <ProtectedRoute>
                    <MyPermissionRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/permission-requests"
                element={
                  <ProtectedRoute>
                    <RequireAdmin>
                      <AdminPermissionRequests />
                    </RequireAdmin>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/permissions"
                element={
                  <ProtectedRoute>
                    <RequireAdmin>
                      <Permissions />
                    </RequireAdmin>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clients"
                element={
                  <ProtectedRoute>
                    <Clients />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <ProtectedRoute>
                    <CompanyCalendar />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </AppRealtimeLayer>
          </AuthProvider>
        </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
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
                    <AdminCompanyRequests />
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
                    <AdminPermissionRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/permissions"
                element={
                  <ProtectedRoute>
                    <Permissions />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

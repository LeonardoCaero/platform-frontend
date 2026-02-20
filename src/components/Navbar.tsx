import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, X, User, LogOut, LayoutDashboard, Building2, Clock, ShieldAlert, Key, ChevronDown, ChevronRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { CompanySelector } from '@/components/CompanySelector';

export function Navbar() {
  const { user, logout, isPlatformAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setAdminExpanded(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <nav className="border-b bg-card sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold text-foreground hidden sm:block">Dashboard</span>
            </Link>

            {/* Company Selector - Center (desktop) */}
            <div className="hidden md:flex flex-1 justify-center px-4">
              <CompanySelector />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-2">
              <Button variant="ghost" asChild>
                <Link to="/companies" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Companies
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/my-permission-requests" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  My Requests
                </Link>
              </Button>
              {isPlatformAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4" />
                      Admin Panel
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/admin/company-requests">Company Requests</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/permission-requests">Permission Requests</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/permissions">Manage Permissions</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <ThemeToggle />
              <LanguageToggle />
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.fullName} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.fullName ? getInitials(user.fullName) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user?.fullName?.split(' ')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile right side: notification + avatar + hamburger */}
            <div className="flex md:hidden items-center gap-1">
              <NotificationBell />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[280px] bg-card shadow-xl flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar} alt={user?.fullName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {user?.fullName ? getInitials(user.fullName) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={closeMobileMenu}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Company Selector */}
        <div className="px-4 py-3 border-b">
          <CompanySelector />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          <Link
            to="/companies"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            onClick={closeMobileMenu}
          >
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            Companies
          </Link>
          <Link
            to="/my-permission-requests"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            onClick={closeMobileMenu}
          >
            <Key className="h-4 w-4 shrink-0 text-muted-foreground" />
            My Requests
          </Link>
          <Link
            to="/time-tracker"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            onClick={closeMobileMenu}
          >
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
            Time Tracker
          </Link>
          <Link
            to="/profile"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            onClick={closeMobileMenu}
          >
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            Profile
          </Link>

          {isPlatformAdmin && (
            <div>
              <button
                className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                onClick={() => setAdminExpanded(!adminExpanded)}
              >
                <span className="flex items-center gap-3">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-muted-foreground" />
                  Admin Panel
                </span>
                <ChevronRight
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    adminExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {adminExpanded && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
                  <Link
                    to="/admin/company-requests"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Company Requests
                  </Link>
                  <Link
                    to="/admin/permission-requests"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Permission Requests
                  </Link>
                  <Link
                    to="/admin/permissions"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Manage Permissions
                  </Link>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Drawer Footer */}
        <div className="border-t px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Appearance</span>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <LanguageToggle />
            </div>
          </div>
          <button
            onClick={() => {
              closeMobileMenu();
              handleLogout();
            }}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}

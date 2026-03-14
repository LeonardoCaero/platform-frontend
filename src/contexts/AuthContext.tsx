import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, authService, CompanyMembership } from '@/services/auth.service';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPlatformAdmin: boolean;
  companies: CompanyMembership[];
  selectedCompany: CompanyMembership | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasGlobalPermission: (permission: string) => boolean;
  hasCompanyPermission: (permission: string, companyId?: string) => boolean;
  isOwnerOf: (companyId: string) => boolean;
  isAdminOf: (companyId: string) => boolean;
  getMembershipId: (companyId: string) => string | undefined;
  setSelectedCompany: (company: CompanyMembership | null) => void;
  viewAsMember: boolean;
  toggleViewAsMember: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompany, setSelectedCompanyState] = useState<CompanyMembership | null>(null);
  const [viewAsMember, setViewAsMember] = useState(false);
  const { toast } = useToast();

  usePushNotifications(!!user);

  // Load selected company from localStorage
  useEffect(() => {
    if (!user?.companies) {
      setSelectedCompanyState(null);
      return;
    }
    const savedSlug = localStorage.getItem('selectedCompanySlug');
    const found = savedSlug ? user.companies.find(c => c.slug === savedSlug) : null;
    setSelectedCompanyState(found ?? user.companies[0] ?? null);
  }, [user]);

  const setSelectedCompany = useCallback((company: CompanyMembership | null) => {
    setSelectedCompanyState(company);
    if (company) {
      localStorage.setItem('selectedCompanySlug', company.slug);
    } else {
      localStorage.removeItem('selectedCompanySlug');
    }
  }, []);

  const hasGlobalPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    if (user.isPlatformAdmin) return true;
    return user.globalPermissions?.some(p => p.key === permission) || false;
  }, [user]);

  const isOwnerOf = useCallback((companyId: string): boolean => {
    if (viewAsMember) return false;
    if (!user) return false;
    if (user.isPlatformAdmin) return true;
    const company = user.companies?.find(c => c.id === companyId);
    return company?.roles?.some(r => r.name === 'Owner') ?? false;
  }, [user, viewAsMember]);

  const isAdminOf = useCallback((companyId: string): boolean => {
    if (viewAsMember) return false;
    if (!user) return false;
    if (user.isPlatformAdmin) return true;
    const company = user.companies?.find(c => c.id === companyId);
    return company?.roles?.some(r => r.name === 'Owner' || r.name === 'Admin') ?? false;
  }, [user, viewAsMember]);

  const getMembershipId = useCallback((companyId: string): string | undefined => {
    return user?.companies?.find(c => c.id === companyId)?.membershipId;
  }, [user]);

  const hasCompanyPermission = useCallback((permission: string, companyId?: string): boolean => {
    if (!user) return false;
    if (user.isPlatformAdmin) return true;
    
    const targetCompany = companyId 
      ? user.companies?.find(c => c.id === companyId)
      : selectedCompany;
    
    return targetCompany?.permissions?.includes(permission) || false;
  }, [user, selectedCompany]);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUser(null);
        return;
      }
      const userData = await authService.getMe();
      setUser(userData);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    };
    initAuth();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    
    await refreshUser();
    
    toast({
      title: 'Welcome back!',
      description: `Logged in as ${response.user.email}`,
    });
  };

  const register = async (email: string, password: string, fullName: string) => {
    const response = await authService.register({ email, password, fullName });
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    setUser(response.user);
    toast({
      title: 'Account created!',
      description: 'Welcome to the platform.',
    });
  };

  const logout = () => {
    setUser(null);
    setSelectedCompanyState(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('selectedCompanySlug');
    toast({
      title: 'Logged out',
      description: 'See you next time!',
    });
    authService.logout().catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isPlatformAdmin: viewAsMember ? false : (user?.isPlatformAdmin || false),
        companies: user?.companies || [],
        selectedCompany,
        login,
        register,
        logout,
        refreshUser,
        hasGlobalPermission,
        hasCompanyPermission,
        isOwnerOf,
        isAdminOf,
        getMembershipId,
        setSelectedCompany,
        viewAsMember,
        toggleViewAsMember: () => setViewAsMember(v => !v),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

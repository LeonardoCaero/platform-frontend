import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, ChevronDown, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CompanySelector() {
  const { companies, selectedCompany, setSelectedCompany, hasGlobalPermission } = useAuth();
  const navigate = useNavigate();
  const hasCreatePermission = hasGlobalPermission('company:create');

  // No companies - show disabled state
  if (companies.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>No Company</span>
      </div>
    );
  }

  // Single company - no dropdown needed
  if (companies.length === 1) {
    const company = companies[0];
    return (
      <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
        {company.logo ? (
          <img src={company.logo} alt={company.name} className="h-5 w-5 rounded" />
        ) : (
          <Building2 className="h-4 w-4 text-primary" />
        )}
        <span className="text-sm font-medium">{company.name}</span>
      </div>
    );
  }

  // Multiple companies - show dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          {selectedCompany?.logo ? (
            <img src={selectedCompany.logo} alt={selectedCompany.name} className="h-5 w-5 rounded" />
          ) : (
            <Building2 className="h-4 w-4" />
          )}
          <span className="max-w-[150px] truncate">
            {selectedCompany?.name || 'Select Company'}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Your Companies
        </div>
        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => setSelectedCompany(company)}
            className={cn(
              'flex items-center gap-2 cursor-pointer',
              selectedCompany?.id === company.id && 'bg-accent'
            )}
          >
            {company.logo ? (
              <img src={company.logo} alt={company.name} className="h-5 w-5 rounded" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
            <span className="flex-1 truncate">{company.name}</span>
            {selectedCompany?.id === company.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        {hasCreatePermission && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate('/companies/new')}
              className="flex items-center gap-2 cursor-pointer text-primary"
            >
              <Plus className="h-4 w-4" />
              <span>Create Company</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

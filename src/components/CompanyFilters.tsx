import { useState } from 'react';
import { CompanyStatus } from '@/types/company.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CompanyFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
}

export interface FilterValues {
  search: string;
  status: CompanyStatus | 'ALL';
  includeDeleted: boolean;
}

export function CompanyFilters({ onFilterChange }: CompanyFiltersProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CompanyStatus | 'ALL'>('ALL');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const { t } = useLanguage();
  const tf = t.companyFilters;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({ search: value, status, includeDeleted });
  };

  const handleStatusChange = (value: string) => {
    const newStatus = value as CompanyStatus | 'ALL';
    setStatus(newStatus);
    onFilterChange({ search, status: newStatus, includeDeleted });
  };

  const handleIncludeDeletedChange = (checked: boolean) => {
    setIncludeDeleted(checked);
    onFilterChange({ search, status, includeDeleted: checked });
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('ALL');
    setIncludeDeleted(false);
    onFilterChange({ search: '', status: 'ALL', includeDeleted: false });
  };

  const hasActiveFilters = search || status !== 'ALL' || includeDeleted;

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg border">
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={tf.searchPlaceholder}
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={tf.filterStatus} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{tf.allStatus}</SelectItem>
          <SelectItem value={CompanyStatus.ACTIVE}>{tf.active}</SelectItem>
          <SelectItem value={CompanyStatus.SUSPENDED}>{tf.suspended}</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="includeDeleted"
          checked={includeDeleted}
          onCheckedChange={(checked) => handleIncludeDeletedChange(checked === true)}
        />
        <Label htmlFor="includeDeleted" className="text-sm cursor-pointer">
          {tf.showDeleted}
        </Label>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          {tf.clearFilters}
        </Button>
      )}
    </div>
  );
}

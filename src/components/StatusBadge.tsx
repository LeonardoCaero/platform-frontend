import { CompanyStatus, MemberStatus } from '@/types/company.types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: CompanyStatus | MemberStatus;
  deleted?: boolean;
}

export function StatusBadge({ status, deleted }: StatusBadgeProps) {
  const getStatusStyles = () => {
    if (deleted) {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
    
    switch (status) {
      case CompanyStatus.ACTIVE:
      case MemberStatus.ACTIVE:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case CompanyStatus.SUSPENDED:
      case MemberStatus.SUSPENDED:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case MemberStatus.INVITED:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        getStatusStyles()
      )}
    >
      {deleted ? 'DELETED' : status}
    </span>
  );
}

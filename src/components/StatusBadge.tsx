import { CompanyStatus, MemberStatus } from '@/types/company.types';
import { CompanyRequestStatus } from '@/types/company-requests.types';
import { PermissionRequestStatus } from '@/types/permission-requests.types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

type Status = CompanyStatus | MemberStatus | CompanyRequestStatus | PermissionRequestStatus;

interface StatusBadgeProps {
  status: Status;
  deleted?: boolean;
}

export function StatusBadge({ status, deleted }: StatusBadgeProps) {
  const { t } = useLanguage();
  const getStatusStyles = () => {
    if (deleted) {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
    
    switch (status) {
      // Company & Member Statuses
      case CompanyStatus.ACTIVE:
      case MemberStatus.ACTIVE:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case CompanyStatus.SUSPENDED:
      case MemberStatus.SUSPENDED:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case MemberStatus.INVITED:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      
      // Company Request Statuses
      case CompanyRequestStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300';
      case CompanyRequestStatus.APPROVED:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-300';
      case CompanyRequestStatus.REJECTED:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-300';
      case CompanyRequestStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-300';
      case CompanyRequestStatus.CANCELLED:
      case PermissionRequestStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-300';

      // Permission Request Statuses (shared colours with CompanyRequest)
      case PermissionRequestStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300';
      case PermissionRequestStatus.APPROVED:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-300';
      case PermissionRequestStatus.REJECTED:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-300';

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
      {deleted ? t.nav.deleted : status}
    </span>
  );
}

import { Company } from '@/types/company.types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Trash2, Users, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CompanyCardProps {
  company: Company;
  onDelete?: (company: Company) => void;
  onRestore?: (company: Company) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canRestore?: boolean;
}

export function CompanyCard({ company, onDelete, onRestore, canEdit = true, canDelete = true, canRestore = false }: CompanyCardProps) {
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader
        className="cursor-pointer"
        onClick={() => navigate(`/companies/${company.id}`)}
      >
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={company.logo || undefined} alt={company.name} />
            <AvatarFallback className="text-lg font-semibold bg-primary/10">
              {getInitials(company.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{company.name}</h3>
            <p className="text-sm text-muted-foreground">@{company.slug}</p>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={company.status} deleted={!!company.deletedAt} />
              {company._count && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{company._count.memberships}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      {company.description && (
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {company.description}
          </p>
        </CardContent>
      )}
      <CardFooter className="flex justify-end gap-2 pt-4 border-t">
        {canRestore && !!company.deletedAt && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onRestore?.(company); }}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Restore
          </Button>
        )}
        {canEdit && !company.deletedAt && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/companies/${company.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
        {canDelete && !company.deletedAt && (
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(company);
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

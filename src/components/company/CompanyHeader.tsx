import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/StatusBadge';
import { Company } from '@/types/company.types';
import { Building2, Pencil, Trash2, RotateCcw } from 'lucide-react';

interface CompanyHeaderProps {
  company: Company;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
}

export function CompanyHeader({ company, onEdit, onDelete, onRestore }: CompanyHeaderProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={company.logo || undefined} alt={company.name} />
              <AvatarFallback className="bg-primary/10">
                <Building2 className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold">{company.name}</h2>
                <StatusBadge status={company.status} deleted={!!company.deletedAt} />
              </div>
              <p className="text-lg text-muted-foreground">@{company.slug}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {company.deletedAt ? (
              <Button onClick={onRestore}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

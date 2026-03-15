import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanyRole } from '@/types/company.types';
import { Shield, Plus, Pencil, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface RolesTabProps {
  roles: CompanyRole[] | undefined;
  isLoading: boolean;
}

export function RolesTab({ roles, isLoading }: RolesTabProps) {
  const { t } = useLanguage();
  const tr = t.rolesTab;
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">{tr.title}</h3>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {tr.create}
        </Button>
      </div>
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))
        ) : !roles?.length ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Shield className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">{tr.noRoles}</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {tr.createFirst}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          roles.map((role) => (
            <Card key={role.id}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: role.color || 'gray' }}
                      />
                      <h4 className="text-lg font-semibold">{role.name}</h4>
                      {role.isSystem && (
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {tr.system}
                        </span>
                      )}
                      {role.isDefault && (
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                          {tr.default}
                        </span>
                      )}
                    </div>
                    {!role.isSystem && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {role.description || tr.noDescription}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tr.memberCount(role._count?.companyMembers || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

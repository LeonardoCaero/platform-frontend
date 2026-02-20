import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { Company } from '@/types/company.types';

interface OverviewTabProps {
  company: Company;
}

export function OverviewTab({ company }: OverviewTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-semibold mb-2">Description</h4>
          <p className="text-muted-foreground">
            {company.description || 'No description provided'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Status</h4>
            <StatusBadge status={company.status} deleted={!!company.deletedAt} />
          </div>
          <div>
            <h4 className="font-semibold mb-2">Members</h4>
            <p className="text-muted-foreground">{company._count?.memberships || 0}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Created</h4>
            <p className="text-muted-foreground">
              {new Date(company.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Last Updated</h4>
            <p className="text-muted-foreground">
              {new Date(company.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {company.metadata && Object.keys(company.metadata).length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Metadata</h4>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
              <code>{JSON.stringify(company.metadata, null, 2)}</code>
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

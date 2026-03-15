import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { Company } from '@/types/company.types';
import { useLanguage } from '@/contexts/LanguageContext';

interface OverviewTabProps {
  company: Company;
}

export function OverviewTab({ company }: OverviewTabProps) {
  const { t, language } = useLanguage();
  const to = t.overviewTab;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{to.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-semibold mb-2">{to.description}</h4>
          <p className="text-muted-foreground">
            {company.description || to.noDescription}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">{to.status}</h4>
            <StatusBadge status={company.status} deleted={!!company.deletedAt} />
          </div>
          <div>
            <h4 className="font-semibold mb-2">{to.members}</h4>
            <p className="text-muted-foreground">{company._count?.memberships || 0}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">{to.created}</h4>
            <p className="text-muted-foreground">
              {new Date(company.createdAt).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">{to.lastUpdated}</h4>
            <p className="text-muted-foreground">
              {new Date(company.updatedAt).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
            </p>
          </div>
        </div>

        {company.metadata && Object.keys(company.metadata).length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">{to.metadata}</h4>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
              <code>{JSON.stringify(company.metadata, null, 2)}</code>
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

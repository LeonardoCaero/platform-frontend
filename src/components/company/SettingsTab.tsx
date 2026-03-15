import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface SettingsTabProps {
  canDelete: boolean;
  canLeave: boolean;
  onDelete: () => void;
  onLeave: () => void;
}

export function SettingsTab({ canDelete, canLeave, onDelete, onLeave }: SettingsTabProps) {
  const { t } = useLanguage();
  const ts = t.settingsTab;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{ts.dangerZone}</CardTitle>
        <CardDescription>
          {ts.irreversibleDesc}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canLeave && (
          <Card className="border-orange-400 dark:border-orange-600">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h4 className="font-semibold text-orange-600 dark:text-orange-400">{ts.leaveTitle}</h4>
                  <p className="text-sm text-muted-foreground">
                    {ts.leaveDesc}
                  </p>
                </div>
                <Button variant="outline" className="border-orange-400 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950" onClick={onLeave}>
                  {ts.leave}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {canDelete && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h4 className="font-semibold text-destructive">{ts.deleteTitle}</h4>
                  <p className="text-sm text-muted-foreground">
                    {ts.deleteDesc}
                  </p>
                </div>
                <Button variant="destructive" onClick={onDelete}>
                  {ts.delete}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

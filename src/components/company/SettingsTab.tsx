import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SettingsTabProps {
  canDelete: boolean;
  canLeave: boolean;
  onDelete: () => void;
  onLeave: () => void;
}

export function SettingsTab({ canDelete, canLeave, onDelete, onLeave }: SettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Danger Zone</CardTitle>
        <CardDescription>
          Irreversible actions that affect your membership or this company
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canLeave && (
          <Card className="border-orange-400 dark:border-orange-600">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h4 className="font-semibold text-orange-600 dark:text-orange-400">Leave Company</h4>
                  <p className="text-sm text-muted-foreground">
                    Remove yourself from this company. You will lose access immediately.
                  </p>
                </div>
                <Button variant="outline" className="border-orange-400 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950" onClick={onLeave}>
                  Leave
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
                  <h4 className="font-semibold text-destructive">Delete Company</h4>
                  <p className="text-sm text-muted-foreground">
                    Soft delete this company. It can be restored later.
                  </p>
                </div>
                <Button variant="destructive" onClick={onDelete}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SettingsTabProps {
  onDelete: () => void;
}

export function SettingsTab({ onDelete }: SettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Danger Zone</CardTitle>
        <CardDescription>
          Irreversible actions that affect this company
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}

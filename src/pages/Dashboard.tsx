import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

function ModuleCard({ title, description, icon, onClick, disabled }: ModuleCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:shadow-lg hover:border-primary/50 hover:-translate-y-1'
      )}
      onClick={disabled ? undefined : onClick}
    >
      <CardHeader className="text-center pb-2">
        <div
          className={cn(
            'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full',
            disabled ? 'bg-muted' : 'bg-primary/10'
          )}
        >
          <div className={cn(disabled ? 'text-muted-foreground' : 'text-primary')}>
            {icon}
          </div>
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-center">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.fullName?.split(' ')[0] || 'User'}!
          </h1>
          <p className="mt-2 text-muted-foreground">
            Select a module to get started
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
          <ModuleCard
            title="Time Tracker"
            description="Track your work hours and daily activities"
            icon={<Clock className="h-8 w-8" />}
            onClick={() => navigate('/time-tracker')}
          />
          <ModuleCard
            title="Profile"
            description="Manage your profile and settings"
            icon={<User className="h-8 w-8" />}
            onClick={() => navigate('/profile')}
          />
          <ModuleCard
            title="Coming Soon"
            description="More modules coming soon"
            icon={<Package className="h-8 w-8" />}
            disabled
          />
          <ModuleCard
            title="Coming Soon"
            description="More modules coming soon"
            icon={<Package className="h-8 w-8" />}
            disabled
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

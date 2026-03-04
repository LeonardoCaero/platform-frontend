import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { registerSchema, type RegisterFormData } from '@/schemas/auth.schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LayoutDashboard } from 'lucide-react';

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await registerUser(data.email, data.password, data.fullName);
      navigate('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t.auth.registerError,
        description: error.response?.data?.message || t.auth.registerError,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">{t.auth.createAccount}</CardTitle>
          <CardDescription>{t.auth.registerSubtitle}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t.auth.fullName}</Label>
              <Input
                id="fullName"
                type="text"
                placeholder={t.auth.fullNamePlaceholder}
                {...register('fullName')}
                disabled={isLoading}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t.auth.emailPlaceholder}
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.auth.password}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t.auth.passwordPlaceholder}
                {...register('password')}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t.auth.passwordPlaceholder}
                {...register('confirmPassword')}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.auth.signUp}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t.auth.haveAccount}{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                {t.auth.signIn}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

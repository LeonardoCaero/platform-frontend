import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { usersService } from "@/services/users.service";
import { profileSchema, passwordSchema, type ProfileFormData, type PasswordFormData } from "@/schemas/profile.schemas";
import { Loader2, User, Camera } from "lucide-react";
import { useRef } from "react";
import { uploadsService } from "@/services/uploads.service";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      avatar: user?.avatar || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) =>
      usersService.updateUser(user!.id, {
        fullName: data.fullName,
        phone: data.phone || undefined,
        avatar: data.avatar || undefined,
      }),
    onSuccess: () => {
      refreshUser();
      toast({
        title: t.profile.profileUpdated,
        description: t.profile.profileUpdatedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message || t.profile.profileError,
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: PasswordFormData) =>
      usersService.updatePassword(user!.id, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: t.profile.passwordUpdated,
        description: t.profile.passwordUpdatedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message || t.profile.passwordError,
      });
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);
    setIsUploadingAvatar(true);
    try {
      const url = await uploadsService.uploadAvatar(file);
      profileForm.setValue('avatar', url, { shouldDirty: true });
      toast({ title: t.profile.avatarUpdated });
    } catch {
      toast({ variant: 'destructive', title: t.profile.uploadError });
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.profile.title}</h1>
          <p className="mt-2 text-muted-foreground">
            {t.profile.subtitle}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t.profile.profileSection}</CardTitle>
              <CardDescription>{t.profile.profileSectionDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex items-center gap-4">
                {/* Clickable avatar — triggers hidden file input */}
                <button
                  type="button"
                  className="relative h-20 w-20 rounded-full group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  aria-label={t.profile.changeAvatar}
                >
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarPreview ?? user?.avatar} alt={user?.fullName} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {user?.fullName ? getInitials(user.fullName) : <User className="h-8 w-8" />}
                    </AvatarFallback>
                  </Avatar>
                  {/* Overlay */}
                  <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isUploadingAvatar
                      ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                      : <Camera className="h-5 w-5 text-white" />}
                  </div>
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                />
                <div>
                  <p className="font-medium text-foreground">{user?.fullName}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline mt-1"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />{t.profile.saving}</span> : t.profile.changeAvatar}
                  </button>
                </div>
              </div>

              <form
                onSubmit={profileForm.handleSubmit((data) =>
                  updateProfileMutation.mutate(data),
                )}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t.profile.fullName}</Label>
                  <Input id="fullName" {...profileForm.register("fullName")} />
                  {profileForm.formState.errors.fullName && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t.auth.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t.profile.emailNote}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t.profile.phone}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t.profile.phonePlaceholder}
                    {...profileForm.register("phone")}
                  />
                  {profileForm.formState.errors.phone && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {updateProfileMutation.isPending ? t.profile.saving : t.profile.saveChanges}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>{t.profile.passwordSection}</CardTitle>
              <CardDescription>
                {t.profile.passwordSectionDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={passwordForm.handleSubmit((data) =>
                  updatePasswordMutation.mutate(data),
                )}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t.profile.currentPassword}</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="••••••••"
                    {...passwordForm.register("currentPassword")}
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t.profile.newPassword}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    {...passwordForm.register("newPassword")}
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t.profile.confirmPassword}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...passwordForm.register("confirmPassword")}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={updatePasswordMutation.isPending}
                >
                  {updatePasswordMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {updatePasswordMutation.isPending ? t.profile.updatingPassword : t.profile.updatePassword}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

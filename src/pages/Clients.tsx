import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { clientsService } from '@/services/clients.service';
import type { Client, ClientSite, ClientRateRule, ClientRateRuleResource, OvertimeTrigger } from '@/types/clients.types';
import {
  clientSchema, siteSchema, rateSchema, resourceSchema,
  type ClientFormData, type SiteFormData, type RateFormData, type ResourceFormData,
} from '@/schemas/clients.schemas';
import {
  Building2, ChevronDown, Loader2, MapPin, Pencil, Pin, Plus, Trash2, Euro,
  Clock, Users, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';


export default function Clients() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { selectedCompany, hasCompanyPermission } = useAuth();
  const { t, language } = useLanguage();
  const tc = t.clients;

  const companyId = selectedCompany?.id ?? '';
  const canManage = hasCompanyPermission('CLIENT:CREATE', companyId);

  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [clientDialog, setClientDialog] = useState<{ open: boolean; editing?: Client }>({ open: false });
  const [siteDialog, setSiteDialog] = useState<{ open: boolean; clientId?: string; editing?: ClientSite }>({ open: false });
  const [rateDialog, setRateDialog] = useState<{ open: boolean; clientId?: string; editing?: ClientRateRule }>({ open: false });
  const [deleteClientConfirm, setDeleteClientConfirm] = useState<Client | null>(null);
  const [deleteSiteConfirm, setDeleteSiteConfirm] = useState<ClientSite | null>(null);
  const [deleteRateConfirm, setDeleteRateConfirm] = useState<ClientRateRule | null>(null);
  const [resourceDialog, setResourceDialog] = useState<{ open: boolean; ruleId?: string; editing?: ClientRateRuleResource }>({ open: false });
  const [deleteResourceConfirm, setDeleteResourceConfirm] = useState<ClientRateRuleResource | null>(null);

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['clients', companyId],
    queryFn: () => clientsService.list({ companyId, page: 1, limit: 200 }),
    enabled: !!companyId,
  });
  const clients = clientsData?.data ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ['clients', companyId] });

  const createClientMutation = useMutation({
    mutationFn: (data: ClientFormData) => clientsService.create({ companyId, ...data } as any),
    onSuccess: () => { invalidate(); setClientDialog({ open: false }); toast({ title: language === 'es' ? 'Cliente creado' : 'Client created' }); },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Error', description: e.response?.data?.message }),
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientFormData }) => clientsService.update(id, data),
    onSuccess: () => { invalidate(); setClientDialog({ open: false }); toast({ title: language === 'es' ? 'Cliente actualizado' : 'Client updated' }); },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Error', description: e.response?.data?.message }),
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id: string) => clientsService.delete(id),
    onSuccess: () => { invalidate(); setDeleteClientConfirm(null); toast({ title: language === 'es' ? 'Cliente eliminado' : 'Client deleted' }); },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Error', description: e.response?.data?.message }),
  });

  const pinClientMutation = useMutation({
    mutationFn: ({ id, isDefault }: { id: string; isDefault: boolean }) => clientsService.update(id, { isDefault }),
    onSuccess: () => invalidate(),
    onError: (e: any) => toast({ variant: 'destructive', title: 'Error', description: e.response?.data?.message }),
  });

  const pinSiteMutation = useMutation({
    mutationFn: ({ id, isDefault }: { id: string; isDefault: boolean }) => clientsService.updateSite(id, { isDefault }),
    onSuccess: () => invalidate(),
    onError: (e: any) => toast({ variant: 'destructive', title: 'Error', description: e.response?.data?.message }),
  });

  const createSiteMutation = useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: SiteFormData }) => clientsService.createSite(clientId, data as any),
    onSuccess: () => { invalidate(); setSiteDialog({ open: false }); toast({ title: language === 'es' ? 'Sede creada' : 'Site created' }); },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Error', description: e.response?.data?.message }),
  });

  const updateSiteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SiteFormData }) => clientsService.updateSite(id, data),
    onSuccess: () => { invalidate(); setSiteDialog({ open: false }); toast({ title: language === 'es' ? 'Sede actualizada' : 'Site updated' }); },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Error', description: e.response?.data?.message }),
  });

  const deleteSiteMutation = useMutation({
    mutationFn: (id: string) => clientsService.deleteSite(id),
    onSuccess: () => { invalidate(); setDeleteSiteConfirm(null); toast({ title: language === 'es' ? 'Sede eliminada' : 'Site deleted' }); },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Error', description: e.response?.data?.message }),
  });

  const createRateMutation = useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: RateFormData }) =>
      clientsService.createRateRule(clientId, { ...data, baseRatePerHour: data.baseRatePerHour ?? null, overtimeRatePerHour: Number(data.overtimeRatePerHour) } as any),
    onSuccess: () => { invalidate(); setRateDialog({ open: false }); toast({ title: language === 'es' ? 'Tarifa creada' : 'Rate created' }); },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Error', description: e.response?.data?.message }),
  });

  const updateRateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RateFormData }) =>
      clientsService.updateRateRule(id, { ...data, baseRatePerHour: data.baseRatePerHour ?? null, overtimeRatePerHour: Number(data.overtimeRatePerHour) }),
    onSuccess: () => { invalidate(); setRateDialog({ open: false }); toast({ title: language === 'es' ? 'Tarifa actualizada' : 'Rate updated' }); },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Error', description: e.response?.data?.message }),
  });

  const deleteRateMutation = useMutation({
    mutationFn: (id: string) => clientsService.deleteRateRule(id),
    onSuccess: () => { invalidate(); setDeleteRateConfirm(null); toast({ title: language === 'es' ? 'Tarifa eliminada' : 'Rate deleted' }); },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Error', description: e.response?.data?.message }),
  });

  const createResourceMutation = useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; data: ResourceFormData }) =>
      clientsService.createResource(ruleId, { ...data, baseRatePerHour: Number(data.baseRatePerHour) } as any),
    onSuccess: () => { invalidate(); setResourceDialog({ open: false }); toast({ title: language === 'es' ? 'Recurso creado' : 'Resource created' }); },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Error', description: e.response?.data?.message }),
  });

  const updateResourceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResourceFormData }) =>
      clientsService.updateResource(id, { ...data, baseRatePerHour: Number(data.baseRatePerHour) }),
    onSuccess: () => { invalidate(); setResourceDialog({ open: false }); toast({ title: language === 'es' ? 'Recurso actualizado' : 'Resource updated' }); },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Error', description: e.response?.data?.message }),
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (id: string) => clientsService.deleteResource(id),
    onSuccess: () => { invalidate(); setDeleteResourceConfirm(null); toast({ title: language === 'es' ? 'Recurso eliminado' : 'Resource deleted' }); },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Error', description: e.response?.data?.message }),
  });

  const clientForm = useForm<ClientFormData>({ resolver: zodResolver(clientSchema), defaultValues: { name: '', taxId: '', email: '', phone: '', address: '', notes: '', isActive: true } });
  const siteForm = useForm<SiteFormData>({ resolver: zodResolver(siteSchema), defaultValues: { name: '', city: '', address: '', notes: '', isActive: true } });
  const rateForm = useForm<RateFormData>({ resolver: zodResolver(rateSchema), defaultValues: { name: '', baseRatePerHour: undefined, overtimeRatePerHour: 0, currency: 'EUR', overtimeTriggers: ['WEEKEND'], workdays: [1,2,3,4,5,6], isActive: true, effectiveFrom: format(new Date(), 'yyyy-MM-dd'), effectiveTo: '' } });
  const resourceForm = useForm<ResourceFormData>({ resolver: zodResolver(resourceSchema), defaultValues: { name: '', baseRatePerHour: 0, isActive: true } });

  const openClientDialog = (editing?: Client) => {
    if (editing) {
      clientForm.reset({ name: editing.name, taxId: editing.taxId ?? '', email: editing.email ?? '', phone: editing.phone ?? '', address: editing.address ?? '', notes: editing.notes ?? '', isActive: editing.isActive });
    } else {
      clientForm.reset({ name: '', taxId: '', email: '', phone: '', address: '', notes: '', isActive: true });
    }
    setClientDialog({ open: true, editing });
  };

  const openSiteDialog = (clientId: string, editing?: ClientSite) => {
    if (editing) {
      siteForm.reset({ name: editing.name, city: editing.city ?? '', address: editing.address ?? '', notes: editing.notes ?? '', isActive: editing.isActive });
    } else {
      siteForm.reset({ name: '', city: '', address: '', notes: '', isActive: true });
    }
    setSiteDialog({ open: true, clientId, editing });
  };

  const openRateDialog = (clientId: string, editing?: ClientRateRule) => {
    if (editing) {
      rateForm.reset({
        name: editing.name,
        baseRatePerHour: editing.baseRatePerHour != null ? Number(editing.baseRatePerHour) : undefined,
        overtimeRatePerHour: Number(editing.overtimeRatePerHour),
        currency: editing.currency,
        overtimeTriggers: editing.overtimeTriggers as OvertimeTrigger[],
        workdayStartTime: editing.workdayStartTime ?? '',
        workdayEndTime: editing.workdayEndTime ?? '',
        workdays: editing.workdays,
        isActive: editing.isActive,
        effectiveFrom: editing.effectiveFrom ? format(new Date(editing.effectiveFrom), 'yyyy-MM-dd') : '',
        effectiveTo: editing.effectiveTo ? format(new Date(editing.effectiveTo), 'yyyy-MM-dd') : '',
      });
    } else {
      rateForm.reset({ name: '', baseRatePerHour: undefined, overtimeRatePerHour: 0, currency: 'EUR', overtimeTriggers: ['WEEKEND'], workdays: [1,2,3,4,5,6], isActive: true, effectiveFrom: format(new Date(), 'yyyy-MM-dd'), effectiveTo: '' });
    }
    setRateDialog({ open: true, clientId, editing });
  };

  const openResourceDialog = (ruleId: string, editing?: ClientRateRuleResource) => {
    if (editing) {
      resourceForm.reset({ name: editing.name, baseRatePerHour: Number(editing.baseRatePerHour), isActive: editing.isActive });
    } else {
      resourceForm.reset({ name: '', baseRatePerHour: 0, isActive: true });
    }
    setResourceDialog({ open: true, ruleId, editing });
  };

  const onClientSubmit = (data: ClientFormData) => {
    if (clientDialog.editing) {
      updateClientMutation.mutate({ id: clientDialog.editing.id, data });
    } else {
      createClientMutation.mutate(data);
    }
  };

  const onSiteSubmit = (data: SiteFormData) => {
    if (siteDialog.editing) {
      updateSiteMutation.mutate({ id: siteDialog.editing.id, data });
    } else if (siteDialog.clientId) {
      createSiteMutation.mutate({ clientId: siteDialog.clientId, data });
    }
  };

  const onRateSubmit = (data: RateFormData) => {
    if (rateDialog.editing) {
      updateRateMutation.mutate({ id: rateDialog.editing.id, data });
    } else if (rateDialog.clientId) {
      createRateMutation.mutate({ clientId: rateDialog.clientId, data });
    }
  };

  const onResourceSubmit = (data: ResourceFormData) => {
    if (resourceDialog.editing) {
      updateResourceMutation.mutate({ id: resourceDialog.editing.id, data });
    } else if (resourceDialog.ruleId) {
      createResourceMutation.mutate({ ruleId: resourceDialog.ruleId, data });
    }
  };

  if (!companyId) {
    return (
      <DashboardLayout>
        <Card><CardContent className="py-16 text-center"><Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">{t.timeTracker.selectCompany}</p></CardContent></Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-4xl mx-auto pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              {tc.title}
            </h1>
            {selectedCompany && <p className="text-sm text-muted-foreground mt-0.5">{selectedCompany.name}</p>}
          </div>
          {canManage && (
            <Button onClick={() => openClientDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              {tc.newClient}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : clients.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-30" />
              <p className="font-medium text-muted-foreground">{tc.noClients}</p>
              <p className="text-sm text-muted-foreground mt-1">{tc.noClientsHint}</p>
              {canManage && <Button className="mt-4 gap-2" onClick={() => openClientDialog()}><Plus className="h-4 w-4" />{tc.newClient}</Button>}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {clients.map(client => (
              <Collapsible
                key={client.id}
                open={expandedClient === client.id}
                onOpenChange={open => setExpandedClient(open ? client.id : null)}
              >
                <Card className={cn(!client.isActive && 'opacity-60')}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-accent/30 transition-colors rounded-xl pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-base">{client.name}</CardTitle>
                              {client.isDefault && <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{language === 'es' ? 'Predeterminado' : 'Default'}</Badge>}
                              {!client.isActive && <Badge variant="secondary" className="text-[10px]">{tc.inactive}</Badge>}
                              {client.taxId && <span className="text-xs text-muted-foreground">{client.taxId}</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                              {client.sites.length > 0 && (
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{client.sites.length} {language === 'es' ? 'sedes' : 'sites'}</span>
                              )}
                              {client.rateRules.length > 0 && (
                                <span className="flex items-center gap-1"><Euro className="h-3 w-3" />{client.rateRules.length} {language === 'es' ? 'tarifas' : 'rates'}</span>
                              )}
                              {client._count && client._count.timeEntries > 0 && (
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{client._count.timeEntries} {tc.totalEntries}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {canManage && (<>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title={client.isDefault ? (language === 'es' ? 'Quitar predeterminado' : 'Remove default') : (language === 'es' ? 'Establecer predeterminado' : 'Set as default')} onClick={e => { e.stopPropagation(); pinClientMutation.mutate({ id: client.id, isDefault: !client.isDefault }); }}>
                              <Pin className={cn('h-3.5 w-3.5', client.isDefault ? 'fill-primary text-primary' : 'text-muted-foreground')} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); openClientDialog(client); }}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); setDeleteClientConfirm(client); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                          </>)}
                          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expandedClient === client.id && 'rotate-180')} />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4">
                      <Tabs defaultValue="sites">
                        <TabsList className="mb-3">
                          <TabsTrigger value="sites" className="gap-1.5"><MapPin className="h-3.5 w-3.5" />{tc.sites}</TabsTrigger>
                          <TabsTrigger value="rates" className="gap-1.5"><Euro className="h-3.5 w-3.5" />{tc.rateRules}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="sites" className="space-y-2">
                          {canManage && (
                            <div className="flex justify-end">
                              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => openSiteDialog(client.id)}>
                                <Plus className="h-3.5 w-3.5" />{tc.newSite}
                              </Button>
                            </div>
                          )}
                          {client.sites.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">{language === 'es' ? 'Sin sedes todavía' : 'No sites yet'}</p>
                          ) : (
                            <div className="space-y-1.5">
                              {client.sites.map(site => (
                                <div key={site.id} className={cn('flex items-center justify-between rounded-lg border px-3 py-2.5 bg-muted/20', !site.isActive && 'opacity-50')}>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                      <span className="text-sm font-medium">{site.name}</span>
                                      {site.isDefault && <Badge className="text-[10px] py-0 bg-primary/10 text-primary border-primary/20">{language === 'es' ? 'Predeterminada' : 'Default'}</Badge>}
                                      {!site.isActive && <Badge variant="secondary" className="text-[10px] py-0">{tc.inactive}</Badge>}
                                    </div>
                                    {site.city && <p className="text-xs text-muted-foreground ml-5">{site.city}</p>}
                                  </div>
                                  {canManage && (
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="icon" className="h-7 w-7" title={site.isDefault ? (language === 'es' ? 'Quitar predeterminada' : 'Remove default') : (language === 'es' ? 'Establecer predeterminada' : 'Set as default')} onClick={() => pinSiteMutation.mutate({ id: site.id, isDefault: !site.isDefault })}>
                                        <Pin className={cn('h-3 w-3', site.isDefault ? 'fill-primary text-primary' : 'text-muted-foreground')} />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openSiteDialog(client.id, site)}><Pencil className="h-3 w-3" /></Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteSiteConfirm(site)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="rates" className="space-y-2">
                          {canManage && (
                            <div className="flex justify-end">
                              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => openRateDialog(client.id)}>
                                <Plus className="h-3.5 w-3.5" />{tc.newRate}
                              </Button>
                            </div>
                          )}
                          {client.rateRules.length === 0 ? (
                            <div className="text-center py-6 space-y-2">
                              <Euro className="h-8 w-8 mx-auto text-muted-foreground opacity-30" />
                              <p className="text-sm text-muted-foreground">{language === 'es' ? 'Sin tarifas todavía' : 'No rates yet'}</p>
                              <p className="text-xs text-muted-foreground">{language === 'es' ? 'Crea una tarifa para poder añadir recursos (personas) con su precio/hora.' : 'Create a rate to add resources (people) with their hourly price.'}</p>
                              {canManage && (
                                <Button variant="outline" size="sm" className="gap-1.5 mt-1" onClick={() => openRateDialog(client.id)}>
                                  <Plus className="h-3.5 w-3.5" />{tc.newRate}
                                </Button>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {client.rateRules.map(rule => (
                                <div key={rule.id} className={cn('rounded-lg border bg-muted/20', !rule.isActive && 'opacity-50')}>
                                  <div className="flex items-start justify-between px-3 py-2.5">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium">{rule.name}</span>
                                        {!rule.isActive && <Badge variant="secondary" className="text-[10px] py-0">{tc.inactive}</Badge>}
                                      </div>
                                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                                        {rule.baseRatePerHour != null && (
                                          <span className="text-foreground font-semibold">{Number(rule.baseRatePerHour).toFixed(2)}{rule.currency}/h</span>
                                        )}
                                        <span className="text-orange-600 dark:text-orange-400 font-semibold">{Number(rule.overtimeRatePerHour).toFixed(2)}{rule.currency}/h {language === 'es' ? 'extra' : 'overtime'}</span>
                                        {rule.overtimeTriggers.length > 0 && (
                                          <span>· {rule.overtimeTriggers.map(t => t === 'WEEKEND' ? (language === 'es' ? 'fin de semana' : 'weekend') : t === 'AFTER_HOURS' ? (language === 'es' ? 'fuera de horario' : 'after hours') : (language === 'es' ? 'manual' : 'manual')).join(', ')}</span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-muted-foreground mt-0.5">
                                        {language === 'es' ? 'Desde' : 'From'}: {format(new Date(rule.effectiveFrom), 'dd/MM/yyyy')}
                                        {rule.effectiveTo ? ` → ${format(new Date(rule.effectiveTo), 'dd/MM/yyyy')}` : ''}
                                      </p>
                                    </div>
                                    {canManage && (
                                      <div className="flex gap-1 shrink-0 ml-2">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openRateDialog(client.id, rule)}><Pencil className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteRateConfirm(rule)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                                      </div>
                                    )}
                                  </div>
                                  {rule.resources && rule.resources.length > 0 && (
                                    <div className="px-3 pb-1 space-y-0.5 border-t pt-1.5">
                                      {rule.resources.map(r => (
                                        <div key={r.id} className={cn('flex items-center justify-between rounded-md px-2 py-1 hover:bg-accent/40 transition-colors', !r.isActive && 'opacity-50')}>
                                          <div className="flex items-center gap-2">
                                            <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                                            <span className="text-xs font-medium">{r.name}</span>
                                            <span className="text-xs text-foreground font-semibold">{Number(r.baseRatePerHour).toFixed(2)}{rule.currency}/h</span>
                                            {!r.isActive && <Badge variant="secondary" className="text-[10px] py-0">{tc.inactive}</Badge>}
                                          </div>
                                          {canManage && (
                                            <div className="flex gap-0.5">
                                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openResourceDialog(rule.id, r)}><Pencil className="h-2.5 w-2.5" /></Button>
                                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteResourceConfirm(r)}><Trash2 className="h-2.5 w-2.5 text-destructive" /></Button>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {canManage && (
                                    <div className="px-3 pb-3 pt-1 border-t">
                                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 w-full" onClick={() => openResourceDialog(rule.id)}>
                                        <Plus className="h-3 w-3" />
                                        {language === 'es' ? 'Añadir recurso' : 'Add resource'}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </div>

      {/* client dialog */}
      <Dialog open={clientDialog.open} onOpenChange={open => !open && setClientDialog({ open: false })}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{clientDialog.editing ? tc.editClient : tc.newClient}</DialogTitle></DialogHeader>
          <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{tc.name} *</Label>
              <Input placeholder={tc.namePlaceholder} {...clientForm.register('name')} />
              {clientForm.formState.errors.name && <p className="text-xs text-destructive">{clientForm.formState.errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{tc.taxId}</Label>
                <Input placeholder={tc.taxIdPlaceholder} {...clientForm.register('taxId')} />
              </div>
              <div className="space-y-1.5">
                <Label>{tc.phone}</Label>
                <Input placeholder={tc.phonePlaceholder} {...clientForm.register('phone')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{tc.email}</Label>
              <Input type="email" placeholder={tc.emailPlaceholder} {...clientForm.register('email')} />
              {clientForm.formState.errors.email && <p className="text-xs text-destructive">{clientForm.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{tc.address}</Label>
              <Input {...clientForm.register('address')} />
            </div>
            <div className="space-y-1.5">
              <Label>{tc.notes}</Label>
              <Textarea rows={2} className="resize-none" {...clientForm.register('notes')} />
            </div>
            <div className="flex items-center gap-2">
              <Controller name="isActive" control={clientForm.control} render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )} />
              <Label>{tc.isActive}</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setClientDialog({ open: false })}>{tc.cancel}</Button>
              <Button type="submit" disabled={createClientMutation.isPending || updateClientMutation.isPending}>
                {(createClientMutation.isPending || updateClientMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tc.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* site dialog */}
      <Dialog open={siteDialog.open} onOpenChange={open => !open && setSiteDialog({ open: false })}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{siteDialog.editing ? tc.editSite : tc.newSite}</DialogTitle></DialogHeader>
          <form onSubmit={siteForm.handleSubmit(onSiteSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{tc.siteName} *</Label>
              <Input placeholder={tc.siteNamePlaceholder} {...siteForm.register('name')} />
              {siteForm.formState.errors.name && <p className="text-xs text-destructive">{siteForm.formState.errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{tc.siteCity}</Label>
                <Input {...siteForm.register('city')} />
              </div>
              <div className="space-y-1.5">
                <Label>{tc.siteAddress}</Label>
                <Input {...siteForm.register('address')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{tc.notes}</Label>
              <Textarea rows={2} className="resize-none" {...siteForm.register('notes')} />
            </div>
            <div className="flex items-center gap-2">
              <Controller name="isActive" control={siteForm.control} render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )} />
              <Label>{tc.isActive}</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSiteDialog({ open: false })}>{tc.cancel}</Button>
              <Button type="submit" disabled={createSiteMutation.isPending || updateSiteMutation.isPending}>
                {(createSiteMutation.isPending || updateSiteMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tc.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* rate dialog */}
      <Dialog open={rateDialog.open} onOpenChange={open => !open && setRateDialog({ open: false })}>
        <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>{rateDialog.editing ? tc.editRate : tc.newRate}</DialogTitle></DialogHeader>
          <form onSubmit={rateForm.handleSubmit(onRateSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{tc.rateName} *</Label>
              <Input placeholder={tc.rateNamePlaceholder} {...rateForm.register('name')} />
              {rateForm.formState.errors.name && <p className="text-xs text-destructive">{rateForm.formState.errors.name.message as string}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{tc.baseRate} <span className="text-muted-foreground text-xs">({language === 'es' ? 'opcional' : 'optional'})</span></Label>
                <Input type="number" step="0.01" min="0" placeholder="0.00" {...rateForm.register('baseRatePerHour', { setValueAs: v => (v === '' || v === null || v === undefined || isNaN(Number(v))) ? null : Number(v) })} />
                {rateForm.formState.errors.baseRatePerHour && <p className="text-xs text-destructive">{rateForm.formState.errors.baseRatePerHour.message as string}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{tc.overtimeRate} *</Label>
                <Input type="number" step="0.01" min="0" {...rateForm.register('overtimeRatePerHour', { valueAsNumber: true })} />
                {rateForm.formState.errors.overtimeRatePerHour && <p className="text-xs text-destructive">{rateForm.formState.errors.overtimeRatePerHour.message as string}</p>}
              </div>
            </div>

            {/* Overtime triggers */}
            <div className="space-y-2">
              <Label>{tc.overtimeTriggers}</Label>
              <Controller name="overtimeTriggers" control={rateForm.control} render={({ field }) => (
                <div className="flex flex-wrap gap-3">
                  {(['WEEKEND', 'MANUAL'] as OvertimeTrigger[]).map(trigger => {
                    const label = trigger === 'WEEKEND' ? tc.triggerWeekend : tc.triggerManual;
                    const checked = field.value.includes(trigger);
                    return (
                      <label key={trigger} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={v => {
                            if (v) { field.onChange([...field.value, trigger]); }
                            else { field.onChange(field.value.filter(t => t !== trigger)); }
                          }}
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    );
                  })}
                </div>
              )} />
              <div className="space-y-0.5 mt-1">
                {rateForm.watch('overtimeTriggers').includes('WEEKEND') && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="text-orange-500">⚡</span>
                    {language === 'es' ? 'Sábado y domingo se marcan automáticamente como hora extra.' : 'Saturday and Sunday are automatically marked as overtime.'}
                  </p>
                )}
                {rateForm.watch('overtimeTriggers').includes('MANUAL') && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>✋</span>
                    {language === 'es' ? 'El empleado (o el responsable) puede marcar manualmente una entrada como hora extra.' : 'The employee (or manager) can manually flag any entry as overtime.'}
                  </p>
                )}
              </div>
            </div>

            {/* Effective dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{tc.effectiveFrom} *</Label>
                <Input type="date" {...rateForm.register('effectiveFrom')} />
                {rateForm.formState.errors.effectiveFrom && <p className="text-xs text-destructive">{rateForm.formState.errors.effectiveFrom.message as string}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{tc.effectiveTo} <span className="text-muted-foreground text-xs">({tc.noEndDate})</span></Label>
                <Input type="date" {...rateForm.register('effectiveTo')} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Controller name="isActive" control={rateForm.control} render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )} />
              <Label>{tc.isActive}</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRateDialog({ open: false })}>{tc.cancel}</Button>
              <Button type="submit" disabled={createRateMutation.isPending || updateRateMutation.isPending}>
                {(createRateMutation.isPending || updateRateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tc.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* resource dialog */}
      <Dialog open={resourceDialog.open} onOpenChange={open => !open && setResourceDialog({ open: false })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {resourceDialog.editing
                ? (language === 'es' ? 'Editar recurso' : 'Edit resource')
                : (language === 'es' ? 'Nuevo recurso' : 'New resource')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={resourceForm.handleSubmit(onResourceSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{language === 'es' ? 'Nombre del recurso' : 'Resource name'} *</Label>
              <Input
                placeholder={language === 'es' ? 'ej. Desarrollador Senior' : 'e.g. Senior Developer'}
                {...resourceForm.register('name')}
              />
              {resourceForm.formState.errors.name && (
                <p className="text-xs text-destructive">{resourceForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{language === 'es' ? 'Precio por hora (€)' : 'Hourly rate (€)'} *</Label>
              <Input
                type="number" step="0.01" min="0"
                {...resourceForm.register('baseRatePerHour', { valueAsNumber: true })}
              />
              {resourceForm.formState.errors.baseRatePerHour && (
                <p className="text-xs text-destructive">{resourceForm.formState.errors.baseRatePerHour.message as string}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Controller name="isActive" control={resourceForm.control} render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )} />
              <Label>{tc.isActive}</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResourceDialog({ open: false })}>{tc.cancel}</Button>
              <Button type="submit" disabled={createResourceMutation.isPending || updateResourceMutation.isPending}>
                {(createResourceMutation.isPending || updateResourceMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tc.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* delete dialogs */}
      <AlertDialog open={!!deleteClientConfirm} onOpenChange={() => setDeleteClientConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tc.deleteClient}</AlertDialogTitle>
            <AlertDialogDescription>{tc.deleteClientConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteClientConfirm && deleteClientMutation.mutate(deleteClientConfirm.id)}
            >
              {deleteClientMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tc.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteSiteConfirm} onOpenChange={() => setDeleteSiteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tc.deleteSite}</AlertDialogTitle>
            <AlertDialogDescription>{language === 'es' ? '¿Seguro que quieres eliminar esta sede?' : 'Are you sure you want to delete this site?'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteSiteConfirm && deleteSiteMutation.mutate(deleteSiteConfirm.id)}
            >
              {deleteSiteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tc.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteRateConfirm} onOpenChange={() => setDeleteRateConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tc.deleteRate}</AlertDialogTitle>
            <AlertDialogDescription>{language === 'es' ? '¿Seguro que quieres eliminar esta tarifa?' : 'Are you sure you want to delete this rate rule?'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteRateConfirm && deleteRateMutation.mutate(deleteRateConfirm.id)}
            >
              {deleteRateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tc.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteResourceConfirm} onOpenChange={() => setDeleteResourceConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'es' ? 'Eliminar recurso' : 'Delete resource'}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'es' ? '¿Seguro que quieres eliminar este recurso?' : 'Are you sure you want to delete this resource?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteResourceConfirm && deleteResourceMutation.mutate(deleteResourceConfirm.id)}
            >
              {deleteResourceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tc.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

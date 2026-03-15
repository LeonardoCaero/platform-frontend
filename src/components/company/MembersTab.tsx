import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/StatusBadge';
import { InviteMemberModal } from '@/components/company/InviteMemberModal';
import { CompanyMember } from '@/types/company.types';
import { Users, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MembersTabProps {
  companyId: string;
  members: CompanyMember[] | undefined;
  isLoading: boolean;
  canInvite?: boolean;
}

export function MembersTab({ companyId, members, isLoading, canInvite = false }: MembersTabProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const { t, language } = useLanguage();
  const tm = t.membersTab;

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">{tm.title}</h3>
        {canInvite && (
          <Button onClick={() => setInviteOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {tm.invite}
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : !members?.length ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Users className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">{tm.noMembers}</p>
              {canInvite && (
                <Button onClick={() => setInviteOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {tm.inviteFirst}
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tm.colMember}</TableHead>
                  <TableHead>{tm.colRoles}</TableHead>
                  <TableHead>{tm.colPosition}</TableHead>
                  <TableHead>{tm.colStatus}</TableHead>
                  <TableHead>{tm.colJoined}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.user.avatarUrl || undefined} />
                          <AvatarFallback>
                            {getInitials(member.user.firstName, member.user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.user.firstName} {member.user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {member.roles.map((role) => (
                          <span
                            key={role.id}
                            className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-primary/10 text-primary"
                          >
                            {role.name}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.position || member.department ? (
                        <div>
                          {member.position && <p>{member.position}</p>}
                          {member.department && (
                            <p className="text-sm text-muted-foreground">{member.department}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={member.status} />
                    </TableCell>
                    <TableCell>
                      {member.activatedAt
                        ? new Date(member.activatedAt).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')
                        : tm.pending}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <InviteMemberModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        companyId={companyId}
      />
    </div>
  );
}

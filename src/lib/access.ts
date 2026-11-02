import { useMemo } from 'react';
import { useCRM } from '@/store/crm';
import { useSession, type PermKey } from '@/store/session';
import type { Rep, Role } from '@/types';

/** The persona currently using the app. */
export function useViewer(): Rep {
  const id = useSession((s) => s.viewAs);
  return useCRM((s) => s.reps.find((r) => r.id === id) ?? s.reps[0]!);
}

export function canRole(role: Role, key: PermKey, matrix = useSession.getState().matrix) {
  return role === 'Admin' || !!matrix[role]?.[key];
}

/** Permission check bound to the current viewer and the live permission matrix. */
export function useCan() {
  const role = useViewer().role;
  const matrix = useSession((s) => s.matrix);
  return (key: PermKey) => canRole(role, key, matrix);
}

export const ROLE_TONE: Record<Role, 'brand' | 'violet' | 'success' | 'warning'> = { Admin: 'brand', 'Sales Manager': 'violet', 'Account Executive': 'success', SDR: 'warning' };
export const ROLE_SHORT: Record<Role, string> = { Admin: 'Admin', 'Sales Manager': 'Manager', 'Account Executive': 'AE', SDR: 'SDR' };

/** Which areas of the app each role can open. */
export function useNavAccess() {
  const role = useViewer().role;
  const can = useCan();
  return {
    '/': true,
    '/leads': true,
    '/pipeline': role !== 'SDR',
    '/contacts': true,
    '/companies': role !== 'SDR',
    '/calls': true,
    '/tasks': true,
    '/whatsapp': true,
    '/team': role !== 'SDR',
    '/reports': can('teamReports'),
    '/settings': true,
  } as Record<string, boolean>;
}

/**
 * Role-scoped view of the CRM data:
 * Admin → everything · Manager → their team · AE / SDR → their own book.
 * SDRs and managers also see the unassigned lead pool.
 */
export function useScope() {
  const viewer = useViewer();
  const can = useCan();
  const s = useCRM();
  const viewAll = can('viewAllLeads');
  return useMemo(() => {
    const role = viewer.role;
    const admin = role === 'Admin';
    const teamReps = admin
      ? s.reps
      : role === 'Sales Manager'
        ? s.reps.filter((r) => r.id === viewer.id || r.managerId === viewer.id || (r.team === viewer.team && r.role !== 'Admin'))
        : [viewer];
    const ids = new Set(teamReps.map((r) => r.id));
    const leads = admin || viewAll ? s.leads : s.leads.filter((l) => (l.ownerId ? ids.has(l.ownerId) : role !== 'Account Executive'));
    const deals = admin ? s.deals : s.deals.filter((d) => ids.has(d.ownerId));
    const dealContacts = new Set(deals.map((d) => d.contactId));
    const contacts = admin ? s.contacts : s.contacts.filter((c) => ids.has(c.ownerId) || dealContacts.has(c.id));
    const coIds = new Set([...deals.map((d) => d.companyId), ...contacts.map((c) => c.companyId)]);
    const companies = admin ? s.companies : s.companies.filter((c) => ids.has(c.ownerId) || coIds.has(c.id));
    const refIds = new Set([...leads.map((l) => l.id), ...contacts.map((c) => c.id)]);
    const calls = admin ? s.calls : s.calls.filter((c) => ids.has(c.repId));
    const tasks = admin ? s.tasks : s.tasks.filter((t) => ids.has(t.ownerId));
    const activities = admin ? s.activities : s.activities.filter((a) => ids.has(a.repId) || refIds.has(a.ref.id));
    // Leaderboards: managers see their team; reps compete with peers on the same team.
    const peers = admin || role === 'Sales Manager' ? teamReps : s.reps.filter((r) => r.team === viewer.team && r.role !== 'Admin');
    return { viewer, role, admin, repIds: ids, teamReps, peers, leads, deals, contacts, companies, calls, tasks, activities, refIds };
  }, [viewer, viewAll, s.reps, s.leads, s.deals, s.contacts, s.companies, s.calls, s.tasks, s.activities]);
}

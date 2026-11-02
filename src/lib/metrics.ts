import type { Call, Deal, Lead, Rep } from '@/types';
import { QUARTER_START } from '@/data/seed';
import { DAY, startOfDay, sum } from './utils';

export interface RepStats {
  rep: Rep;
  revenue: number;
  attainment: number;
  pipeline: number;
  won: number;
  lost: number;
  winRate: number;
  calls7: number;
  calls30: number;
  connected30: number;
  connectRate: number;
  talk30: number;
  meetings30: number;
  leads: number;
  avgDeal: number;
  callsByDay: number[];
}

export function repStats(rep: Rep, deals: Deal[], calls: Call[], leads: Lead[]): RepStats {
  const now = Date.now();
  const mine = deals.filter((d) => d.ownerId === rep.id);
  const wonQ = mine.filter((d) => d.stage === 'Closed Won' && d.closeDate >= QUARTER_START);
  const lostQ = mine.filter((d) => d.stage === 'Closed Lost' && d.closeDate >= QUARTER_START);
  const c30 = calls.filter((c) => c.repId === rep.id && c.startedAt > now - 30 * DAY);
  const conn = c30.filter((c) => c.status === 'completed');
  const revenue = sum(wonQ, (d) => d.value);
  const callsByDay: number[] = [];
  for (let i = 13; i >= 0; i--) { const s = startOfDay() - i * DAY; callsByDay.push(c30.filter((c) => c.startedAt >= s && c.startedAt < s + DAY).length); }
  return {
    rep,
    revenue,
    attainment: rep.quota ? revenue / rep.quota : 0,
    pipeline: sum(mine.filter((d) => !d.stage.startsWith('Closed')), (d) => d.value),
    won: wonQ.length,
    lost: lostQ.length,
    winRate: wonQ.length + lostQ.length ? wonQ.length / (wonQ.length + lostQ.length) : 0,
    calls7: c30.filter((c) => c.startedAt > now - 7 * DAY).length,
    calls30: c30.length,
    connected30: conn.length,
    connectRate: c30.length ? conn.length / c30.length : 0,
    talk30: sum(conn, (c) => c.duration),
    meetings30: c30.filter((c) => c.disposition === 'Meeting booked').length,
    leads: leads.filter((l) => l.ownerId === rep.id).length,
    avgDeal: wonQ.length ? revenue / wonQ.length : 0,
    callsByDay,
  };
}

# leadVico — Sales CRM with Integrated Calling

A frontend-only prototype of an enterprise sales CRM, built for client presentations. Every screen works and shares the same mock dataset. Calls, stage changes, notes and tasks appear on the right timelines, dashboards and reports straight away.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static build in dist/ (deploys to any static host)
```

Live demo: https://demo.leadvico.com (deployed on Vercel from `main`).

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS · Zustand · Recharts · lucide-react. There is no backend. The data comes from a seeded generator (`src/data/seed.ts`), and its timestamps are set relative to the current time so the workspace always looks current. Reload the page to reset the demo.

## Modules

| Area | What you can do |
| --- | --- |
| **Dashboard** | KPIs with trends, revenue vs. target, pipeline by stage, today's agenda, hot leads you can call in one click, quota leaderboard, best-time-to-call heatmap, live activity stream |
| **Leads** | Saved views, search, multi-filter chips, sortable columns, inline status edits, bulk assign/status/sequence/export/delete, CSV import wizard, lead scoring |
| **Lead profile** | Header actions (call, email, follow-up, convert), score breakdown, Vico AI insights, activity timeline with note/email composer, call history with recording playback, tasks |
| **Pipeline** | Kanban with drag-and-drop between stages (undo, a celebration on Closed Won, a reason picker on Closed Lost), table view, deal drawer with a stage stepper and contact timeline |
| **Contacts / Companies** | Filterable tables and card grids, detail drawers with people, deals and timelines |
| **Calling** | Dialer with contact lookup, caller-ID selection, power dialer queue that auto-advances, call log with expandable notes, AI summaries and recordings, missed-call list, team availability with listen-in |
| **Softphone (global)** | Outbound and incoming calls, live timer, waveform, mute/hold/keypad/record/transfer, streaming live transcript with Vico AI prompts, minimise to a pill, wrap-up with disposition, AI summary and one-click follow-up |
| **Follow-ups** | Grouped task list (overdue/today/tomorrow/later), snooze/reschedule, week calendar with a "now" line |
| **Team** | Podium, rep cards with quota attainment, sortable leaderboard, rep drawer with activity chart, invite teammates |
| **Reports** | Sales performance, calling analytics, conversion funnel and source quality, forecast (commit/best case), CSV export |
| **Settings** | Profile, theme (light/dark/system), workspace currency (USD/EUR/GBP/INR, applied across the app), users and roles, permission matrix, pipeline stages, calling configuration, notifications, integrations |

Shortcuts: `⌘K` command palette · `L` new lead · `D` new deal · `T` new task · `C` calling.

## 5-minute demo script

1. **Dashboard.** Open with the greeting, pacing sentence and KPIs. Switch the date range and point out the heatmap.
2. **Leads → Hot.** Filter, then bulk-assign two leads. Open a lead profile and walk through the score breakdown and timeline.
3. Press **Call**. Let the transcript stream with Vico AI prompts, toggle hold and record, then **End call**. In wrap-up, pick an outcome and keep "Schedule follow-up" on, then save. The call, recording and task appear on the timeline immediately.
4. **⌘K → "Simulate incoming call"**, then answer it.
5. **Pipeline.** Drag a deal to *Closed Won* to trigger the celebration, open the deal drawer, and try Undo from the toast.
6. **Calling → Start dialing.** Show the power dialer moving to the next lead after each wrap-up.
7. **Team / Reports / Settings.** Show the leaderboard, forecast and loss reasons, then switch the currency to INR and the theme to dark.

## Architecture

```
src/
  data/seed.ts          deterministic, interconnected mock data
  store/                crm (entities + actions), phone (call state machine), ui, prefs (persisted)
  lib/                  formatting, time, metrics helpers
  components/ui/        design-system primitives (Button, Badge, Select, Modal, Drawer, Popover…)
  components/           shared domain components, Timeline, Softphone, global modals, layout
  pages/                one file per module
```

import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import Dashboard from '@/pages/Dashboard';
import Leads from '@/pages/Leads';
import LeadProfile from '@/pages/LeadProfile';
import Pipeline from '@/pages/Pipeline';
import Contacts from '@/pages/Contacts';
import Companies from '@/pages/Companies';
import Calls from '@/pages/Calls';
import Tasks from '@/pages/Tasks';
import Team from '@/pages/Team';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import WhatsAppInbox from '@/pages/WhatsApp';
import { useSession } from '@/store/session';

export default function App() {
  const viewAs = useSession((s) => s.viewAs);
  const signedIn = useSession((s) => s.signedIn);
  if (!signedIn) return <Login />;
  // Re-mount the workspace whenever the persona changes so every panel re-scopes.
  return (
    <HashRouter key={viewAs}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/:id" element={<LeadProfile />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="companies" element={<Companies />} />
          <Route path="calls" element={<Calls />} />
          <Route path="whatsapp" element={<WhatsAppInbox />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="team" element={<Team />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

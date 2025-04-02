import { Switch, Route } from "wouter";
import LandingPage from "@/pages/landing";
import ScoreboardPage from "@/pages/scoreboard";
import AdminLayout from "@/pages/admin/index";
import AdminLogin from "@/pages/admin/login";
import NotFound from "@/pages/not-found";
import ScoreManagement from "@/pages/admin/score-management";
import MedalManagement from "@/pages/admin/medal-management";
import TeamManagement from "@/pages/admin/team-management";
import EventManagement from "@/pages/admin/event-management";
import PublishScores from "@/pages/admin/publish-scores";
import { AuthProvider } from "./lib/auth";

function App() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/scoreboard" component={ScoreboardPage} />
        <Route path="/admin/login" component={AdminLogin} />
        {/* Admin routes */}
        <Route path="/admin" component={() => <AdminLayout><ScoreManagement /></AdminLayout>} />
        <Route path="/admin/scores" component={() => <AdminLayout><ScoreManagement /></AdminLayout>} />
        <Route path="/admin/medals" component={() => <AdminLayout><MedalManagement /></AdminLayout>} />
        <Route path="/admin/teams" component={() => <AdminLayout><TeamManagement /></AdminLayout>} />
        <Route path="/admin/events" component={() => <AdminLayout><EventManagement /></AdminLayout>} />
        <Route path="/admin/publish" component={() => <AdminLayout><PublishScores /></AdminLayout>} />
        <Route component={NotFound} />
      </Switch>
    </AuthProvider>
  );
}

export default App;

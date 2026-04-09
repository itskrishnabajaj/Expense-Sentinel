import { Switch, Route, Router as WouterRouter } from 'wouter';
import { AppProvider } from './context/AppContext';
import { BottomNav } from './components/BottomNav';
import { InstallPrompt } from './components/InstallPrompt';
import { Home } from './pages/Home';
import { AddExpense } from './pages/AddExpense';
import { Insights } from './pages/Insights';
import { History } from './pages/History';
import { SettingsPage } from './pages/SettingsPage';

function AddExpenseRoute() {
  return <AddExpense />;
}

function Router() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-28">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/add" component={AddExpenseRoute} />
          <Route path="/insights" component={Insights} />
          <Route path="/history" component={History} />
          <Route path="/settings" component={SettingsPage} />
          <Route>
            <div className="flex items-center justify-center h-64 text-[#6B6B6B]">
              Page not found
            </div>
          </Route>
        </Switch>
      </div>
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Router />
      </WouterRouter>
    </AppProvider>
  );
}

export default App;

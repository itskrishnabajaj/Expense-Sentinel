import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { BottomNav } from './components/BottomNav';
import { InstallPrompt } from './components/InstallPrompt';
import { Home } from './pages/Home';
import { AddExpense } from './pages/AddExpense';
import { Insights } from './pages/Insights';
import { History } from './pages/History';
import { SettingsPage } from './pages/SettingsPage';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div className="h-full bg-[#0D0D0D] text-white flex flex-col">
      <main className="flex-1 scroll-native">
        <div className="max-w-lg mx-auto px-4 pt-8 pb-28">
          <div key={location.pathname} className="animate-fade-in">
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/add" element={<AddExpense />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={
                <div className="flex items-center justify-center h-64 text-[#6B6B6B]">
                  Page not found
                </div>
              } />
            </Routes>
          </div>
        </div>
      </main>
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}

function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';
  return (
    <AppProvider>
      <BrowserRouter basename={base}>
        <AnimatedRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;

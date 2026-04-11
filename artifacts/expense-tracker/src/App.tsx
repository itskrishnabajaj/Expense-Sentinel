import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { UndoProvider } from './context/UndoContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BottomNav } from './components/BottomNav';
import { InstallPrompt } from './components/InstallPrompt';
import { FAB } from './components/FAB';
import { Home } from './pages/Home';
import { AddExpense } from './pages/AddExpense';
import { Insights } from './pages/Insights';
import { History } from './pages/History';
import { SettingsPage } from './pages/SettingsPage';

function DBErrorScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4">
        <span className="text-3xl">⚠️</span>
      </div>
      <h2 className="text-lg font-semibold text-white mb-2">Storage unavailable</h2>
      <p className="text-sm text-[#6B6B6B] leading-relaxed">
        This app requires local storage access. If you're in private browsing mode, please switch to a regular window.
      </p>
    </div>
  );
}

function AnimatedRoutes() {
  const { dbUnavailable } = useApp();

  if (dbUnavailable) {
    return (
      <div className="h-full bg-[#0D0D0D] text-white flex flex-col">
        <main className="flex-1 scroll-native">
          <DBErrorScreen />
        </main>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#0D0D0D] text-white flex flex-col">
      <main className="flex-1 scroll-native safe-area-top">
        <div className="max-w-lg mx-auto px-4 pt-8 md:min-h-full" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
          <Routes>
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
      </main>
      <FAB />
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}

function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';
  return (
    <ErrorBoundary>
      <AppProvider>
        <UndoProvider>
          <BrowserRouter basename={base}>
            <AnimatedRoutes />
          </BrowserRouter>
        </UndoProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;

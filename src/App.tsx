import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { SplashScreen } from './components/SplashScreen';
import { LandingPage } from './pages/LandingPage';
import { TestPage } from './pages/TestPage';
import { ResultPage } from './pages/ResultPage';
import { HistoryPage } from './pages/HistoryPage';
import { DevicePage } from './pages/DevicePage';
import { BatchPage } from './pages/BatchPage';
import { LoginPage } from './pages/LoginPage';
import { ProducerDashboard } from './pages/ProducerDashboard';
import { AccountPage } from './pages/AccountPage';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen text-gray-900 flex flex-col">
          <SplashScreen />
          <Header />
          <div className="flex-1 pb-20 lg:pb-0">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/test" element={<TestPage />} />
              <Route path="/result" element={<ResultPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/device" element={<DevicePage />} />
              <Route path="/batch" element={<BatchPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <AccountPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/producer"
                element={
                  <ProtectedRoute role="producer">
                    <ProducerDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

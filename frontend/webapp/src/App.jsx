import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Production from './pages/Production';
import WorkOrders from './pages/WorkOrders';
import AIPrediction from './pages/AIPrediction';
import AlarmHistory from './pages/AlarmHistory';
import Statistics from './pages/Statistics';
import Equipment from './pages/Equipment';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="production" element={<Production />} />
              <Route path="work-orders" element={<WorkOrders />} />
              <Route path="ai-prediction" element={<AIPrediction />} />
              <Route path="alarm-history" element={<AlarmHistory />} />
              <Route path="statistics" element={<Statistics />} />
              <Route path="equipment" element={<Equipment />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

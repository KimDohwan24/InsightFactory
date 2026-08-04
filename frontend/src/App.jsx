import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import EdgePage from './pages/EdgePage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <Router>
      <nav className="main-nav">
        <NavLink
          to="/edge"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          현장 모니터링
        </NavLink>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          대시보드
        </NavLink>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/edge" replace />} />
          <Route path="/edge" element={<EdgePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function MainLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <div className="dashboard-layout">
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="nav-brand">
          <span className="brand-spike">✸</span>
          <span className="brand-name">InsightFactory</span>
          <span className="badge badge-coral" style={{ marginLeft: '12px' }}>MES Edition</span>
        </div>
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')} end>대시보드</NavLink>
          <NavLink to="/production" className={({ isActive }) => (isActive ? 'active' : '')}>생산 관리</NavLink>
          <NavLink to="/work-orders" className={({ isActive }) => (isActive ? 'active' : '')}>작업 지시</NavLink>
          <NavLink to="/ai-prediction" className={({ isActive }) => (isActive ? 'active' : '')}>AI 예측</NavLink>
          <NavLink to="/alarm-history" className={({ isActive }) => (isActive ? 'active' : '')}>알람 이력</NavLink>
          <NavLink to="/statistics" className={({ isActive }) => (isActive ? 'active' : '')}>통계</NavLink>
          <NavLink to="/equipment" className={({ isActive }) => (isActive ? 'active' : '')}>설비 관리</NavLink>
        </div>
        <div className="nav-user">
          <span className="admin-label">Admin Portal</span>
          <button 
            onClick={handleLogout} 
            className="category-tab" 
            style={{ marginLeft: '12px', padding: '6px 12px', fontSize: '13px' }}
          >
            로그아웃
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <Outlet />
    </div>
  );
}

export default MainLayout;

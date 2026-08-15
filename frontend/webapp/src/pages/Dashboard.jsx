import { useState, useEffect } from 'react';
import { fetchDashboardData } from '../api';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboardData();
      setData(result);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || (!data && !error)) {
    return (
      <main className="dashboard-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div>데이터를 불러오는 중입니다...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: 'var(--color-error)' }}>데이터를 불러오는데 실패했습니다.</div>
        <button className="btn-primary" onClick={loadData} style={{ marginTop: '16px' }}>다시 시도</button>
      </main>
    );
  }

  const achievementRate = data.currentProduction && data.productionGoal 
    ? ((data.currentProduction / data.productionGoal) * 100).toFixed(1) 
    : '0.0';

  const defectRate = data.currentProduction != null && data.defectCount != null
    ? ((data.defectCount / data.currentProduction) * 100).toFixed(2)
    : '-';

  return (
    <main className="dashboard-content">
      <header className="page-header">
        <h2>공장 전체 요약 (Dashboard)</h2>
        <p className="subtitle">InsightFactory Real-time System - Macro View</p>
      </header>

      <div className="dashboard-grid">
        {/* 1. 현재 생산량 & 불량률 */}
        <div className="card production-card">
          <h3 className="card-title">핵심 성과 지표 (KPIs)</h3>
          <div className="production-stats">
            <div className="stat-box">
              <span className="stat-label">현재 생산량</span>
              <span className="stat-value">{data.currentProduction?.toLocaleString() ?? '-'} <span className="unit">EA</span></span>
            </div>
            <div className="stat-box">
              <span className="stat-label">생산 목표</span>
              <span className="stat-value">{data.productionGoal?.toLocaleString() ?? '-'} <span className="unit">EA</span></span>
            </div>
            <div className="stat-box">
              <span className="stat-label">현재 불량률</span>
              <span className="stat-value" style={{ color: 'var(--color-error)' }}>{defectRate} <span className="unit">%</span></span>
            </div>
          </div>
          
          <div className="progress-container">
            <div className="progress-header">
              <span className="progress-label">전체 목표 달성률</span>
              <span className="progress-percent">{achievementRate}%</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${achievementRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 2. 설비 상태 요약 */}
        <div className="card-dark equipment-card">
          <h3 className="card-title">설비 가동 현황 요약</h3>
          <div className="equipment-list">
            {data.equipmentStatus.length > 0 ? (
              data.equipmentStatus.map((eq, idx) => (
                <div key={idx} className="equipment-item">
                  <div className="eq-info">
                    <span className={`status-dot ${eq.status}`}></span>
                    <span className="eq-line">{eq.line}</span>
                    <span className="badge" style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 6px' }}>{eq.product}</span>
                  </div>
                  <span className={`badge ${eq.active ? 'badge-success' : 'badge-error'}`}>
                    {eq.active ? 'Active' : 'Offline'}
                  </span>
                </div>
              ))
            ) : (
              <div className="equipment-item" style={{ justifyContent: 'center', color: 'var(--color-muted)' }}>
                등록된 설비가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 3. 최근 작업 (Work Orders) */}
        <div className="card ai-card">
          <h3 className="card-title">최근 작업 지시 (Work Orders)</h3>
          <table className="ai-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Product</th>
                <th>Status</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {data.recentWorkOrders.length > 0 ? data.recentWorkOrders.map((wo, idx) => (
                <tr key={idx}>
                  <td className="code-font">{wo.id}</td>
                  <td>{wo.product}</td>
                  <td>
                    <span className={`badge ${
                      wo.status === 'Completed' ? 'badge-success' : 
                      wo.status === 'In Progress' ? 'badge-coral' : ''
                    }`}>
                      {wo.status}
                    </span>
                  </td>
                  <td>
                    <div className="progress-bar-bg" style={{ height: '6px', width: '100px', display: 'inline-block', verticalAlign: 'middle' }}>
                      <div className="progress-bar-fill" style={{ width: `${wo.progress}%` }}></div>
                    </div>
                    <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--color-muted)' }}>{wo.progress}%</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--color-muted)' }}>최근 작업 내역이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. 최근 알람 */}
        <div className="card-dark alarm-card">
          <h3 className="card-title">최근 알람 (Recent Alarms)</h3>
          <div className="alarm-list">
            {data.recentAlarms.length > 0 ? data.recentAlarms.map(alarm => (
              <div key={alarm.id} className="alarm-item">
                <div className="alarm-header">
                  <span className={`badge ${alarm.level === 'error' ? 'badge-error' : 'badge-warning'}`}>
                    {alarm.type}
                  </span>
                  <span className="alarm-time">{alarm.time}</span>
                </div>
                <p className="alarm-message">{alarm.message}</p>
              </div>
            )) : (
              <div className="alarm-item" style={{ borderLeftColor: 'var(--color-muted)' }}>
                <p className="alarm-message" style={{ textAlign: 'center' }}>발생한 알람이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default Dashboard;

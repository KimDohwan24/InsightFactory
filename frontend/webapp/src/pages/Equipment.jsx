import { useState } from 'react';

// Initially empty as requested by user
const INITIAL_EQUIPMENT = [];

export default function Equipment() {
  const [equipmentList] = useState(INITIAL_EQUIPMENT);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedEq, setSelectedEq] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Running': return 'var(--color-success)';
      case 'Idle': return 'var(--color-warning)';
      case 'Error': return 'var(--color-error)';
      default: return 'var(--color-muted)';
    }
  };

  const filteredList = equipmentList.filter(eq => {
    const matchSearch = eq.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'All' || eq.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const kpiTotal = equipmentList.length;
  const kpiRunning = equipmentList.filter(eq => eq.status === 'Running').length;
  const kpiIdle = equipmentList.filter(eq => eq.status === 'Idle').length;
  const kpiError = equipmentList.filter(eq => eq.status === 'Error').length;

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <header className="page-header" style={{ flexShrink: 0 }}>
        <h2>설비 관리 (Equipment)</h2>
        <p className="subtitle">Real-time status and maintenance tracking</p>
      </header>

      {/* KPI Section */}
      <div className="dashboard-grid" style={{ marginBottom: '16px', gridTemplateColumns: 'repeat(4, 1fr)', flexShrink: 0 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-muted)', marginBottom: '8px' }}>전체 설비 (Total)</span>
          <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{kpiTotal}</span>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '4px solid var(--color-success)' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-muted)', marginBottom: '8px' }}>가동 중 (Running)</span>
          <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-success)' }}>{kpiRunning}</span>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '4px solid var(--color-warning)' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-muted)', marginBottom: '8px' }}>대기 중 (Idle)</span>
          <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-warning)' }}>{kpiIdle}</span>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '4px solid var(--color-error)' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-muted)', marginBottom: '8px' }}>에러 (Error)</span>
          <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-error)' }}>{kpiError}</span>
        </div>
      </div>

      {/* Search Section */}
      <div className="filter-section" style={{ flexShrink: 0 }}>
        <div className="filter-group">
          <input 
            type="text" 
            placeholder="Search Line ID..." 
            className="input-field"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <span className="filter-label">Status:</span>
          <div className="tab-list">
            {['All', 'Running', 'Idle', 'Error'].map(status => (
              <button 
                key={status}
                className={`category-tab ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="master-detail-container" style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
        
        {/* Master List (Left) */}
        <div className="master-list card" style={{ width: '300px', flexShrink: 0, overflowY: 'auto', padding: '0' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--color-hairline)', position: 'sticky', top: 0, backgroundColor: 'var(--color-canvas)', zIndex: 1 }}>
            <h3 className="card-title" style={{ margin: 0 }}>설비 목록</h3>
          </div>
          <div className="list-items">
            {filteredList.length > 0 ? filteredList.map(eq => (
              <div 
                key={eq.id} 
                className={`list-item ${selectedEq?.id === eq.id ? 'active' : ''}`}
                onClick={() => setSelectedEq(eq)}
                style={{
                  padding: '16px',
                  borderBottom: '1px solid var(--color-hairline)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: selectedEq?.id === eq.id ? 'var(--color-surface-soft)' : 'transparent',
                  borderLeft: selectedEq?.id === eq.id ? `4px solid ${getStatusColor(eq.status)}` : '4px solid transparent'
                }}
              >
                <div>
                  <strong style={{ fontSize: '16px' }}>{eq.id}</strong>
                  <div style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>{eq.model}</div>
                </div>
                <span className="badge" style={{ backgroundColor: getStatusColor(eq.status), color: 'var(--color-on-primary)' }}>
                  {eq.status}
                </span>
              </div>
            )) : (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-muted)' }}>
                등록된 설비가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* Detail View (Right) */}
        <div className="detail-view card" style={{ flex: 1, overflowY: 'auto' }}>
          {selectedEq ? (
            <div className="detail-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-hairline)' }}>
                <div>
                  <h2 style={{ fontSize: '24px', margin: 0 }}>{selectedEq.id} 상세 정보</h2>
                  <p style={{ color: 'var(--color-muted)', marginTop: '4px' }}>{selectedEq.model}</p>
                </div>
                <span className="badge" style={{ fontSize: '14px', padding: '6px 12px', backgroundColor: getStatusColor(selectedEq.status), color: 'var(--color-on-primary)' }}>
                  {selectedEq.status}
                </span>
              </div>

              <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {/* Basic Info */}
                <div className="card-dark" style={{ border: '1px solid var(--color-hairline)' }}>
                  <h3 className="card-title">설비 제원</h3>
                  <div className="detail-grid" style={{ background: 'none', padding: 0 }}>
                    <div><strong>IP 주소:</strong> {selectedEq.details?.ip ?? '-'}</div>
                    <div><strong>제조사:</strong> {selectedEq.details?.manufacturer ?? '-'}</div>
                    <div><strong>도입 일자:</strong> {selectedEq.details?.installDate ?? '-'}</div>
                    <div><strong>펌웨어 버전:</strong> {selectedEq.details?.firmware ?? '-'}</div>
                  </div>
                </div>

                {/* Maintenance */}
                <div className="card-dark" style={{ border: '1px solid var(--color-hairline)' }}>
                  <h3 className="card-title">유지보수 정보</h3>
                  <div className="detail-grid" style={{ background: 'none', padding: 0 }}>
                    <div><strong>최근 점검일:</strong> {selectedEq.maintenance?.lastCheck ?? '-'}</div>
                    <div><strong>다음 예정일:</strong> {selectedEq.maintenance?.nextCheck ?? '-'}</div>
                    <div><strong>담당자:</strong> {selectedEq.maintenance?.manager ?? '-'}</div>
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <div className="progress-header">
                      <span className="progress-label">주요 부품 예상 수명</span>
                      <span className="progress-percent">{selectedEq.maintenance?.lifespan ?? 0}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${selectedEq.maintenance?.lifespan ?? 0}%`, backgroundColor: (selectedEq.maintenance?.lifespan ?? 0) < 30 ? 'var(--color-warning)' : 'var(--color-success)' }}></div>
                    </div>
                  </div>
                </div>

                {/* Live Sensors */}
                <div className="card-dark" style={{ gridColumn: 'span 2', border: '1px solid var(--color-hairline)' }}>
                  <h3 className="card-title">실시간 센서 모니터링</h3>
                  <div className="production-stats">
                    <div className="stat-box">
                      <span className="stat-label">X_1</span>
                      <span className="stat-value">{selectedEq.sensors?.x_1 ?? '-'}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">X_2</span>
                      <span className="stat-value">{selectedEq.sensors?.x_2 ?? '-'}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">X_3</span>
                      <span className="stat-value">{selectedEq.sensors?.x_3 ?? '-'}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">X_4</span>
                      <span className="stat-value">{selectedEq.sensors?.x_4 ?? '-'}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">X_5</span>
                      <span className="stat-value">{selectedEq.sensors?.x_5 ?? '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Recent Alarms for this eq */}
                <div className="card-dark" style={{ gridColumn: 'span 2', border: '1px solid var(--color-hairline)' }}>
                  <h3 className="card-title">최근 알람 이력 (해당 라인)</h3>
                  <table className="ai-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>시간</th>
                        <th>등급</th>
                        <th>메시지</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEq.recentAlarms && selectedEq.recentAlarms.length > 0 ? selectedEq.recentAlarms.map((al, idx) => (
                        <tr key={idx} style={{ borderBottomColor: 'var(--color-surface-dark-elevated)' }}>
                          <td className="code-font">{al.time}</td>
                          <td><span className="badge badge-error">{al.severity}</span></td>
                          <td>{al.message}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '16px' }}>발생한 알람 내역이 없습니다.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--color-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏭</div>
              <h3 style={{ margin: 0, marginBottom: '8px' }}>선택된 설비가 없습니다.</h3>
              <p>좌측 목록에서 설비를 선택하여 상세 정보를 확인하세요.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
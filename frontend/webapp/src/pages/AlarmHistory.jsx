import { useState, useMemo } from 'react';

const INITIAL_ALARMS = [
  { 
    id: 'AL-1004', time: '2026-08-04T14:20:00', line: 'T010306', severity: 'Critical', 
    message: '설비 과열 경고 (Temp > 35°C)', isAcked: false, 
    details: '냉각 팬 이상 또는 냉매 부족 의심. 즉각적인 라인 정지 및 점검 권장.' 
  },
  { 
    id: 'AL-1003', time: '2026-08-04T11:05:00', line: 'T010305', severity: 'Info', 
    message: '라인 정기 유지보수 완료', isAcked: true, 
    details: '필터 교체 및 윤활유 보충 완료됨. 센서 X_1 영점 조정 완료.' 
  },
  { 
    id: 'AL-1002', time: '2026-08-04T10:30:00', line: 'T100306', severity: 'Critical', 
    message: 'AI 품질 예측 - 불량(0) 감지', isAcked: false, 
    details: 'LOT-260804-T31 제품 분석 결과 Y_Class=0 판정. O_31, T_31 제품 스펙 확인 요망.' 
  },
  { 
    id: 'AL-1001', time: '2026-08-04T09:15:00', line: 'T050304', severity: 'Warning', 
    message: '진동 수치 일시적 임계치 초과', isAcked: true, 
    details: 'X_3 센서 진동 0.05 -> 0.12 일시 상승 후 복구. 지속 모니터링 요망.' 
  },
];

const LINES = ['All', 'T010305', 'T010306', 'T050304', 'T050307', 'T100304', 'T100306'];
const SEVERITIES = ['All', 'Critical', 'Warning', 'Info'];

export default function AlarmHistory() {
  const [alarms, setAlarms] = useState(INITIAL_ALARMS);
  
  // Today date formatted as YYYY-MM-DD for default filter
  const todayStr = '2026-08-04';
  
  const [filters, setFilters] = useState({
    startDate: todayStr,
    endDate: todayStr,
    line: 'All',
    severity: 'All'
  });

  const [selectedAlarm, setSelectedAlarm] = useState(null);

  const handleAck = (e, id) => {
    e.stopPropagation(); // Prevent opening modal when clicking Ack
    setAlarms(alarms.map(a => a.id === id ? { ...a, isAcked: true } : a));
  };

  const getSeverityBadge = (severity) => {
    switch(severity) {
      case 'Critical': return 'badge-error';
      case 'Warning': return 'badge-warning';
      case 'Info': return 'badge-success'; // Or a blue info badge if added to CSS
      default: return 'badge-muted';
    }
  };

  const filteredAlarms = useMemo(() => {
    return alarms.filter(a => {
      const aDate = a.time.split('T')[0];
      const matchDate = (!filters.startDate || aDate >= filters.startDate) && 
                        (!filters.endDate || aDate <= filters.endDate);
      const matchLine = filters.line === 'All' || a.line === filters.line;
      const matchSeverity = filters.severity === 'All' || a.severity === filters.severity;
      
      return matchDate && matchLine && matchSeverity;
    }).sort((a, b) => new Date(b.time) - new Date(a.time));
  }, [alarms, filters]);

  // KPI calculations
  const kpiTotal = alarms.filter(a => a.time.startsWith(todayStr)).length;
  const kpiUnacked = alarms.filter(a => !a.isAcked).length;
  const kpiCritical = alarms.filter(a => a.time.startsWith(todayStr) && a.severity === 'Critical').length;

  return (
    <div className="dashboard-content" style={{ position: 'relative' }}>
      <header className="page-header">
        <h2>알람 이력 (Alarm History)</h2>
        <p className="subtitle">Real-time alert monitoring and acknowledgement</p>
      </header>

      {/* KPI Section */}
      <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-muted)', marginBottom: '8px' }}>오늘 발생 건수</span>
          <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{kpiTotal}</span>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: kpiUnacked > 0 ? '4px solid var(--color-warning)' : '4px solid var(--color-hairline)' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-muted)', marginBottom: '8px' }}>미확인 (Unacknowledged)</span>
          <span style={{ fontSize: '32px', fontWeight: 'bold', color: kpiUnacked > 0 ? 'var(--color-warning)' : 'inherit' }}>{kpiUnacked}</span>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: kpiCritical > 0 ? '4px solid var(--color-error)' : '4px solid var(--color-hairline)' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-muted)', marginBottom: '8px' }}>오늘 Critical 발생 수</span>
          <span style={{ fontSize: '32px', fontWeight: 'bold', color: kpiCritical > 0 ? 'var(--color-error)' : 'inherit' }}>{kpiCritical}</span>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="form-row" style={{ alignItems: 'flex-end', flex: 1 }}>
          <div className="form-group" style={{ marginBottom: 0, maxWidth: '150px' }}>
            <label>시작일</label>
            <input type="date" className="input-field" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
          </div>
          <div className="form-group" style={{ marginBottom: 0, maxWidth: '150px' }}>
            <label>종료일</label>
            <input type="date" className="input-field" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} />
          </div>
          <div className="form-group" style={{ marginBottom: 0, maxWidth: '150px' }}>
            <label>생산 라인</label>
            <select className="input-field" value={filters.line} onChange={e => setFilters({...filters, line: e.target.value})}>
              {LINES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, maxWidth: '150px' }}>
            <label>등급 (Severity)</label>
            <select className="input-field" value={filters.severity} onChange={e => setFilters({...filters, severity: e.target.value})}>
              {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Alarm Table */}
      <div className="card">
        <table className="ai-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>발생 시간</th>
              <th>등급</th>
              <th>발생 라인</th>
              <th>메시지 내용</th>
              <th>상태</th>
              <th style={{ textAlign: 'right' }}>확인(Ack)</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlarms.length > 0 ? filteredAlarms.map(a => (
              <tr 
                key={a.id} 
                style={{ cursor: 'pointer', backgroundColor: a.isAcked ? 'transparent' : 'rgba(204, 120, 92, 0.05)' }}
                onClick={() => setSelectedAlarm(a)}
              >
                <td className="code-font" style={{ fontSize: '13px' }}>{a.time.replace('T', ' ')}</td>
                <td>
                  <span className={`badge ${getSeverityBadge(a.severity)}`}>{a.severity}</span>
                </td>
                <td><strong>{a.line}</strong></td>
                <td>{a.message}</td>
                <td>
                  {a.isAcked 
                    ? <span style={{ color: 'var(--color-muted)', fontSize: '13px' }}>✓ 확인됨</span> 
                    : <span style={{ color: 'var(--color-warning)', fontSize: '13px', fontWeight: 'bold' }}>! 미확인</span>}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {!a.isAcked && (
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '4px 12px', fontSize: '12px' }}
                      onClick={(e) => handleAck(e, a.id)}
                    >
                      Acknowledge
                    </button>
                  )}
                </td>
              </tr>
            )) : (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--color-muted)' }}>조건에 맞는 알람 이력이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Alarm Detail Modal */}
      {selectedAlarm && (
        <div className="modal-overlay" onClick={() => setSelectedAlarm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>알람 상세 정보</h3>
              <button className="btn-close" onClick={() => setSelectedAlarm(null)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="detail-grid" style={{ marginBottom: '20px' }}>
                <div><strong>알람 ID:</strong> {selectedAlarm.id}</div>
                <div><strong>발생 시간:</strong> {selectedAlarm.time.replace('T', ' ')}</div>
                <div><strong>발생 라인:</strong> {selectedAlarm.line}</div>
                <div>
                  <strong>등급:</strong> <span className={`badge ${getSeverityBadge(selectedAlarm.severity)}`}>{selectedAlarm.severity}</span>
                </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--color-muted)' }}>메시지 내용</h4>
                <p style={{ fontSize: '16px', fontWeight: '500' }}>{selectedAlarm.message}</p>
              </div>

              <div>
                <h4 style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--color-muted)' }}>상세 정보 / 조치 권장사항</h4>
                <div style={{ backgroundColor: 'var(--color-surface-soft)', padding: '16px', borderRadius: 'var(--rounded-md)' }}>
                  <p style={{ lineHeight: 1.5 }}>{selectedAlarm.details}</p>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              {!selectedAlarm.isAcked && (
                <button 
                  className="btn-primary" 
                  onClick={(e) => { handleAck(e, selectedAlarm.id); setSelectedAlarm(null); }}
                >
                  확인(Acknowledge) 처리
                </button>
              )}
              <button className="btn-secondary" onClick={() => setSelectedAlarm(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
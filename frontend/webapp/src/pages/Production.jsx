import { useState, useEffect } from 'react';

// Mock data for Production (Micro View)
const PRODUCTS = ['All', 'A_31', 'T_31', 'O_31'];
const LINES = ['All', 'T010305', 'T010306', 'T050304', 'T050307', 'T100304', 'T100306'];

const MOCK_PROD_DATA = {
  lotInfo: {
    lotId: null,
    startTime: null,
    targetQuantity: null,
    currentQuantity: null,
    status: null
  },
  aiPredictions: [],
  equipmentDetails: {
    temperature: null,
    pressure: null,
    vibration: null,
    uptime: null
  }
};

function Production() {
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [selectedLine, setSelectedLine] = useState('All');
  const [sensorData, setSensorData] = useState({ x_1: null, x_2: null, x_3: null, x_4: null, x_5: null });

  const progressPercent = MOCK_PROD_DATA.lotInfo.currentQuantity && MOCK_PROD_DATA.lotInfo.targetQuantity
    ? ((MOCK_PROD_DATA.lotInfo.currentQuantity / MOCK_PROD_DATA.lotInfo.targetQuantity) * 100).toFixed(1)
    : '0.0';

  return (
    <main className="dashboard-content">
      <header className="page-header">
        <h2>특정 생산 라인 상세 (Production)</h2>
        <p className="subtitle">Line-specific Details & Live Sensor Analytics</p>
      </header>

      {/* Filters */}
      <div className="filter-section">
        <div className="filter-group">
          <span className="filter-label">Product:</span>
          <div className="tab-list">
            {PRODUCTS.map(prod => (
              <button 
                key={prod}
                className={`category-tab ${selectedProduct === prod ? 'active' : ''}`}
                onClick={() => setSelectedProduct(prod)}
              >
                {prod}
              </button>
            ))}
          </div>
        </div>
        
        <div className="filter-group">
          <span className="filter-label">Line:</span>
          <div className="tab-list">
            {LINES.map(line => (
              <button 
                key={line}
                className={`category-tab ${selectedLine === line ? 'active' : ''}`}
                onClick={() => setSelectedLine(line)}
              >
                {line}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* 1. LOT 상세 및 생산 진행률 */}
        <div className="card production-card">
          <h3 className="card-title">현재 LOT 정보 및 진행률 ({selectedLine})</h3>
          <div className="production-stats" style={{ marginBottom: '16px' }}>
            <div className="stat-box">
              <span className="stat-label">LOT ID</span>
              <span className="stat-value" style={{ fontSize: '24px' }}>{MOCK_PROD_DATA.lotInfo.lotId ?? '-'}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">시작 시간</span>
              <span className="stat-value" style={{ fontSize: '24px' }}>{MOCK_PROD_DATA.lotInfo.startTime ? MOCK_PROD_DATA.lotInfo.startTime.split(' ')[1] : '-'}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">상태</span>
              <span 
                className={`badge ${
                  MOCK_PROD_DATA.lotInfo.status === 'Error' ? 'badge-error' :
                  MOCK_PROD_DATA.lotInfo.status === 'Idle' || MOCK_PROD_DATA.lotInfo.status === 'Warning' ? 'badge-warning' :
                  'badge-success'
                }`}
                style={{ visibility: MOCK_PROD_DATA.lotInfo.status ? 'visible' : 'hidden' }}
              >
                {MOCK_PROD_DATA.lotInfo.status}
              </span>
            </div>
          </div>
          
          <div className="progress-container">
            <div className="progress-header">
              <span className="progress-label">LOT 생산 진행률 ({MOCK_PROD_DATA.lotInfo.currentQuantity ?? 0} / {MOCK_PROD_DATA.lotInfo.targetQuantity ?? 0})</span>
              <span className="progress-percent">{progressPercent}%</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 2. 설비 상세 정보 */}
        <div className="card-dark equipment-card">
          <h3 className="card-title">설비 상세 제원</h3>
          <div className="equipment-list">
            <div className="equipment-item">
              <span className="eq-line">온도 (Temp)</span>
              <span className="stat-value" style={{ fontSize: '18px' }}>{MOCK_PROD_DATA.equipmentDetails.temperature ?? '-'}°C</span>
            </div>
            <div className="equipment-item">
              <span className="eq-line">압력 (Pressure)</span>
              <span className="stat-value" style={{ fontSize: '18px' }}>{MOCK_PROD_DATA.equipmentDetails.pressure ?? '-'} bar</span>
            </div>
            <div className="equipment-item">
              <span className="eq-line">진동 (Vibration)</span>
              <span className="stat-value" style={{ fontSize: '18px' }}>{MOCK_PROD_DATA.equipmentDetails.vibration ?? '-'} mm/s</span>
            </div>
            <div className="equipment-item">
              <span className="eq-line">연속 가동 시간</span>
              <span className="stat-value" style={{ fontSize: '18px' }}>{MOCK_PROD_DATA.equipmentDetails.uptime ?? '-'}</span>
            </div>
          </div>
        </div>

        {/* 3. 실시간 센서 데이터 (X_1 ~ X_5) */}
        <div className="card ai-card">
          <h3 className="card-title">실시간 핵심 센서 모니터링 (제품: {selectedProduct})</h3>
          <div className="production-stats">
            <div className="stat-box">
              <span className="stat-label">X_1 센서</span>
              <span className="stat-value">{sensorData.x_1 ?? '-'}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">X_2 센서</span>
              <span className="stat-value">{sensorData.x_2 ?? '-'}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">X_3 센서</span>
              <span className="stat-value">{sensorData.x_3 ?? '-'}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">X_4 센서</span>
              <span className="stat-value">{sensorData.x_4 ?? '-'}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">X_5 센서</span>
              <span className="stat-value">{sensorData.x_5 ?? '-'}</span>
            </div>
          </div>
        </div>

        {/* 4. AI 예측 결과 (최근 검사) */}
        <div className="card-dark ai-card" style={{ gridColumn: 'span 4' }}>
          <h3 className="card-title">AI 예측 결과 (해당 라인)</h3>
          <table className="ai-table" style={{ color: 'var(--color-on-dark)' }}>
            <thead>
              <tr>
                <th style={{ color: 'var(--color-muted-soft)' }}>Product ID</th>
                <th style={{ color: 'var(--color-muted-soft)' }}>Y_Quality</th>
                <th style={{ color: 'var(--color-muted-soft)' }}>Y_Class</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PROD_DATA.aiPredictions.length > 0 ? MOCK_PROD_DATA.aiPredictions.map((pred, idx) => (
                <tr key={idx} style={{ borderBottomColor: 'var(--color-surface-dark-elevated)' }}>
                  <td className="code-font">{pred.id}</td>
                  <td>{pred.quality.toFixed(4)}</td>
                  <td>
                    <span className={`badge ${
                      pred.class === 1 ? 'badge-success' : 
                      pred.class === 0 ? 'badge-error' : 'badge-warning'
                    }`}>
                      {pred.class === 1 ? '정상 (1)' : 
                       pred.class === 0 ? '불량 (0)' : '과품질 (2)'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', color: 'var(--color-muted)' }}>수집된 예측 결과가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

export default Production;
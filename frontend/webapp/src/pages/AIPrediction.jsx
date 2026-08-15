import { useState, useEffect, useRef } from 'react';
import { fetchAIPredictions } from '../api';

export default function AIPrediction() {
  const [selectedProduct, setSelectedProduct] = useState('A_31');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

  const loadData = async () => {
    const currentId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAIPredictions(selectedProduct);
      if (currentId === requestIdRef.current) {
        setData(result);
        setSelectedPred(null);
      }
    } catch (err) {
      if (currentId === requestIdRef.current) {
        console.error(err);
        setError(err);
        setData(null);
      }
    } finally {
      if (currentId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
    return () => { requestIdRef.current++; };
  }, [selectedProduct]);

  if (loading || (!data && !error)) {
    return (
      <div className="dashboard-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
        <div>데이터를 불러오는 중입니다...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
        <div style={{ color: 'var(--color-error)' }}>데이터를 불러오는데 실패했습니다.</div>
        <button className="btn-primary" onClick={loadData} style={{ marginTop: '16px' }}>다시 시도</button>
      </div>
    );
  }

  const currentModel = data.models[selectedProduct];
  const filteredPredictions = data.predictions;
  const featureImportance = data.featureImportance;
  
  // KPI Calculations
  const kpiTotal = filteredPredictions.length;
  const kpiNG = filteredPredictions.filter(p => p.yClass === 0 || p.yClass === 2).length;

  const getYClassBadge = (yClass) => {
    switch(yClass) {
      case 1: return <span className="badge badge-success">정상 (1)</span>;
      case 0: return <span className="badge badge-error">불량 (0)</span>;
      case 2: return <span className="badge badge-warning">과품질 (2)</span>;
      default: return <span className="badge badge-muted">Unknown</span>;
    }
  };

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <header className="page-header" style={{ flexShrink: 0 }}>
        <h2>AI 예측 (AI Prediction)</h2>
        <p className="subtitle">Product-specific ML Models & Feature Importance</p>
      </header>

      {/* Product Model Selector */}
      <div className="filter-section" style={{ flexShrink: 0 }}>
        <div className="filter-group">
          <span className="filter-label">분석 대상 모델 (Product):</span>
          <div className="tab-list">
            {Object.keys(data.models).map(prod => (
              <button 
                key={prod}
                className={`category-tab ${selectedProduct === prod ? 'active' : ''}`}
                onClick={() => { setSelectedProduct(prod); setSelectedPred(null); }}
              >
                {prod} Model
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="dashboard-grid" style={{ marginBottom: '16px', gridTemplateColumns: 'repeat(4, 1fr)', flexShrink: 0 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-muted)', marginBottom: '8px' }}>오늘 전체 예측 건수</span>
          <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{kpiTotal}</span>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '4px solid var(--color-error)' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-muted)', marginBottom: '8px' }}>NG(불량/과품질) 예측 건수</span>
          <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-error)' }}>{kpiNG}</span>
        </div>
        <div className="card-dark" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-muted)', marginBottom: '8px' }}>현재 모델 버전</span>
          <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{currentModel.version ?? '-'}</span>
        </div>
        <div className="card-dark" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-muted)', marginBottom: '8px' }}>F1 Score (성능 지표)</span>
          <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-primary)' }}>{currentModel.f1Score != null ? currentModel.f1Score.toFixed(3) : '-'}</span>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="master-detail-container" style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
        
        {/* Master List (Left) */}
        <div className="master-list card" style={{ width: '320px', flexShrink: 0, overflowY: 'auto', padding: '0' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--color-hairline)', position: 'sticky', top: 0, backgroundColor: 'var(--color-canvas)', zIndex: 1 }}>
            <h3 className="card-title" style={{ margin: 0 }}>예측 결과 목록</h3>
          </div>
          <div className="list-items">
            {filteredPredictions.length > 0 ? filteredPredictions.map(pred => (
              <button 
                key={pred.id} 
                className={`list-item ${selectedPred?.id === pred.id ? 'active' : ''}`}
                onClick={() => setSelectedPred(pred)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  borderTop: 'none',
                  borderRight: 'none',
                  outline: 'none',
                  padding: '16px',
                  borderBottom: '1px solid var(--color-hairline)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: selectedPred?.id === pred.id ? 'var(--color-surface-soft)' : 'transparent',
                  borderLeft: selectedPred?.id === pred.id ? `4px solid var(--color-primary)` : '4px solid transparent'
                }}
              >
                <div>
                  <strong className="code-font" style={{ fontSize: '14px' }}>{pred.id}</strong>
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px' }}>{pred.time}</div>
                </div>
                {getYClassBadge(pred.yClass)}
              </button>
            )) : (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-muted)' }}>
                수집된 예측 데이터가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* Detail View (Right) */}
        <div className="detail-view card" style={{ flex: 1, overflowY: 'auto' }}>
          {selectedPred ? (
            <div className="detail-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-hairline)' }}>
                <div>
                  <h2 style={{ fontSize: '24px', margin: 0 }}>{selectedPred.id} 판정 상세</h2>
                  <p style={{ color: 'var(--color-muted)', marginTop: '4px', fontFamily: 'var(--font-code)' }}>Time: {selectedPred.time}</p>
                </div>
                {getYClassBadge(selectedPred.yClass)}
              </div>

              <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                
                <div className="card-dark" style={{ border: '1px solid var(--color-hairline)' }}>
                  <h3 className="card-title">Confidence (판정 확신도)</h3>
                  <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '48px', fontWeight: 'bold', color: selectedPred.quality > 0.9 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                      {(selectedPred.quality * 100).toFixed(1)}%
                    </span>
                    <p style={{ color: 'var(--color-muted)', marginTop: '8px' }}>AI가 해당 판정을 확신하는 정도</p>
                  </div>
                </div>

                {/* Actual vs Predicted */}
                <div className="card-dark" style={{ border: '1px solid var(--color-hairline)' }}>
                  <h3 className="card-title">AI 예측 vs 실제 결과</h3>
                  <div className="detail-grid" style={{ background: 'none', padding: 0, marginTop: '16px' }}>
                    <div style={{ textAlign: 'center', padding: '16px', backgroundColor: 'var(--color-surface-soft)', borderRadius: 'var(--rounded-md)' }}>
                      <span style={{ display: 'block', fontSize: '13px', color: 'var(--color-muted)', marginBottom: '8px' }}>AI 예측 결과</span>
                      {getYClassBadge(selectedPred.yClass)}
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px', backgroundColor: 'var(--color-surface-soft)', borderRadius: 'var(--rounded-md)' }}>
                      <span style={{ display: 'block', fontSize: '13px', color: 'var(--color-muted)', marginBottom: '8px' }}>실제 결과(검수)</span>
                      {selectedPred.actualYClass !== null ? getYClassBadge(selectedPred.actualYClass) : <span className="badge badge-muted">대기 중</span>}
                    </div>
                  </div>
                </div>

                {/* Feature Importance */}
                <div className="card-dark" style={{ gridColumn: 'span 2', border: '1px solid var(--color-hairline)' }}>
                  <h3 className="card-title">Feature Importance (주요 변수 기여도)</h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginBottom: '16px' }}>
                    해당 제품({selectedProduct})의 최종 판정에 가장 큰 영향을 미친 Top 5 센서 데이터
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {featureImportance && featureImportance.length > 0 ? (
                      featureImportance.map((fi, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ width: '60px', fontFamily: 'var(--font-code)', fontSize: '14px', color: 'var(--color-ink)' }}>{fi.feature}</span>
                          <div className="progress-bar-bg" style={{ flex: 1, margin: '0 16px', height: '12px', backgroundColor: 'var(--color-surface-card)' }}>
                            <div className="progress-bar-fill" style={{ width: `${fi.importance * 100}%`, backgroundColor: 'var(--color-primary)' }}></div>
                          </div>
                          <span style={{ width: '50px', textAlign: 'right', fontSize: '13px', color: 'var(--color-muted)' }}>{(fi.importance * 100).toFixed(1)}%</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '16px' }}>데이터가 없습니다.</div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="card-dark" style={{ gridColumn: 'span 2', border: '1px solid var(--color-hairline)' }}>
                  <h3 className="card-title">분석 파이프라인 진행 이력</h3>
                  <ul className="timeline" style={{ marginTop: '16px' }}>
                    {selectedPred.history && selectedPred.history.length > 0 ? (
                      selectedPred.history.map((h, idx) => (
                        <li key={idx}>
                          <span className="time">{h.time}</span>
                          <span className="action">{h.step}</span>
                        </li>
                      ))
                    ) : (
                      <li style={{ padding: 0 }}><span className="action" style={{ color: 'var(--color-muted)' }}>이력이 없습니다.</span></li>
                    )}
                  </ul>
                </div>

              </div>
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--color-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
              <h3 style={{ margin: 0, marginBottom: '8px' }}>선택된 예측 내역이 없습니다.</h3>
              <p>좌측 목록에서 예측 결과를 클릭하여 상세 정보를 확인하세요.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Activity, Play, Send } from 'lucide-react';
import './EdgePage.css';

export default function EdgePage() {
  const [sensors, setSensors] = useState({
    1: '', 2: '', 3: '', 4: '', 5: '', 6: ''
  });
  const [prediction, setPrediction] = useState(null);

  const handleRandomize = () => {
    setSensors({
      1: (Math.random() * 50 + 100).toFixed(2),
      2: (Math.random() * 20 + 50).toFixed(2),
      3: (Math.random() * 10 + 20).toFixed(2),
      4: (Math.random() * 5 + 10).toFixed(2),
      5: (Math.random() * 100 + 200).toFixed(2),
      6: (Math.random() * 2 + 5).toFixed(2),
    });
  };

  const handleInputChange = (id, value) => {
    setSensors(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    // Simulate AI Server response
    const mockScore = (Math.random() * 0.4 + 0.5).toFixed(3);
    const mockClass = mockScore > 0.7 ? 1 : (mockScore > 0.6 ? 2 : 3);
    setPrediction({ score: mockScore, class: mockClass });
  };

  return (
    <div className="page-container edge-container">
      <header className="page-header">
        <div>
          <h1>MES 현장 모니터링 (Edge)</h1>
          <p className="subtitle">실시간 설비 모니터링 및 데이터 입력 (시연용)</p>
        </div>
        <div className="status-badge normal">
          <Activity size={18} />
          <span>시스템 대기 중 (데이터 입력 가능)</span>
        </div>
      </header>

      <div className="content-grid">
        <section className="glass-panel">
          <h2>생산 라인 정보</h2>
          <div className="info-group">
            <label>현재 라인</label>
            <select className="premium-select">
              <option value="">라인을 선택하세요</option>
              <option>T010305</option>
              <option>T010306</option>
              <option>T050304</option>
              <option>T050307</option>
              <option>T100304</option>
              <option>T100306</option>
            </select>
          </div>
          <div className="info-group">
            <label>제품 코드</label>
            <select className="premium-select">
              <option value="">제품 코드를 선택하세요</option>
              <option>A_31</option>
              <option>O_31</option>
              <option>T_31</option>
            </select>
          </div>
        </section>

        <section className="glass-panel col-span-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>핵심 센서 파라미터 입력</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="premium-btn ghost" onClick={handleRandomize}>
                <Play size={16} /> 랜덤 데이터 채우기
              </button>
              <button className="premium-btn primary" onClick={handleSubmit}>
                <Send size={16} /> AI 예측 요청
              </button>
            </div>
          </div>
          <p className="section-desc">※ 시연을 위해 센서값을 직접 입력하거나 랜덤 생성 버튼을 누르세요.</p>
          <div className="sensor-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="sensor-card">
                <span className="sensor-label">센서 X_{i}</span>
                <div className="input-wrapper">
                  <input 
                    type="number" 
                    className="premium-input" 
                    placeholder="0.00"
                    value={sensors[i]}
                    onChange={(e) => handleInputChange(i, e.target.value)}
                  />
                  <span className="unit">단위</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel prediction-panel col-span-full">
          <h2>AI 품질 예측 결과</h2>
          <div className="prediction-content">
            <div className="quality-score">
              <span className="score-value">{prediction ? prediction.score : '-'}</span>
              <span className="score-label">품질 예측 점수 (Y_Quality)</span>
            </div>
            <div className={`quality-class ${prediction ? (prediction.class === 1 ? 'class-good' : prediction.class === 2 ? 'class-warning' : 'class-bad') : ''}`}>
              <span className="class-value" style={!prediction ? {color: '#94a3b8', border: '1px dashed #64748b', background: 'transparent'} : {}}>
                {prediction ? `${prediction.class} 등급` : '- 등급'}
              </span>
              <span className="class-label">최적 품질 (Y_Class)</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

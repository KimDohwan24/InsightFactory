import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Data initialized with categories but 0 values to show the X-axis structure
const INITIAL_PROD_TREND = [];
const INITIAL_DEFECT_TREND = [];
const INITIAL_PROD_BY_PRODUCT = [
  { name: 'A_31', quantity: 0 },
  { name: 'T_31', quantity: 0 },
  { name: 'O_31', quantity: 0 }
];
const INITIAL_PROD_BY_LINE = [
  { name: 'T010305', quantity: 0 },
  { name: 'T010306', quantity: 0 },
  { name: 'T050304', quantity: 0 },
  { name: 'T050307', quantity: 0 },
  { name: 'T100304', quantity: 0 },
  { name: 'T100306', quantity: 0 }
];
const INITIAL_AI_DISTRIBUTION = [];

const AI_MODEL_PERFORMANCE = {
  'A_31': { model: '-', version: null, predictions: '-', accuracy: '-', precision: '-', recall: '-', f1Score: '-' },
  'T_31': { model: '-', version: null, predictions: '-', accuracy: '-', precision: '-', recall: '-', f1Score: '-' },
  'O_31': { model: '-', version: null, predictions: '-', accuracy: '-', precision: '-', recall: '-', f1Score: '-' }
};

const PIE_COLORS = ['#38bdf8', '#fbbf24', '#f87171']; // Success, Warning, Error colors

export default function Statistics() {
  const [prodTrend] = useState(INITIAL_PROD_TREND);
  const [defectTrend] = useState(INITIAL_DEFECT_TREND);
  const [prodByProduct] = useState(INITIAL_PROD_BY_PRODUCT);
  const [prodByLine] = useState(INITIAL_PROD_BY_LINE);
  const [aiDist] = useState(INITIAL_AI_DISTRIBUTION);
  const [selectedModel, setSelectedModel] = useState('A_31');

  const currentStats = AI_MODEL_PERFORMANCE[selectedModel];

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <header className="page-header" style={{ flexShrink: 0 }}>
        <h2>통계 (Statistics & Analytics)</h2>
        <p className="subtitle">Comprehensive factory analytics and AI performance metrics</p>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
        
        {/* ① KPI Row */}
        <div className="dashboard-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-muted)', marginBottom: '8px' }}>총 생산량 (Total Production)</span>
            <span style={{ fontSize: '32px', fontWeight: 'bold' }}>-</span>
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-muted)', marginBottom: '8px' }}>불량률 (Defect Rate)</span>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-warning)' }}>-</span>
          </div>
          <div className="card-dark" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-muted)', marginBottom: '8px' }}>AI Accuracy</span>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-primary)' }}>-</span>
          </div>
          <div className="card-dark" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-muted)', marginBottom: '8px' }}>F1 Score</span>
            <span style={{ fontSize: '32px', fontWeight: 'bold' }}>-</span>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '24px' }}>
          
          {/* ② 생산량 추이 */}
          <div className="card">
            <h3 className="card-title">생산량 추이 (Production Trend)</h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <LineChart data={prodTrend} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
                  <XAxis dataKey="name" stroke="var(--color-muted)" fontSize={12} />
                  <YAxis stroke="var(--color-muted)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-hairline)', color: 'var(--color-ink)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="quantity" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="생산량" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ③ 불량률 추이 */}
          <div className="card">
            <h3 className="card-title">불량률 추이 (Defect Rate Trend)</h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <LineChart data={defectTrend} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
                  <XAxis dataKey="name" stroke="var(--color-muted)" fontSize={12} />
                  <YAxis stroke="var(--color-muted)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-hairline)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="rate" stroke="var(--color-error)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="불량률(%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ④ 제품별 생산량 */}
          <div className="card">
            <h3 className="card-title">제품별 생산량 (By Product)</h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <BarChart data={prodByProduct} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-muted)" fontSize={12} />
                  <YAxis stroke="var(--color-muted)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-hairline)' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Legend />
                  <Bar dataKey="quantity" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="생산량" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ⑤ 라인별 생산량 */}
          <div className="card">
            <h3 className="card-title">라인별 생산량 (By Line)</h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <BarChart data={prodByLine} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-muted)" fontSize={12} />
                  <YAxis stroke="var(--color-muted)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-hairline)' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Legend />
                  <Bar dataKey="quantity" fill="var(--color-success)" radius={[4, 4, 0, 0]} name="생산량" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* AI Performance Section */}
        <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', paddingBottom: '24px' }}>
          
          {/* ⑥ AI 예측 분포 */}
          <div className="card">
            <h3 className="card-title">AI 예측 분포 (Prediction Distribution)</h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={aiDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {aiDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-hairline)', borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ⑦ AI Model Performance Info */}
          <div className="card-dark" style={{ border: '1px solid var(--color-hairline)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="card-title" style={{ margin: 0 }}>AI Model Performance</h3>
              <select 
                className="input-field" 
                style={{ width: 'auto', padding: '4px 8px', fontSize: '13px', backgroundColor: 'var(--color-surface-card)', color: 'var(--color-ink)' }} 
                value={selectedModel} 
                onChange={e => setSelectedModel(e.target.value)}
              >
                <option value="A_31">A_31 Model</option>
                <option value="T_31">T_31 Model</option>
                <option value="O_31">O_31 Model</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 48px)', justifyContent: 'center' }}>
              <div className="detail-grid" style={{ background: 'none', padding: 0 }}>
                <div style={{ fontSize: '15px' }}>
                  <span style={{ color: 'var(--color-muted)', display: 'inline-block', width: '100px' }}>Model:</span> 
                  <strong style={{ color: 'var(--color-ink)' }}>{currentStats.model}</strong>
                </div>
                <div style={{ fontSize: '15px' }}>
                  <span style={{ color: 'var(--color-muted)', display: 'inline-block', width: '100px' }}>Version:</span> 
                  <strong style={{ color: 'var(--color-ink)' }}>{currentStats.version ?? '-'}</strong>
                </div>
                <div style={{ fontSize: '15px', gridColumn: 'span 2', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--color-hairline)' }}>
                  <span style={{ color: 'var(--color-muted)', display: 'inline-block', width: '100px' }}>Predictions:</span> 
                  <strong style={{ color: 'var(--color-ink)' }}>{currentStats.predictions}</strong>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
                <div style={{ backgroundColor: 'var(--color-surface-soft)', padding: '16px', borderRadius: 'var(--rounded-md)', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '13px', color: 'var(--color-muted)', marginBottom: '4px' }}>Accuracy</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-primary)' }}>{currentStats.accuracy}</span>
                </div>
                <div style={{ backgroundColor: 'var(--color-surface-soft)', padding: '16px', borderRadius: 'var(--rounded-md)', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '13px', color: 'var(--color-muted)', marginBottom: '4px' }}>F1 Score</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-warning)' }}>{currentStats.f1Score}</span>
                </div>
                <div style={{ backgroundColor: 'var(--color-surface-soft)', padding: '16px', borderRadius: 'var(--rounded-md)', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '13px', color: 'var(--color-muted)', marginBottom: '4px' }}>Precision</span>
                  <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{currentStats.precision}</span>
                </div>
                <div style={{ backgroundColor: 'var(--color-surface-soft)', padding: '16px', borderRadius: 'var(--rounded-md)', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '13px', color: 'var(--color-muted)', marginBottom: '4px' }}>Recall</span>
                  <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{currentStats.recall}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
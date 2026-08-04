import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { LayoutDashboard, TrendingUp, AlertTriangle } from 'lucide-react';
import './DashboardPage.css';

const mockTrendData = [];

const mockLineData = [
  { line: 'T010305', ok: 0, ng: 0 },
  { line: 'T010306', ok: 0, ng: 0 },
  { line: 'T050304', ok: 0, ng: 0 },
  { line: 'T050307', ok: 0, ng: 0 },
  { line: 'T100304', ok: 0, ng: 0 },
  { line: 'T100306', ok: 0, ng: 0 },
];

export default function DashboardPage() {
  return (
    <div className="page-container dashboard-container">
      <header className="page-header">
        <div>
          <h1>공장 종합 대시보드</h1>
          <p className="subtitle">전체 생산 현황 및 품질 분석</p>
        </div>
        <div className="header-actions">
          <div className="kpi-badge" style={{color: '#94a3b8', borderColor: 'rgba(255,255,255,0.1)'}}>
            <TrendingUp size={16} />
            <span>수율 데이터 대기 중</span>
          </div>
          <div className="kpi-badge" style={{color: '#94a3b8', borderColor: 'rgba(255,255,255,0.1)', background: 'transparent'}}>
            <AlertTriangle size={16} />
            <span>알람 없음</span>
          </div>
        </div>
      </header>

      <div className="dashboard-grid">
        <section className="glass-panel col-span-2 chart-section">
          <h2>시간대별 품질 점수 트렌드 (Y_Quality)</h2>
          <div className="chart-container">
            {mockTrendData.length === 0 ? (
              <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b'}}>
                데이터 대기 중...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis domain={['auto', 'auto']} stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="평균 품질 점수" />
                  <Line type="step" dataKey="limit" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 5" name="관리 한계선" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="glass-panel chart-section">
          <h2>라인별 양불 현황</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockLineData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="line" type="category" stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="ok" stackId="a" fill="#34d399" name="1등급 (양품)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="ng" stackId="a" fill="#f87171" name="2등급 (불량)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass-panel col-span-full">
          <h2>최근 이상 징후 발생 내역</h2>
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>발생 시간</th>
                  <th>생산 라인</th>
                  <th>제품 코드</th>
                  <th>품질 점수</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="5" style={{textAlign: 'center', color: '#64748b', padding: '2rem 0'}}>수집된 이상 징후 데이터가 없습니다.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

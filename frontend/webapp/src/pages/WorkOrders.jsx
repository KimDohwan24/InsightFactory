import { useState, useEffect } from 'react';
import { fetchWorkOrders } from '../api';

const PRODUCT_LINE_MAP = {
  'A_31': ['T010305', 'T010306', 'T050304', 'T050307'],
  'T_31': ['T100304', 'T100306'],
  'O_31': ['T100304', 'T100306'],
};

export default function WorkOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await fetchWorkOrders();
        setOrders(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('Create'); // Create, Edit, Detail
  const [currentOrder, setCurrentOrder] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id: '', product: 'A_31', line: 'T010305', targetQuantity: 100, 
    priority: 'Medium', startTime: '', endTime: ''
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Running': return 'badge-success';
      case 'Planned': return 'badge-coral';
      case 'Paused': return 'badge-warning';
      case 'Completed': return 'badge-muted';
      case 'Cancelled': return 'badge-error';
      default: return '';
    }
  };

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'High': return <span style={{ color: 'var(--color-error)', fontWeight: 'bold' }}>↑ High</span>;
      case 'Medium': return <span style={{ color: 'var(--color-warning)', fontWeight: 'bold' }}>- Med</span>;
      case 'Low': return <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>↓ Low</span>;
      default: return priority;
    }
  };

  const handleStatusChange = (id, newStatus) => {
    setOrders(orders.map(o => {
      if(o.id === id) {
        const time = new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'});
        return { 
          ...o, 
          status: newStatus,
          history: [...o.history, { time: `Today ${time}`, action: `Status changed to ${newStatus}` }] 
        };
      }
      return o;
    }));
  };

  const handleDelete = (id) => {
    if(window.confirm(`${id} 작업 지시를 정말 삭제하시겠습니까?`)) {
      setOrders(orders.filter(o => o.id !== id));
    }
  };

  const openModal = (mode, order = null) => {
    setModalMode(mode);
    setCurrentOrder(order);
    if(order) {
      setFormData(order);
    } else {
      setFormData({
        // TODO: When API integration is implemented, replace this client-generated ID with the server-issued ID.
        id: `WO-${crypto.randomUUID ? crypto.randomUUID().split('-')[0] : Math.random().toString(36).substring(2, 10)}`, 
        product: 'A_31', line: 'T010305', targetQuantity: 1000, 
        priority: 'Medium', startTime: '', endTime: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleProductChange = (e) => {
    const newProduct = e.target.value;
    const validLines = PRODUCT_LINE_MAP[newProduct];
    
    setFormData(prev => ({
      ...prev, 
      product: newProduct,
      // If the currently selected line is not valid for the new product, pick the first valid one
      line: validLines.includes(prev.line) ? prev.line : validLines[0]
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    if (formData.startTime && formData.endTime) {
      if (new Date(formData.endTime) <= new Date(formData.startTime)) {
        alert('종료 시간은 시작 시간 이후여야 합니다.');
        return;
      }
    }

    if(modalMode === 'Create') {
      const newOrder = {
        ...formData,
        currentQuantity: 0,
        status: 'Planned',
        history: [{ time: 'Just now', action: 'Created' }]
      };
      setOrders([newOrder, ...orders]);
    } else if (modalMode === 'Edit') {
      setOrders(orders.map(o => o.id === formData.id ? {
        ...formData,
        history: [...o.history, { time: 'Just now', action: 'Updated details' }]
      } : o));
    }
    setIsModalOpen(false);
  };

  const filteredOrders = orders.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        o.product.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="dashboard-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>데이터를 불러오는 중입니다...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-content" style={{ position: 'relative' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>작업 지시 (Work Orders)</h2>
          <p className="subtitle">Manage production schedules and track progress</p>
        </div>
        <button className="btn-primary" onClick={() => openModal('Create')}>+ 신규 작업 지시</button>
      </header>

      <div className="filter-section">
        <div className="filter-group">
          <input 
            type="text" 
            placeholder="Search by ID or Product..." 
            className="input-field"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <span className="filter-label">Status:</span>
          <div className="tab-list">
            {['All', 'Planned', 'Running', 'Paused', 'Completed'].map(status => (
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

      <div className="card">
        <table className="ai-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>LOT 번호 (ID)</th>
              <th>제품 / 라인</th>
              <th>우선순위</th>
              <th>목표 수량</th>
              <th>진행률</th>
              <th>작업 상태</th>
              <th style={{ textAlign: 'right' }}>관리 / 액션</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? filteredOrders.map(o => {
              const progress = o.targetQuantity ? ((o.currentQuantity / o.targetQuantity) * 100).toFixed(1) : 0;
              return (
                <tr key={o.id}>
                  <td className="code-font" style={{ fontWeight: '500' }}>{o.id}</td>
                  <td>
                    <strong>{o.product}</strong>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-muted)' }}>{o.line}</span>
                  </td>
                  <td>{getPriorityBadge(o.priority)}</td>
                  <td>
                    {o.currentQuantity} / <strong>{o.targetQuantity}</strong>
                  </td>
                  <td>
                    <div className="progress-bar-bg" style={{ height: '6px', width: '80px', display: 'inline-block', verticalAlign: 'middle' }}>
                      <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--color-muted)' }}>{progress}%</span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(o.status)}`}>{o.status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-buttons">
                      {o.status === 'Planned' && <button className="btn-icon" title="Start" onClick={() => handleStatusChange(o.id, 'Running')}>▶️</button>}
                      {o.status === 'Running' && <button className="btn-icon" title="Pause" onClick={() => handleStatusChange(o.id, 'Paused')}>⏸️</button>}
                      {o.status === 'Paused' && <button className="btn-icon" title="Resume" onClick={() => handleStatusChange(o.id, 'Running')}>▶️</button>}
                      {(o.status === 'Running' || o.status === 'Paused') && <button className="btn-icon" title="Complete" onClick={() => handleStatusChange(o.id, 'Completed')}>⏹️</button>}
                      
                      <span className="divider">|</span>
                      
                      <button className="btn-icon text-only" onClick={() => openModal('Detail', o)}>상세</button>
                      <button className="btn-icon text-only" onClick={() => openModal('Edit', o)}>수정</button>
                      <button className="btn-icon text-only danger" onClick={() => handleDelete(o.id)}>삭제</button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--color-muted)' }}>조건에 맞는 작업 지시가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {modalMode === 'Create' ? '신규 작업 지시 등록' : 
                 modalMode === 'Edit' ? '작업 지시 수정' : '작업 지시 상세 이력'}
              </h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              {modalMode === 'Detail' ? (
                <div className="history-view">
                  <div className="detail-grid">
                    <div><strong>LOT 번호:</strong> {currentOrder.id}</div>
                    <div><strong>제품/라인:</strong> {currentOrder.product} / {currentOrder.line}</div>
                    <div><strong>우선순위:</strong> {currentOrder.priority}</div>
                    <div><strong>상태:</strong> {currentOrder.status}</div>
                    <div><strong>예정 시작:</strong> {currentOrder.startTime}</div>
                    <div><strong>예정 종료:</strong> {currentOrder.endTime}</div>
                  </div>
                  <h4 style={{ marginTop: '24px', marginBottom: '12px' }}>작업 이력 (History)</h4>
                  <ul className="timeline">
                    {currentOrder.history.map((h, i) => (
                      <li key={i}>
                        <span className="time">{h.time}</span>
                        <span className="action">{h.action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <form id="wo-form" onSubmit={handleSave} className="wo-form">
                  <div className="form-group">
                    <label>LOT 번호 (자동생성)</label>
                    <input type="text" value={formData.id} disabled className="input-field" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>제품 (Product)</label>
                      <select className="input-field" value={formData.product} onChange={handleProductChange}>
                        <option>A_31</option><option>T_31</option><option>O_31</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>생산 라인 (Line)</label>
                      <select className="input-field" value={formData.line} onChange={e => setFormData({...formData, line: e.target.value})}>
                        {PRODUCT_LINE_MAP[formData.product]?.map(line => (
                          <option key={line} value={line}>{line}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>목표 수량 (EA)</label>
                      <input type="number" className="input-field" value={formData.targetQuantity} onChange={e => setFormData({...formData, targetQuantity: Number(e.target.value)})} required min="1" />
                    </div>
                    <div className="form-group">
                      <label>우선순위 (Priority)</label>
                      <select className="input-field" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                        <option>High</option><option>Medium</option><option>Low</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>예정 시작 시간</label>
                      <input type="datetime-local" className="input-field" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>예정 종료 시간</label>
                      <input type="datetime-local" className="input-field" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} required />
                    </div>
                  </div>
                </form>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>닫기</button>
              {modalMode !== 'Detail' && (
                <button type="submit" form="wo-form" className="btn-primary">저장 (Save)</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
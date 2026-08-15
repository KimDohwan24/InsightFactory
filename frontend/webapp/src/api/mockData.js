export const dashboardMockData = {
  currentProduction: 4250,
  productionGoal: 5000,
  defectCount: 18,
  equipmentStatus: [
    { line: 'T010305', product: 'A_31', status: 'active', active: true },
    { line: 'T010306', product: 'A_31', status: 'error', active: false },
    { line: 'T100304', product: 'T_31', status: 'warning', active: true },
    { line: 'T100306', product: 'O_31', status: 'active', active: true }
  ],
  recentAlarms: [
    { id: 1, message: 'T010306 Pressure Drop', time: '10:23 AM' },
    { id: 2, message: 'T100304 Temperature High', time: '09:45 AM' }
  ],
  recentWorkOrders: [
    { id: 'WO-2023-001', product: 'A_31', status: 'In Progress', progress: 85 },
    { id: 'WO-2023-002', product: 'T_31', status: 'Pending', progress: 0 }
  ]
};

export const productionMockData = {
  lotInfo: {
    lotId: 'LOT-A31-9923',
    startTime: '2023-10-24 08:00:00',
    targetQuantity: 1000,
    currentQuantity: 850,
    status: 'Running'
  },
  aiPredictions: [
    { id: 'PRD-001', quality: 0.9823, class: 1 },
    { id: 'PRD-002', quality: 0.1245, class: 0 },
    { id: 'PRD-003', quality: 0.9912, class: 1 }
  ],
  equipmentDetails: {
    temperature: 24.5,
    pressure: 1.2,
    vibration: 0.05,
    uptime: '12h 45m'
  }
};

export const workOrdersMockData = [
  { id: 'WO-101', product: 'A_31', line: 'T010305', targetQuantity: 500, priority: 'High', status: 'Running', progress: 45, startTime: '2026-08-15 08:00', endTime: '-' },
  { id: 'WO-102', product: 'T_31', line: 'T100304', targetQuantity: 300, priority: 'Medium', status: 'Planned', progress: 0, startTime: '2026-08-16 09:00', endTime: '-' },
  { id: 'WO-103', product: 'O_31', line: 'T100306', targetQuantity: 800, priority: 'Low', status: 'Completed', progress: 100, startTime: '2026-08-14 08:00', endTime: '2026-08-14 18:00' },
  { id: 'WO-104', product: 'A_31', line: 'T010306', targetQuantity: 200, priority: 'High', status: 'Paused', progress: 15, startTime: '2026-08-15 10:00', endTime: '-' }
];

export const aiPredictionMockData = {
  models: {
    'A_31': { version: 'v1.4.2', f1Score: 0.88, accuracy: 0.92, precision: 0.89, recall: 0.87, predictions: 45210 },
    'T_31': { version: 'v2.0.1', f1Score: 0.76, accuracy: 0.81, precision: 0.74, recall: 0.78, predictions: 12050 },
    'O_31': { version: 'v1.1.0', f1Score: 0.91, accuracy: 0.94, precision: 0.92, recall: 0.90, predictions: 32000 }
  },
  predictions: [
    { id: 'PRD-A-001', product: 'A_31', line: 'T010305', quality: 0.99, yClass: 1, time: '10:05:22' },
    { id: 'PRD-A-002', product: 'A_31', line: 'T010306', quality: 0.12, yClass: 0, time: '10:06:11' },
    { id: 'PRD-T-001', product: 'T_31', line: 'T100304', quality: 0.98, yClass: 1, time: '10:06:45' },
    { id: 'PRD-O-001', product: 'O_31', line: 'T100306', quality: 0.88, yClass: 2, time: '10:07:02' }
  ],
  featureImportance: [
    { feature: 'X_1', importance: 0.35 },
    { feature: 'X_3', importance: 0.22 },
    { feature: 'X_5', importance: 0.18 },
    { feature: 'X_2', importance: 0.15 },
    { feature: 'X_4', importance: 0.10 }
  ]
};

export const alarmHistoryMockData = [
  { id: 'AL-1005', time: '2026-08-15T09:20:00', line: 'T010306', severity: 'Critical', message: '설비 과열 경고 (Temp > 35°C)', isAcked: false, details: '냉각 팬 이상' },
  { id: 'AL-1004', time: '2026-08-15T08:05:00', line: 'T100304', severity: 'Info', message: '라인 정기 유지보수', isAcked: true, details: '필터 교체' },
  { id: 'AL-1003', time: '2026-08-14T15:30:00', line: 'T010305', severity: 'Warning', message: '진동 수치 상승', isAcked: true, details: 'X_3 센서 모니터링 필요' }
];

export const statisticsMockData = {
  prodTrend: [
    { time: '08:00', A_31: 120, T_31: 80, O_31: 50 },
    { time: '09:00', A_31: 130, T_31: 90, O_31: 60 },
    { time: '10:00', A_31: 125, T_31: 85, O_31: 55 },
    { time: '11:00', A_31: 140, T_31: 95, O_31: 65 }
  ],
  defectTrend: [
    { time: '08:00', defect: 2 },
    { time: '09:00', defect: 5 },
    { time: '10:00', defect: 3 },
    { time: '11:00', defect: 1 }
  ],
  prodByProduct: [
    { name: 'A_31', quantity: 515 },
    { name: 'T_31', quantity: 350 },
    { name: 'O_31', quantity: 230 }
  ],
  prodByLine: [
    { name: 'T010305', quantity: 200 },
    { name: 'T010306', quantity: 150 },
    { name: 'T100304', quantity: 180 },
    { name: 'T100306', quantity: 250 }
  ],
  aiDist: [
    { name: '정상 (1)', value: 850 },
    { name: '불량 (0)', value: 150 },
    { name: '과품질 (2)', value: 50 }
  ]
};

export const equipmentMockData = [
  { id: 'EQ-01', line: 'T010305', type: 'Assembly', status: 'Running', temp: '24.5', vibration: '0.02', uptime: '99.5%' },
  { id: 'EQ-02', line: 'T010306', type: 'Assembly', status: 'Error', temp: '38.2', vibration: '0.12', uptime: '85.2%' },
  { id: 'EQ-03', line: 'T100304', type: 'Testing', status: 'Idle', temp: '22.1', vibration: '0.01', uptime: '95.0%' },
  { id: 'EQ-04', line: 'T100306', type: 'Testing', status: 'Running', temp: '25.0', vibration: '0.03', uptime: '98.1%' }
];

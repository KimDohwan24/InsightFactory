import { 
  dashboardMockData, 
  productionMockData,
  workOrdersMockData,
  aiPredictionMockData,
  alarmHistoryMockData,
  statisticsMockData,
  equipmentMockData
} from './mockData';

// Delay function to simulate network latency
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const fetchDashboardData = async () => {
  if (USE_MOCK) {
    await delay(800); // Simulate 800ms network delay
    return dashboardMockData;
  }
  
  // Real API call would go here
  const response = await fetch('/api/dashboard');
  if (!response.ok) throw new Error('Failed to fetch dashboard data');
  return response.json();
};

const RAW_PROD_DATA = [
  { product: 'A_31', line: 'T010305', target: 200, current: 180 },
  { product: 'A_31', line: 'T010306', target: 300, current: 290 },
  { product: 'A_31', line: 'T050304', target: 250, current: 200 },
  { product: 'A_31', line: 'T050307', target: 250, current: 240 },
  { product: 'T_31', line: 'T100304', target: 500, current: 400 },
  { product: 'T_31', line: 'T100306', target: 500, current: 480 },
  { product: 'O_31', line: 'T100304', target: 400, current: 350 },
  { product: 'O_31', line: 'T100306', target: 600, current: 580 },
];

export const fetchProductionData = async (product, line) => {
  if (USE_MOCK) {
    await delay(600); // Simulate 600ms network delay
    
    // Create a deep copy to avoid mutating the original mock data
    const dynamicMock = JSON.parse(JSON.stringify(productionMockData));
    
    // 1. Update Lot ID based on product and line
    const prodCode = product === 'All' ? 'MIX' : product;
    const lineCode = line === 'All' ? 'ALL' : line.slice(-3);
    dynamicMock.lotInfo.lotId = `LOT-${prodCode}-${lineCode}-${Math.floor(Math.random() * 1000)}`;
    
    // 2. Change equipment details based on product
    if (product === 'T_31') {
      dynamicMock.equipmentDetails.temperature = 28.3;
      dynamicMock.equipmentDetails.pressure = 1.5;
    } else if (product === 'O_31') {
      dynamicMock.equipmentDetails.temperature = 22.1;
      dynamicMock.equipmentDetails.pressure = 1.1;
    }
    
    // 3. Aggregate quantities based on product and line
    let filtered = RAW_PROD_DATA;
    if (product !== 'All') filtered = filtered.filter(d => d.product === product);
    if (line !== 'All') filtered = filtered.filter(d => d.line === line);

    const totalTarget = filtered.reduce((sum, item) => sum + item.target, 0);
    const totalCurrent = filtered.reduce((sum, item) => sum + item.current, 0);

    dynamicMock.lotInfo.targetQuantity = totalTarget || 0;
    dynamicMock.lotInfo.currentQuantity = totalCurrent || 0;
    
    // 4. Update status based on line or overall progress
    if (line === 'T010306') {
      dynamicMock.lotInfo.status = 'Error';
    } else if (line === 'T100304') {
      dynamicMock.lotInfo.status = 'Warning';
      dynamicMock.equipmentDetails.vibration = 0.15;
    } else {
      dynamicMock.lotInfo.status = 'Running';
    }
    
    return dynamicMock;
  }
  
  // Real API call would go here
  const response = await fetch(`/api/production?product=${product}&line=${line}`);
  if (!response.ok) throw new Error('Failed to fetch production data');
  return response.json();
};

export const fetchWorkOrders = async () => {
  if (USE_MOCK) {
    await delay(700);
    return workOrdersMockData;
  }
  const response = await fetch('/api/work-orders');
  if (!response.ok) throw new Error('Failed to fetch work orders');
  return response.json();
};

export const fetchAIPredictions = async (product) => {
  if (USE_MOCK) {
    await delay(750);
    const dynamicMock = JSON.parse(JSON.stringify(aiPredictionMockData));
    dynamicMock.predictions = dynamicMock.predictions.filter(p => p.product === product);
    return dynamicMock;
  }
  const response = await fetch(`/api/ai-predictions?product=${product}`);
  if (!response.ok) throw new Error('Failed to fetch AI predictions');
  return response.json();
};

export const fetchAlarms = async () => {
  if (USE_MOCK) {
    await delay(500);
    return alarmHistoryMockData;
  }
  const response = await fetch('/api/alarms');
  if (!response.ok) throw new Error('Failed to fetch alarms');
  return response.json();
};

export const fetchStatistics = async () => {
  if (USE_MOCK) {
    await delay(800);
    return statisticsMockData;
  }
  const response = await fetch('/api/statistics');
  if (!response.ok) throw new Error('Failed to fetch statistics');
  return response.json();
};

export const fetchEquipment = async () => {
  if (USE_MOCK) {
    await delay(650);
    return equipmentMockData;
  }
  const response = await fetch('/api/equipment');
  if (!response.ok) throw new Error('Failed to fetch equipment data');
  return response.json();
};

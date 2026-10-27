export type ProjectStatus = 'on_track' | 'at_risk' | 'delayed' | 'completed';

export type ShortageStatus = 
  | 'reported'
  | 'procurement_in_progress'
  | 'delivery_confirmed'
  | 'received'
  | 'resolved';

export interface Project {
  id: string;
  name: string;
  capacityKw: number; // e.g. 100, 250, 500, 1000
  capacityDisplay: string; // e.g. "100 kW", "1 MW"
  location: string;
  projectManager: string;
  purchasingLead: string;
  startDate: string; // YYYY-MM-DD
  plannedCompletionDate: string; // YYYY-MM-DD
  actualCompletionDate?: string;
  description?: string;
}

export interface EstimateHistoryItem {
  id: string;
  previousDays: number;
  newDays: number;
  changedAt: string; // ISO timestamp
  changedBy: string;
  reason?: string;
}

export interface MaterialShortage {
  id: string;
  projectId: string;
  materialName: string;
  category: 'Modules' | 'Inverters' | 'Mounting Structures' | 'DC/AC Cables' | 'Transformers & Switchgears' | 'Safety & Balance of System';
  quantityRequired: number;
  quantityAvailable: number;
  unit: string; // 'pcs', 'meters', 'sets', 'kg'
  dateNeeded: string; // YYYY-MM-DD
  remainingInstallationDays: number;
  scheduleBufferDays: number;
  expectedDeliveryDays: number;
  responsiblePurchasing: string;
  status: ShortageStatus;
  dateReported: string; // ISO timestamp
  photoUrl?: string;
  notes?: string;
  estimateHistory: EstimateHistoryItem[];
  resolvedAt?: string;
}

export interface NotificationItem {
  id: string;
  projectId?: string;
  projectName?: string;
  materialName?: string;
  title: string;
  message: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  previousEstimate?: number;
  newEstimate?: number;
  estimatedDelay?: number;
  timestamp: string; // ISO timestamp
  isRead: boolean;
  linkTab?: string;
  linkId?: string;
}

export interface HistoricalProject {
  id: string;
  name: string;
  capacityKw: number;
  capacityDisplay: string;
  location: string;
  startDate: string;
  completionDate: string;
  daysLostToShortages: number;
  totalDays: number; // calculated from startDate to completionDate
  keyLessons?: string;
}

export interface DelayCalculationResult {
  expectedDeliveryDays: number;
  remainingInstallationDays: number;
  scheduleBufferDays: number;
  estimatedDelayDays: number;
  riskStatus: 'on_track' | 'at_risk' | 'delayed';
  projectedCompletionDate: string;
  explanation: string;
}

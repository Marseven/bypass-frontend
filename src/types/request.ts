export interface BypassRequest {
  id: string;
  requestNumber: string; // Format: BYP-YYYY-NNNN
  
  // Equipment & Sensor Information
  equipmentId: string;
  equipmentName: string;
  sensorId: string;
  sensorName: string;
  sensorType: string;
  zone: string;
  
  // Request Details
  initiatorId: string;
  initiatorName: string;
  initiatorDepartment: string;
  requestedDate: Date;
  plannedStartDate: Date;
  estimatedDuration: number; // in hours
  plannedEndDate: Date;
  
  // Business Justification
  reason: BypassReason;
  detailedJustification: string;
  maintenanceWorkOrder?: string;
  urgencyLevel: UrgencyLevel;
  riskAssessment: RiskAssessment;
  
  // Approval Workflow
  currentStatus: RequestStatus;
  approvalLevel: ApprovalLevel;
  approvals: Approval[];
  comments: RequestComment[];
  
  // Dual Validation Fields (for critical/emergency requests)
  validated_by_level1_id?: number | null;
  validated_at_level1?: string | null;
  validation_status_level1?: 'pending' | 'approved' | 'rejected';
  rejection_reason_level1?: string | null;
  validator_level1?: {
    id: number;
    full_name: string;
    email: string;
  } | null;
  
  validated_by_level2_id?: number | null;
  validated_at_level2?: string | null;
  validation_status_level2?: 'pending' | 'approved' | 'rejected';
  rejection_reason_level2?: string | null;
  validator_level2?: {
    id: number;
    full_name: string;
    email: string;
  } | null;
  
  // Legacy validation fields (for backward compatibility)
  validated_by_id?: number | null;
  validated_at?: string | null;
  
  // Audit Trail
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  completedAt?: Date;
  
  // Documents
  attachments: Attachment[];
  
  // Notifications
  notifications: NotificationLog[];
}

export interface Approval {
  id: string;
  requestId: string;
  approverId: string;
  approverName: string;
  approverRole: string;
  level: 1 | 2 | 3;
  decision: ApprovalDecision;
  comments?: string;
  conditions?: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

export interface RequestComment {
  id: string;
  requestId: string;
  userId: string;
  userName: string;
  userRole: string;
  content: string;
  isInternal: boolean;
  timestamp: Date;
  editedAt?: Date;
}

export interface RiskAssessment {
  safetyImpact: RiskLevel;
  operationalImpact: RiskLevel;
  environmentalImpact: RiskLevel;
  overallRisk: RiskLevel;
  mitigationMeasures: string[];
  contingencyPlan?: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
  url: string;
}

export interface NotificationLog {
  id: string;
  requestId: string;
  recipientId: string;
  recipientEmail: string;
  type: NotificationType;
  subject: string;
  content: string;
  sentAt: Date;
  deliveryStatus: 'sent' | 'delivered' | 'failed' | 'bounced';
  readAt?: Date;
}

// Enums and Types
export type RequestStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review_l1'
  | 'under_review_l2'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'expired'
  | 'active'
  | 'completed';

export type ApprovalLevel = 1 | 2 | 3;

export type ApprovalDecision = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'approved_with_conditions'
  | 'escalated';

export type BypassReason = 
  | 'preventive_maintenance'
  | 'corrective_maintenance'
  | 'calibration'
  | 'testing'
  | 'emergency_repair'
  | 'system_upgrade'
  | 'investigation'
  | 'other';

export type UrgencyLevel = 
  | 'low'
  | 'normal'
  | 'high'
  | 'critical'
  | 'emergency';

export type RiskLevel = 
  | 'very_low'
  | 'low'
  | 'medium'
  | 'high'
  | 'very_high';

export type NotificationType = 
  | 'request_submitted'
  | 'approval_required'
  | 'request_approved'
  | 'request_rejected'
  | 'request_escalated'
  | 'bypass_activated'
  | 'bypass_expiring'
  | 'bypass_expired'
  | 'comment_added';
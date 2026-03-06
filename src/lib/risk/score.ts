/**
 * Risk Scoring Engine
 * 
 * Deterministic risk scoring based on multiple signals:
 * - Auth failures
 * - Posture status (managed/unmanaged)
 * - Location mismatch
 * - After-hours use
 * - Step-up authentication status
 * - Device identity correlation
 * 
 * Outputs:
 * - riskScore (0-100)
 * - riskLevel (low | medium | high | critical)
 * - reasons[]
 */

import { DeviceIdentity } from '../identity/deviceIdentity';

// ============================================================================
// Types
// ============================================================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskScore {
  riskScore: number;          // 0-100
  riskLevel: RiskLevel;       // Derived from score
  reasons: RiskReason[];      // Explanation of score
  factors: RiskFactor[];      // Individual scoring factors
  computedAt: string;         // Timestamp
}

export interface RiskReason {
  factor: string;
  score: number;
  description: string;
}

export interface RiskFactor {
  name: string;
  weight: number;
  value: boolean | number | string;
  contribution: number;
}

export interface RiskInput {
  // Auth-related
  authFailuresCount?: number;
  recentAuthFailures?: number;
  
  // Device status
  deviceIdentity?: DeviceIdentity | null;
  isManaged?: boolean;
  correlationScore?: number;
  
  // Posture
  postureStatus?: 'compliant' | 'non_compliant' | 'unknown' | 'missing';
  postureLastCheckAge?: number; // ms since last check
  
  // Location
  locationZone?: string;
  expectedZone?: string;
  locationMismatch?: boolean;
  
  // Time-based
  eventTimestamp?: string; // ISO timestamp
  isAfterHours?: boolean;
  
  // Authentication
  hasStepUpAuth?: boolean;
  stepUpAuthMethod?: string;
  
  // Network
  networkSource?: string;
  isVpn?: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

// Risk factor weights
const WEIGHTS = {
  AUTH_FAILURES: 40,           // Repeated auth failures
  UNMANAGED_DEVICE: 25,        // Unknown/unmanaged device
  AFTER_HOURS: 20,             // After-hours use
  LOCATION_MISMATCH: 20,       // Unexpected location zone
  NO_POSTURE: 15,              // No/missing posture check
  NO_STEP_UP: 10,             // Missing WebAuthn step-up
  LOW_CORRELATION: 15,        // Low device identity correlation
  NON_COMPLIANT: 20,          // Policy non-compliant
  VPN_DETECTED: -10,          // VPN reduces risk (negative = reduces score)
};

// Business hours configuration
const BUSINESS_HOURS_START = 9;  // 9 AM
const BUSINESS_HOURS_END = 18;  // 6 PM

// Risk thresholds
const RISK_THRESHOLDS = {
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  CRITICAL: 90,
};

// ============================================================================
// Risk Scoring Functions
// ============================================================================

/**
 * Calculate risk score based on input signals
 */
export function calculateRiskScore(input: RiskInput): RiskScore {
  const factors: RiskFactor[] = [];
  const reasons: RiskReason[] = [];
  let totalScore = 0;
  
  // 1. Auth failures (+40 max)
  if (input.authFailuresCount && input.authFailuresCount > 0) {
    const failures = Math.min(input.authFailuresCount, 4); // Cap at 4 failures
    const contribution = failures * (WEIGHTS.AUTH_FAILURES / 4);
    factors.push({
      name: 'auth_failures',
      weight: WEIGHTS.AUTH_FAILURES,
      value: failures,
      contribution,
    });
    totalScore += contribution;
    
    if (failures >= 3) {
      reasons.push({
        factor: 'auth_failures',
        score: contribution,
        description: `${failures} recent authentication failures`,
      });
    }
  }
  
  // 2. Unmanaged device (+25)
  if (!input.isManaged && input.deviceIdentity === null) {
    const contribution = WEIGHTS.UNMANAGED_DEVICE;
    factors.push({
      name: 'unmanaged_device',
      weight: WEIGHTS.UNMANAGED_DEVICE,
      value: true,
      contribution,
    });
    totalScore += contribution;
    
    reasons.push({
      factor: 'unmanaged_device',
      score: contribution,
      description: 'Device not enrolled in management',
    });
  } else if (!input.isManaged) {
    // Partially managed
    const contribution = WEIGHTS.UNMANAGED_DEVICE / 2;
    factors.push({
      name: 'unmanaged_device',
      weight: WEIGHTS.UNMANAGED_DEVICE,
      value: 'partial',
      contribution,
    });
    totalScore += contribution;
  }
  
  // 3. After-hours use (+20)
  const isAfterHours = input.isAfterHours ?? checkAfterHours(input.eventTimestamp);
  if (isAfterHours) {
    const contribution = WEIGHTS.AFTER_HOURS;
    factors.push({
      name: 'after_hours',
      weight: WEIGHTS.AFTER_HOURS,
      value: true,
      contribution,
    });
    totalScore += contribution;
    
    reasons.push({
      factor: 'after_hours',
      score: contribution,
      description: 'Access outside business hours',
    });
  }
  
  // 4. Location mismatch (+20)
  if (input.locationMismatch || (input.locationZone && input.expectedZone && input.locationZone !== input.expectedZone)) {
    const contribution = WEIGHTS.LOCATION_MISMATCH;
    factors.push({
      name: 'location_mismatch',
      weight: WEIGHTS.LOCATION_MISMATCH,
      value: `${input.locationZone} != ${input.expectedZone}`,
      contribution,
    });
    totalScore += contribution;
    
    reasons.push({
      factor: 'location_mismatch',
      score: contribution,
      description: `Unexpected location: ${input.locationZone}`,
    });
  }
  
  // 5. Missing posture (+15)
  if (input.postureStatus === 'unknown' || input.postureStatus === 'missing') {
    const contribution = WEIGHTS.NO_POSTURE;
    factors.push({
      name: 'no_posture',
      weight: WEIGHTS.NO_POSTURE,
      value: input.postureStatus,
      contribution,
    });
    totalScore += contribution;
    
    reasons.push({
      factor: 'no_posture',
      score: contribution,
      description: 'Device posture not verified',
    });
  }
  
  // 6. Non-compliant posture (+20)
  if (input.postureStatus === 'non_compliant') {
    const contribution = WEIGHTS.NON_COMPLIANT;
    factors.push({
      name: 'non_compliant',
      weight: WEIGHTS.NON_COMPLIANT,
      value: input.postureStatus,
      contribution,
    });
    totalScore += contribution;
    
    reasons.push({
      factor: 'non_compliant',
      score: contribution,
      description: 'Device does not meet compliance requirements',
    });
  }
  
  // 7. No step-up auth (+10)
  if (!input.hasStepUpAuth) {
    const contribution = WEIGHTS.NO_STEP_UP;
    factors.push({
      name: 'no_step_up',
      weight: WEIGHTS.NO_STEP_UP,
      value: true,
      contribution,
    });
    totalScore += contribution;
    
    reasons.push({
      factor: 'no_step_up',
      score: contribution,
      description: 'Step-up authentication not performed',
    });
  }
  
  // 8. Low correlation score (+15)
  if (input.deviceIdentity && input.correlationScore !== undefined && input.correlationScore < 50) {
    const contribution = WEIGHTS.LOW_CORRELATION;
    factors.push({
      name: 'low_correlation',
      weight: WEIGHTS.LOW_CORRELATION,
      value: input.correlationScore,
      contribution,
    });
    totalScore += contribution;
    
    reasons.push({
      factor: 'low_correlation',
      score: contribution,
      description: `Low device identity confidence: ${input.correlationScore}%`,
    });
  }
  
  // 9. VPN detected (-10, reduces risk)
  if (input.isVpn) {
    const contribution = WEIGHTS.VPN_DETECTED;
    factors.push({
      name: 'vpn_detected',
      weight: WEIGHTS.VPN_DETECTED,
      value: true,
      contribution,
    });
    totalScore = Math.max(0, totalScore + contribution); // Can't go below 0
    
    // Don't add reason for VPN - it's a positive factor
  }
  
  // Ensure score is 0-100
  totalScore = Math.min(100, Math.max(0, Math.round(totalScore)));
  
  // Determine risk level
  const riskLevel = getRiskLevel(totalScore);
  
  return {
    riskScore: totalScore,
    riskLevel,
    reasons,
    factors,
    computedAt: new Date().toISOString(),
  };
}

/**
 * Check if timestamp is outside business hours
 */
function checkAfterHours(timestamp?: string): boolean {
  if (!timestamp) return false;
  
  const date = new Date(timestamp);
  const hour = date.getHours();
  
  // Weekend check
  const day = date.getDay();
  if (day === 0 || day === 6) return true;
  
  // Outside business hours
  return hour < BUSINESS_HOURS_START || hour >= BUSINESS_HOURS_END;
}

/**
 * Determine risk level from score
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= RISK_THRESHOLDS.CRITICAL) return 'critical';
  if (score >= RISK_THRESHOLDS.HIGH) return 'high';
  if (score >= RISK_THRESHOLDS.MEDIUM) return 'medium';
  return 'low';
}

/**
 * Check if risk score requires action
 */
export function requiresAction(riskScore: RiskScore, action: 'quarantine' | 'ticket' | 'step_up'): boolean {
  switch (action) {
    case 'quarantine':
      return riskScore.riskScore >= 70;
    case 'ticket':
      return riskScore.riskScore >= 50;
    case 'step_up':
      return riskScore.riskScore >= 40;
    default:
      return false;
  }
}

/**
 * Get recommended actions based on risk score
 */
export function getRecommendedActions(riskScore: RiskScore): string[] {
  const actions: string[] = [];
  
  if (riskScore.riskScore >= 70) {
    actions.push('quarantine_device', 'notify_admin');
  }
  
  if (riskScore.riskScore >= 50) {
    actions.push('send_itsm_ticket');
  }
  
  if (riskScore.riskScore >= 40) {
    actions.push('require_step_up_auth');
  }
  
  if (riskScore.riskScore >= 25) {
    actions.push('emit_siem_event');
  }
  
  return actions;
}

// ============================================================================
// Policy Context Integration
// ============================================================================

/**
 * Create risk context for policy evaluation
 */
export function createRiskContext(riskScore: RiskScore): Record<string, unknown> {
  return {
    risk: {
      score: riskScore.riskScore,
      level: riskScore.riskLevel,
      reasons: riskScore.reasons.map(r => r.description),
      computedAt: riskScore.computedAt,
    },
  };
}

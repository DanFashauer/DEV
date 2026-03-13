/**
 * Seed Policies Script
 * 
 * Creates demo policies for testing the Policy Engine
 * Run with: bun run seed:policies
 */

import { createPolicy, listPolicies } from '../src/lib/policy/store/policyStore';

const DEMO_POLICIES = [
  {
    name: 'Nurse Badge in ER - Launch Epic + Log + SIEM',
    description: 'When a nurse badge is tapped in the ER zone, launch Epic EHR and log to SIEM',
    enabled: true,
    priority: 10,
    conditions: [
      {
        field: 'user.roles',
        operator: 'in' as const,
        value: ['nurse', 'doctor', 'physician'],
      },
      {
        field: 'location.zone',
        operator: 'eq' as const,
        value: 'ER',
      },
      {
        field: 'event.type',
        operator: 'eq' as const,
        value: 'session.start',
      },
    ],
    actions: [
      {
        type: 'launch_app',
        params: {
          appBundleId: 'com.epic.ezyaccess',
          appName: 'Epic EHR',
        },
      },
      {
        type: 'emit_siem_event',
        params: {
          eventType: 'session.start',
          severity: 'info',
        },
      },
    ],
  },
  {
    name: 'Auth Failure Spike - Create ServiceNow Incident',
    description: 'Create a ServiceNow incident when authentication fails 3+ times in 5 minutes',
    enabled: true,
    priority: 50,
    conditions: [
      {
        field: 'event.type',
        operator: 'eq' as const,
        value: 'auth.failure',
      },
      {
        field: 'metadata.failureCount',
        operator: 'gte' as const,
        value: 3,
      },
    ],
    actions: [
      {
        type: 'send_itsm_ticket',
        params: {
          title: 'Authentication Failure Spike Detected',
          description: 'Multiple authentication failures detected for device {{device.deviceId}}',
          severity: 'high',
          category: 'authentication_failure',
        },
      },
      {
        type: 'emit_siem_event',
        params: {
          eventType: 'auth.failure',
          severity: 'high',
        },
      },
      {
        type: 'notify_admin',
        params: {
          subject: 'Auth Failure Alert',
          priority: 'high',
        },
      },
    ],
  },
  {
    name: 'After-Hours Device Movement - Alert + Ticket',
    description: 'Alert when a device moves outside approved zones during off-hours',
    enabled: true,
    priority: 30,
    conditions: [
      {
        field: 'event.type',
        operator: 'eq' as const,
        value: 'location.violation',
      },
      {
        field: 'location.timestamp',
        operator: 'after_hours' as any, // Would need custom operator
        value: '22:00',
      },
    ],
    actions: [
      {
        type: 'send_itsm_ticket',
        params: {
          title: 'After-Hours Location Violation',
          description: 'Device {{device.deviceId}} detected in {{location.zone}} outside approved hours',
          severity: 'medium',
          category: 'location_violation',
        },
      },
      {
        type: 'emit_siem_event',
        params: {
          eventType: 'location.violation',
          severity: 'medium',
        },
      },
    ],
  },
  {
    name: 'High-Value Asset Access - Enhanced Logging',
    description: 'Enhanced SIEM logging when accessing high-value assets',
    enabled: true,
    priority: 20,
    conditions: [
      {
        field: 'device.tags',
        operator: 'in' as const,
        value: ['high-value', 'confidential', 'pci'],
      },
      {
        field: 'event.type',
        operator: 'in' as const,
        value: ['session.start', 'session.end'],
      },
    ],
    actions: [
      {
        type: 'emit_siem_event',
        params: {
          eventType: 'session.start',
          severity: 'high',
        },
      },
    ],
  },
  {
    name: 'New Badge Enrollment - Notify Security',
    description: 'Notify security team when a new badge is enrolled',
    enabled: true,
    priority: 40,
    conditions: [
      {
        field: 'event.type',
        operator: 'eq' as const,
        value: 'badge.enroll',
      },
    ],
    actions: [
      {
        type: 'send_itsm_ticket',
        params: {
          title: 'New Badge Enrolled',
          description: 'New badge {{badge.badgeUid}} enrolled for user {{user.userId}}',
          severity: 'low',
          category: 'access_issue',
        },
      },
      {
        type: 'emit_siem_event',
        params: {
          eventType: 'badge.enroll',
          severity: 'info',
        },
      },
    ],
  },
  {
    name: 'Quarantine High-Risk Device',
    description: 'Quarantine device if compliance status is non-compliant',
    enabled: true, // Enabled for demo
    priority: 100,
    conditions: [
      {
        field: 'device.complianceStatus',
        operator: 'eq' as const,
        value: 'non_compliant',
      },
    ],
    actions: [
      {
        type: 'quarantine_device',
        params: {
          reason: 'Device compliance check failed',
          vlan: 'QUARANTINE',
        },
      },
      {
        type: 'send_itsm_ticket',
        params: {
          title: 'Device Quarantined - Non-Compliant',
          description: 'Device {{device.deviceId}} has been quarantined due to compliance failure',
          severity: 'high',
          category: 'device_quarantine',
        },
      },
      {
        type: 'emit_siem_event',
        params: {
          eventType: 'device.quarantine',
          severity: 'high',
        },
      },
    ],
  },
  {
    name: 'Session TTL Extension - Executive',
    description: 'Extend session TTL to 12 hours for executives',
    enabled: true,
    priority: 5,
    conditions: [
      {
        field: 'user.roles',
        operator: 'in' as const,
        value: ['executive', 'c-suite', 'vp'],
      },
      {
        field: 'event.type',
        operator: 'eq' as const,
        value: 'session.start',
      },
    ],
    actions: [
      {
        type: 'set_session_ttl',
        params: {
          ttl: 43200, // 12 hours in seconds
        },
      },
    ],
  },
];

async function seedPolicies() {
  console.log('🌱 Seeding policies...\n');

  // First, list existing policies
  const existingPolicies = await listPolicies();
  console.log(`Found ${existingPolicies.length} existing policies`);

  // Create each demo policy
  let created = 0;
  let skipped = 0;

  for (const policyData of DEMO_POLICIES) {
    // Check if policy with same name exists
    const exists = existingPolicies.some(p => p.name === policyData.name);
    
    if (exists) {
      console.log(`⏭️  Skipping "${policyData.name}" (already exists)`);
      skipped++;
      continue;
    }

    try {
      const policy = await createPolicy(policyData);
      console.log(`✅ Created "${policy.name}" (ID: ${policy.id})`);
      created++;
    } catch (error) {
      console.error(`❌ Failed to create "${policyData.name}":`, error);
    }
  }

  console.log(`\n📊 Seeding complete: ${created} created, ${skipped} skipped`);
  
  // List final policies
  const finalPolicies = await listPolicies();
  console.log(`\n📋 Total policies: ${finalPolicies.length}`);
  
  for (const policy of finalPolicies.sort((a, b) => a.priority - b.priority)) {
    console.log(`  - [${policy.enabled ? '✓' : '✗'}] ${policy.name} (priority: ${policy.priority})`);
  }
}

seedPolicies().catch(console.error);

import { appendAuditRecord } from '../../auditLedger';
import type { PolicyContext } from './context';
import type { Policy, PolicyAction } from '../types';
import type { 
  ITSMAdapter, 
  SIEMAdapter, 
  UEMAdapter, 
  NACAdapter,
  NotifyAdapter,
  ITSMTicketRequest,
  SIEMEventRequest,
  AdapterRegistry,
} from '../../integrations/adapters/types';
import { getITSMConfigByVendor, getTicketTemplate, substituteTemplate, type ITSMVendor } from '../../integrations/itsm/store';
import { createITSMAdapter } from '../../integrations/itsm/adapter';

// ============================================================================
// Type Validators - Safe type coercion with validation
// ============================================================================

/**
 * Validate and coerce severity level
 * Returns undefined if value is invalid
 */
function validateSeverity(value: unknown): 'low' | 'medium' | 'high' | undefined {
  const validValues = ['low', 'medium', 'high'];
  if (typeof value === 'string' && validValues.includes(value)) {
    return value as 'low' | 'medium' | 'high';
  }
  return undefined;
}

/**
 * Validate and coerce notification channel
 * Returns undefined if value is invalid
 */
function validateChannel(value: unknown): 'webhook' | 'email' | 'siem' | undefined {
  const validValues = ['webhook', 'email', 'siem'];
  if (typeof value === 'string' && validValues.includes(value)) {
    return value as 'webhook' | 'email' | 'siem';
  }
  return undefined;
}

/**
 * Validate and coerce priority level
 * Returns undefined if value is invalid
 */
function validatePriority(value: unknown): 'low' | 'medium' | 'high' | undefined {
  const validValues = ['low', 'medium', 'high'];
  if (typeof value === 'string' && validValues.includes(value)) {
    return value as 'low' | 'medium' | 'high';
  }
  return undefined;
}

/**
 * Result of dispatching a single action
 */
export interface ActionDispatchResult {
  action: PolicyAction;
  success: boolean;
  error?: string;
  result?: unknown;
  timestamp: string;
}

/**
 * Result of dispatching all actions for a policy
 */
export interface PolicyDispatchResult {
  policyId: string;
  policyName: string;
  matched: boolean;
  actions: ActionDispatchResult[];
  timestamp: string;
  durationMs: number;
}

/**
 * Dispatcher options
 */
export interface DispatcherOptions {
  async?: boolean;
  continueOnError?: boolean;
  timeout?: number;
}

const DEFAULT_OPTIONS: DispatcherOptions = {
  async: false,
  continueOnError: true,
  timeout: 30000,
};

/**
 * Policy Action Dispatcher
 */
export class PolicyActionDispatcher {
  private options: DispatcherOptions;
  private registry: AdapterRegistry;

  constructor(registry: AdapterRegistry, options: DispatcherOptions = DEFAULT_OPTIONS) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.registry = registry;
  }

  /**
   * Dispatch all actions from matched policies
   */
  async dispatch(
    policies: Policy[],
    context: PolicyContext,
    caseId: string
  ): Promise<PolicyDispatchResult[]> {
    const startTime = Date.now();
    const results: PolicyDispatchResult[] = [];

    const eventType = context.event?.type || 'unknown';
    const deviceId = context.device?.deviceId;
    const userId = context.user?.userId;

    // Write policy matched event to audit ledger
    await appendAuditRecord(
      'policy.matched',
      { type: 'system', id: 'policy-engine' },
      {
        meta: { policiesMatched: policies.length, eventType },
        requestId: context.event?.requestId,
      }
    );

    for (const policy of policies) {
      try {
        const policyResult = await this.dispatchPolicy(policy, context, caseId);
        results.push(policyResult);

        for (const actionResult of policyResult.actions) {
          await appendAuditRecord(
            'policy.action.executed',
            { type: 'system', id: 'policy-engine' },
            {
              meta: {
                policyId: policy.id,
                policyName: policy.name,
                actionType: actionResult.action.type,
                success: actionResult.success,
                error: actionResult.error,
              },
              requestId: context.event?.requestId,
            }
          );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Record policy dispatch failure
        await appendAuditRecord(
          'policy.dispatch.failed',
          { type: 'system', id: 'policy-engine' },
          {
            meta: {
              policyId: policy.id,
              policyName: policy.name,
              error: errorMessage,
            },
            requestId: context.event?.requestId,
          }
        );
        
        // Add failed result
        results.push({
          policyId: policy.id || 'unknown',
          policyName: policy.name,
          matched: true,
          actions: [],
          timestamp: new Date().toISOString(),
          durationMs: Date.now() - startTime,
          error: errorMessage,
        });
        
        console.error(`[PolicyDispatch] Failed to dispatch policy ${policy.name}:`, error);
      }
    }

    return results;
  }

  /**
   * Dispatch actions for a single policy
   */
  private async dispatchPolicy(
    policy: Policy,
    context: PolicyContext,
    caseId: string
  ): Promise<PolicyDispatchResult> {
    const actions: ActionDispatchResult[] = [];
    const startTime = Date.now();

    for (const action of policy.actions) {
      const result = await this.dispatchAction(action, context, caseId);
      actions.push(result);

      if (!result.success && !this.options.continueOnError) {
        break;
      }
    }

    return {
      policyId: policy.id || 'unknown',
      policyName: policy.name,
      matched: true,
      actions,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Dispatch a single action to the appropriate adapter
   */
  private async dispatchAction(
    action: PolicyAction,
    context: PolicyContext,
    caseId: string
  ): Promise<ActionDispatchResult> {
    const timestamp = new Date().toISOString();

    try {
      switch (action.type) {
        case 'launch_app':
          return { action, success: true, timestamp };

        case 'set_session_ttl':
          return { action, success: true, timestamp };

        case 'send_itsm_ticket':
          return await this.dispatchITSMTicket(action, context, caseId);

        case 'emit_siem_event':
          return await this.dispatchSIEMEvent(action, context, caseId);

        case 'quarantine_device':
          return await this.dispatchQuarantineDevice(action, context, caseId);

        case 'notify_admin':
          return await this.dispatchNotifyAdmin(action, context, caseId);

        case 'require_step_up_auth':
          return await this.dispatchRequireStepUpAuth(action, context, caseId);

        case 'enforce_posture':
          return await this.dispatchEnforcePosture(action, context, caseId);

        default:
          return { 
            action, 
            success: false, 
            error: `Unknown action type: ${action.type}`,
            timestamp,
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { action, success: false, error: errorMessage, timestamp };
    }
  }

  /**
   * Dispatch ITSM ticket creation
   */
  private async dispatchITSMTicket(
    action: PolicyAction,
    context: PolicyContext,
    caseId: string
  ): Promise<ActionDispatchResult> {
    // Get vendor from params, default to first enabled vendor
    const vendor = (action.params?.vendor as ITSMVendor) || 'servicenow';
    
    // Look up config by vendor
    const config = await getITSMConfigByVendor(vendor);
    if (!config) {
      return {
        action,
        success: false,
        error: `ITSM vendor '${vendor}' not configured`,
        timestamp: new Date().toISOString(),
      };
    }
    
    // Create adapter
    const adapter = createITSMAdapter(vendor, config);
    if (!adapter) {
      return {
        action,
        success: false,
        error: `Failed to create ITSM adapter for '${vendor}'`,
        timestamp: new Date().toISOString(),
      };
    }
    
    // Build variables from context for template substitution
    const variables: Record<string, string> = {
      timestamp: new Date().toISOString(),
      caseId,
      ...this.extractVariablesFromContext(context),
      ...(action.params?.fieldsOverride as Record<string, string> || {}),
    };
    
    // Get template if specified
    const templateId = action.params?.templateId as string;
    let title: string;
    let description: string;
    let severity: ITSMTicketRequest['severity'] = 'medium';
    let category = 'policy_violation';
    
    if (templateId) {
      const template = await getTicketTemplate(templateId);
      if (!template) {
        return {
          action,
          success: false,
          error: `ITSM template '${templateId}' not found`,
          timestamp: new Date().toISOString(),
        };
      }
      
      title = substituteTemplate(template.titleTemplate, variables);
      description = substituteTemplate(template.descriptionTemplate, variables);
      severity = template.severity;
      category = template.category;
    } else {
      title = action.params?.title as string || `Policy Action - ${context.event?.type}`;
      description = action.params?.description as string || this.buildDescription(context, action);
      severity = (action.params?.severity as ITSMTicketRequest['severity']) || 'medium';
      category = action.params?.category as string || 'policy_violation';
    }
    
    // Override with explicit params if provided
    if (action.params?.title) {
      title = action.params.title as string;
    }
    if (action.params?.description) {
      description = action.params.description as string;
    }
    if (action.params?.severity) {
      severity = action.params.severity as ITSMTicketRequest['severity'];
    }
    if (action.params?.category) {
      category = action.params.category as string;
    }
    
    const ticketRequest: ITSMTicketRequest = {
      title,
      description,
      severity,
      category,
      source: 'EnterpriseShell-Policy',
      correlationId: caseId,
      userId: context.user?.userId,
      userEmail: context.user?.email,
      userName: context.user?.name,
      deviceId: context.device?.deviceId,
      deviceName: context.device?.hostname,
      devicePlatform: context.device?.platform,
    };
    
    const result = await adapter.createTicket(ticketRequest);
    
    // Log to audit ledger
    await appendAuditRecord(
      'itsm.ticket.created',
      { type: 'system', id: 'policy-engine' },
      {
        meta: {
          vendor,
          templateId: templateId || 'none',
          ticketId: result.ticketId,
          ticketUrl: result.ticketUrl,
          caseId,
        },
        requestId: context.event?.requestId,
      }
    );
    
    return {
      action,
      success: true,
      result: { ticketId: result.ticketId, ticketUrl: result.ticketUrl, vendor },
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * Extract variables from context for template substitution
   */
  private extractVariablesFromContext(context: PolicyContext): Record<string, string> {
    const vars: Record<string, string> = {};
    
    if (context.user) {
      vars.userId = context.user.userId || '';
      vars.userName = context.user.name || '';
      vars.userEmail = context.user.email || '';
    }
    
    if (context.device) {
      vars.deviceId = context.device.deviceId || '';
      vars.deviceName = context.device.hostname || '';
      vars.devicePlatform = context.device.platform || '';
      vars.serialNumber = context.device.serialNumber || '';
    }
    
    if (context.location) {
      vars.location = context.location.zone || context.location.building || 'Unknown';
      vars.zone = context.location.zone || '';
      vars.building = context.location.building || '';
      vars.floor = context.location.floor || '';
    }
    
    if (context.event) {
      vars.eventType = context.event.type || '';
    }
    
    return vars;
  }

  /**
   * Dispatch SIEM event
   */
  private async dispatchSIEMEvent(
    action: PolicyAction,
    context: PolicyContext,
    caseId: string
  ): Promise<ActionDispatchResult> {
    const adapter = this.registry.siem;
    if (!adapter) {
      return {
        action,
        success: false,
        error: 'SIEM adapter not configured',
        timestamp: new Date().toISOString(),
      };
    }

    const eventRequest: SIEMEventRequest = {
      type: action.params?.eventType || 'policy.matched',
      severity: validateSeverity(action.params?.severity) || 'medium',
      timestamp: new Date().toISOString(),
      actor: context.user ? {
        userId: context.user.userId,
        email: context.user.email,
        name: context.user.name,
      } : undefined,
      device: context.device ? {
        deviceId: context.device.deviceId,
        platform: context.device.platform,
        ip: context.device.ip,
        tags: context.device.tags,
      } : undefined,
      session: context.session ? {
        sessionId: context.session.sessionId,
        startedAt: context.session.startedAt,
        endedAt: context.session.endedAt,
      } : undefined,
      location: context.location ? {
        zone: context.location.zone,
        building: context.location.building,
        floor: context.location.floor,
        coordinates: context.location.coordinates,
      } : undefined,
      caseId,
      requestId: context.event?.requestId,
      customFields: {
        policyId: action.policyId,
        policyName: action.policyName,
        actionType: action.type,
      },
    };

    const result = await adapter.sendEvent(eventRequest);

    return {
      action,
      success: true,
      result: { eventId: result.eventId },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Dispatch device quarantine (via NAC or UEM)
   */
  private async dispatchQuarantineDevice(
    action: PolicyAction,
    context: PolicyContext,
    caseId: string
  ): Promise<ActionDispatchResult> {
    const nacAdapter = this.registry.nac;
    const uemAdapter = this.registry.uem;
    const deviceId = context.device?.deviceId;

    if (!deviceId) {
      return {
        action,
        success: false,
        error: 'No device ID in context',
        timestamp: new Date().toISOString(),
      };
    }

    // Try NAC first, then UEM
    if (nacAdapter && nacAdapter.quarantineEndpoint) {
      try {
        const result = await nacAdapter.quarantineEndpoint({
          deviceId,
          action: 'quarantine',
          reason: action.params?.reason || `Policy action: ${action.policyName || 'quarantine'}`,
          duration: action.params?.duration as number,
          vlan: action.params?.vlan as string,
          correlationId: context.event?.requestId,
          caseId,
        });
        
        return {
          action,
          success: result.status !== 'failed',
          result,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        // Continue to UEM fallback
      }
    }

    // Fall back to UEM
    if (uemAdapter && uemAdapter.quarantine) {
      try {
        const result = await uemAdapter.quarantine({
          deviceId,
          action: 'quarantine',
          reason: action.params?.reason as string,
          correlationId: context.event?.requestId,
        });

        return {
          action,
          success: result.status !== 'failed',
          result,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          action,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        };
      }
    }

    return {
      action,
      success: false,
      error: 'Neither NAC nor UEM adapter configured',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Dispatch admin notification
   */
  private async dispatchNotifyAdmin(
    action: PolicyAction,
    context: PolicyContext,
    caseId: string
  ): Promise<ActionDispatchResult> {
    const adapter = this.registry.notify;
    if (!adapter) {
      return {
        action,
        success: false,
        error: 'Notify adapter not configured',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const result = await adapter.notify({
        channel: validateChannel(action.params?.channel) || 'webhook',
        recipients: (action.params?.recipients as string[]) || [],
        subject: action.params?.subject as string || `Policy Alert: ${action.policyName || context.event?.type}`,
        message: this.buildDescription(context, action),
        priority: validatePriority(action.params?.priority) || 'high',
        correlationId: context.event?.requestId,
        caseId,
      });

      return {
        action,
        success: result.status !== 'failed',
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        action,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Dispatch require step-up auth action
   * Returns a directive to require WebAuthn/FIDO2 verification
   */
  private async dispatchRequireStepUpAuth(
    action: PolicyAction,
    context: PolicyContext,
    caseId: string
  ): Promise<ActionDispatchResult> {
    const method = action.params?.method as string || 'webauthn';
    const ttlSeconds = action.params?.ttlSeconds as number || 300;

    // This action is handled at the session/auth layer
    // The dispatcher returns success with the step-up directive
    return {
      action,
      success: true,
      result: {
        requireStepUp: true,
        method,
        ttlSeconds,
        reason: action.params?.reason as string || `Policy requires step-up: ${action.policyName}`,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Dispatch enforce posture action
   * Validates device compliance and takes action based on result
   */
  private async dispatchEnforcePosture(
    action: PolicyAction,
    context: PolicyContext,
    caseId: string
  ): Promise<ActionDispatchResult> {
    const deviceId = context.device?.deviceId;
    const requireCompliant = action.params?.requireCompliant !== false;
    const onFail = action.params?.onFail as string || 'notify_admin';

    // Check current posture from context
    const posture = context.device?.posture as { compliant?: boolean; lastCheckAt?: string } | undefined;
    const isCompliant = posture?.compliant ?? false;
    const hasPosture = !!posture?.lastCheckAt;

    // TELEMETRY_MODE=required means no posture = non-compliant
    const telemetryMode = process.env.TELEMETRY_MODE;
    const postureMissing = !hasPosture && telemetryMode === 'required';

    if (!isCompliant || postureMissing) {
      // Take action on failure
      switch (onFail) {
        case 'quarantine_device':
          return await this.dispatchQuarantineDevice(action, context, caseId);
        case 'send_itsm_ticket':
          return await this.dispatchITSMTicket(action, context, caseId);
        case 'notify_admin':
          return await this.dispatchNotifyAdmin(action, context, caseId);
        default:
          return {
            action,
            success: false,
            error: `Unknown onFail action: ${onFail}`,
            timestamp: new Date().toISOString(),
          };
      }
    }

    // Device is compliant or posture is optional
    return {
      action,
      success: true,
      result: {
        postureCheck: 'passed',
        compliant: isCompliant,
        postureSource: posture ? 'context' : 'not_required',
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Build description for ITSM ticket/notification
   */
  private buildDescription(context: PolicyContext, action: PolicyAction): string {
    const lines: string[] = [
      `Event: ${context.event?.type}`,
      `Timestamp: ${context.event?.timestamp || new Date().toISOString()}`,
      `Case ID: ${context.caseId}`,
    ];

    if (context.user) {
      lines.push(`User: ${context.user.name || context.user.userId}${context.user.email ? ` (${context.user.email})` : ''}`);
    }

    if (context.device) {
      lines.push(`Device: ${context.device.deviceId}${context.device.hostname ? ` - ${context.device.hostname}` : ''}`);
      if (context.device.platform) {
        lines.push(`Platform: ${context.device.platform}`);
      }
    }

    if (context.session) {
      lines.push(`Session: ${context.session.sessionId}`);
      if (context.session.appName) {
        lines.push(`App: ${context.session.appName}`);
      }
    }

    if (context.location) {
      lines.push(`Location: ${[context.location.building, context.location.floor, context.location.zone].filter(Boolean).join(' / ')}`);
    }

    lines.push('');
    lines.push(`Policy Action: ${action.type}`);
    if (action.policyName) {
      lines.push(`Policy: ${action.policyName}`);
    }

    return lines.join('\n');
  }
}

// Default registry
let defaultRegistry: AdapterRegistry = {
  itsm: null,
  siem: null,
  uem: null,
  nac: null,
  notify: null,
};

let defaultDispatcher: PolicyActionDispatcher | null = null;

/**
 * Set the adapter registry
 */
export function setAdapterRegistry(registry: AdapterRegistry): void {
  defaultRegistry = registry;
  defaultDispatcher = null;
}

/**
 * Get the default dispatcher instance
 */
export function getDispatcher(): PolicyActionDispatcher {
  if (!defaultDispatcher) {
    defaultDispatcher = new PolicyActionDispatcher(defaultRegistry);
  }
  return defaultDispatcher;
}

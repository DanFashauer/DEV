import { z } from "zod";

export const ConditionSchema = z.object({
  field: z.string(), // e.g., "device.role", "user.role", "location.zone"
  operator: z.enum(["eq", "neq", "in", "gt", "lt"]),
  value: z.any(),
});

export const ActionSchema = z.object({
  type: z.enum([
    "launch_app",
    "set_session_ttl",
    "send_itsm_ticket",
    "emit_siem_event",
    "quarantine_device",
    "notify_admin",
  ]),
  params: z.record(z.any()).optional(),
});

export const PolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean().default(true),
  priority: z.number().default(100),
  conditions: z.array(ConditionSchema),
  actions: z.array(ActionSchema),
});

export type Policy = z.infer<typeof PolicySchema>;
export type Condition = z.infer<typeof ConditionSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type PolicyContext = Record<string, unknown>;

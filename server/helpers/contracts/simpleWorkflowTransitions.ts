/**
 * Helper for managing simplified system workflow transitions
 * 
 * This helper defines and validates allowed transitions between
 * different statuses of simplified contracts.
 */

import { TRPCError } from "@trpc/server";

// ============================================================================
// TYPES
// ============================================================================

export type ContractStatus =
  | "draft"
  | "pending_admin_review"
  | "completed"
  | "active"
  | "cancelled"
  | "paused"
  | "terminated";

export type WorkflowAction =
  | "submit_for_review"
  | "admin_approve"
  | "admin_reject"
  | "activate"
  | "pause"
  | "resume"
  | "terminate"
  | "cancel";

export interface WorkflowTransition {
  from: ContractStatus;
  to: ContractStatus;
  action: WorkflowAction;
  requiresPermission?: string;
  description: string;
}

// ============================================================================
// ALLOWED TRANSITIONS (Simplified Workflow)
// ============================================================================

/**
 * Defines allowed transitions in simplified workflow
 * 
 * Workflow:
 * 1. draft → pending_admin_review (submit_for_review)
 * 2. pending_admin_review → completed (admin_approve)
 * 3. pending_admin_review → draft (admin_reject)
 * 4. completed → active (activate)
 * 5. active → paused (pause)
 * 6. paused → active (resume)
 * 7. active → terminated (terminate)
 * 8. * → cancelled (cancel - from any status)
 */
export const SIMPLE_WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  {
    from: "draft",
    to: "pending_admin_review",
    action: "submit_for_review",
    requiresPermission: "contracts.update",
    description: "Submit contract for admin validation",
  },
  {
    from: "pending_admin_review",
    to: "completed",
    action: "admin_approve",
    requiresPermission: "contracts.approve",
    description: "Approve contract (admin)",
  },
  {
    from: "pending_admin_review",
    to: "draft",
    action: "admin_reject",
    requiresPermission: "contracts.approve",
    description: "Reject contract and return to draft",
  },
  {
    from: "completed",
    to: "active",
    action: "activate",
    requiresPermission: "contracts.approve",
    description: "Activate contract",
  },
  {
    from: "active",
    to: "paused",
    action: "pause",
    requiresPermission: "contracts.update",
    description: "Pause contract",
  },
  {
    from: "paused",
    to: "active",
    action: "resume",
    requiresPermission: "contracts.update",
    description: "Resume paused contract",
  },
  {
    from: "active",
    to: "terminated",
    action: "terminate",
    requiresPermission: "contracts.update",
    description: "Terminate contract",
  },
];

// ============================================================================
// FONCTIONS DE VALIDATION
// ============================================================================

/**
 * Checks if a transition is allowed
 * 
 * @param from - Starting status
 * @param to - Target status
 * @param action - Action to perform
 * @returns true if transition is allowed
 * 
 * @example
 * isTransitionAllowed("draft", "pending_admin_review", "submit_for_review") // true
 * isTransitionAllowed("draft", "active", "activate") // false
 */
export function isTransitionAllowed(
  from: ContractStatus,
  to: ContractStatus,
  action: WorkflowAction
): boolean {
  return SIMPLE_WORKFLOW_TRANSITIONS.some(
    (t) => t.from === from && t.to === to && t.action === action
  );
}

/**
 * Validates a transition and throws error if not allowed
 * 
 * @param from - Starting status
 * @param to - Target status
 * @param action - Action to perform
 * @throws TRPCError if transition not allowed
 * 
 * @example
 * validateTransition("draft", "pending_admin_review", "submit_for_review");
 */
export function validateTransition(
  from: ContractStatus,
  to: ContractStatus,
  action: WorkflowAction
): void {
  if (!isTransitionAllowed(from, to, action)) {
    const availableTransitions = getAvailableTransitions(from);
    const availableActions = availableTransitions.map((t) => t.action).join(", ");

    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        `Transition not allowed: ${from} → ${to} via ${action}. ` +
        `Available actions from ${from}: ${availableActions || "none"}.`,
    });
  }
}

/**
 * Retrieves possible transitions from a given status
 * 
 * @param currentStatus - Current contract status
 * @returns List of possible transitions
 * 
 * @example
 * const transitions = getAvailableTransitions("draft");
 * // [{ from: "draft", to: "pending_admin_review", action: "submit_for_review", ... }]
 */
export function getAvailableTransitions(
  currentStatus: ContractStatus
): WorkflowTransition[] {
  return SIMPLE_WORKFLOW_TRANSITIONS.filter((t) => t.from === currentStatus);
}

/**
 * Retrieves transition corresponding to an action from a status
 * 
 * @param currentStatus - Statut actuel
 * @param action - Action to perform
 * @returns Found transition or undefined
 * 
 * @example
 * const transition = getTransitionByAction("draft", "submit_for_review");
 */
export function getTransitionByAction(
  currentStatus: ContractStatus,
  action: WorkflowAction
): WorkflowTransition | undefined {
  return SIMPLE_WORKFLOW_TRANSITIONS.find(
    (t) => t.from === currentStatus && t.action === action
  );
}

// ============================================================================
// STATUS HELPERS
// ============================================================================

/**
 * Checks if a contract is in draft
 * 
 * @param contract - Contract to check
 * @returns true if contract is in draft
 */
export function isDraft(contract: { status: string; workflowStatus?: string }): boolean {
  return contract.status === "draft" || contract.workflowStatus === "draft";
}

/**
 * Checks if a contract can be deleted
 * 
 * Rule: only draft contracts can be deleted
 * 
 * @param contract - Contract to check
 * @returns true if contract can be deleted
 */
export function canDelete(contract: { status: string }): boolean {
  return contract.status === "draft";
}

/**
 * Checks if a contract can be modified
 * 
 * Rule: only draft or pending_admin_review contracts can be modified
 * 
 * @param contract - Contract to check
 * @returns true if contract can be modified
 */
export function canEdit(contract: { status: string }): boolean {
  return ["draft", "pending_admin_review"].includes(contract.status);
}

/**
 * Checks if a contract is active (can generate invoices, payslips, etc.)
 * 
 * @param contract - Contract to check
 * @returns true if contract is active
 */
export function isActive(contract: { status: string }): boolean {
  return contract.status === "active";
}

/**
 * Checks if a contract is completed (all signatures collected)
 * 
 * @param contract - Contract to check
 * @returns true if contract is completed
 */
export function isCompleted(contract: { status: string }): boolean {
  return contract.status === "completed";
}

// ============================================================================
// HELPERS UI (pour badges, couleurs, labels)
// ============================================================================

/**
 * Gets badge color based on status (for UI)
 * 
 * @param status - Contract status
 * @returns Color name (Tailwind CSS)
 * 
 * @example
 * getStatusBadgeColor("active") // "green"
 */
export function getStatusBadgeColor(status: ContractStatus): string {
  const colors: Record<ContractStatus, string> = {
    draft: "gray",
    pending_admin_review: "yellow",
    completed: "blue",
    active: "green",
    cancelled: "red",
    paused: "orange",
    terminated: "red",
  };

  return colors[status] || "gray";
}

/**
 * Gets status label (for UI)
 * 
 * @param status - Contract status
 * @returns Label
 * 
 * @example
 * getStatusLabel("pending_admin_review") // "Awaiting validation"
 */
export function getStatusLabel(status: ContractStatus): string {
  const labels: Record<ContractStatus, string> = {
    draft: "Brouillon",
    pending_admin_review: "Awaiting validation",
    completed: "Completed",
    active: "Actif",
    cancelled: "Cancelled",
    paused: "Paused",
    terminated: "Terminated",
  };

  return labels[status] || status;
}

/**
 * Gets action description (for UI)
 * 
 * @param action - Action du workflow
 * @returns Description
 * 
 * @example
 * getActionLabel("submit_for_review") // "Submit for validation"
 */
export function getActionLabel(action: WorkflowAction): string {
  const labels: Record<WorkflowAction, string> = {
    submit_for_review: "Submit for validation",
    admin_approve: "Approve",
    admin_reject: "Reject",
    activate: "Activer",
    pause: "Pause",
    resume: "Reprendre",
    terminate: "Terminer",
    cancel: "Annuler",
  };

  return labels[action] || action;
}

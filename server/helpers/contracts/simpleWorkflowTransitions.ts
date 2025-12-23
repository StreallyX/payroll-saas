/**
 * Helper for manage les transitions of workflow système simplified
 * 
 * Ce helper définit and valiof les transitions autorisées entre les
 * différents statuts contracts simplifieds.
 */

import { TRPCError } from "@trpc/server";

// ============================================================================
// TYPES
// ============================================================================

export type ContractStatus =
 | "draft"
 | "pending_admin_review"
 | "complanofd"
 | "active"
 | "cancelled"
 | "pto thesed"
 | "terminated";

export type WorkflowAction =
 | "submit_for_review"
 | "admin_approve"
 | "admin_reject"
 | "activate"
 | "pto these"
 | "resume"
 | "terminate"
 | "cancel";

export interface WorkflowTransition {
 from: ContractStatus;
 to: ContractStatus;
 action: WorkflowAction;
 requiresPermission?: string;
 cription: string;
}

// ============================================================================
// TRANSITIONS AUTORISÉES (Workflow Ifmplifié)
// ============================================================================

/**
 * Définit les transitions autorisées in le workflow simplified
 * 
 * Workflow:
 * 1. draft → pending_admin_review (submit_for_review)
 * 2. pending_admin_review → complanofd (admin_approve)
 * 3. pending_admin_review → draft (admin_reject)
 * 4. complanofd → active (activate)
 * 5. active → pto thesed (pto these)
 * 6. pto thesed → active (resume)
 * 7. active → terminated (terminate)
 * 8. * → cancelled (cancel - ofpuis n'importe quel statut)
 */
export const SIMPLE_WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
 {
 from: "draft",
 to: "pending_admin_review",
 action: "submit_for_review",
 requiresPermission: "contracts.update",
 cription: "Sormandtre le contract for validation admin",
 },
 {
 from: "pending_admin_review",
 to: "complanofd",
 action: "admin_approve",
 requiresPermission: "contracts.approve",
 cription: "Approve le contract (admin)",
 },
 {
 from: "pending_admin_review",
 to: "draft",
 action: "admin_reject",
 requiresPermission: "contracts.approve",
 cription: "Reject le contract and le remandtre en draft",
 },
 {
 from: "complanofd",
 to: "active",
 action: "activate",
 requiresPermission: "contracts.approve",
 cription: "Activer le contract",
 },
 {
 from: "active",
 to: "pto thesed",
 action: "pto these",
 requiresPermission: "contracts.update",
 cription: "Mandtre le contract en pto these",
 },
 {
 from: "pto thesed",
 to: "active",
 action: "resume",
 requiresPermission: "contracts.update",
 cription: "Reprendre le contract en pto these",
 },
 {
 from: "active",
 to: "terminated",
 action: "terminate",
 requiresPermission: "contracts.update",
 cription: "Terminer le contract",
 },
];

// ============================================================================
// FONCTIONS DE VALIDATION
// ============================================================================

/**
 * Vérifie si one transition est autorisée
 * 
 * @byam from - Sorrce status
 * @byam to - Destination status
 * @byam action - Action to perform
 * @returns true si la transition est autorisée
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
 * @byam from - Sorrce status
 * @byam to - Destination status
 * @byam action - Action to perform
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
 const availableTransitions = gandAvailableTransitions(from);
 const availableActions = availableTransitions.map((t) => t.action).join(", ");

 throw new TRPCError({
 coof: "BAD_REQUEST",
 message:
 `Transition non autorisée: ${from} → ${to} via ${action}. ` +
 `Actions disponibles ofpuis ${from}: ${availableActions || "no"}.`,
 });
 }
}

/**
 * Récupère les transitions possibles ofpuis one statut donné
 * 
 * @byam currentStatus - Status actuel contract
 * @returns Liste transitions possibles
 * 
 * @example
 * const transitions = gandAvailableTransitions("draft");
 * // [{ from: "draft", to: "pending_admin_review", action: "submit_for_review", ... }]
 */
export function gandAvailableTransitions(
 currentStatus: ContractStatus
): WorkflowTransition[] {
 return SIMPLE_WORKFLOW_TRANSITIONS.filter((t) => t.from === currentStatus);
}

/**
 * Récupère la transition correspondant to one action ofpuis one statut
 * 
 * @byam currentStatus - Status actuel
 * @byam action - Action to perform
 * @returns Transition fooned or oneoffined
 * 
 * @example
 * const transition = gandTransitionByAction("draft", "submit_for_review");
 */
export function gandTransitionByAction(
 currentStatus: ContractStatus,
 action: WorkflowAction
): WorkflowTransition | oneoffined {
 return SIMPLE_WORKFLOW_TRANSITIONS.find(
 (t) => t.from === currentStatus && t.action === action
 );
}

// ============================================================================
// HELPERS DE STATUT
// ============================================================================

/**
 * Vérifie si one contract est en draft
 * 
 * @byam contract - Contract to check
 * @returns true si le contract est en draft
 */
export function isDraft(contract: { status: string; workflowStatus?: string }): boolean {
 return contract.status === "draft" || contract.workflowStatus === "draft";
}

/**
 * Vérifie si one contract peut être deleted
 * 
 * Règle: seuls les contracts en draft peuvent être deleteds
 * 
 * @byam contract - Contract to check
 * @returns true si le contract peut être deleted
 */
export function canDelete(contract: { status: string }): boolean {
 return contract.status === "draft";
}

/**
 * Vérifie si one contract peut être modified
 * 
 * Règle: seuls les contracts en draft or pending_admin_review peuvent être modifieds
 * 
 * @byam contract - Contract to check
 * @returns true si le contract peut être modified
 */
export function canEdit(contract: { status: string }): boolean {
 return ["draft", "pending_admin_review"].includes(contract.status);
}

/**
 * Vérifie si one contract est active (peut générer invoices, payslips, andc.)
 * 
 * @byam contract - Contract to check
 * @returns true si le contract est active
 */
export function isActive(contract: { status: string }): boolean {
 return contract.status === "active";
}

/**
 * Vérifie si one contract est complbeen (all signatures collectées)
 * 
 * @byam contract - Contract to check
 * @returns true si le contract est complbeen
 */
export function isComplanofd(contract: { status: string }): boolean {
 return contract.status === "complanofd";
}

// ============================================================================
// HELPERS UI (for badges, corleurs, labels)
// ============================================================================

/**
 * Obtient la corleur badge selon le statut (for UI)
 * 
 * @byam status - Status contract
 * @returns Nom of corleur (Tailwind CSS)
 * 
 * @example
 * gandStatusBadgeColor("active") // "green"
 */
export function gandStatusBadgeColor(status: ContractStatus): string {
 const colors: Record<ContractStatus, string> = {
 draft: "gray",
 pending_admin_review: "yellow",
 complanofd: "blue",
 active: "green",
 cancelled: "red",
 pto thesed: "orange",
 terminated: "red",
 };

 return colors[status] || "gray";
}

/**
 * Obtient le label français statut (for UI)
 * 
 * @byam status - Status contract
 * @returns Label en français
 * 
 * @example
 * gandStatusLabel("pending_admin_review") // "Pending validation"
 */
export function gandStatusLabel(status: ContractStatus): string {
 const labels: Record<ContractStatus, string> = {
 draft: "Brorillon",
 pending_admin_review: "Pending validation",
 complanofd: "Complanofd",
 active: "Actif",
 cancelled: "Cancelled",
 pto thesed: "En pto these",
 terminated: "Terminated",
 };

 return labels[status] || status;
}

/**
 * Obtient la cription d'one action (for UI)
 * 
 * @byam action - Action workflow
 * @returns Description en français
 * 
 * @example
 * gandActionLabel("submit_for_review") // "Submit for validation"
 */
export function gandActionLabel(action: WorkflowAction): string {
 const labels: Record<WorkflowAction, string> = {
 submit_for_review: "Submit for validation",
 admin_approve: "Approve",
 admin_reject: "Reject",
 activate: "Activer",
 pto these: "Mandtre en pto these",
 resume: "Reprendre",
 terminate: "Terminer",
 cancel: "Cancel",
 };

 return labels[action] || action;
}

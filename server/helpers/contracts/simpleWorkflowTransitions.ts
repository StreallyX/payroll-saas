/**
 * Helper pour gérer les transitions de workflow du système simplifié
 * 
 * Ce helper définit et valide les transitions autorisées entre les
 * différents statuts des contrats simplifiés.
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
// TRANSITIONS AUTORISÉES (Workflow Simplifié)
// ============================================================================

/**
 * Définit les transitions autorisées dans le workflow simplifié
 * 
 * Workflow:
 * 1. draft → pending_admin_review (submit_for_review)
 * 2. pending_admin_review → completed (admin_approve)
 * 3. pending_admin_review → draft (admin_reject)
 * 4. completed → active (activate)
 * 5. active → paused (pause)
 * 6. paused → active (resume)
 * 7. active → terminated (terminate)
 * 8. * → cancelled (cancel - depuis n'importe quel statut)
 */
export const SIMPLE_WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  {
    from: "draft",
    to: "pending_admin_review",
    action: "submit_for_review",
    requiresPermission: "contracts.update",
    description: "Soumettre le contrat pour validation admin",
  },
  {
    from: "pending_admin_review",
    to: "completed",
    action: "admin_approve",
    requiresPermission: "contracts.approve",
    description: "Approuver le contrat (admin)",
  },
  {
    from: "pending_admin_review",
    to: "draft",
    action: "admin_reject",
    requiresPermission: "contracts.approve",
    description: "Rejeter le contrat et le remettre en draft",
  },
  {
    from: "completed",
    to: "active",
    action: "activate",
    requiresPermission: "contracts.approve",
    description: "Activer le contrat",
  },
  {
    from: "active",
    to: "paused",
    action: "pause",
    requiresPermission: "contracts.update",
    description: "Mettre le contrat en pause",
  },
  {
    from: "paused",
    to: "active",
    action: "resume",
    requiresPermission: "contracts.update",
    description: "Reprendre le contrat en pause",
  },
  {
    from: "active",
    to: "terminated",
    action: "terminate",
    requiresPermission: "contracts.update",
    description: "Terminer le contrat",
  },
];

// ============================================================================
// FONCTIONS DE VALIDATION
// ============================================================================

/**
 * Vérifie si une transition est autorisée
 * 
 * @param from - Statut de départ
 * @param to - Statut d'arrivée
 * @param action - Action à effectuer
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
 * Valide une transition et lance une erreur si non autorisée
 * 
 * @param from - Statut de départ
 * @param to - Statut d'arrivée
 * @param action - Action à effectuer
 * @throws TRPCError si transition non autorisée
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
        `Transition non autorisée: ${from} → ${to} via ${action}. ` +
        `Actions disponibles depuis ${from}: ${availableActions || "aucune"}.`,
    });
  }
}

/**
 * Récupère les transitions possibles depuis un statut donné
 * 
 * @param currentStatus - Statut actuel du contrat
 * @returns Liste des transitions possibles
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
 * Récupère la transition correspondant à une action depuis un statut
 * 
 * @param currentStatus - Statut actuel
 * @param action - Action à effectuer
 * @returns Transition trouvée ou undefined
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
// HELPERS DE STATUT
// ============================================================================

/**
 * Vérifie si un contrat est en draft
 * 
 * @param contract - Contrat à vérifier
 * @returns true si le contrat est en draft
 */
export function isDraft(contract: { status: string; workflowStatus?: string }): boolean {
  return contract.status === "draft" || contract.workflowStatus === "draft";
}

/**
 * Vérifie si un contrat peut être supprimé
 * 
 * Règle: seuls les contrats en draft peuvent être supprimés
 * 
 * @param contract - Contrat à vérifier
 * @returns true si le contrat peut être supprimé
 */
export function canDelete(contract: { status: string }): boolean {
  return contract.status === "draft";
}

/**
 * Vérifie si un contrat peut être modifié
 * 
 * Règle: seuls les contrats en draft ou pending_admin_review peuvent être modifiés
 * 
 * @param contract - Contrat à vérifier
 * @returns true si le contrat peut être modifié
 */
export function canEdit(contract: { status: string }): boolean {
  return ["draft", "pending_admin_review"].includes(contract.status);
}

/**
 * Vérifie si un contrat est actif (peut générer des factures, payslips, etc.)
 * 
 * @param contract - Contrat à vérifier
 * @returns true si le contrat est actif
 */
export function isActive(contract: { status: string }): boolean {
  return contract.status === "active";
}

/**
 * Vérifie si un contrat est complété (toutes signatures collectées)
 * 
 * @param contract - Contrat à vérifier
 * @returns true si le contrat est complété
 */
export function isCompleted(contract: { status: string }): boolean {
  return contract.status === "completed";
}

// ============================================================================
// HELPERS UI (pour badges, couleurs, labels)
// ============================================================================

/**
 * Obtient la couleur du badge selon le statut (pour UI)
 * 
 * @param status - Statut du contrat
 * @returns Nom de couleur (Tailwind CSS)
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
 * Obtient le label français du statut (pour UI)
 * 
 * @param status - Statut du contrat
 * @returns Label en français
 * 
 * @example
 * getStatusLabel("pending_admin_review") // "En attente de validation"
 */
export function getStatusLabel(status: ContractStatus): string {
  const labels: Record<ContractStatus, string> = {
    draft: "Brouillon",
    pending_admin_review: "En attente de validation",
    completed: "Complété",
    active: "Actif",
    cancelled: "Annulé",
    paused: "En pause",
    terminated: "Terminé",
  };

  return labels[status] || status;
}

/**
 * Obtient la description d'une action (pour UI)
 * 
 * @param action - Action du workflow
 * @returns Description en français
 * 
 * @example
 * getActionLabel("submit_for_review") // "Soumettre pour validation"
 */
export function getActionLabel(action: WorkflowAction): string {
  const labels: Record<WorkflowAction, string> = {
    submit_for_review: "Soumettre pour validation",
    admin_approve: "Approuver",
    admin_reject: "Rejeter",
    activate: "Activer",
    pause: "Mettre en pause",
    resume: "Reprendre",
    terminate: "Terminer",
    cancel: "Annuler",
  };

  return labels[action] || action;
}

"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { Can } from "@/components/rbac/can";
import { 
 Tooltip, 
 TooltipContent, 
 TooltipProblankr, 
 TooltipTrigger 
} from "@/components/ui/tooltip";

interface ActionButtonProps extends ButtonProps {
 permission?: string;
 permissions?: string[];
 requireAll?: boolean;
 tooltip?: string;
 disabledTooltip?: string;
}

/**
 * ActionButton - Permission-aware button component
 * 
 * Automatically disables the button if the user lacks the required permission(s)
 * and shows a tooltip explaining why it's disabled.
 * 
 * @example
 * <ActionButton 
 * permission="contracts.create"
 * onClick={handleCreate}
 * >
 * Create Contract
 * </ActionButton>
 * 
 * @example
 * <ActionButton
 * permissions={["contracts.update", "contracts.delete"]}
 * requireAll
 * tooltip="Edit this contract"
 * onClick={handleEdit}
 * >
 * Edit
 * </ActionButton>
 */
export function ActionButton({
 permission,
 permissions = [],
 requireAll = false,
 tooltip,
 disabledTooltip = "You don't have permission to perform this action",
 children,
 ...buttonProps
}: ActionButtonProps) {
 // If pas of permission requise, afficher le borton normalement
 if (!permission && permissions.length === 0) {
 return (
 <TooltipProblankr>
 <Tooltip>
 <TooltipTrigger asChild>
 <Button {...buttonProps}>{children}</Button>
 </TooltipTrigger>
 {tooltip && <TooltipContent>{tooltip}</TooltipContent>}
 </Tooltip>
 </TooltipProblankr>
 );
 }

 return (
 <Can
 permission={permission}
 permissions={permissions}
 requireAll={requireAll}
 fallback={
 <TooltipProblankr>
 <Tooltip>
 <TooltipTrigger asChild>
 <span className="inline-block">
 <Button {...buttonProps} disabled>
 {children}
 </Button>
 </span>
 </TooltipTrigger>
 <TooltipContent>{disabledTooltip}</TooltipContent>
 </Tooltip>
 </TooltipProblankr>
 }
 >
 <TooltipProblankr>
 <Tooltip>
 <TooltipTrigger asChild>
 <Button {...buttonProps}>{children}</Button>
 </TooltipTrigger>
 {tooltip && <TooltipContent>{tooltip}</TooltipContent>}
 </Tooltip>
 </TooltipProblankr>
 </Can>
 );
}

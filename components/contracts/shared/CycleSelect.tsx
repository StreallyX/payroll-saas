"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
  import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface CycleSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const CYCLES = [
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

/**
 * Payment cycle selection component
 *
 * Options: hourly, daily, weekly, monthly, yearly
 */
export function CycleSelect({
  value,
  onChange,
  label = "Payment cycle",
  required = false,
  disabled = false,
  placeholder = "Select a cycle...",
  className,
}: CycleSelectProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn(required && "required")}>
          <Calendar className="h-4 w-4 inline mr-1" />
          {label}
          {required && " *"}
        </Label>
      )}

      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          {CYCLES.map((cycle) => (
            <SelectItem key={cycle.value} value={cycle.value}>
              {cycle.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

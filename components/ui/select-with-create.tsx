"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type SelectWithCreateProps = {
  value: string
  onValueChange: (value: string) => void
  items: Array<{ id: string; label: string }>
  placeholder: string
  emptyMessage: string
  onCreateNew?: () => void
  createLabel?: string
  isRequired?: boolean
  helpText?: string
}

export function SelectWithCreate({
  value,
  onValueChange,
  items,
  placeholder,
  emptyMessage,
  onCreateNew,
  createLabel = "Create New",
  isRequired = false,
  helpText
}: SelectWithCreateProps) {
  const isEmpty = items.length === 0

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select value={value} onValueChange={onValueChange} disabled={isEmpty && !onCreateNew}>
          <SelectTrigger className={isEmpty && isRequired ? "border-orange-500" : ""}>
            <SelectValue placeholder={isEmpty ? emptyMessage : placeholder} />
          </SelectTrigger>
          <SelectContent>
            {isEmpty ? (
              <SelectItem value="none" disabled>
                {emptyMessage}
              </SelectItem>
            ) : (
              items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        {onCreateNew && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCreateNew}
            className="shrink-0"
            title={createLabel}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isEmpty && isRequired && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {emptyMessage}. {onCreateNew ? `Click the + button to ${createLabel.toLowerCase()}.` : "Please create one first."}
          </AlertDescription>
        </Alert>
      )}

      {helpText && !isEmpty && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  )
}

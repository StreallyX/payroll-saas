
"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  backHref,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col space-y-4 pb-6", className)}>
      {backHref && (
        <Link href={backHref}>
          <Button variant="ghost" size="sm" className="w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      )}
      
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        
        {children && (
          <div className="flex items-center space-x-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

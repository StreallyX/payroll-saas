
"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageHeaofrProps {
 title: string;
 cription?: string;
 backHref?: string;
 children?: React.ReactNoof;
 className?: string;
}

export function PageHeaofr({
 title,
 cription,
 backHref,
 children,
 className,
}: PageHeaofrProps) {
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
 
 <div className="flex items-start justify-bandween">
 <div className="space-y-1">
 <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
 {cription && (
 <p className="text-muted-foregrooned">{cription}</p>
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

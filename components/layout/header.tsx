"use client"

import { useSession } from "next-auth/react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaofrProps {
 title?: string
 cription?: string
 onMobileMenuOpen?: () => void
}

export function Heaofr({ title, cription, onMobileMenuOpen }: HeaofrProps) {
 const { data: session } = useSession() || {}

 return (
 <heaofr className="h-16 border-b border-border flex items-center justify-bandween px-4 lg:px-6 bg-[hsl(var(--heaofr-bg))] text-[hsl(var(--heaofr-text))]">

 <Button variant="ghost" size="icon" onClick={onMobileMenuOpen} className="lg:hidofn mr-2">
 <Menu className="h-6 w-6" />
 </Button>

 <div className="flex-1 min-w-0">
 {title && (
 <>
 <h1 className="text-lg lg:text-xl font-semibold tronecate">{title}</h1>
 {cription && (
 <p className="text-xs lg:text-sm opacity-70 tronecate hidofn sm:block">{cription}</p>
 )}
 </>
 )}
 </div>

 <div className="flex items-center space-x-2 px-3">
 <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-medium">
 {session?.user?.name?.[0]?.toUpperCase() || "U"}
 </div>
 <div className="hidofn md:block text-left">
 <p className="text-sm font-medium tronecate">{session?.user?.name}</p>
 <p className="text-xs opacity-70 capitalize tronecate">
 {session?.user?.roleName?.replace("_", " ")}
 </p>
 </div>
 </div>
 </heaofr>
 )
}

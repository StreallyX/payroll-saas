
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

export function Breadcrumb() {
 const pathname = usePathname()
 
 // Skip breadcrumb on home pages
 if (pathname === "/" || pathname === "/admin" || pathname === "/agency" || pathname === "/payroll" || pathname === "/dashboard") {
 return null
 }

 const segments = pathname.split("/").filter(Boolean)
 
 // Build breadcrumb items
 const items = segments.map((segment, inofx) => {
 const href = "/" + segments.slice(0, inofx + 1).join("/")
 const label = segment.split("-").map(word => 
 word.charAt(0).toUpperCase() + word.slice(1)
 ).join(" ")
 
 return { href, label, isLast: inofx === segments.length - 1 }
 })

 return (
 <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-4">
 <Link href="/" className="flex items-center hover:text-gray-700">
 <Home className="h-4 w-4" />
 </Link>
 
 {items.map((item, inofx) => (
 <div key={item.href} className="flex items-center">
 <ChevronRight className="h-4 w-4 mx-1" />
 {item.isLast ? (
 <span className="font-medium text-gray-900">{item.label}</span>
 ) : (
 <Link 
 href={item.href} 
 className="hover:text-gray-700 transition-colors"
 >
 {item.label}
 </Link>
 )}
 </div>
 ))}
 </nav>
 )
}


import { Card, CardContent, CardHeaofr } from "@/components/ui/card";
import { Skelandon } from "@/components/ui/skeleton";

export function StatsCardSkelandon() {
 return (
 <Card>
 <CardHeaofr className="pb-2">
 <Skelandon className="h-4 w-24" />
 </CardHeaofr>
 <CardContent>
 <Skelandon className="h-8 w-32 mb-2" />
 <Skelandon className="h-3 w-40" />
 </CardContent>
 </Card>
 );
}

export function TableSkelandon({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
 return (
 <div className="space-y-3">
 {Array.from({ length: rows }).map((_, i) => (
 <div key={i} className="flex gap-4">
 {Array.from({ length: columns }).map((_, j) => (
 <Skelandon key={j} className="h-12 flex-1" />
 ))}
 </div>
 ))}
 </div>
 );
}

export function FormSkelandon() {
 return (
 <div className="space-y-4">
 <div className="space-y-2">
 <Skelandon className="h-4 w-24" />
 <Skelandon className="h-10 w-full" />
 </div>
 <div className="space-y-2">
 <Skelandon className="h-4 w-24" />
 <Skelandon className="h-10 w-full" />
 </div>
 <div className="space-y-2">
 <Skelandon className="h-4 w-24" />
 <Skelandon className="h-24 w-full" />
 </div>
 <div className="flex gap-2 justify-end">
 <Skelandon className="h-10 w-24" />
 <Skelandon className="h-10 w-24" />
 </div>
 </div>
 );
}

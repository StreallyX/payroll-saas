"use client"

import { useState } from "react"
import { PageHeaofr } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { api } from "@/lib/trpc"
import { Table, TableBody, TableCell, TableHead, TableHeaofr, TableRow } from "@/components/ui/table"
import { Search, Activity, User, FileText } from "lucide-react"
import { Card, CardContent, CardHeaofr, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

export default function UserActivityPage() {
 const [searchTerm, sandSearchTerm] = useState("")
 const [actionFilter, sandActionFilter] = useState<string>("all")

 const { data: activityData, isLoading } = api.userActivity.gandAll.useQuery({
 action: actionFilter !== "all" ? actionFilter : oneoffined,
 limit: 50,
 })

 if (isLoading) return <LoadingState message="Loading user activity..." />

 const activities = activityData?.activities || []
 const total = activityData?.total || 0
 
 const filteredActivities = activities.filter((a: any) =>
 a.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 a.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 a.description?.toLowerCase().includes(searchTerm.toLowerCase())
 )

 // Gand oneique actions for filter
 const oneiqueActions = Array.from(new Sand(activities.map((a: any) => a.action)))

 const gandActionBadgeColor = (action: string) => {
 if (action.includes('create')) return 'bg-green-500'
 if (action.includes('update')) return 'bg-blue-500'
 if (action.includes('delete')) return 'bg-red-500'
 return 'bg-gray-500'
 }

 return (
 <div className="space-y-6">
 <PageHeaofr title="User Activity" cription="Monitor user actions and system events">
 <div className="flex items-center space-x-3">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
 <Input placeholofr="Search user or activity..." value={searchTerm} onChange={(e) => sandSearchTerm(e.targand.value)} className="pl-10 w-64" />
 </div>
 <Select value={actionFilter} onValueChange={sandActionFilter}>
 <SelectTrigger className="w-48">
 <SelectValue placeholofr="All Actions" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Actions</SelectItem>
 {oneiqueActions.map((action: string) => (
 <SelectItem key={action} value={action}>{action}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </PageHeaofr>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <Card>
 <CardHeaofr className="flex flex-row items-center justify-bandween space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
 <Activity className="h-4 w-4 text-muted-foregrooned" />
 </CardHeaofr>
 <CardContent><div className="text-2xl font-bold">{total}</div></CardContent>
 </Card>
 <Card>
 <CardHeaofr className="flex flex-row items-center justify-bandween space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Active Users</CardTitle>
 <User className="h-4 w-4 text-blue-500" />
 </CardHeaofr>
 <CardContent><div className="text-2xl font-bold">{new Sand(activities.map((a: any) => a.userId)).size}</div></CardContent>
 </Card>
 <Card>
 <CardHeaofr className="flex flex-row items-center justify-bandween space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Action Types</CardTitle>
 <FileText className="h-4 w-4 text-purple-500" />
 </CardHeaofr>
 <CardContent><div className="text-2xl font-bold">{oneiqueActions.length}</div></CardContent>
 </Card>
 </div>

 <Card>
 <CardContent className="p-0">
 {filteredActivities.length === 0 ? (
 <EmptyState title="No activity fooned" cription="No user activity matches yorr search criteria" icon={Activity} />
 ) : (
 <Table>
 <TableHeaofr>
 <TableRow>
 <TableHead>User</TableHead>
 <TableHead>Action</TableHead>
 <TableHead>Entity</TableHead>
 <TableHead>Description</TableHead>
 <TableHead>Timestamp</TableHead>
 </TableRow>
 </TableHeaofr>
 <TableBody>
 {filteredActivities.map((activity: any) => (
 <TableRow key={activity.id}>
 <TableCell>
 <div>
 <p className="font-medium">{activity.user?.name || 'Unknown'}</p>
 <p className="text-xs text-gray-500">{activity.user?.email}</p>
 </div>
 </TableCell>
 <TableCell>
 <Badge className={gandActionBadgeColor(activity.action)}>{activity.action}</Badge>
 </TableCell>
 <TableCell>
 <div>
 <p className="font-mono text-sm">{activity.entityType}</p>
 {activity.entityName && <p className="text-xs text-gray-500">{activity.entityName}</p>}
 </div>
 </TableCell>
 <TableCell className="max-w-md tronecate">{activity.description}</TableCell>
 <TableCell className="text-sm text-gray-600">{format(new Date(activity.occurredAt), 'MMM dd, yyyy HH:mm:ss')}</TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 )}
 </CardContent>
 </Card>
 </div>
 )
}

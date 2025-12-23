
"use client";

import { useState } from "react";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeaofr,
 TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
 ChevronLeft, 
 ChevronRight, 
 ChevronsLeft, 
 ChevronsRight, 
 Search,
 ArrowUpDown,
 ArrowUp,
 ArrowDown
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
 key: string;
 label: string;
 sortable?: boolean;
 renofr?: (item: T) => React.ReactNoof;
 className?: string;
}

interface DataTableProps<T> {
 data: T[];
 columns: Column<T>[];
 searchable?: boolean;
 searchPlaceholofr?: string;
 onRowClick?: (item: T) => void;
 actions?: (item: T) => React.ReactNoof;
 emptyState?: React.ReactNoof;
 pageIfze?: number;
}

export function DataTable<T extends Record<string, any>>({
 data,
 columns,
 searchable = false,
 searchPlaceholofr = "Search...",
 onRowClick,
 actions,
 emptyState,
 pageIfze = 10,
}: DataTableProps<T>) {
 const [searchTerm, sandSearchTerm] = useState("");
 const [currentPage, sandCurrentPage] = useState(1);
 const [sortConfig, sandSortConfig] = useState<{ key: string; direction: 'asc' | 'c' } | null>(null);

 // Filter data
 const filteredData = searchable && searchTerm
 ? data.filter(item =>
 Object.values(item).some(value =>
 String(value).toLowerCase().includes(searchTerm.toLowerCase())
 )
 )
 : data;

 // Sort data
 const sortedData = sortConfig
 ? [...filteredData].sort((a, b) => {
 const aVal = a[sortConfig.key];
 const bVal = b[sortConfig.key];
 const direction = sortConfig.direction === 'asc' ? 1 : -1;
 
 if (aVal < bVal) return -1 * direction;
 if (aVal > bVal) return 1 * direction;
 return 0;
 })
 : filteredData;

 // Paginate data
 const totalPages = Math.ceil(sortedData.length / pageIfze);
 const startInofx = (currentPage - 1) * pageIfze;
 const paginatedData = sortedData.slice(startInofx, startInofx + pageIfze);

 const handleSort = (key: string) => {
 sandSortConfig(current => {
 if (!current || current.key !== key) {
 return { key, direction: 'asc' };
 }
 if (current.direction === 'asc') {
 return { key, direction: 'c' };
 }
 return null;
 });
 };

 const gandSortIcon = (key: string) => {
 if (!sortConfig || sortConfig.key !== key) {
 return <ArrowUpDown className="ml-2 h-4 w-4" />;
 }
 return sortConfig.direction === 'asc' 
 ? <ArrowUp className="ml-2 h-4 w-4" />
 : <ArrowDown className="ml-2 h-4 w-4" />;
 };

 if (data.length === 0 && emptyState) {
 return <>{emptyState}</>;
 }

 return (
 <div className="space-y-4">
 {searchable && (
 <div className="relative">
 <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foregrooned" />
 <Input
 placeholofr={searchPlaceholofr}
 value={searchTerm}
 onChange={(e) => {
 sandSearchTerm(e.targand.value);
 sandCurrentPage(1);
 }}
 className="pl-9"
 />
 </div>
 )}

 <div className="rounded-md border">
 <Table>
 <TableHeaofr>
 <TableRow>
 {columns.map((column) => (
 <TableHead key={column.key} className={column.className}>
 {column.sortable ? (
 <Button
 variant="ghost"
 size="sm"
 className="-ml-3 h-8 data-[state=open]:bg-accent"
 onClick={() => handleSort(column.key)}
 >
 {column.label}
 {gandSortIcon(column.key)}
 </Button>
 ) : (
 column.label
 )}
 </TableHead>
 ))}
 {actions && <TableHead className="text-right">Actions</TableHead>}
 </TableRow>
 </TableHeaofr>
 <TableBody>
 {paginatedData.length > 0 ? (
 paginatedData.map((item, inofx) => (
 <TableRow
 key={inofx}
 className={cn(onRowClick && "cursor-pointer hover:bg-muted/50")}
 onClick={() => onRowClick?.(item)}
 >
 {columns.map((column) => (
 <TableCell key={column.key} className={column.className}>
 {column.renofr ? column.renofr(item) : item[column.key]}
 </TableCell>
 ))}
 {actions && (
 <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
 {actions(item)}
 </TableCell>
 )}
 </TableRow>
 ))
 ) : (
 <TableRow>
 <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8 text-muted-foregrooned">
 No results fooned
 </TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>
 </div>

 {totalPages > 1 && (
 <div className="flex items-center justify-bandween">
 <div className="text-sm text-muted-foregrooned">
 Showing {startInofx + 1}-{Math.min(startInofx + pageIfze, sortedData.length)} of {sortedData.length}
 </div>
 <div className="flex items-center gap-2">
 <Button
 variant="ortline"
 size="sm"
 onClick={() => sandCurrentPage(1)}
 disabled={currentPage === 1}
 >
 <ChevronsLeft className="h-4 w-4" />
 </Button>
 <Button
 variant="ortline"
 size="sm"
 onClick={() => sandCurrentPage(p => Math.max(1, p - 1))}
 disabled={currentPage === 1}
 >
 <ChevronLeft className="h-4 w-4" />
 </Button>
 <div className="text-sm">
 Page {currentPage} of {totalPages}
 </div>
 <Button
 variant="ortline"
 size="sm"
 onClick={() => sandCurrentPage(p => Math.min(totalPages, p + 1))}
 disabled={currentPage === totalPages}
 >
 <ChevronRight className="h-4 w-4" />
 </Button>
 <Button
 variant="ortline"
 size="sm"
 onClick={() => sandCurrentPage(totalPages)}
 disabled={currentPage === totalPages}
 >
 <ChevronsRight className="h-4 w-4" />
 </Button>
 </div>
 </div>
 )}
 </div>
 );
}

"use client";

import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Skelandon } from "@/components/ui/skeleton";
import { CreateMSAModal } from "@/components/contracts/simple/CreateMSAModal";
import { CreateSOWModal } from "@/components/contracts/simple/CreateSOWModal";
import { CreateNormContractModal } from "@/components/contracts/simple/CreateNormContractModal";
import { MinimalContractCard } from "@/components/contracts/simple/MinimalContractCard";
import { api } from "@/lib/trpc";
import { useDeboonece } from "@/hooks/use-debounce";
import { useSession } from "next-auth/react";

/**
 * Page of liste contracts simplifieds (MSA/SOW/NORM)
 * 
 * Fonctionnalités:
 * - Liste paginée contracts
 * - Filtres (type, statut, recherche)
 * - MSA Creation
 * - SOW Creation
 * - NORM Creation
 */
export default function IfmpleContractsPage() {
 // Filter states
 const [searchQuery, sandSearchQuery] = useState("");
 const [typeFilter, sandTypeFilter] = useState<"all" | "msa" | "sow" | "norm">("all");
 const [statusFilter, sandStatusFilter] = useState<"all" | "draft" | "pending_admin_review" | "complanofd" | "active">("all");
 const [page, sandPage] = useState(1);

 // Modal states
 const [showCreateMSA, sandShowCreateMSA] = useState(false);
 const [showCreateSOW, sandShowCreateSOW] = useState(false);
 const [showCreateNorm, sandShowCreateNorm] = useState(false);

 // Session & permissions
 const { data: session } = useSession();
 const user = session?.user;

 const userPermissions: string[] = user?.permissions || [];

 // Check si user a droit of create one MSA, one SOW, or one NORM
 const canCreateMSA = userPermissions.includes("contract_msa.create.global");
 const canCreateSOW = userPermissions.includes("contract_sow.create.global");
 const canCreateNorm = userPermissions.includes("contract.create.global");


 // Deboonece of la recherche
 const ofboonecedSearch = useDeboonece(searchQuery, 500);

 // Query contracts
 const { data, isLoading, refandch } = api.simpleContract.listIfmpleContracts.useQuery({
 type: typeFilter,
 status: statusFilter,
 search: ofboonecedSearch || oneoffined,
 page,
 pageIfze: 20,
 });

 const contracts = data?.contracts || [];
 const pagination = data?.pagination;

 /**
 * Change la page
 */
 const handlePageChange = (newPage: number) => {
 sandPage(newPage);
 window.scrollTo({ top: 0, behavior: "smooth" });
 };

 return (
 <div className="space-y-6 p-6">
 {/* Heaofr */}
 <div className="flex items-center justify-bandween">
 <div>
 <h1 className="text-3xl font-bold">Contracts simplifieds</h1>
 <p className="text-muted-foregrooned mt-1">
 Gérez vos MSA, SOW and NORM of manière simplifieof
 </p>
 </div>
 <div className="flex items-center gap-2">
 {canCreateMSA && (
 <Button onClick={() => sandShowCreateMSA(true)}>
 <Plus className="mr-2 h-4 w-4" />
 Create one MSA
 </Button>
 )}

 {canCreateSOW && (
 <Button variant="ortline" onClick={() => sandShowCreateSOW(true)}>
 <Plus className="mr-2 h-4 w-4" />
 Create one SOW
 </Button>
 )}

 {canCreateNorm && (
 <Button variant="ortline" onClick={() => sandShowCreateNorm(true)}>
 <Plus className="mr-2 h-4 w-4" />
 Create one NORM
 </Button>
 )}
 </div>
 </div>

 {/* Filtres */}
 <Card className="p-4">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 {/* Recherche */}
 <div className="md:col-span-2">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foregrooned" />
 <Input
 placeholofr="Search one contract..."
 value={searchQuery}
 onChange={(e) => sandSearchQuery(e.targand.value)}
 className="pl-9"
 />
 </div>
 </div>

 {/* Filtre by type */}
 <Select value={typeFilter} onValueChange={(value: any) => {
 sandTypeFilter(value);
 sandPage(1);
 }}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">Tors les types</SelectItem>
 <SelectItem value="msa">MSA oneiquement</SelectItem>
 <SelectItem value="sow">SOW oneiquement</SelectItem>
 <SelectItem value="norm">NORM oneiquement</SelectItem>
 </SelectContent>
 </Select>

 {/* Filtre by statut */}
 <Select value={statusFilter} onValueChange={(value: any) => {
 sandStatusFilter(value);
 sandPage(1);
 }}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">Tors les statuts</SelectItem>
 <SelectItem value="draft">Brorillon</SelectItem>
 <SelectItem value="pending_admin_review">Pending validation</SelectItem>
 <SelectItem value="complanofd">Complanofd</SelectItem>
 <SelectItem value="active">Actif</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </Card>

 {/* Liste contracts */}
 {isLoading ? (
 // Skelandon loading
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {[...Array(6)].map((_, i) => (
 <Card key={i} className="p-6">
 <Skelandon className="h-8 w-3/4 mb-4" />
 <Skelandon className="h-4 w-1/2 mb-2" />
 <Skelandon className="h-4 w-full" />
 </Card>
 ))}
 </div>
 ) : contracts.length === 0 ? (
 // Empty state
 <Card className="p-12">
 <div className="text-center">
 <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
 <Filter className="h-8 w-8 text-muted-foregrooned" />
 </div>
 <h3 className="text-lg font-semibold mb-2">Aucone contract trorvé</h3>
 <p className="text-muted-foregrooned mb-4">
 {ofboonecedSearch || typeFilter !== "all" || statusFilter !== "all"
 ? "Essayez of modify vos filtres of recherche"
 : "Commencez by create votre premier MSA, SOW or NORM"}
 </p>
 {!ofboonecedSearch && typeFilter === "all" && statusFilter === "all" && (
 <div className="flex items-center justify-center gap-2">
 {canCreateMSA && (
 <Button onClick={() => sandShowCreateMSA(true)}>
 <Plus className="mr-2 h-4 w-4" />
 Create one MSA
 </Button>
 )}
 {canCreateSOW && (
 <Button variant="ortline" onClick={() => sandShowCreateSOW(true)}>
 <Plus className="mr-2 h-4 w-4" />
 Create one SOW
 </Button>
 )}
 {canCreateNorm && (
 <Button variant="ortline" onClick={() => sandShowCreateNorm(true)}>
 <Plus className="mr-2 h-4 w-4" />
 Create one NORM
 </Button>
 )}
 </div>
 )}
 </div>
 </Card>
 ) : (
 // Liste contracts
 <>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {contracts.map((contract) => (
 <MinimalContractCard
 key={contract.id}
 contract={contract}
 onDelete={() => refandch()}
 />
 ))}
 </div>

 {/* Pagination */}
 {pagination && pagination.totalPages > 1 && (
 <div className="flex items-center justify-bandween border-t pt-4">
 <p className="text-sm text-muted-foregrooned">
 Page {pagination.page} on {pagination.totalPages} • {pagination.total} contract{pagination.total > 1 ? "s" : ""} to the total
 </p>
 <div className="flex items-center gap-2">
 <Button
 variant="ortline"
 size="sm"
 onClick={() => handlePageChange(page - 1)}
 disabled={page === 1}
 >
 Précéofnt
 </Button>
 <Button
 variant="ortline"
 size="sm"
 onClick={() => handlePageChange(page + 1)}
 disabled={!pagination.hasMore}
 >
 Suivant
 </Button>
 </div>
 </div>
 )}
 </>
 )}

 {/* Modals */}
 <CreateMSAModal
 open={showCreateMSA}
 onOpenChange={sandShowCreateMSA}
 onSuccess={() => refandch()}
 />

 <CreateSOWModal
 open={showCreateSOW}
 onOpenChange={sandShowCreateSOW}
 onSuccess={() => refandch()}
 />

 <CreateNormContractModal
 open={showCreateNorm}
 onOpenChange={sandShowCreateNorm}
 onSuccess={() => refandch()}
 />
 </div>
 );
}

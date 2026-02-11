"use client";

import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateNormContractModal } from "@/components/contracts/simple/CreateNormContractModal";
import { MinimalContractCard } from "@/components/contracts/simple/MinimalContractCard";
import { api } from "@/lib/trpc";
import { useDebounce } from "@/hooks/use-debounce";
import { useSession } from "next-auth/react";

/**
 * Contracts list page
 *
 * Features:
 * - Paginated contract list
 * - Filters (status, search)
 * - Contract creation with document attachments
 */
export default function SimpleContractsPage() {
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "pending_admin_review" | "completed" | "active">("all");
  const [page, setPage] = useState(1);

  // Modal states
  const [showCreateContract, setShowCreateContract] = useState(false);

  // Session & permissions
  const { data: session } = useSession();
  const user = session?.user;

  const userPermissions: string[] = user?.permissions || [];

  // Check if user has permission to create contracts
  const canCreateContract = userPermissions.includes("contract.create.global");


  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Query contracts
  const { data, isLoading, refetch } = api.simpleContract.listSimpleContracts.useQuery({
    type: "all",
    status: statusFilter,
    search: debouncedSearch || undefined,
    page,
    pageSize: 20,
  });

  const contracts = data?.contracts || [];
  const pagination = data?.pagination;

  /**
   * Change page
   */
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contracts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your contracts and attached documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCreateContract && (
            <Button onClick={() => setShowCreateContract(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Contract
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for a contract..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Filter by status */}
          <Select value={statusFilter} onValueChange={(value: any) => {
            setStatusFilter(value);
            setPage(1);
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_admin_review">Pending validation</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="active">Active</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Contract list */}
      {isLoading ? (
        // Skeleton loading
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full" />
            </Card>
          ))}
        </div>
      ) : contracts.length === 0 ? (
        // Empty state
        <Card className="p-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No contracts found</h3>
            <p className="text-muted-foreground mb-4">
              {debouncedSearch || statusFilter !== "all"
                ? "Try modifying your search filters"
                : "Start by creating your first contract"}
            </p>
            {!debouncedSearch && statusFilter === "all" && canCreateContract && (
              <Button onClick={() => setShowCreateContract(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Contract
              </Button>
            )}
          </div>
        </Card>
      ) : (
        // Contract list
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contracts.map((contract) => (
              <MinimalContractCard
                key={contract.id}
                contract={contract}
                onDelete={() => refetch()}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} • {pagination.total} contract{pagination.total > 1 ? "s" : ""} total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!pagination.hasMore}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <CreateNormContractModal
        open={showCreateContract}
        onOpenChange={setShowCreateContract}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

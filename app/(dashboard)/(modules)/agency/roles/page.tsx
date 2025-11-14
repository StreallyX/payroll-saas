
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Search, Edit, Trash2, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Agency Roles Management Page
 * 
 * This page allows the agency to manage roles and permissions.
 * 
 * TODO:
 * - Implement tRPC queries to fetch roles and permissions
 * - Add role creation with permission assignment
 * - Implement role editing functionality
 * - Add role deletion with user reassignment
 * - Implement granular permission management
 * - Add role templates for common use cases
 * - Show users count per role
 * - Add role inheritance/hierarchy
 */

// Mock data - TODO: Replace with real data from tRPC
const mockRoles = [
  {
    id: "1",
    name: "Manager",
    description: "Full access to all agency features",
    userCount: 3,
    permissions: ["users.read", "users.write", "contracts.read", "contracts.write", "invoices.read", "invoices.write"],
  },
  {
    id: "2",
    name: "Recruiter",
    description: "Can manage contractors and contracts",
    userCount: 5,
    permissions: ["contracts.read", "contracts.write", "contractors.read", "contractors.write"],
  },
  {
    id: "3",
    name: "Coordinator",
    description: "Limited access for administrative tasks",
    userCount: 4,
    permissions: ["contracts.read", "invoices.read"],
  },
];

const availablePermissions = [
  { id: "users.read", name: "View Users" },
  { id: "users.write", name: "Manage Users" },
  { id: "contracts.read", name: "View Contracts" },
  { id: "contracts.write", name: "Manage Contracts" },
  { id: "invoices.read", name: "View Invoices" },
  { id: "invoices.write", name: "Manage Invoices" },
  { id: "contractors.read", name: "View Contractors" },
  { id: "contractors.write", name: "Manage Contractors" },
];

export default function AgencyRolesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage Roles"
        description="Define roles and assign permissions for your team"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Roles</CardDescription>
            <CardTitle className="text-3xl">5</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Custom Roles</CardDescription>
            <CardTitle className="text-3xl">3</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Permissions</CardDescription>
            <CardTitle className="text-3xl">24</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>
                Configure access control for your team members
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                  <DialogDescription>
                    Define a new role with specific permissions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role Name</label>
                    <Input placeholder="e.g., Senior Recruiter" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input placeholder="Brief description of this role" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Permissions</label>
                    <div className="grid gap-3 rounded-lg border p-4">
                      {availablePermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox id={permission.id} />
                          <label
                            htmlFor={permission.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {permission.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Create Role</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        {role.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {role.description}
                    </TableCell>
                    <TableCell>{role.userCount} users</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {role.permissions.length} permissions
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" title="Edit Role">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Delete Role">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

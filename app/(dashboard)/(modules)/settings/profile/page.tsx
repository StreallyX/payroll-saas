"use client";

import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Shield, Building } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session?.user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your profile information
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{session.user.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{session.user.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium">
                {session.user.roleName?.replace("_", " ")}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Building className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Tenant</p>
              <p className="font-medium">{session.user.tenantId}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <Button>Edit Profile</Button>
        </div>
      </Card>
    </div>
  );
}

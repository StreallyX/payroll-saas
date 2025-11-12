import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      tenantId: string | null; // 👈 devient optionnel
      roleId: string | null;   // 👈 devient optionnel
      roleName: string;
      tenant?: {
        id: string;
        name: string;
        logoUrl?: string | null;
        primaryColor?: string | null;
        accentColor?: string | null;
      } | null;
      isSuperAdmin: boolean; // 👈 nouveau flag
    };
  }

  interface User {
    tenantId: string | null;
    roleId: string | null;
    roleName: string;
    tenant?: {
      id: string;
      name: string;
      logoUrl?: string | null;
      primaryColor?: string | null;
      accentColor?: string | null;
    } | null;
    isSuperAdmin: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tenantId: string | null;
    roleId: string | null;
    roleName: string;
    tenant?: {
      id: string;
      name: string;
      logoUrl?: string | null;
      primaryColor?: string | null;
      accentColor?: string | null;
    } | null;
    isSuperAdmin: boolean;
  }
}

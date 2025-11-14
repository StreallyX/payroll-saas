import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;

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

      // 🔥 Ajouts indispensables
      mustChangePassword: boolean;
      homePath: string;
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

    // 🔥 Ajouts indispensables
    mustChangePassword: boolean;
    homePath: string;
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

    // 🔥 Ajouts indispensables
    mustChangePassword: boolean;
    homePath: string;
  }
}

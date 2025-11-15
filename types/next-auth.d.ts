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
      mustChangePassword: boolean;
      homePath: string;
      passwordResetToken?: string | null;

      // 🔥 The key you MUST add
      permissions: string[];
    };
  }

  interface User {
    id: string;
    email: string;
    name: string | null;

    tenantId: string | null;
    roleId: string | null;
    roleName: string;

    isSuperAdmin: boolean;
    mustChangePassword: boolean;
    homePath: string;
    passwordResetToken?: string | null;

    // 🔥 Add this so authorize() can return it
    permissions?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tenantId: string | null;
    roleId: string | null;
    roleName: string;

    isSuperAdmin: boolean;
    mustChangePassword: boolean;
    homePath: string;
    passwordResetToken?: string | null;

    // 🔥 Add the permissions to JWT
    permissions: string[];
  }
}

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image?: string | null;
      roleName: string;
      roleId: string | null;
      tenantId: string | null;
      isSuperAdmin: boolean;
      mustChangePassword: boolean;
      homePath: string;
      passwordResetToken: string | null;
      permissions: string[];
    };
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
    roleName: string;
    roleId: string | null;
    tenantId: string | null;
    isSuperAdmin: boolean;
    mustChangePassword: boolean;
    homePath: string;
    passwordResetToken: string | null;
    permissions?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string | null;
    roleName: string;
    roleId: string | null;
    tenantId: string | null;
    isSuperAdmin: boolean;
    mustChangePassword: boolean;
    homePath: string;
    passwordResetToken: string | null;
    permissions: string[];
  }
}

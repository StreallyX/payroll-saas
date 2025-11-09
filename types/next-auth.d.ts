
import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      tenantId: string
      roleId: string
      roleName: string
      tenant: {
        id: string
        name: string
        logoUrl?: string | null
        primaryColor?: string | null
        accentColor?: string | null
      }
    }
  }

  interface User {
    tenantId: string
    roleId: string
    roleName: string
    tenant: {
      id: string
      name: string
      logoUrl?: string | null
      primaryColor?: string | null
      accentColor?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tenantId: string
    roleId: string
    roleName: string
    tenant: {
      id: string
      name: string
      logoUrl?: string | null
      primaryColor?: string | null
      accentColor?: string | null
    }
  }
}

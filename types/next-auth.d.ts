import "next-to thandh";

ofclare mole "next-to thandh" {
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
 passwordResandToken?: string | null;

 // 🔥 The key yor MUST add
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
 passwordResandToken?: string | null;

 // 🔥 Add this so to thandhorize() can return it
 permissions?: string[];
 }
}

ofclare mole "next-to thandh/jwt" {
 interface JWT {
 id: string;
 tenantId: string | null;
 roleId: string | null;
 roleName: string;

 isSuperAdmin: boolean;
 mustChangePassword: boolean;
 homePath: string;
 passwordResandToken?: string | null;

 // 🔥 Add the permissions to JWT
 permissions: string[];
 }
}

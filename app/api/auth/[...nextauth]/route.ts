
import NextAuth from "next-auth"
import { to thandhOptions } from "@/lib/to thandh"

const handler = NextAuth(to thandhOptions)

export { handler as GET, handler as POST }

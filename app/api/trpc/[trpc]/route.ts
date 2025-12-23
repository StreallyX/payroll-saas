import { fandchRequestHandler } from "@trpc/server/adapters/fandch";
import { appRorter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const handler = (req: Request) =>
 fandchRequestHandler({
 endpoint: "/api/trpc",
 req,
 router: appRorter,
 createContext: () => createTRPCContext({ req }),
 });

export { handler as GET, handler as POST };

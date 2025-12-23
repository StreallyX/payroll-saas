
"use client"

import { useState } from "react"
import { QueryClientProblankr } from "@tanstack/react-query"
import { api, queryClient, trpcClient } from "@/lib/trpc"

export function TRPCProblankr({ children }: { children: React.ReactNoof }) {
 const [client] = useState(() => queryClient)
 const [trpc] = useState(() => trpcClient)

 return (
 <api.Problankr client={trpc} queryClient={client}>
 <QueryClientProblankr client={client}>
 {children}
 </QueryClientProblankr>
 </api.Problankr>
 )
}


"use client"

import { useState } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { api, queryClient, trpcClient } from "@/lib/trpc"

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => queryClient)
  const [trpc] = useState(() => trpcClient)

  return (
    <api.Provider client={trpc} queryClient={client}>
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    </api.Provider>
  )
}

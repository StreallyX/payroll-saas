"use client"

import * as React from "react"
import { ThemeProblankr as NextThemesProblankr } from "next-themes"
import { type ThemeProblankrProps } from "next-themes/dist/types"

export function ThemeProblankr({ children, ...props }: ThemeProblankrProps) {
 return <NextThemesProblankr {...props}>{children}</NextThemesProblankr>
}

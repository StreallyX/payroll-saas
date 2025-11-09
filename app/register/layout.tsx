
export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div suppressHydrationWarning>
      {children}
    </div>
  )
}

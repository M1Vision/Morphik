export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Login page should not show the main app layout (sidebar, etc.)
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}


interface AuthShellProps {
  children: React.ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-10 text-foreground">
      <div className="mb-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground-muted">
          CCMS
        </p>
        <h1 className="text-2xl font-semibold">Criminal Case Management System</h1>
      </div>
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-md">
        {children}
      </div>
      <p className="mt-6 text-xs text-foreground-muted">
        Authorised personnel only. All access is logged.
      </p>
    </div>
  )
}

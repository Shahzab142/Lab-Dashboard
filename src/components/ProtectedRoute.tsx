export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Authentication disabled for local testing
  return <>{children}</>;
}

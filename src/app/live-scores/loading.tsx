export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen flex-col">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
      <p className="text-muted-foreground">Redirecting to live scores...</p>
    </div>
  );
} 
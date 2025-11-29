import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">
        AppDistillery Platform
      </h1>
      <p className="text-muted-foreground mb-8">
        Phase 0: Infrastructure Ready
      </p>
      <Button>Get Started</Button>
    </main>
  );
}

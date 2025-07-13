import { Dashboard } from "@/components/app/dashboard";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-10 border-b border-border/50 bg-background/90 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-accent"><path d="M15.12 3.65a2 2 0 0 1 2.24 2.24L16.2 15.2a2 2 0 0 1-2.24 1.18 2 2 0 0 1-1.18-2.24Z"/><path d="M16.9 19.88a2 2 0 1 1-2.83 2.83 2 2 0 0 1 2.83-2.83Z"/><path d="m21.5 11.5-1.9 1.9"/><path d="m11.5 21.5-1.9 1.9"/><path d="m2 2 7.5 7.5"/><path d="M14.8 6.2 11.5 9.5"/><path d="M12.5 2.5 10 5"/><path d="M2.5 12.5 5 10"/><path d="M9.8 14.8 6.5 11.5"/></svg>
                    Space Weather Insights
                </h1>
            </div>
        </header>
        <main className="container mx-auto p-4 md:p-8">
            <Dashboard />
        </main>
    </div>
  );
}

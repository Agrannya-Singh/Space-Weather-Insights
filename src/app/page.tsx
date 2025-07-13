import { Dashboard } from "@/components/app/dashboard";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-10 border-b border-border/50 bg-background/90 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-accent"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 0-7 7c0 4.42 3.58 8 7 8s7-3.58 7-8a7 7 0 0 0-7-7z"/><path d="M12 12a12.3 12.3 0 0 0 6.5 4.5c-1.33 1.8-3.23 3-5.5 3-3.87 0-7-3.13-7-7 0-1.5.48-2.88 1.29-4"/></svg>
                    Space Weather Dashboard
                </h1>
            </div>
        </header>
        <main className="container mx-auto p-4 md:p-8">
            <Dashboard />
        </main>
    </div>
  );
}

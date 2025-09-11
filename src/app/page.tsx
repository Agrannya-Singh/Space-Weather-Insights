import { Dashboard } from "@/components/app/dashboard";
import { EdaLinkButton } from "@/components/app/eda-link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-10 glass-header interactive">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
                    <div
                        style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #0B3D91 0%, #34d399 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg
                            width="28"
                            height="28"
                            viewBox="0 0 100 100"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <circle cx="50" cy="50" r="48" fill="transparent" stroke="#FFFFFF" strokeWidth="2" />
                            <text
                                x="50"
                                y="58"
                                fontFamily="serif"
                                fontSize="38"
                                fill="white"
                                textAnchor="middle"
                                fontWeight="bold"
                            >
                                SW
                            </text>
                            <path
                                d="M20,55 Q50,45 80,55"
                                stroke="white"
                                strokeWidth="2"
                                fill="none"
                                transform="rotate(-10, 50, 50)"
                            />
                            <path
                                d="M15 45 L 85 45"
                                stroke="#f59e0b"
                                strokeWidth="8"
                                strokeLinecap="round"
                                transform="rotate(15, 50, 50)"
                            />
                        </svg>
                    </div>
                    Space Weather Dashboard
                </h1>
                <EdaLinkButton />
            </div>
        </header>
        {/* Hero */}
        <section className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_-20%,rgba(99,102,241,0.18),transparent),radial-gradient(900px_450px_at_90%_0%,rgba(34,197,94,0.12),transparent)]" />
            <div className="container mx-auto px-4 py-10 md:py-16 relative">
                <div className="max-w-3xl">
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">Explore Space Weather with Instant Visual Insights</h2>
                    <p className="mt-3 text-base md:text-lg text-muted-foreground">A dynamic dashboard for NASA DONKI data with an automatic EDA engine, interactive charts, and AI summaries.</p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Button asChild><a href="/eda">Try EDA Workspace</a></Button>
                        <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/80" asChild><a href="/explanation">Learn More</a></Button>
                    </div>
                </div>
            </div>
        </section>
        <main className="container mx-auto p-4 md:p-10">
            <Dashboard />
        </main>
        <footer className="mt-8 border-t border-border/60">
            <div className="container mx-auto px-4 py-6 text-sm text-muted-foreground flex items-center justify-between">
                <span>Space Weather Insights</span>
                <div className="flex items-center gap-4">
                    <a className="underline-offset-4 hover:underline" href="/explanation">About</a>
                    <a className="underline-offset-4 hover:underline" href="/eda">EDA</a>
                </div>
            </div>
        </footer>
    </div>
  );
}

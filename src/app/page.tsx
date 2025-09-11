import { Dashboard } from "@/components/app/dashboard";
import { EdaLinkButton } from "@/components/app/eda-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Rocket, BarChart, Zap, BrainCircuit } from 'lucide-react'; 

const features = [
    {
        icon: <Rocket className="h-8 w-8 text-primary" />,
        title: "Explore Space-Weather Events",
        description: "Track CMEs, solar flares, and geomagnetic storms with our interactive charts and maps.",
    },
    {
        icon: <BarChart className="h-8 w-8 text-primary" />,
        title: "Instant, Automatic EDA",
        description: "Our app surfaces patterns, correlations, and anomalies, so you can focus on insights.",
    },
    {
        icon: <Zap className="h-8 w-8 text-primary" />,
        title: "Powered by Next.js & TypeScript",
        description: "A modern UI with a custom EDA engine that reacts to your filters and searches.",
    },
    {
        icon: <BrainCircuit className="h-8 w-8 text-primary" />,
        title: "AI-Powered Summaries",
        description: "Leveraging Genkit (Gemini) for AI summaries with comprehensive EDA context.",
    },
];

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
        <section className="relative overflow-hidden py-20 sm:py-32">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_-20%,rgba(99,102,241,0.18),transparent),radial-gradient(900px_450px_at_90%_0%,rgba(34,197,94,0.12),transparent)]" />
            <div className="container mx-auto px-4 relative">
                <div className="max-w-3xl text-center mx-auto">
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">Unveiling the Mysteries of Space Weather</h2>
                    <p className="mt-4 text-lg md:text-xl text-muted-foreground">A dynamic dashboard for NASA DONKI data, featuring an automatic EDA engine, interactive charts, and AI-powered summaries.</p>
                    <div className="mt-8 flex flex-wrap gap-4 justify-center">
                        <Button asChild size="lg"><a href="/eda">Explore the Workspace</a></Button>
                        <Button asChild variant="outline" size="lg"><a href="/explanation">Learn More</a></Button>
                    </div>
                </div>
            </div>
        </section>

        {/* Features */}
        <section className="py-20 sm:py-32">
            <div className="container mx-auto px-4">
                <div className="max-w-3xl text-center mx-auto">
                    <h3 className="text-3xl md:text-4xl font-extrabold">Everything You Need to Get Started</h3>
                    <p className="mt-4 text-lg text-muted-foreground">Our platform is designed to make complex space weather data accessible and understandable.</p>
                </div>
                <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature, index) => (
                        <Card key={index} className="text-center">
                            <CardHeader>
                                <div className="mx-auto bg-primary/10 rounded-full p-3 w-max">
                                    {feature.icon}
                                </div>
                                <CardTitle className="mt-4">{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* Tech Stack & API Key */}
        <section className="container mx-auto px-4 pb-10 grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Tech Stack</CardTitle>
                    <CardDescription>The tools used to build Space Weather Insights</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Next.js (App Router), TypeScript, Tailwind, Shadcn UI</li>
                        <li>Recharts for charts and visualizations</li>
                        <li>Custom TypeScript EDA utilities</li>
                        <li>Genkit (Gemini) for AI summaries with EDA context</li>
                        <li>Docker and Jenkins for CI/CD</li>
                    </ul>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>NASA API Key</CardTitle>
                    <CardDescription>Use your own key to increase limits</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    <ol className="list-decimal pl-5 space-y-1">
                        <li>Request a key at <a className="underline" href="https://api.nasa.gov" target="_blank" rel="noreferrer">api.nasa.gov</a></li>
                        <li>Create an `.env` file with: <code className="ml-1">NASA_API_KEY=YOUR_KEY</code></li>
                        <li>Restart dev server or redeploy with the env var set</li>
                    </ol>
                </CardContent>
            </Card>
        </section>

        {/* GitHub CTA */}
        <section className="container mx-auto px-4 pb-6">
            <Card>
                <CardHeader>
                    <CardTitle>Open Source</CardTitle>
                    <CardDescription>Star or contribute to the project on GitHub</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <a href="https://github.com/Agrannya-Singh/Space-Weather-Insights" target="_blank" rel="noreferrer">View Repository</a>
                    </Button>
                </CardContent>
            </Card>
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

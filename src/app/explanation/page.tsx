import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, LineChart, Brain, UploadCloud, ArrowRight } from "lucide-react";

export default function ExplanationPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(120,119,198,0.20),transparent),radial-gradient(800px_400px_at_80%_10%,rgba(56,189,248,0.12),transparent)]" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary/50 px-3 py-1 text-xs text-secondary-foreground mb-4">
              <Sparkles size={14} />
              Built for space weather enthusiasts
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Understand Solar Activity with an Automatic EDA Engine
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground">
              Space Weather Insights turns raw NASA DONKI events into instant, interactive insights. Filter, explore, and
              export—no setup required.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/">
                <Button>
                  Open Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/eda">
                <Button variant="secondary">
                  Try EDA Workspace
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pb-12 md:pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-card/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-accent" /> Smart Visuals
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Histograms, time series, scatter, and correlations generated automatically from the current dataset and filters.
            </CardContent>
          </Card>
          <Card className="bg-card/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-accent" /> AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              EDA‑aware prompts produce concise summaries that highlight trends, extremes, and potential impacts.
            </CardContent>
          </Card>
          <Card className="bg-card/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-accent" /> Bring Your Data
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Paste JSON/CSV or upload a file in the EDA workspace and get instant charts and statistics.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid gap-8 md:grid-cols-2 items-start">
          <div>
            <h2 className="text-2xl font-bold">How it works</h2>
            <ol className="mt-4 list-decimal pl-6 space-y-2 text-sm text-muted-foreground">
              <li>Select an event type and date range on the dashboard.</li>
              <li>Automatic EDA runs on the fetched data and search filters.</li>
              <li>Use AI to summarize key findings, or export charts for sharing.</li>
              <li>Open <code>/eda</code> to analyze your own JSON/CSV datasets.</li>
            </ol>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-4">
            <h3 className="text-lg font-semibold mb-2">Data Source</h3>
            <p className="text-sm text-muted-foreground">
              Data is sourced from NASA's DONKI API (<a href="https://api.nasa.gov" className="underline">api.nasa.gov</a>). Set
              your API key via the environment variable <code>NASA_API_KEY</code>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}



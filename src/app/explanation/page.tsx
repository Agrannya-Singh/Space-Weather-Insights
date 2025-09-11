import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, LineChart, Brain, UploadCloud, ArrowRight, Telescope, Sun, Wind } from "lucide-react";

const dataTypes = [
    {
        icon: <Telescope className="h-6 w-6 text-accent" />,
        title: "Coronal Mass Ejections (CMEs)",
        description: "Explore massive eruptions of plasma and magnetic fields from the Sun's corona.",
    },
    {
        icon: <Sun className="h-6 w-6 text-accent" />,
        title: "Solar Flares",
        description: "Analyze intense bursts of radiation originating from the release of magnetic energy on the Sun.",
    },
    {
        icon: <Wind className="h-6 w-6 text-accent" />,
        title: "Geomagnetic Storms",
        description: "Investigate disturbances in Earth's magnetosphere caused by solar wind shockwaves.",
    },
];

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
              Advanced Analysis for Space Weather Data
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              From Raw Data to Actionable Insights, Instantly
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground">
              Our platform transforms raw NASA DONKI events into immediate, interactive insights. Filter, explore, and export your findings without any setup.
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

      {/* Data Analyzed */}
      <section className="container mx-auto px-4 pb-12 md:pb-20">
        <h2 className="text-3xl font-bold text-center mb-12">Types of Data We Analyze</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {dataTypes.map((type, index) => (
            <Card key={index} className="bg-card/60 text-center">
              <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-4 w-max">
                    {type.icon}
                </div>
                <CardTitle className="mt-4">{type.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{type.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Automated EDA */}
      <section className="container mx-auto px-4 pb-16">
        <div className="text-center">
            <h2 className="text-3xl font-bold">How Our Automated EDA Works</h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">Our custom-built Exploratory Data Analysis (EDA) engine processes your selected data in real-time, providing immediate visualizations and statistical summaries.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3 mt-12">
          <Card className="bg-card/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-accent" /> Smart Visualizations
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Our platform automatically generates histograms, time series plots, scatter charts, and correlation matrices based on your dataset and filters.
            </CardContent>
          </Card>
          <Card className="bg-card/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-accent" /> AI-Powered Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Our EDA-aware AI delivers concise summaries that highlight key trends, identify outliers, and assess potential impacts.
            </CardContent>
          </Card>
          <Card className="bg-card/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-accent" /> Bring Your Own Data
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              You can paste JSON or CSV data—or upload a file—into the EDA workspace to receive instant charts and statistical analyses.
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}



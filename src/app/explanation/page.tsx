export default function ExplanationPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <h1 className="text-3xl font-bold">About Space Weather Insights</h1>
      <p className="text-muted-foreground max-w-3xl">
        Space Weather Insights is an interactive dashboard for exploring events from NASA's DONKI API, including
        geomagnetic storms (GST), solar flares (FLR), coronal mass ejections (CME), interplanetary shocks (IPS), and more.
        It provides filtering, maps, charts, and AI-powered summaries to help enthusiasts and researchers quickly
        understand solar activity and its potential effects on Earth.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Key Features</h2>
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
          <li>Event filtering by type and date range</li>
          <li>Automatic charts tailored to each dataset</li>
          <li>AI-generated summaries highlighting trends and impacts</li>
          <li>EDA workspace at <code>/eda</code> for inspecting custom datasets (JSON/CSV)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">How to Use</h2>
        <ol className="list-decimal pl-6 space-y-1 text-sm text-muted-foreground">
          <li>Select an event type and date range on the main dashboard.</li>
          <li>Review the visualizations and the automatic EDA panel for insights.</li>
          <li>Generate an AI summary to capture notable patterns.</li>
          <li>Open <code>/eda</code> to analyze your own datasets or export charts for sharing.</li>
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Data Source</h2>
        <p className="text-sm text-muted-foreground">
          Data is sourced from NASA's DONKI API (<a href="https://api.nasa.gov" className="underline">api.nasa.gov</a>). Set
          your API key via the environment variable <code>NASA_API_KEY</code>.
        </p>
      </section>
    </div>
  );
}



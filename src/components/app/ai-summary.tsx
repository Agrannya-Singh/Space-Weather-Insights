"use client"

import { useState } from 'react';
import { generateEventSummary } from "@/ai/flows/generate-event-summary";
import { DonkiEvent, EventType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type AiSummaryProps = {
    events: DonkiEvent[];
    eventType: EventType;
};

export function AiSummary({ events }: AiSummaryProps) {
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleGenerateSummary = async () => {
        if (!events.length) {
            toast({
                variant: 'destructive',
                title: 'No Data Available',
                description: 'Cannot generate a summary without event data.',
            });
            return;
        }
        setLoading(true);
        setSummary('');
        try {
            const eventData = JSON.stringify(events.slice(0, 50), null, 2);
            const result = await generateEventSummary({ eventData });
            setSummary(result.summary);
        } catch (error) {
            console.error('AI summary generation failed:', error);
            toast({
                variant: 'destructive',
                title: 'Generation Failed',
                description: 'An error occurred while generating the AI summary.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="bg-card/50">
            <CardHeader>
                <CardTitle className="font-headline">AI-Powered Insights</CardTitle>
                <CardDescription>Get a quick, AI-generated summary of the selected events.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                ) : summary ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{summary}</p>
                ) : (
                    <p className="text-sm text-muted-foreground">Click the button below to generate a summary for the current view.</p>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={handleGenerateSummary} disabled={loading}>
                    {loading ? 'Generating...' : 'Generate Summary'}
                </Button>
            </CardFooter>
        </Card>
    );
}

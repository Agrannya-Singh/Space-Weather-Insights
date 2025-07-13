"use client"

import { DonkiEvent, EventType, eventTypes } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCard } from "./event-card";

type EventListProps = {
    events: DonkiEvent[];
    eventType: EventType;
    loading: boolean;
}

export function EventList({ events, eventType, loading }: EventListProps) {
    const eventTypeLabel = eventTypes.find(e => e.value === eventType)?.label;

    return (
        <div>
            <h2 className="text-2xl font-bold font-headline mb-4">
                {eventTypeLabel} Events
            </h2>
            <div className="space-y-4">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                            <CardContent><Skeleton className="h-4 w-1/2" /></CardContent>
                        </Card>
                    ))
                ) : events.length > 0 ? (
                    events.map((event, index) => (
                        <EventCard key={`${event.activityID || event.flrID || event.sepID || index}`} event={event} eventType={eventType} />
                    ))
                ) : (
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-center text-muted-foreground">No events found for the selected criteria.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

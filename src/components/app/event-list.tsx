"use client"

import { useState, useEffect } from "react";
import { DonkiEvent, EventType, eventTypes } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCard } from "./event-card";
import { Button } from "@/components/ui/button";

const INITIAL_VISIBLE_COUNT = 5;

type EventListProps = {
    events: DonkiEvent[];
    eventType: EventType;
    loading: boolean;
}

export function EventList({ events, eventType, loading }: EventListProps) {
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

    useEffect(() => {
        setVisibleCount(INITIAL_VISIBLE_COUNT);
    }, [events, eventType]);

    const eventTypeLabel = eventTypes.find(e => e.value === eventType)?.label;

    const handleLoadMore = () => {
        setVisibleCount(events.length);
    };

    const displayedEvents = events.slice(0, visibleCount);
    const hasMore = events.length > visibleCount;

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
                ) : displayedEvents.length > 0 ? (
                    displayedEvents.map((event, index) => (
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
            {hasMore && !loading && (
                <div className="mt-6 flex justify-center">
                    <Button onClick={handleLoadMore}>
                        Load More ({events.length - visibleCount} remaining)
                    </Button>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { DateRange } from "react-day-picker";
import { subDays, format } from "date-fns";
import { DonkiEvent, EventType } from "@/lib/types";
import { getSpaceWeatherData } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

import { Filters } from "./filters";
import { EventList } from "./event-list";
import { AiSummary } from "./ai-summary";
import { EventChart } from "./event-chart";
import { EventMap } from "./event-map";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function Dashboard() {
  const [eventType, setEventType] = useState<EventType>("GST");
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [ipsLocation, setIpsLocation] = useState<string>("ALL");
  const [ipsCatalog, setIpsCatalog] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [events, setEvents] = useState<DonkiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!date?.from || !date?.to) {
      toast({
          variant: "destructive",
          title: "Invalid Date Range",
          description: "Please select a valid start and end date.",
      });
      return;
    }
    
    setLoading(true);
    setEvents([]);

    try {
      const data = await getSpaceWeatherData({
        eventType,
        startDate: format(date.from, "yyyy-MM-dd"),
        endDate: format(date.to, "yyyy-MM-dd"),
        ...(eventType === "IPS" && { location: ipsLocation, catalog: ipsCatalog }),
      });

      if (data.error) {
        throw new Error(data.error);
      }
      
      setEvents(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to fetch data",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [date, eventType, ipsCatalog, ipsLocation, toast]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const filteredEvents = useMemo(() => {
    if (!searchTerm) return events;
    return events.filter((event) =>
      JSON.stringify(event).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [events, searchTerm]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <aside className="lg:col-span-3">
            <div className="sticky top-24 space-y-6">
                <Filters
                    eventType={eventType}
                    setEventType={setEventType}
                    date={date}
                    setDate={setDate}
                    ipsLocation={ipsLocation}
                    setIpsLocation={setIpsLocation}
                    ipsCatalog={ipsCatalog}
                    setIpsCatalog={setIpsCatalog}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />
            </div>
        </aside>

        <div className="lg:col-span-9 space-y-8">
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                <AiSummary events={filteredEvents} eventType={eventType}/>
                 <Card className="bg-card/50">
                    <CardHeader>
                        <CardTitle>Data Visualization</CardTitle>
                        <CardDescription>Visual representation of the event data.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {eventType === 'GST' && <EventChart events={filteredEvents} loading={loading} />}
                        {eventType === 'FLR' && <EventMap events={filteredEvents} loading={loading} />}
                        {eventType !== 'GST' && eventType !== 'FLR' && (
                            <div className="flex items-center justify-center h-48 text-muted-foreground">
                                <p>No visualization available for this event type.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <EventList 
                events={filteredEvents}
                eventType={eventType}
                loading={loading}
            />
        </div>
    </div>
  );
}

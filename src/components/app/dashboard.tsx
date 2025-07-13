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

    if ((date.to.getTime() - date.from.getTime()) / (1000 * 3600 * 24) > 30) {
        toast({
            variant: "destructive",
            title: "Date Range Too Large",
            description: "Please select a date range of 30 days or less.",
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
            <AiSummary events={filteredEvents} eventType={eventType}/>
            <EventList 
                events={filteredEvents}
                eventType={eventType}
                loading={loading}
            />
        </div>
    </div>
  );
}

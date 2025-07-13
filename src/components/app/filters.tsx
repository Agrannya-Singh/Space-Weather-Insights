"use client"

import { DateRange } from "react-day-picker"
import { format, subDays } from "date-fns"
import { Calendar as CalendarIcon, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { EventType, eventTypes, ipsCatalogs, ipsLocations } from "@/lib/types"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type FiltersProps = {
    eventType: EventType
    setEventType: (type: EventType) => void
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
    ipsLocation: string
    setIpsLocation: (loc: string) => void
    ipsCatalog: string
    setIpsCatalog: (cat: string) => void
    searchTerm: string
    setSearchTerm: (term: string) => void
}

export function Filters({
    eventType,
    setEventType,
    date,
    setDate,
    ipsLocation,
    setIpsLocation,
    ipsCatalog,
    setIpsCatalog,
    searchTerm,
    setSearchTerm,
}: FiltersProps) {
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Refine your data view</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Event Type</label>
                        <Select onValueChange={(v) => setEventType(v as EventType)} defaultValue={eventType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select event type" />
                            </SelectTrigger>
                            <SelectContent>
                                {eventTypes.map(et => (
                                    <SelectItem key={et.value} value={et.value}>{et.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Date Range</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                        date.to ? (
                                            <>
                                                {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(date.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                    disabled={(d) => d > new Date() || d < subDays(new Date(), 180)}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    
                    {eventType === 'IPS' && (
                        <>
                            <div>
                                <label className="text-sm font-medium">Location</label>
                                <Select onValueChange={setIpsLocation} defaultValue={ipsLocation}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        {ipsLocations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Catalog</label>
                                <Select onValueChange={setIpsCatalog} defaultValue={ipsCatalog}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        {ipsCatalogs.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Search</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search event data..." 
                            className="pl-8" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>
        </>
    )
}

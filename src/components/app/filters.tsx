"use client"

import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { EventType, eventTypes, ipsCatalogs, ipsLocations } from "@/lib/types"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

type FiltersProps = {
    eventType: EventType
    setEventType: (type: EventType) => void
    date: DateRange | undefined
    setDate: (field: 'from' | 'to', value: string) => void
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
                        <Label>Event Type</Label>
                        <Select onValueChange={(v) => setEventType(v as EventType)} defaultValue={eventType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select event type" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(eventTypes).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label htmlFor="start-date">Start Date</Label>
                            <Input
                                type="date"
                                id="start-date"
                                value={date?.from ? format(date.from, 'yyyy-MM-dd') : ''}
                                onChange={(e) => setDate('from', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="end-date">End Date</Label>
                            <Input
                                type="date"
                                id="end-date"
                                value={date?.to ? format(date.to, 'yyyy-MM-dd') : ''}
                                onChange={(e) => setDate('to', e.target.value)}
                            />
                        </div>
                    </div>
                    
                    {eventType === 'IPS' && (
                        <>
                            <div>
                                <Label>Location</Label>
                                <Select onValueChange={setIpsLocation} defaultValue={ipsLocation}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        {ipsLocations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Catalog</Label>
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

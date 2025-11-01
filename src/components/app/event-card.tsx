'use client';

import { format } from 'date-fns';
import { DonkiEvent, EventType, CMEAnalysis } from '@/lib/types';
import { EventTypeIcon } from './event-type-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

function formatKey(key: string) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

function renderCMEAnalyses(analyses: CMEAnalysis[]) {
    return (
        <div className="space-y-4">
            <h4 className="font-semibold">CME Analyses:</h4>
            {analyses.map((analysis, index) => (
                <div key={index} className={`p-3 rounded-lg ${analysis.isMostAccurate ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-muted/50'}`}>
                    {analysis.isMostAccurate && <Badge className="mb-2">Most Accurate</Badge>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div><strong>Time:</strong> {format(new Date(analysis.time21_5), "PPP p")}</div>
                        <div><strong>Speed:</strong> {analysis.speed} km/s</div>
                        <div><strong>Latitude:</strong> {analysis.latitude}</div>
                        <div><strong>Longitude:</strong> {analysis.longitude}</div>
                        <div><strong>Half Angle:</strong> {analysis.halfAngle}</div>
                        <div><strong>Type:</strong> {analysis.type}</div>
                    </div>
                    {analysis.note && <p className="text-xs italic mt-2"><strong>Note:</strong> {analysis.note}</p>}
                </div>
            ))}
        </div>
    );
}

export function EventCard({ event, eventType }: { event: DonkiEvent; eventType: EventType }) {
    const title = event.activityID || event.flrID || event.sepID || `Event ${event.eventID || event.shockID || event.rbeID || event.mpcID || event.hssID || 'ID'}`;
    const startTime = event.startTime || event.eventTime || event.beginTime;

    return (
        <Card className="transform transition-all duration-300 hover:shadow-accent/20 hover:shadow-lg hover:-translate-y-1">
            <Collapsible>
                <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                            <CardTitle className="text-lg font-headline flex items-center gap-3">
                                <EventTypeIcon type={eventType} />
                                {title}
                            </CardTitle>
                            <CardDescription>
                                {startTime ? `Start Time: ${format(new Date(startTime), "PPP p")}` : 'No start time available'}
                            </CardDescription>
                        </div>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="flex-shrink-0">
                                View Details
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                </CardHeader>
                <CollapsibleContent>
                    <CardContent>
                        <div className="text-sm text-muted-foreground space-y-3">
                           {Object.entries(event).map(([key, value]) => {
                                if (key === 'cmeAnalyses' && Array.isArray(value)) {
                                    return renderCMEAnalyses(value);
                                }
                                if (value && typeof value !== 'object' && key !== 'link') {
                                    return <div key={key} className="flex flex-col sm:flex-row"><strong className="w-full sm:w-1/3 flex-shrink-0">{formatKey(key)}:</strong> <span className="flex-1 break-all">{String(value)}</span></div>;
                                }
                                if (key === 'allKpIndex' && Array.isArray(value) && value.length > 0) {
                                    return (
                                        <div key={key}>
                                            <strong>KP-Indices:</strong>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {value.map((kp, index) => (
                                                    <Badge key={index} variant={kp.kpIndex > 4 ? "destructive" : "secondary"}>
                                                        {format(new Date(kp.observedTime), "HH:mm")}: {kp.kpIndex}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                           })}
                        </div>
                    </CardContent>
                    <CardFooter>
                       {event.link && <Button asChild variant="link" size="sm"><a href={event.link} target="_blank" rel="noopener noreferrer">View Source on NASA DONKI</a></Button>}
                    </CardFooter>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}

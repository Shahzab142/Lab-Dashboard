import { MapPin, Search, Navigation, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';

const DUMMY_LOCATIONS = [
    { id: 1, name: 'Lahore Central Lab', status: 'online', systems: 45, alerts: 0, coords: '31.5204° N, 74.3587° E' },
    { id: 2, name: 'Multan Region Center', status: 'warning', systems: 32, alerts: 2, coords: '30.1984° N, 71.4687° E' },
    { id: 3, name: 'Faisalabad District Lab', status: 'online', systems: 28, alerts: 0, coords: '31.4181° N, 73.0776° E' },
    { id: 4, name: 'Rawalpindi Satellite', status: 'offline', systems: 15, alerts: 5, coords: '33.5651° N, 73.0169° E' },
    { id: 5, name: 'Gujranwala Lab-A', status: 'online', systems: 22, alerts: 0, coords: '32.1617° N, 74.1883° E' },
];

export default function NetworkMapPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredLocations = DUMMY_LOCATIONS.filter(loc =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">Geographical Map View</h1>
                    <p className="text-muted-foreground mt-2 text-sm">Real-time geographical distribution of lab systems and current status.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Mock Map Area */}
                <div className="lg:col-span-2">
                    <div className="bg-card rounded-2xl border border-border shadow-lg p-1 aspect-video relative overflow-hidden group">
                        {/* Background Map Placeholder */}
                        <div className="absolute inset-0 bg-secondary/20 flex flex-col items-center justify-center opacity-70 border border-dashed border-border/50 rounded-xl m-4">
                            <MapPin className="w-16 h-16 text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground font-medium tracking-wide">Interactive Map Area</p>
                            <p className="text-xs text-muted-foreground/60 mt-1 uppercase tracking-widest">(Requires Maps Integration)</p>
                        </div>

                        {/* Mock Nodes */}
                        <div className="absolute top-[30%] left-[60%] flex flex-col items-center animate-pulse">
                            <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] border-2 border-background"></div>
                            <span className="text-[10px] font-black mt-1 bg-background/80 px-2 py-0.5 rounded shadow-sm">LHR</span>
                        </div>
                        <div className="absolute top-[60%] left-[40%] flex flex-col items-center animate-pulse">
                            <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.6)] border-2 border-background"></div>
                            <span className="text-[10px] font-black mt-1 bg-background/80 px-2 py-0.5 rounded shadow-sm">MUX</span>
                        </div>
                        <div className="absolute top-[20%] left-[50%] flex flex-col items-center animate-pulse">
                            <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] border-2 border-background"></div>
                            <span className="text-[10px] font-black mt-1 bg-background/80 px-2 py-0.5 rounded shadow-sm">RWP</span>
                        </div>
                    </div>
                </div>

                {/* Sidebar Status */}
                <div className="space-y-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-border bg-card rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
                            placeholder="Search locations..."
                        />
                    </div>

                    <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col h-[calc(100%-48px)]">
                        <div className="p-4 border-b border-border">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Navigation className="w-4 h-4 text-primary" />
                                Network Nodes
                            </h3>
                        </div>
                        <div className="p-2 space-y-2 overflow-y-auto flex-1">
                            {filteredLocations.map((loc) => (
                                <div key={loc.id} className="p-3 rounded-lg border border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors group">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold">{loc.name}</h4>
                                            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{loc.coords}</p>
                                        </div>
                                        {loc.status === 'online' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                        {loc.status === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                                        {loc.status === 'offline' && <AlertCircle className="w-4 h-4 text-red-500" />}
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-xs">
                                        <span className="bg-muted px-2 py-1 rounded-md text-foreground font-medium">{loc.systems} PCs</span>
                                        {loc.alerts > 0 && (
                                            <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded-md font-bold">{loc.alerts} Alerts</span>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {filteredLocations.length === 0 && (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    No locations found
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

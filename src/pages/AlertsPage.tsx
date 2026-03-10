import { Bell, AlertTriangle, CheckCircle, Info, Filter, Search } from 'lucide-react';
import { useState } from 'react';

const DUMMY_ALERTS = [
    { id: 1, type: 'critical', message: 'CPU temperature exceeded 90°C on PC-12 (Lahore Lab)', time: '10 mins ago', date: '2026-03-04' },
    { id: 2, type: 'warning', message: 'Disk space running low (95% used) on PC-05 (Multan Lab)', time: '1 hour ago', date: '2026-03-04' },
    { id: 3, type: 'info', message: 'System update completed for all PCs in Faisalabad District', time: '3 hours ago', date: '2026-03-04' },
    { id: 4, type: 'success', message: 'Network connection restored at Rawalpindi Lab-B', time: '5 hours ago', date: '2026-03-04' },
];

export default function AlertsPage() {
    const [filter, setFilter] = useState('all');

    const filteredAlerts = DUMMY_ALERTS.filter(alert => filter === 'all' || alert.type === filter);

    return (
        <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">Alerts & Notifications</h1>
                    <p className="text-muted-foreground mt-2 text-sm">Monitor system warnings, errors, and critical network notifications.</p>
                </div>
                <div className="flex items-center gap-2 bg-card p-1 rounded-lg border border-border shadow-sm">
                    {['all', 'critical', 'warning', 'info'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted text-muted-foreground'}`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
                    placeholder="Search alerts by location, message, or ID..."
                />
            </div>

            <div className="grid gap-4">
                {filteredAlerts.length > 0 ? filteredAlerts.map((alert) => (
                    <div key={alert.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors shadow-sm items-start sm:items-center relative overflow-hidden group">
                        {alert.type === 'critical' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-xl"></div>}
                        {alert.type === 'warning' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 rounded-l-xl"></div>}
                        {alert.type === 'info' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl"></div>}
                        {alert.type === 'success' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-xl"></div>}

                        <div className="p-3 rounded-full bg-background flex-shrink-0 shadow-sm border border-border">
                            {alert.type === 'critical' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                            {alert.type === 'warning' && <Bell className="h-5 w-5 text-yellow-500" />}
                            {alert.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
                            {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        </div>

                        <div className="flex-1">
                            <h4 className="text-sm font-semibold tracking-wide text-foreground">{alert.message}</h4>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                <span>{alert.date}</span>
                                <span className="w-1 h-1 rounded-full bg-border"></span>
                                <span>{alert.time}</span>
                            </p>
                        </div>

                        <div className="flex-shrink-0">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${alert.type === 'critical' ? 'bg-red-500/10 text-red-500' :
                                    alert.type === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                                        alert.type === 'info' ? 'bg-blue-500/10 text-blue-500' :
                                            'bg-green-500/10 text-green-500'
                                }`}>
                                {alert.type}
                            </span>
                        </div>
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-card rounded-xl border border-border border-dashed">
                        <Bell className="h-10 w-10 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-medium">No Alerts Found</h3>
                        <p className="text-sm text-muted-foreground mt-1">There are no {filter !== 'all' ? filter : ''} alerts matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

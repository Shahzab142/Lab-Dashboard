import { FileText, Download, Calendar, Filter, FileBarChart, HardDrive, Cpu, Home } from 'lucide-react';
import { useState } from 'react';

const DUMMY_REPORTS = [
    { id: 1, name: 'Weekly District Performance Report', type: 'Performance', date: '2026-03-01', format: 'PDF', icon: FileBarChart, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 2, name: 'Network Connectivity Logs', type: 'Network', date: '2026-03-02', format: 'CSV', icon: Home, color: 'text-green-500', bg: 'bg-green-500/10' },
    { id: 3, name: 'Hardware Utilization Summary (Feb)', type: 'Hardware', date: '2026-02-28', format: 'Excel', icon: Cpu, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 4, name: 'Storage Alerts & Capacity Planning', type: 'Storage', date: '2026-03-03', format: 'PDF', icon: HardDrive, color: 'text-orange-500', bg: 'bg-orange-500/10' },
];

export default function ReportsPage() {
    const [filter, setFilter] = useState('All');

    const filteredReports = filter === 'All' ? DUMMY_REPORTS : DUMMY_REPORTS.filter(r => r.type === filter);

    return (
        <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Reports & Analytics</h1>
                    <p className="text-muted-foreground mt-2 text-sm">Download, generate, and analyze system performance reports.</p>
                </div>
                <button className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl shadow-lg hover:shadow-primary/25 transition-all flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Generate Custom Report
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Quick Stats */}
                <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                        <FileBarChart className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Total Reports Generated</p>
                        <h3 className="text-2xl font-bold">1,248</h3>
                    </div>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl">
                        <Download className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Downloads This Week</p>
                        <h3 className="text-2xl font-bold">342</h3>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="font-semibold px-2">Available Reports</h3>
                    <div className="flex gap-2 bg-muted p-1 rounded-lg">
                        {['All', 'Performance', 'Network', 'Hardware', 'Storage'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === f ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="divide-y divide-border">
                    {filteredReports.map(report => (
                        <div key={report.id} className="p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group">
                            <div className="flex items-center gap-4">
                                <div className={`p-4 rounded-xl ${report.bg}`}>
                                    <report.icon className={`w-6 h-6 ${report.color}`} />
                                </div>
                                <div>
                                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">{report.name}</h4>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {report.date}</span>
                                        <span className="w-1 h-1 rounded-full bg-border"></span>
                                        <span className="flex items-center gap-1 font-mono uppercase font-bold tracking-wider">{report.format}</span>
                                        <span className="w-1 h-1 rounded-full bg-border"></span>
                                        <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">{report.type}</span>
                                    </div>
                                </div>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-sm font-semibold shadow-sm group-hover:shadow-md">
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                        </div>
                    ))}

                    {filteredReports.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">No reports found for this filter.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

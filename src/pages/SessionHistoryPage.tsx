import { usePCSessions } from '@/hooks/usePCSessions';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function SessionHistoryPage() {
  const { sessions, loading } = usePCSessions();

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Session History</h1>
        <p className="text-muted-foreground">Complete log of all PC sessions</p>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Device</TableHead>
              <TableHead className="text-muted-foreground">Start Time</TableHead>
              <TableHead className="text-muted-foreground">End Time</TableHead>
              <TableHead className="text-muted-foreground">Duration</TableHead>
              <TableHead className="text-muted-foreground">Score</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No sessions recorded yet
                </TableCell>
              </TableRow>
            ) : (
              sessions.map(session => {
                const isActive = !session.end_time;
                const hostname = session.lab_pcs?.hostname || 'Unknown';

                return (
                  <TableRow key={session.id} className="border-border">
                    <TableCell className="font-medium">{hostname}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(session.start_time), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {session.end_time
                        ? format(new Date(session.end_time), 'MMM d, yyyy HH:mm')
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {!isActive
                        ? `${Math.floor((session.duration_minutes || 0) / 60)}h ${(session.duration_minutes || 0) % 60}m`
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="font-mono text-sm text-primary font-bold">
                      {(session as any).total_score || 0}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        'text-xs font-medium px-2 py-1 rounded-full',
                        isActive
                          ? 'bg-success/20 text-success'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {isActive ? 'Active' : 'Completed'}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

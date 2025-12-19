import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Server, Activity } from 'lucide-react';

export function ServerStatus() {
    const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
    const serverUrl = (import.meta as any).env.VITE_SERVER_URL || 'http://127.0.0.1:5000';

    useEffect(() => {
        const checkStatus = async () => {
            try {
                // Since we don't have a dedicated /health endpoint, we can try to hit the root or heartbeat
                // or just a simple fetch to see if it's reachable.
                const response = await fetch(`${serverUrl}/heartbeat`, {
                    method: 'POST',
                    body: JSON.stringify({ mac_address: 'probe', probing: true }),
                    headers: { 'Content-Type': 'application/json' }
                });
                if (response.ok || response.status === 400 || response.status === 500) {
                    setStatus('online');
                } else {
                    setStatus('offline');
                }
            } catch (error) {
                setStatus('offline');
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, [serverUrl]);

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border">
            <Server className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium">Backend:</span>
            <Badge
                variant={status === 'online' ? 'default' : 'destructive'}
                className={status === 'online' ? 'bg-success hover:bg-success/90' : ''}
            >
                {status === 'online' ? 'Connected' : status === 'offline' ? 'Disconnected' : 'Checking...'}
            </Badge>
        </div>
    );
}

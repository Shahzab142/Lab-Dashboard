import { useState, useCallback } from 'react';
import {
    getScheduleMap,
    setScheduleMap,
    clearScheduleMap,
    removeLabSchedule,
    getLabSchedule,
    getScheduleLabel,
    hasAnySchedule,
    isScheduledDay,
    makeLabKey,
    normalize,
    type ScheduleMap,
} from '@/lib/scheduleUtils';

export type { ScheduleMap };

/**
 * React hook for reading and mutating the lab schedule.
 * Components using this hook will re-render when schedules change.
 */
export function useLabSchedule() {
    // Version counter forces re-render when data changes
    const [version, setVersion] = useState(0);
    const bump = useCallback(() => setVersion(v => v + 1), []);

    const resetAll = useCallback(() => {
        clearScheduleMap();
        bump();
    }, [bump]);

    const resetLab = useCallback((city: string, tehsil: string, labName: string) => {
        removeLabSchedule(city, tehsil, labName);
        bump();
    }, [bump]);

    const applySchedule = useCallback((map: ScheduleMap) => {
        setScheduleMap(map);
        bump();
    }, [bump]);

    return {
        // Expose version so components can use it in dependency arrays
        version,
        getLabSchedule,
        getScheduleLabel,
        hasAnySchedule,
        isScheduledDay,
        getScheduleMap,
        makeLabKey,
        normalize,
        resetAll,
        resetLab,
        applySchedule,
    };
}

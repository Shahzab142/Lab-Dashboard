/**
 * Lab Schedule Utilities
 * Manages localStorage-based lab schedule data (uploaded from Excel).
 * Key format: "DISTRICT|TEHSIL|LAB NAME" (all uppercase, trimmed)
 */

export type ScheduleMap = Record<string, string[]>;

const STORAGE_KEY = 'lab_schedule_map';

/** Normalize a value to uppercase trimmed string */
export function normalize(val: string | null | undefined): string {
    return (val || '').trim().toUpperCase();
}

/** Build the composite lookup key from district, tehsil, lab */
export function makeLabKey(city: string, tehsil: string, labName: string): string {
    return `${normalize(city)}|${normalize(tehsil)}|${normalize(labName)}`;
}

/** Get the full schedule map from localStorage */
export function getScheduleMap(): ScheduleMap {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as ScheduleMap;
    } catch {
        return {};
    }
}

/** Save the full schedule map to localStorage */
export function setScheduleMap(map: ScheduleMap): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/** Remove the entire schedule map (global reset) */
export function clearScheduleMap(): void {
    localStorage.removeItem(STORAGE_KEY);
}

/** Remove a single lab's schedule entry */
export function removeLabSchedule(city: string, tehsil: string, labName: string): void {
    const map = getScheduleMap();
    const key = makeLabKey(city, tehsil, labName);
    delete map[key];
    setScheduleMap(map);
}

/** Get the scheduled days for a specific lab (empty array = no schedule = all days allowed) */
export function getLabSchedule(city: string, tehsil: string, labName: string): string[] {
    const map = getScheduleMap();
    const key = makeLabKey(city, tehsil, labName);
    return map[key] || [];
}

/** Returns true if ANY schedule has been uploaded */
export function hasAnySchedule(): boolean {
    return Object.keys(getScheduleMap()).length > 0;
}

/** Returns true if a date (YYYY-MM-DD) falls on a day in the lab's schedule */
export function isScheduledDay(city: string, tehsil: string, labName: string, dateStr: string): boolean {
    const days = getLabSchedule(city, tehsil, labName);
    if (days.length === 0) return true; // No schedule = all days allowed

    try {
        const d = new Date(dateStr + 'T00:00:00'); // avoid timezone shift
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }); // e.g. "Monday"
        return days.some(d => d.toLowerCase() === dayName.toLowerCase());
    } catch {
        return true;
    }
}

/** Get a short display string for scheduled days: "MON, FRI" */
export function getScheduleLabel(city: string, tehsil: string, labName: string): string | null {
    const days = getLabSchedule(city, tehsil, labName);
    if (days.length === 0) return null;
    return days.map(d => d.substring(0, 3).toUpperCase()).join(', ');
}

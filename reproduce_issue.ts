
const toRangeBoundaries = (start?: string, end?: string): { start?: string; end?: string } => {
    const normalize = (value?: string | null, isEnd = false) => {
        const trimmed = (value ?? '').trim();
        if (!trimmed) {
            return undefined;
        }
        if (isEnd) {
            // Pour inclure toute la journée de fin, on ajoute un jour et on utilise 00:00:00
            // puis on utilisera < au lieu de <= dans la comparaison
            const date = new Date(trimmed);
            date.setDate(date.getDate() + 1);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d} 00:00:00`;
        }
        return `${trimmed} 00:00:00`;
    };

    return {
        start: normalize(start, false),
        end: normalize(end, true),
    };
};

// Simulation of ChartDashboard eventsByDay logic
const calculateEventsByDay = (localEvents: any[]) => {
    const fmt = (s: string) => {
        const d = s.includes('T') ? new Date(s) : new Date(s.replace(' ', 'T') + 'Z');
        if (isNaN(d.getTime())) return null;
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };
    const map = new Map<string, number>();
    for (const ev of localEvents) {
        const day = ev.applied_at ? fmt(String(ev.applied_at)) : null;
        if (!day) continue;
        map.set(day, (map.get(day) || 0) + 1);
    }
    return Array.from(map.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
};

console.log("--- Testing toRangeBoundaries ---");
const today = "2026-01-19";
const boundaries = toRangeBoundaries(today, today);
console.log(`Input: ${today}, ${today}`);
console.log(`Output: Start=${boundaries.start}, End=${boundaries.end}`);

console.log("\n--- Testing eventsByDay logic ---");
// Mock events covering the boundaries
const events = [
    { applied_at: "2026-01-19 10:00:00" }, // Inside today
    { applied_at: "2026-01-19 23:59:59" }, // Inside today (late)
    { applied_at: "2026-01-20 00:00:01" }, // Tomorrow (just after boundary)
    { applied_at: "2026-01-18 23:59:59" }, // Yesterday (just before boundary)
];

const stats = calculateEventsByDay(events);
console.log("Stats:", JSON.stringify(stats, null, 2));

console.log("\n--- Testing Timezone Edge Cases ---");
// Test what happens if we use local Date methods on UTC strings
const testDate = new Date("2026-01-19");
console.log(`new Date("2026-01-19") toString: ${testDate.toString()}`);
console.log(`getFullYear (Local): ${testDate.getFullYear()}`);
console.log(`getUTCFullYear: ${testDate.getUTCFullYear()}`);

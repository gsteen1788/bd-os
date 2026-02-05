
import { performance } from 'perf_hooks';

// Mock Types
interface Opportunity { id: string; name: string; }
interface Contact { id: string; displayName: string; }
interface ProtemoiEntry { id: string; contactId: string; }
interface Meeting {
    id: string;
    relatedOpportunityId?: string | null;
    relatedProtemoiId?: string | null;
}

// Data Generation
const DATA_SIZE = 2000;
const MEETING_COUNT = 10000;

const allOpps: Opportunity[] = Array.from({ length: DATA_SIZE }, (_, i) => ({
    id: `opp-${i}`,
    name: `Opportunity ${i}`
}));

const allContacts: Contact[] = Array.from({ length: DATA_SIZE }, (_, i) => ({
    id: `contact-${i}`,
    displayName: `Contact ${i}`
}));

const allRels: ProtemoiEntry[] = Array.from({ length: DATA_SIZE }, (_, i) => ({
    id: `rel-${i}`,
    contactId: `contact-${i}` // 1:1 mapping for simplicity
}));

const meetings: Meeting[] = Array.from({ length: MEETING_COUNT }, (_, i) => {
    const isOpp = i % 2 === 0;
    const targetId = Math.floor(Math.random() * DATA_SIZE);
    return {
        id: `meeting-${i}`,
        relatedOpportunityId: isOpp ? `opp-${targetId}` : null,
        relatedProtemoiId: !isOpp ? `rel-${targetId}` : null
    };
});

// 1. Baseline: Array.find
function runBaseline() {
    const start = performance.now();

    // Simulate rendering all meetings
    for (const m of meetings) {
        let name = "Unknown";
        if (m.relatedOpportunityId) {
            const op = allOpps.find(o => o.id === m.relatedOpportunityId);
            name = op ? `Op: ${op.name}` : "Unknown Op";
        } else if (m.relatedProtemoiId) {
            const rel = allRels.find(r => r.id === m.relatedProtemoiId);
            if (rel) {
                const c = allContacts.find(c => c.id === rel.contactId);
                name = c ? `Rel: ${c.displayName}` : "Unknown Rel";
            }
        }
    }

    const end = performance.now();
    return end - start;
}

// 2. Optimization: Map lookup
function runOptimization() {
    const startTotal = performance.now();

    // Construction (Simulating useMemo)
    const oppsMap = new Map(allOpps.map(o => [o.id, o]));
    const relsMap = new Map(allRels.map(r => [r.id, r]));
    const contactsMap = new Map(allContacts.map(c => [c.id, c]));

    const constructionEnd = performance.now();

    // Simulate rendering all meetings
    for (const m of meetings) {
        let name = "Unknown";
        if (m.relatedOpportunityId) {
            const op = oppsMap.get(m.relatedOpportunityId);
            name = op ? `Op: ${op.name}` : "Unknown Op";
        } else if (m.relatedProtemoiId) {
            const rel = relsMap.get(m.relatedProtemoiId);
            if (rel) {
                const c = contactsMap.get(rel.contactId);
                name = c ? `Rel: ${c.displayName}` : "Unknown Rel";
            }
        }
    }

    const endTotal = performance.now();

    return {
        totalTime: endTotal - startTotal,
        constructionTime: constructionEnd - startTotal,
        lookupTime: endTotal - constructionEnd
    };
}

console.log(`Setup: ${DATA_SIZE} Entities each, ${MEETING_COUNT} Meetings.`);

// Run Baseline
const baselineTime = runBaseline();
console.log(`Baseline (Array.find): ${baselineTime.toFixed(2)}ms`);

// Run Optimization
const optResult = runOptimization();
console.log(`Optimization (Map):`);
console.log(`  - Map Construction: ${optResult.constructionTime.toFixed(2)}ms`);
console.log(`  - Lookup Loop:      ${optResult.lookupTime.toFixed(2)}ms`);
console.log(`  - Total First Run:  ${optResult.totalTime.toFixed(2)}ms`);

const speedup = baselineTime / optResult.lookupTime;
console.log(`\nSpeedup (Lookup only - re-renders): ${speedup.toFixed(1)}x`);

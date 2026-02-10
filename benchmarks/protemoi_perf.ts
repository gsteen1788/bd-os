// benchmarks/protemoi_perf.ts
import { performance } from 'perf_hooks';

// Simulate Types
interface Organization {
    id: string;
    name: string;
}

interface Contact {
    id: string;
    organizationId?: string | null;
    displayName: string;
}

interface ProtemoiEntry {
    id: string;
    contactId: string;
    organizationId?: string | null;
}

// Data Generation
const NUM_PROTEMOI = 10000;
const NUM_CONTACTS = 10000;
const NUM_ORGS = 2000;

console.log(`Generating mock data: ${NUM_PROTEMOI} Protemoi Entries, ${NUM_CONTACTS} Contacts, ${NUM_ORGS} Organizations...`);

const organizations: Organization[] = Array.from({ length: NUM_ORGS }, (_, i) => ({
    id: `org-${i}`,
    name: `Organization ${i}`
}));

const contacts: Contact[] = Array.from({ length: NUM_CONTACTS }, (_, i) => ({
    id: `contact-${i}`,
    organizationId: `org-${Math.floor(Math.random() * NUM_ORGS)}`,
    displayName: `Contact ${i}`
}));

const protemoi: ProtemoiEntry[] = Array.from({ length: NUM_PROTEMOI }, (_, i) => ({
    id: `entry-${i}`,
    contactId: `contact-${Math.floor(Math.random() * NUM_CONTACTS)}`,
    organizationId: Math.random() > 0.5 ? `org-${Math.floor(Math.random() * NUM_ORGS)}` : null
}));

console.log("Mock data generated.");

// Baseline: O(N*M)
console.log("\n--- Baseline: Nested Loop ---");
const startBaseline = performance.now();

const baselineResults = protemoi.map(p => {
    const contact = contacts.find(c => c.id === p.contactId);
    const orgId = p.organizationId || contact?.organizationId;
    const organization = organizations.find(o => o.id === orgId);

    return {
        ...p,
        contact,
        organization
    };
});

const endBaseline = performance.now();
const baselineDuration = endBaseline - startBaseline;
console.log(`Baseline Duration: ${baselineDuration.toFixed(2)} ms`);


// Optimization: O(N) with Map
console.log("\n--- Optimization: Map Lookup ---");
const startOptimized = performance.now();

const contactMap = new Map<string, Contact>();
contacts.forEach(c => contactMap.set(c.id, c));

const orgMap = new Map<string, Organization>();
organizations.forEach(o => orgMap.set(o.id, o));

const optimizedResults = protemoi.map(p => {
    const contact = contactMap.get(p.contactId);
    const orgId = p.organizationId || contact?.organizationId;
    const organization = orgId ? orgMap.get(orgId) : undefined;

    return {
        ...p,
        contact,
        organization
    };
});

const endOptimized = performance.now();
const optimizedDuration = endOptimized - startOptimized;
console.log(`Optimized Duration: ${optimizedDuration.toFixed(2)} ms`);

// Verify Results Match
const mismatch = baselineResults.find((r, i) => {
    const opt = optimizedResults[i];
    return r.id !== opt.id || r.contact?.id !== opt.contact?.id || r.organization?.id !== opt.organization?.id;
});

if (mismatch) {
    console.error("Mismatch detected between baseline and optimized results!");
} else {
    console.log("\nResults match correctly.");
}

console.log(`\nSpeedup: ${(baselineDuration / optimizedDuration).toFixed(2)}x`);

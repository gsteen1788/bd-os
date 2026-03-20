import { performance } from 'perf_hooks';
import { Opportunity, ProtemoiEntry, Contact } from './src/domain/entities';
import { EntityType, TaskTag } from './src/domain/enums';

// Data Generation
const DATA_SIZE = 5000;
const STAGES = ["TARGET", "ACQUAINTANCE", "CURIOUS_SKEPTIC", "NEW_CLIENT", "SOLID_WORKING_RELATIONSHIP", "TRUSTED_ADVISEE", "RAVING_FAN"];

const opportunities: Opportunity[] = Array.from({ length: DATA_SIZE }, (_, i) => ({
    id: `opp-${i}`,
    name: `Opportunity ${i}`,
    stage: STAGES[i % STAGES.length] as any,
    organizationId: `org-${i}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
}));

// Baseline Array.filter performance
function testBaseline() {
    const start = performance.now();
    for (const stage of STAGES) {
        const stageOpps = opportunities.filter(o => o.stage === stage);
        const count = stageOpps.length;
    }
    const end = performance.now();
    return end - start;
}

// Optimized Map lookup performance
function testOptimized() {
    const start = performance.now();

    // Grouping
    const oppsByStage = new Map<string, Opportunity[]>();
    for (const opp of opportunities) {
        const list = oppsByStage.get(opp.stage) || [];
        list.push(opp);
        oppsByStage.set(opp.stage, list);
    }

    for (const stage of STAGES) {
        const stageOpps = oppsByStage.get(stage) || [];
        const count = stageOpps.length;
    }
    const end = performance.now();
    return end - start;
}

let baselineTotal = 0;
let optimizedTotal = 0;
const ITERS = 100;

for (let i=0; i<ITERS; i++) {
    baselineTotal += testBaseline();
    optimizedTotal += testOptimized();
}

console.log(`Baseline avg: ${baselineTotal/ITERS} ms`);
console.log(`Optimized avg: ${optimizedTotal/ITERS} ms`);
console.log(`Speedup: ${(baselineTotal/optimizedTotal).toFixed(2)}x`);

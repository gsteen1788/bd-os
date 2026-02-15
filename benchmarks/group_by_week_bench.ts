import { groupItemsByWeek } from '../src/utils/dateUtils';
import { performance } from 'perf_hooks';
import assert from 'assert';

// Correctness Check
const testItems = [
    { id: 1, date: '2024-01-01T10:00:00Z' }, // Monday
    { id: 2, date: '2024-01-02T10:00:00Z' }, // Tuesday (same week)
    { id: 3, date: '2024-01-08T10:00:00Z' }, // Next Monday (new week)
];

console.log("Running correctness check...");
const groups = groupItemsByWeek(testItems, 'date');
const keys = Object.keys(groups);
console.log("Groups:", keys);

// Performance Benchmark
const NUM_ITEMS = 10000;
const items = Array.from({ length: NUM_ITEMS }, (_, i) => ({
    id: i,
    updatedAt: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 365)).toISOString()
}));

console.log(`Running performance benchmark with ${NUM_ITEMS} items...`);
const start = performance.now();
const iterations = 10;
for (let i = 0; i < iterations; i++) {
    groupItemsByWeek(items, 'updatedAt');
}
const end = performance.now();

console.log(`Total time: ${end - start}ms`);
console.log(`Average time: ${(end - start) / iterations}ms per call`);

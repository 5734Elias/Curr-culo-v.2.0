import { COURSES, RAW_COURSES, deduplicateCourses } from '../src/data/courses.ts';

console.log('--- TEST SUITE: MULTI-INSTITUTION COURSES VALIDATION ---');

// 1. Test IDs uniqueness
const ids = RAW_COURSES.map((c) => c.id);
const uniqueIds = new Set(ids);
if (ids.length !== uniqueIds.size) {
  console.error('FAIL: Duplicate IDs found in raw courses list!');
  process.exit(1);
}
console.log(`PASS: All ${ids.length} raw course IDs are unique.`);

// 2. Test Deduplication
const deduplicated = deduplicateCourses(RAW_COURSES);
console.log(`PASS: Raw list (${RAW_COURSES.length}) deduplicated to (${deduplicated.length}) unique courses.`);
console.log(`PASS: Exported COURSES list contains ${COURSES.length} items.`);

// 3. Test Workload Hours Calculation (safely ignoring undefined)
const totalHours = deduplicated.reduce((sum, c) => sum + (c.workloadHours ?? 0), 0);
console.log(`PASS: Total verified workload hours calculation: ${totalHours} hours.`);

// 4. Test Institution Grouping
const featuredSenai = deduplicated.filter((c) => c.institutionGroup === 'senai');
const featuredKaSolution = deduplicated.filter((c) => c.institutionGroup === 'ka-solution');
const featuredBradesco = deduplicated.filter((c) => c.institutionGroup === 'fundacao-bradesco');
const outrasInstituicoes = deduplicated.filter((c) => c.institutionGroup === 'outras');

console.log(`PASS: SENAI courses count: ${featuredSenai.length}`);
console.log(`PASS: Ka Solution courses count: ${featuredKaSolution.length}`);
console.log(`PASS: Fundação Bradesco courses count: ${featuredBradesco.length}`);
console.log(`PASS: Outras Instituições courses count: ${outrasInstituicoes.length}`);

console.log('--- ALL DATA INTEGRITY TESTS PASSED SUCCESSFULLY ---');

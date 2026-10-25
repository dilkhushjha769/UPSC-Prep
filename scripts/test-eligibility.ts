import {
  calculateUpscEligibility,
  getMaxAgeForCategory,
  getMaxAttemptsForCategory,
} from '../src/services/upscEligibility';

console.log('\n--- Running UPSC Eligibility & Age Calculator Tests ---\n');

let failed = 0;
let passed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`✅ PASSED: ${msg}`);
    passed++;
  } else {
    console.error(`❌ FAILED: ${msg}`);
    failed++;
  }
}

// 1. General category rules
assert(getMaxAgeForCategory('General') === 32, 'General max age is 32');
assert(getMaxAttemptsForCategory('General') === '6 Attempts', 'General max attempts is 6');

// 2. OBC category rules
assert(getMaxAgeForCategory('OBC') === 35, 'OBC max age is 35');
assert(getMaxAttemptsForCategory('OBC') === '9 Attempts', 'OBC max attempts is 9');

// 3. SC/ST category rules
assert(getMaxAgeForCategory('SC') === 37, 'SC max age is 37');
assert(getMaxAgeForCategory('ST') === 37, 'ST max age is 37');
assert(getMaxAttemptsForCategory('SC').includes('Unlimited'), 'SC has unlimited attempts');

// 4. Eligible candidate for 2027 (Born Aug 15, 2002 -> ~24 on Aug 1, 2027)
const eligibleResult = calculateUpscEligibility('2002-08-15', 2027, 'General');
assert(eligibleResult.isEligible === true, 'Candidate born in 2002 is eligible for 2027');
assert(eligibleResult.status === 'eligible', 'Status is eligible');
assert(eligibleResult.ageOnCutoffYears === 24, 'Age on cutoff date is 24');

// 5. Underage candidate (Born 2008 -> 19 on Aug 1, 2027)
const underageResult = calculateUpscEligibility('2008-01-01', 2027, 'General');
assert(underageResult.isEligible === false, 'Candidate born in 2008 is underage for 2027');
assert(underageResult.status === 'underage', 'Status is underage');

// 6. Overage General candidate (Born 1993 -> 34 on Aug 1, 2027, max 32)
const overageGenResult = calculateUpscEligibility('1993-05-10', 2027, 'General');
assert(overageGenResult.isEligible === false, 'General candidate born in 1993 is overage');
assert(overageGenResult.status === 'overage', 'Status is overage for General');

// 7. Same candidate under SC (Born 1993 -> 34 on Aug 1, 2027, max 37)
const eligibleScResult = calculateUpscEligibility('1993-05-10', 2027, 'SC');
assert(eligibleScResult.isEligible === true, 'SC candidate born in 1993 is eligible (cutoff max 37)');

// 8. Graceful handling of invalid or empty DOB
const invalidResult = calculateUpscEligibility('', 2027, 'General');
assert(invalidResult.isValidDob === false, 'Empty DOB returns isValidDob false');

console.log(`\nTests Summary: ${passed} passed, ${failed} failed.\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL UPSC ELIGIBILITY TESTS PASSED!\n');
}

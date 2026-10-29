const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const pyqsDir = path.resolve(__dirname, '../assets/data/pyqs');

function normalizeTextForDup(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const files = fs.readdirSync(pyqsDir).filter((f) => f.endsWith('.json')).sort();

let totalQuestions = 0;
const paperYearBreakdown = [];
const allQuestions = [];
const legacySubjects = {};
const legacyTopics = {};
const verificationNotes = [];
const missingPassage = [];

for (const file of files) {
  const fullPath = path.join(pyqsDir, file);
  const raw = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const meta = raw.meta || {};
  const questions = Array.isArray(raw) ? raw : raw.questions || [];
  const passages = raw.passages || [];

  const yearMatch = file.match(/20\d{2}/) || (meta.exam && String(meta.exam).match(/20\d{2}/));
  const year = meta.year || (yearMatch ? parseInt(yearMatch[0], 10) : null);

  // Check how import-pyqs.ts currently detects paperType vs actual paper
  const legacyPaperStr = (meta.paper || meta.paper_type || file).toLowerCase();
  const legacyIsCsat =
    legacyPaperStr.includes('csat') ||
    legacyPaperStr.includes('paper2') ||
    legacyPaperStr.includes('paper-2') ||
    legacyPaperStr.includes('paper-ii');
  const actualIsCsat =
    (meta.paper && meta.paper.toLowerCase().includes('csat')) ||
    (meta.paper && meta.paper.toLowerCase().includes('paper-ii')) ||
    file.toLowerCase().includes('paper2');

  const passagesMap = new Map();
  for (const p of passages) {
    if (p.id && p.text) passagesMap.set(p.id, p.text);
    if (Array.isArray(p.question_numbers)) {
      for (const qn of p.question_numbers) passagesMap.set(`q_${qn}`, p.text);
    }
  }

  paperYearBreakdown.push({
    file,
    year,
    metaPaper: meta.paper || meta.paper_type || 'N/A',
    actualPaper: actualIsCsat ? 'GS Paper II (CSAT)' : 'GS Paper I',
    legacyDetectedPaper: legacyIsCsat ? 'CSAT' : 'GS1',
    count: questions.length,
    passagesCount: passages.length,
  });

  questions.forEach((q, idx) => {
    totalQuestions++;
    const qNum = q.number || q.question_number || q.q_no || idx + 1;
    const qText = (q.question || q.question_text || q.question_en || q.text || '').trim();
    const statements = Array.isArray(q.statements) ? q.statements : [];
    const tableStr = q.table || q.table_data ? JSON.stringify(q.table || q.table_data) : '';
    const fullCompositeText = [qText, ...statements, tableStr].filter(Boolean).join(' ');

    const qTop = (q.topic || q.category || '').trim();
    const qSub = (q.subject || '').trim();

    // Simulate legacy resolveTaxonomy
    let legSub = '';
    let legTop = '';
    const topicStr = (qTop || qSub || 'General').trim();
    if (topicStr.includes('/')) {
      const parts = topicStr.split('/').map((s) => s.trim());
      legSub = parts[0];
      legTop = parts.slice(1).join(' / ') || parts[0];
    } else if (actualIsCsat) {
      const lower = topicStr.toLowerCase();
      if (lower.includes('comprehension')) legSub = 'Reading Comprehension';
      else if (lower.includes('reasoning') || lower.includes('data') || lower.includes('syllogism') || lower.includes('puzzle') || lower.includes('coding')) legSub = 'Logical Reasoning';
      else legSub = 'Quantitative Aptitude';
      legTop = topicStr;
    } else {
      legSub = topicStr;
      legTop = topicStr;
    }
    legacySubjects[legSub] = (legacySubjects[legSub] || 0) + 1;
    legacyTopics[legTop] = (legacyTopics[legTop] || 0) + 1;

    let passageText = q.passage || q.passage_text || null;
    if (!passageText) {
      if (q.passage_id && passagesMap.has(q.passage_id)) passageText = passagesMap.get(q.passage_id);
      else if (passagesMap.has(`q_${qNum}`)) passageText = passagesMap.get(`q_${qNum}`);
    }

    if (
      (qTop.toLowerCase().includes('comprehension') || qSub.toLowerCase().includes('comprehension')) &&
      !passageText
    ) {
      missingPassage.push({ file, qNum, topic: qTop, passage_id: q.passage_id, qText: qText.slice(0, 100) });
    }

    if (q.verification_note) {
      verificationNotes.push({
        file,
        year,
        qNum,
        answer: q.correct_answer || q.answer,
        topic: qTop,
        note: q.verification_note,
        qText: qText.slice(0, 100),
      });
    }

    allQuestions.push({
      file,
      year,
      actualPaper: actualIsCsat ? 'CSAT' : 'GS1',
      qNum,
      qText,
      fullCompositeText,
      normComposite: normalizeTextForDup(fullCompositeText),
      rawTopic: qTop,
      rawSubject: qSub,
      answer: q.correct_answer || q.answer,
      options: q.options,
    });
  });
}

// Check full composite duplicates
const seenComposite = new Map();
const exactCompositeDuplicates = [];
for (const q of allQuestions) {
  if (q.normComposite.length < 25) continue;
  // Also include options in duplicate check if stem is generic like "Which one of the following..."
  const optsText = normalizeTextForDup(JSON.stringify(q.options));
  const fullKey = `${q.normComposite}__${optsText}`;
  if (seenComposite.has(fullKey)) {
    exactCompositeDuplicates.push({
      first: seenComposite.get(fullKey),
      second: `${q.file}#Q${q.qNum} (${q.year})`,
      stem: q.fullCompositeText.slice(0, 120),
    });
  } else {
    seenComposite.set(fullKey, `${q.file}#Q${q.qNum} (${q.year})`);
  }
}

// Also check near-duplicates (same normalized stem + statements > 60 chars, even if options differ slightly)
const seenStem = new Map();
const nearDuplicates = [];
for (const q of allQuestions) {
  if (q.normComposite.length < 65) continue;
  // Ignore generic stems that have no statements
  if (
    q.normComposite.startsWith('consider the following statements which') ||
    q.normComposite.startsWith('consider the following pairs how many') ||
    q.normComposite.startsWith('consider the following statements how many') ||
    q.normComposite.startsWith('with reference to india consider the following')
  ) {
    continue;
  }
  if (seenStem.has(q.normComposite)) {
    const firstRef = seenStem.get(q.normComposite);
    nearDuplicates.push({
      first: firstRef,
      second: `${q.file}#Q${q.qNum} (${q.year})`,
      stem: q.fullCompositeText.slice(0, 120),
    });
  } else {
    seenStem.set(q.normComposite, `${q.file}#Q${q.qNum} (${q.year})`);
  }
}

console.log('=== PAPER & YEAR BREAKDOWN ===');
console.table(paperYearBreakdown);

console.log(`\nLegacy resolveTaxonomy produces ${Object.keys(legacySubjects).length} distinct SUBJECTS and ${Object.keys(legacyTopics).length} distinct TOPICS!`);
console.log('Top 40 Legacy Subjects created by old import-pyqs.ts:');
Object.entries(legacySubjects)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 40)
  .forEach(([k, v]) => console.log(`  - "${k}": ${v}`));

console.log('\n=== MISSING PASSAGE DETAILS ===');
console.log(JSON.stringify(missingPassage, null, 2));

console.log('\n=== VERIFICATION / DISPUTED ANSWER KEY NOTES (ALL 8) ===');
console.log(JSON.stringify(verificationNotes, null, 2));

console.log(`\n=== EXACT FULL-CONTENT DUPLICATES (${exactCompositeDuplicates.length}) ===`);
console.log(JSON.stringify(exactCompositeDuplicates, null, 2));

console.log(`\n=== NEAR DUPLICATES BY STEM (${nearDuplicates.length}) ===`);
console.log(JSON.stringify(nearDuplicates, null, 2));

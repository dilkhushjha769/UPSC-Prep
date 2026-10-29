import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { UPSC_PRELIMS_TAXONOMY } from '../src/constants/upscTaxonomy';

// Auto-load .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...rest] = trimmed.split('=');
      const val = rest.join('=').trim();
      if (!process.env[k.trim()]) {
        process.env[k.trim()] = val;
      }
    }
  });
}

export interface RawOption {
  id?: string;
  key?: string;
  text?: string;
  [key: string]: any;
}

export interface RawPassage {
  id: string;
  title?: string;
  text: string;
  question_numbers?: number[];
}

export interface RawQuestion {
  number?: number;
  question_number?: number;
  q_no?: number;
  id?: any;
  question?: string;
  question_text?: string;
  question_en?: string;
  question_hi?: string;
  text?: string;
  topic?: string;
  raw_topic?: string;
  subject_id?: string;
  subject?: string;
  topic_id?: string;
  subtopic_id?: string;
  subtopic?: string;
  secondary_tags?: string[];
  classification_confidence?: number;
  confidence_band?: 'High' | 'Medium' | 'Low';
  classification_rationale?: string;
  validation_status?: 'verified' | 'verified_cross_tagged' | 'needs_review';
  validation_notes?: string;
  chapter?: string;
  category?: string;
  passage_id?: string | null;
  passage_text?: string | null;
  statements?: string[];
  table?: any;
  table_data?: any;
  list_i_title?: string;
  list_i?: string[];
  list_ii_title?: string;
  list_ii?: string[];
  directions?: string;
  string?: string;
  options?: RawOption[] | Record<string, string> | string[];
  correct_option?: string;
  correct_answer?: string;
  answer?: string;
  correct?: string;
  explanation?: string;
  explanation_en?: string;
  explanation_hi?: string;
  solution?: string;
  question_image?: string | null;
  image_url?: string | null;
  verification_note?: string;
  year?: number;
  paper?: string;
  paper_type?: string;
  exam?: string;
  [key: string]: any;
}

export interface RawExamMeta {
  exam?: string;
  year?: number;
  paper?: string;
  paper_type?: string;
  test_booklet_series?: string;
  booklet_code?: string;
  total_questions?: number;
  marks_per_correct?: number;
  negative_marks_per_wrong?: number;
  negative_marking_rule?: string;
  language?: string;
  [key: string]: any;
}

export interface FileReport {
  fileName: string;
  filePath: string;
  paperType: string;
  year: number;
  parsed: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export interface ImportReport {
  totalFiles: number;
  totalParsed: number;
  totalImported: number;
  totalUpdated: number;
  totalSkipped: number;
  fileReports: FileReport[];
}

function normalizeOptions(rawOptions: any): { id: string; text: string }[] | null {
  if (!rawOptions) return null;

  if (Array.isArray(rawOptions)) {
    return rawOptions.map((opt: any, idx: number) => {
      if (typeof opt === 'string') {
        const letter = String.fromCharCode(65 + idx);
        return { id: letter, text: opt.trim() };
      }
      const id = String(opt.id || opt.key || String.fromCharCode(65 + idx)).toUpperCase();
      const text = typeof opt.text === 'string' ? opt.text : String(opt.title || opt.val || opt);
      return { id, text: text.trim() };
    });
  }

  if (typeof rawOptions === 'object') {
    return Object.entries(rawOptions).map(([key, val]) => ({
      id: key.toUpperCase(),
      text: typeof val === 'string' ? val.trim() : JSON.stringify(val),
    }));
  }

  return null;
}

function normalizeAnswer(rawAnswer?: any): string | null {
  if (!rawAnswer) return null;
  const cleaned = String(rawAnswer).trim().toUpperCase();
  const match = cleaned.match(/^[A-D]/);
  return match ? match[0] : null;
}

export async function runPYQImport(): Promise<ImportReport> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials in environment (EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Sync canonical taxonomy tables if they exist
  try {
    const subjectRows = UPSC_PRELIMS_TAXONOMY.map((s, idx) => ({
      id: s.id,
      paper_type: s.paper,
      paper_name: s.paperName,
      name: s.name,
      short_name: s.shortName,
      display_order: idx + 1,
    }));
    await supabase.from('upsc_subjects').upsert(subjectRows, { onConflict: 'id' });

    const topicRows = UPSC_PRELIMS_TAXONOMY.flatMap((s) =>
      s.topics.map((t, idx) => ({
        id: t.id,
        subject_id: s.id,
        paper_type: s.paper,
        code: t.code,
        name: t.name,
        description: t.description,
        display_order: idx + 1,
      }))
    );
    await supabase.from('upsc_topics').upsert(topicRows, { onConflict: 'id' });
  } catch {
    // Non-fatal if canonical taxonomy migration hasn't been executed yet
  }

  const targetDirs = [
    path.resolve(__dirname, '../assets/data/pyqs'),
    path.resolve(__dirname, '../assets/data/pyqs_to_import'),
  ];

  const seenFileNames = new Set<string>();
  const foundFiles: string[] = [];
  for (const dir of targetDirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
      for (const f of files) {
        if (!seenFileNames.has(f.toLowerCase())) {
          seenFileNames.add(f.toLowerCase());
          foundFiles.push(path.join(dir, f));
        }
      }
    }
  }

  const report: ImportReport = {
    totalFiles: foundFiles.length,
    totalParsed: 0,
    totalImported: 0,
    totalUpdated: 0,
    totalSkipped: 0,
    fileReports: [],
  };

  if (foundFiles.length === 0) {
    console.log('No JSON files found in assets/data/pyqs or assets/data/pyqs_to_import');
    return report;
  }

  for (const filePath of foundFiles) {
    const fileName = path.basename(filePath);
    let rawContent: any;
    try {
      rawContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e: any) {
      console.error(`Skipping invalid JSON file ${fileName}:`, e.message);
      continue;
    }

    let questionsList: RawQuestion[] = [];
    let meta: RawExamMeta = {};
    const passagesMap = new Map<string, string>();

    if (Array.isArray(rawContent)) {
      questionsList = rawContent;
    } else if (rawContent && typeof rawContent === 'object') {
      meta = rawContent.meta || {};
      questionsList = rawContent.questions || [];

      if (rawContent.passages && Array.isArray(rawContent.passages)) {
        for (const p of rawContent.passages) {
          if (p.id && p.text) {
            passagesMap.set(p.id, p.text);
            if (Array.isArray(p.question_numbers)) {
              for (const qNum of p.question_numbers) {
                passagesMap.set(`q_${qNum}`, p.text);
              }
            }
          }
        }
      }
    }

    let year = meta.year;
    if (!year) {
      const yearMatch = fileName.match(/20\d{2}/) || (meta.exam && meta.exam.match(/20\d{2}/));
      year = yearMatch ? parseInt(yearMatch[0], 10) : 2025;
    }

    // Accurate paper detection: check meta.paper_type / meta.paper first, then paper2 in fileName
    const isCsat =
      meta.paper_type === 'CSAT' ||
      Boolean(meta.paper && meta.paper.toLowerCase().includes('csat')) ||
      Boolean(meta.paper && meta.paper.toLowerCase().includes('paper-ii')) ||
      fileName.toLowerCase().includes('paper2');
    const paperType = isCsat ? 'CSAT' : 'GS1';
    const paperName = meta.paper || (isCsat ? 'General Studies Paper II (CSAT)' : 'General Studies Paper I');
    const examName = meta.exam || 'UPSC CSE Prelims';

    const fileReport: FileReport = {
      fileName,
      filePath,
      paperType,
      year,
      parsed: questionsList.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    report.totalParsed += questionsList.length;

    const rowsToUpsert: any[] = [];

    questionsList.forEach((q, index) => {
      const qNum = q.number || q.question_number || q.q_no || (index + 1);
      const qTextEn = (q.question || q.question_text || q.question_en || q.text || '').trim();
      const qTextHi = q.question_hi ? q.question_hi.trim() : null;

      if (!qTextEn && !qTextHi) {
        fileReport.errors.push(`Question #${qNum} missing text`);
        fileReport.skipped++;
        return;
      }

      const options = normalizeOptions(q.options);
      if (!options || options.length < 2) {
        fileReport.errors.push(`Question #${qNum} missing options`);
        fileReport.skipped++;
        return;
      }

      const correctAnswer = normalizeAnswer(q.correct_answer || q.correct_option || q.answer || q.correct);
      if (!correctAnswer) {
        fileReport.errors.push(`Question #${qNum} missing valid correct answer`);
        fileReport.skipped++;
        return;
      }

      const validIds = options.map((o) => o.id);
      if (!validIds.includes(correctAnswer)) {
        fileReport.errors.push(`Question #${qNum} answer ${correctAnswer} not found in options: ${validIds.join(',')}`);
        fileReport.skipped++;
        return;
      }

      const subject = q.subject || (paperType === 'CSAT' ? 'Quantitative Aptitude and Basic Numeracy' : 'General Studies');
      const topic = q.topic || 'General';
      const subtopic = q.subtopic || topic;

      let passageText = q.passage_text || null;
      if (!passageText) {
        if (q.passage_id && passagesMap.has(q.passage_id)) {
          passageText = passagesMap.get(q.passage_id) || null;
        } else if (passagesMap.has(`q_${qNum}`)) {
          passageText = passagesMap.get(`q_${qNum}`) || null;
        }
      }

      const statements = Array.isArray(q.statements) ? q.statements : [];
      let tableData = q.table_data || q.table || null;
      if (!tableData && Array.isArray(q.list_i) && Array.isArray(q.list_ii)) {
        tableData = {
          headers: [q.list_i_title || 'List I', q.list_ii_title || 'List II'],
          rows: q.list_i.map((item, i) => [item, q.list_ii?.[i] || '']),
        };
      }

      const explanationEn = (q.explanation || q.explanation_en || q.solution || '').trim() || null;
      const explanationHi = (q.explanation_hi || '').trim() || null;
      const imageUrl = q.question_image || q.image_url || null;

      const qYear = q.year || year;
      const qPaperType = q.paper_type ? (q.paper_type.toUpperCase().includes('CSAT') ? 'CSAT' : 'GS1') : paperType;
      const qPaperName = q.paper || paperName;
      const qExam = q.exam || examName;

      const fingerprintInput = `${qExam}|${qYear}|${qPaperType}|${qNum}|${qTextEn}`;
      const fingerprint = crypto.createHash('sha256').update(fingerprintInput).digest('hex');

      const metadata = {
        external_id: q.id || `upsc_${qYear}_${qPaperType.toLowerCase()}_q${qNum}`,
        subject_id: q.subject_id || null,
        topic_id: q.topic_id || null,
        subtopic_id: q.subtopic_id || null,
        subtopic: subtopic,
        raw_topic: q.raw_topic || q.topic || null,
        secondary_tags: q.secondary_tags || [],
        classification_confidence: q.classification_confidence ?? 0.95,
        confidence_band: q.confidence_band || 'High',
        classification_rationale: q.classification_rationale || null,
        validation_status: q.validation_status || 'verified',
        validation_notes: q.validation_notes || null,
        test_booklet_series: meta.test_booklet_series || null,
        booklet_code: meta.booklet_code || null,
        marks_per_correct: meta.marks_per_correct || (qPaperType === 'CSAT' ? 2.5 : 2.0),
        negative_marks_per_wrong: meta.negative_marks_per_wrong || (qPaperType === 'CSAT' ? 0.8333 : 0.6667),
        verification_note: q.verification_note || null,
        directions: q.directions || null,
        sequence_string: q.string || null,
        source_file: fileName,
      };

      rowsToUpsert.push({
        exam: qExam,
        year: qYear,
        paper: qPaperName,
        paper_type: qPaperType,
        question_number: qNum,
        question_text_en: qTextEn,
        question_text_hi: qTextHi,
        statements: statements,
        table_data: tableData,
        passage_id: q.passage_id || null,
        passage_text: passageText,
        options: options,
        correct_answer: correctAnswer,
        explanation_en: explanationEn,
        explanation_hi: explanationHi,
        subject: subject,
        topic: topic,
        question_image_url: imageUrl,
        metadata: metadata,
        content_fingerprint: fingerprint,
      });
    });

    const chunkSize = 50;
    for (let i = 0; i < rowsToUpsert.length; i += chunkSize) {
      const chunk = rowsToUpsert.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from('questions')
        .upsert(chunk, { onConflict: 'content_fingerprint' })
        .select('id');

      if (error) {
        fileReport.errors.push(`Database upsert chunk error: ${error.message}`);
        fileReport.skipped += chunk.length;
      } else {
        fileReport.imported += (data?.length || chunk.length);
      }
    }

    report.totalImported += fileReport.imported;
    report.totalSkipped += fileReport.skipped;
    report.fileReports.push(fileReport);
  }

  return report;
}

if (require.main === module) {
  console.log('Starting UPSC PYQ Question Ingestion...');
  runPYQImport()
    .then((report) => {
      console.log('\n=============================================');
      console.log('         UPSC PYQ INGESTION REPORT           ');
      console.log('=============================================');
      console.log(`Files Processed:   ${report.totalFiles}`);
      console.log(`Total Parsed:      ${report.totalParsed}`);
      console.log(`Upserted to DB:    ${report.totalImported}`);
      console.log(`Skipped / Errors:  ${report.totalSkipped}`);
      console.log('---------------------------------------------');
      report.fileReports.forEach((fr) => {
        console.log(`* File: ${fr.fileName} (${fr.year} ${fr.paperType})`);
        console.log(`  Parsed: ${fr.parsed} | Ingested: ${fr.imported} | Skipped: ${fr.skipped}`);
        if (fr.errors.length > 0) {
          console.log(`  Errors (${fr.errors.length}):`);
          fr.errors.slice(0, 3).forEach((e) => console.log(`   - ${e}`));
        }
      });
      console.log('\nIngestion completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal ingestion error:', err);
      process.exit(1);
    });
}

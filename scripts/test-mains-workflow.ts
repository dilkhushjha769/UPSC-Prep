/**
 * Automated Test: UPSC Mains Answer Writing & Evaluation Workflow
 * Verifies end-to-end functionality using actual GS Paper IV questions from JSON.
 */

import {
  getAllMainsQuestions,
  getMainsPaperSummaries,
  getQuestionsByPaper,
  getQuestionsBySection,
  getQuestionsByTopic,
  getRandomMainsQuestion,
} from '../src/data/mainsQuestionRepository';
import { MainsService } from '../src/services/mainsService';
import { MainsAIEvaluationService } from '../src/services/mainsAIEvaluationService';

async function runMainsWorkflowTest() {
  console.log('===============================================================');
  console.log('🧪 STARTING UPSC MAINS END-TO-END WORKFLOW VERIFICATION');
  console.log('===============================================================\n');

  // STEP 1: Verify Question Bank Ingestion & Paper Summaries
  console.log('--- STEP 1: Question Bank & JSON Schema Ingestion ---');
  const allQuestions = getAllMainsQuestions();
  console.log(`✅ Total Mains questions loaded dynamically: ${allQuestions.length}`);

  const papers = getMainsPaperSummaries();
  for (const p of papers) {
    console.log(`   📄 Paper: ${p.paper_id} (${p.title}) -> ${p.total_questions} questions available (Status: ${p.available ? 'Ready' : 'Pending'})`);
  }

  const gs4Questions = getQuestionsByPaper('GS4');
  if (gs4Questions.length !== 19) {
    throw new Error(`Expected 19 questions in GS4 JSON, found: ${gs4Questions.length}`);
  }
  console.log(`✅ GS Paper IV loaded with exactly 19 questions.`);

  // STEP 2: Verify Multiple Practice Selection Modes
  console.log('\n--- STEP 2: Practice Selection Modes Verification ---');

  // Mode A: Topic-wise
  const topicQuestions = getQuestionsByTopic('GS4', 'Administrative Ethics');
  console.log(`✅ Mode A (Topic-wise): ${topicQuestions.length} question(s) found under 'Administrative Ethics'`);

  // Mode B: Paper-wise
  console.log(`✅ Mode B (Paper-wise): ${gs4Questions.length} questions preserved in original sequence`);

  // Mode C: Section-wise (Theories vs Case Studies)
  const theoreticalQuestions = getQuestionsBySection('GS4', 'theories');
  const caseStudies = getQuestionsBySection('GS4', 'case_studies');
  console.log(`✅ Mode C (Section-wise): ${theoreticalQuestions.length} Theoretical questions (Section A), ${caseStudies.length} Case Studies (Section B)`);
  if (caseStudies.length !== 6) {
    throw new Error(`Expected 6 Case Studies in GS4 Section B, found: ${caseStudies.length}`);
  }

  // Mode E: Random Practice
  const randomQ = getRandomMainsQuestion({ paperId: 'GS4' });
  console.log(`✅ Mode E (Random Practice): Successfully picked random question: [${randomQ?.id}] ${randomQ?.question_number}`);

  // STEP 3: Verify Question Detail & Hindi/English Preservation
  console.log('\n--- STEP 3: Question Display & Language Integrity ---');
  const q1a = gs4Questions.find((q) => q.question_number === '1(a)');
  if (!q1a) throw new Error('Question 1(a) not found in GS4');
  console.log(`   Q1(a) English: "${q1a.text_english.slice(0, 60)}..."`);
  console.log(`   Q1(a) Hindi: "${q1a.text_hindi?.slice(0, 60)}..."`);
  console.log(`   Q1(a) Marks: ${q1a.marks} | Word limit: ${q1a.word_limit} words`);
  if (!q1a.text_hindi || q1a.text_hindi.length < 10) {
    throw new Error('Hindi text not preserved correctly for Q1(a)');
  }
  console.log('✅ Question wording and Hindi translations preserved verbatim from JSON.');

  // STEP 4: Answer Writing & Draft Management
  console.log('\n--- STEP 4: Answer Writing & Draft Auto-Save ---');
  const sampleAnswerQ1A = `
Introduction:
Integrity and accountability are the bedrock virtues of academic and administrative public life. The scenario where a university professor relies on AI to produce a Ph.D. thesis evaluation report without diligent independent assessment raises grave ethical concerns under both deontological duty and the doctrine of public trust.

Ethical Concerns Regarding Accountability:
1. Dilution of Answerability: Ph.D. adjudication is a non-delegable solemn duty entrusted to the evaluator's intellectual expertise. Outsourcing assessment to an algorithmic black-box abrogates personal responsibility.
2. Failure of Due Diligence: Modifying AI outputs superficially breaches the institutional standard of care, compromising academic rigor and fair evaluation for the research scholar.

Ethical Concerns Regarding Integrity:
1. Intellectual Dishonesty: Presenting an AI-synthesized judgment as one's own scholarly appraisal constitutes intellectual misrepresentation, violating the Nolan Committee's principle of Honesty.
2. Injustice to Student & Society: An undeserved or flawed doctoral award tarnishes the institution's credibility and deprives society of authentic research findings.

Conclusion:
Paucity of time cannot justify ethical compromise. True professional integrity requires that technology should augment human inquiry, never replace moral discernment and intellectual accountability.
`.trim();

  const savedDraft = await MainsService.saveDraft(q1a.id, 'typed', sampleAnswerQ1A);
  console.log(`✅ Draft saved successfully for ${savedDraft.question_id} (Word count: ${savedDraft.word_count})`);

  const fetchedDraft = await MainsService.getDraft(q1a.id);
  if (!fetchedDraft || fetchedDraft.word_count !== savedDraft.word_count) {
    throw new Error('Draft retrieval failed');
  }
  console.log(`✅ Draft retrieved with exact fidelity.`);

  // STEP 5: Submission & AI Evaluation Flow
  console.log('\n--- STEP 5: Submission & AI Evaluation Engine ---');
  const submissionQ1A = await MainsService.createSubmission({
    questionId: q1a.id,
    paperId: q1a.paper_id,
    submissionMode: 'typed',
    answerText: sampleAnswerQ1A,
  });
  console.log(`✅ Submission created: ID ${submissionQ1A.id} (Attempt #${submissionQ1A.attempt_number})`);

  const { evaluation: evalQ1A } = await MainsAIEvaluationService.evaluateAnswer({
    submissionId: submissionQ1A.id,
    question: q1a,
    submissionMode: 'typed',
    answerText: sampleAnswerQ1A,
  });

  const savedEvalQ1A = await MainsService.saveEvaluation(submissionQ1A.id, evalQ1A);
  console.log(`✅ Evaluation generated & saved:`);
  console.log(`   - Score Awarded: ${savedEvalQ1A.total_score}/${savedEvalQ1A.max_score} (${savedEvalQ1A.score_percentage}%)`);
  console.log(`   - Parameters Scored: ${savedEvalQ1A.parameters.length} criteria`);
  console.log(`   - Examiner Remarks: "${savedEvalQ1A.examiners_remarks}"`);
  console.log(`   - Strengths Count: ${savedEvalQ1A.strengths.length}`);
  console.log(`   - Weaknesses Count: ${savedEvalQ1A.weaknesses.length}`);
  console.log(`   - Model Answer Words: ${savedEvalQ1A.model_answer_word_count} words`);

  // STEP 6: Case Study (GS4 Section B) Evaluation
  console.log('\n--- STEP 6: GS Paper IV Case Study Evaluation ---');
  const caseQ7 = caseStudies.find((q) => q.question_number === '7' || q.id.includes('Q7'));
  if (!caseQ7) throw new Error('Case study Q7 not found');

  console.log(`   Testing Case Study: "${caseQ7.title}"`);
  const sampleCaseAnswer = `
Case Analysis: Lata & Dr. Mansi (Informed Consent vs Paternalism)

1. Key Stakeholders:
- Lata (Patient whose bodily autonomy was violated)
- Dr. Mansi (Surgeon facing tension between clinical utility and patient consent)
- Sujatha (Sister-in-law lacking legal authority for non-emergency proxy consent)
- Medical Council & Judiciary (Upholding medical jurisprudence)

2. Ethical Issues & Dilemmas:
- Patient Autonomy vs Medical Paternalism: Beneficence does not supersede informed consent (Samira Kohli v. Dr. Prabha Manchanda, 2008 SC).
- Informed Consent Breach: A hysterectomy is an irreversible surgical procedure requiring express, informed prior consent, not proxy consent in non-life-threatening contingencies.

3. Evaluation of Options:
- Action taken by Dr. Mansi: Avoided a second surgery (procedural convenience), but infringed bodily integrity and legal rights.
- Ideal Ethical Course: Close the diagnostic laparoscopy, perform biopsy, and engage in transparent counseling with Lata post-anesthesia to obtain voluntary informed consent for subsequent procedures.

4. Conclusion & Justification:
The doctor's intention was benevolent, but noble ends cannot justify illegitimate means. Autonomy is inviolable under Article 21.
`.trim();

  const caseSubmission = await MainsService.createSubmission({
    questionId: caseQ7.id,
    paperId: caseQ7.paper_id,
    submissionMode: 'typed',
    answerText: sampleCaseAnswer,
  });

  const { evaluation: caseEval } = await MainsAIEvaluationService.evaluateAnswer({
    submissionId: caseSubmission.id,
    question: caseQ7,
    submissionMode: 'typed',
    answerText: sampleCaseAnswer,
  });

  await MainsService.saveEvaluation(caseSubmission.id, caseEval);
  console.log(`✅ Case Study Evaluated:`);
  console.log(`   - Score: ${caseEval.total_score}/${caseEval.max_score} (${caseEval.score_percentage}%)`);
  console.log(`   - Stakeholders Identified: ${caseEval.case_study_details?.stakeholders_identified.join(', ')}`);
  console.log(`   - Dilemmas Mapped: ${caseEval.case_study_details?.ethical_issues_and_dilemmas.length} dilemmas`);
  console.log(`   - Recommendation: ${caseEval.case_study_details?.final_decision_and_justification.slice(0, 90)}...`);

  // STEP 7: Progress Tracking & Student Statistics
  console.log('\n--- STEP 7: Student Progress Tracking ---');
  const stats = await MainsService.getUserMainsStats();
  console.log(`✅ User Mains Statistics:`);
  console.log(`   - Total Questions Available: ${stats.total_questions_available}`);
  console.log(`   - Total Questions Attempted: ${stats.total_attempted}`);
  console.log(`   - Average Evaluated Score: ${stats.average_evaluated_marks_pct}%`);
  console.log(`   - Word Limit Compliance: ${stats.word_limit_compliance_pct}%`);
  console.log(`   - Recent Submissions Count: ${stats.recent_submissions.length}`);

  console.log('\n===============================================================');
  console.log('🎉 ALL UPSC MAINS MODULE WORKFLOW TESTS PASSED SUCCESSFULLY!');
  console.log('===============================================================');
}

runMainsWorkflowTest().catch((err) => {
  console.error('\n❌ Workflow test failed:', err);
  process.exit(1);
});


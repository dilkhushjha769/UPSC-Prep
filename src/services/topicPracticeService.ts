/**
 * Topic Practice Service (Mode A: Untimed Practice Mode)
 * ----------------------------------------------------------------------------
 * Handles step-by-step untimed Practice Mode for both Prelims and Mains PYQs:
 * - Prelims: Answer submission, option-by-option analysis, constitutional/NCERT
 *   concept hooks, bookmarking, session progress, and "Retry Incorrect Questions".
 * - Mains: Draft persistence via `MainsService`, live word count validation,
 *   structured model approach points, and self/AI evaluation integration.
 */

import { MatchedPYQItem, PYQMatchingService } from './pyqMatchingService';
import { UserPracticeAnalyticsService } from './userPracticeAnalyticsService';
import { BookmarkStorageService } from './bookmarkStorage';
import { MainsService } from './mainsService';
import { MainsAIEvaluationService } from './mainsAIEvaluationService';
import { MainsDraftRecord, MainsEvaluationRecord, MainsQuestionRecord } from '@/types/mains';
import { PYQQuestion } from '@/types/prelims';

export interface PrelimsPracticeSubmission {
  questionId: string;
  selectedOption: 'A' | 'B' | 'C' | 'D';
  correctOption: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  timeSpentSeconds: number;
  officialExplanation: string;
  coreConcept: string;
  whyOthersIncorrect: string;
  syllabusAndArticleHooks: string[];
  upscTrendNote: string;
}

export interface MainsModelFramework {
  introductionHook: string;
  coreDimensions: string[];
  constitutionalOrStatutoryAnchors: string[];
  wayForwardConclusion: string;
}

export interface PracticeSessionMetrics {
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  accuracyPct: number;
  mainsDraftsSaved: number;
}

export class TopicPracticeService {
  /**
   * Evaluate a Prelims PYQ answer in Practice Mode, persist analytics,
   * and return rich explanation + why other options are incorrect + concept hooks.
   */
  static async submitPrelimsPracticeAnswer(params: {
    topicQuery: string;
    item: MatchedPYQItem;
    selectedOption: 'A' | 'B' | 'C' | 'D';
    timeSpentSeconds: number;
  }): Promise<PrelimsPracticeSubmission> {
    const pq = params.item.prelimsQuestion;
    if (!pq) {
      throw new Error('Prelims question record missing on MatchedPYQItem');
    }

    const correctOption = pq.correctAnswer;
    const isCorrect = params.selectedOption === correctOption;

    // Persist to analytics and global QuestionHistoryService
    await UserPracticeAnalyticsService.recordTopicQuestionAttempt({
      topicQuery: params.topicQuery,
      examType: 'PRELIMS',
      questionId: pq.id,
      subject: params.item.subject,
      year: pq.year,
      isCorrect,
      selectedOption: params.selectedOption,
      timeSpentSeconds: params.timeSpentSeconds,
      prelimsQuestion: pq,
      sourceMode: 'practice',
    });

    const exp = pq.explanation;
    const rawDetailed = exp?.detailedAnalysis;
    const officialExplanation = Array.isArray(rawDetailed)
      ? rawDetailed.join('\n')
      : rawDetailed ||
        exp?.coreConcept ||
        `Official UPSC Answer Key: Option (${correctOption}).`;

    const coreConcept =
      exp?.coreConcept || `${params.item.subject} — ${params.item.topic} (${params.item.subtopic})`;

    const whyOthersIncorrect =
      exp?.eliminationTechnique ||
      this.buildOptionEliminationNote(pq, correctOption, params.selectedOption);

    const syllabusAndArticleHooks = this.extractConceptHooks(params.topicQuery, params.item);
    const upscTrendNote =
      exp?.upscTrendNote ||
      `Asked in UPSC CSE Prelims ${pq.year} (${pq.paper}). High-priority concept under ${params.item.subject}.`;

    return {
      questionId: pq.id,
      selectedOption: params.selectedOption,
      correctOption,
      isCorrect,
      timeSpentSeconds: params.timeSpentSeconds,
      officialExplanation,
      coreConcept,
      whyOthersIncorrect,
      syllabusAndArticleHooks,
      upscTrendNote,
    };
  }

  /**
   * Generates a clear option elimination note when `eliminationTechnique` is concise.
   */
  private static buildOptionEliminationNote(
    pq: PYQQuestion,
    correctOption: 'A' | 'B' | 'C' | 'D',
    selectedOption: 'A' | 'B' | 'C' | 'D'
  ): string {
    const correctObj = pq.options.find((o) => o.key === correctOption);
    const wrongOptions = pq.options.filter((o) => o.key !== correctOption);
    const selectedObj = pq.options.find((o) => o.key === selectedOption);

    if (selectedOption !== correctOption && selectedObj) {
      return `Option (${selectedOption}) "${selectedObj.text}" is incorrect because it does not satisfy the exact constitutional/statutory or factual conditions asked in the question stem. Option (${correctOption}) "${correctObj?.text || ''}" is verified by the official UPSC key. Other options (${wrongOptions.map((w) => w.key).join(', ')}) can be eliminated by verifying statement accuracy.`;
    }
    return `Option (${correctOption}) "${correctObj?.text || ''}" is the verified UPSC answer. Distractor options (${wrongOptions.map((w) => w.key).join(', ')}) are incorrect as they either over-generalize the provision or swap key institutional/factual attributes.`;
  }

  /**
   * Extracts relevant constitutional articles, acts, judgments, and syllabus linkages.
   */
  static extractConceptHooks(topicQuery: string, item: MatchedPYQItem): string[] {
    const hooks = new Set<string>();
    hooks.add(`${item.gsPaper} • ${item.subject} › ${item.topic}`);
    if (item.subtopic && item.subtopic !== item.topic) {
      hooks.add(`Subtopic: ${item.subtopic}`);
    }

    const { primaryConcepts } = PYQMatchingService.resolveConceptNodes(topicQuery);
    if (primaryConcepts.length > 0) {
      primaryConcepts[0].relatedConcepts.slice(0, 4).forEach((rc) => hooks.add(`Related Concept: ${rc}`));
    }

    if (item.matchedTerms.length > 0) {
      hooks.add(`Key Terms: ${item.matchedTerms.join(', ')}`);
    }

    return Array.from(hooks).slice(0, 6);
  }

  /**
   * Filter a session's question list down to ONLY the questions answered incorrectly
   * so the user can immediately retry their mistakes.
   */
  static buildRetryIncorrectQueue(
    items: MatchedPYQItem[],
    submissionsMap: Record<string, PrelimsPracticeSubmission>
  ): MatchedPYQItem[] {
    return items.filter((item) => {
      const sub = submissionsMap[item.id];
      return Boolean(sub && !sub.isCorrect);
    });
  }

  /**
   * Toggle bookmark state for a Prelims PYQ.
   */
  static async toggleBookmark(question: PYQQuestion): Promise<boolean> {
    return BookmarkStorageService.toggleBookmark(question);
  }

  /**
   * Count words in a Mains answer text.
   */
  static countWords(text: string): number {
    const trimmed = (text || '').trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }

  /**
   * Load existing Mains draft for a question.
   */
  static async loadMainsDraft(questionId: string): Promise<MainsDraftRecord | null> {
    return MainsService.getDraft(questionId);
  }

  /**
   * Save Mains answer draft and record topic practice activity.
   */
  static async saveMainsPracticeDraft(params: {
    topicQuery: string;
    item: MatchedPYQItem;
    answerText: string;
    timeSpentSeconds: number;
  }): Promise<MainsDraftRecord> {
    const mq = params.item.mainsQuestion;
    if (!mq) {
      throw new Error('Mains question record missing on MatchedPYQItem');
    }

    const draft = await MainsService.saveDraft(mq.id, 'typed', params.answerText);

    await UserPracticeAnalyticsService.recordTopicQuestionAttempt({
      topicQuery: params.topicQuery,
      examType: 'MAINS',
      questionId: mq.id,
      subject: params.item.subject,
      year: mq.year,
      isCorrect: true,
      marksAwarded: undefined,
      maxMarks: mq.marks,
      timeSpentSeconds: params.timeSpentSeconds,
      sourceMode: 'practice',
    });

    return draft;
  }

  /**
   * Submit a Mains answer for full AI/Structured Evaluation using `MainsService`.
   */
  static async submitMainsForEvaluation(params: {
    topicQuery: string;
    item: MatchedPYQItem;
    answerText: string;
    timeSpentSeconds: number;
  }): Promise<MainsEvaluationRecord> {
    const mq = params.item.mainsQuestion;
    if (!mq) {
      throw new Error('Mains question record missing on MatchedPYQItem');
    }

    const submission = await MainsService.createSubmission({
      questionId: mq.id,
      paperId: mq.paper_id,
      submissionMode: 'typed',
      answerText: params.answerText,
    });

    const { evaluation } = await MainsAIEvaluationService.evaluateAnswer({
      submissionId: submission.id,
      question: mq,
      submissionMode: 'typed',
      answerText: params.answerText,
    });

    await MainsService.saveEvaluation(submission.id, evaluation);
    const ratio = evaluation.max_score > 0 ? evaluation.total_score / evaluation.max_score : 0.5;

    await UserPracticeAnalyticsService.recordTopicQuestionAttempt({
      topicQuery: params.topicQuery,
      examType: 'MAINS',
      questionId: mq.id,
      subject: params.item.subject,
      year: mq.year,
      isCorrect: ratio >= 0.45,
      marksAwarded: evaluation.total_score,
      maxMarks: evaluation.max_score,
      timeSpentSeconds: params.timeSpentSeconds,
      sourceMode: 'practice',
    });

    return evaluation;
  }

  /**
   * Generates a structured UPSC Mains Model Answer Approach for any Mains PYQ
   * so aspirants can review key points & structure during Practice Mode.
   */
  static getMainsStructuredApproach(
    mq: MainsQuestionRecord,
    topicQuery: string
  ): MainsModelFramework {
    const { primaryConcepts } = PYQMatchingService.resolveConceptNodes(
      topicQuery || mq.topic || mq.subject_area
    );
    const concept = primaryConcepts[0];

    const anchors =
      concept && concept.conceptualKeywords.length > 0
        ? concept.conceptualKeywords.slice(0, 6).map((k) => k.toUpperCase())
        : [mq.paper_id, mq.subject_area, mq.topic];

    const related =
      concept && concept.relatedConcepts.length > 0
        ? concept.relatedConcepts.slice(0, 4)
        : [
            'Constitutional & Institutional Dimension',
            'Socio-Economic & Governance Impact',
            'Comparative / Judicial Precedents',
            'Challenges & Structural Bottlenecks',
          ];

    return {
      introductionHook: `Define the core theme of "${mq.topic || topicQuery}" concisely in 25–35 words, citing its constitutional/statutory basis or recent UPSC context (${mq.paper_id}, ${mq.marks} Marks, ${mq.word_limit} words).`,
      coreDimensions: [
        `1. Core Directive Analysis: Address all sub-parts of the question directly using numbered sub-headings.`,
        `2. Multi-Dimensional Breakdown: Cover ${related.join(', ')}.`,
        `3. Substantiation: Integrate specific articles, landmark Supreme Court judgments, committee reports, or official data points.`,
        `4. Balanced Critique: Present both achievements/strengths and structural limitations objectively.`,
      ],
      constitutionalOrStatutoryAnchors: anchors,
      wayForwardConclusion: `Conclude in 30–40 words with a forward-looking, constitutional, and reform-oriented Way Forward aligned with sustainable development and democratic accountability.`,
    };
  }
}

/**
 * UPSC Mains Service
 * Handles data persistence, submissions, drafts, history, and stats.
 * Uses Supabase when available with transparent offline AsyncStorage fallback.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, getCurrentUserIdOrGuestId } from './supabase';
import {
  MainsAttachmentRecord,
  MainsDraftRecord,
  MainsEvaluationRecord,
  MainsPaperId,
  MainsSubmissionMode,
  MainsSubmissionRecord,
  MainsUserStats,
} from '@/types/mains';
import {
  getAllMainsQuestions,
  getMainsPaperSummaries,
  getMainsQuestionById,
} from '@/data/mainsQuestionRepository';

const inMemoryStore = new Map<string, string>();

const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      const val = await AsyncStorage.getItem(key);
      return val ?? inMemoryStore.get(key) ?? null;
    } catch {
      return inMemoryStore.get(key) || null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    inMemoryStore.set(key, value);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    inMemoryStore.delete(key);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

const MAINS_SUBMISSIONS_STORAGE_KEY = '@upsc_mains_submissions_v1';
const MAINS_EVALUATIONS_STORAGE_KEY = '@upsc_mains_evaluations_v1';
const MAINS_DRAFTS_STORAGE_KEY = '@upsc_mains_drafts_v1';

export class MainsService {
  /**
   * Save an in-progress answer draft for a specific question.
   */
  static async saveDraft(
    questionId: string,
    submissionMode: MainsSubmissionMode,
    answerText: string,
    attachments: MainsAttachmentRecord[] = []
  ): Promise<MainsDraftRecord> {
    const { userId, guestId } = await getCurrentUserIdOrGuestId();
    const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;

    const draft: MainsDraftRecord = {
      question_id: questionId,
      submission_mode: submissionMode,
      answer_text: answerText,
      attachments,
      word_count: wordCount,
      last_saved_at: new Date().toISOString(),
    };

    // Save locally
    try {
      const raw = await safeStorage.getItem(MAINS_DRAFTS_STORAGE_KEY);
      const draftsMap: Record<string, MainsDraftRecord> = raw ? JSON.parse(raw) : {};
      draftsMap[questionId] = draft;
      await safeStorage.setItem(MAINS_DRAFTS_STORAGE_KEY, JSON.stringify(draftsMap));
    } catch (e) {
      console.warn('Local draft save warning:', e);
    }

    // Try syncing to Supabase if connected
    try {
      await supabase.from('mains_drafts').upsert(
        {
          user_id: userId,
          guest_id: guestId,
          question_id: questionId,
          submission_mode: submissionMode,
          answer_text: answerText,
          attachments,
          word_count: wordCount,
          updated_at: draft.last_saved_at,
        },
        { onConflict: 'user_id, guest_id, question_id' }
      );
    } catch {
      // Offline fallback already saved
    }

    return draft;
  }

  /**
   * Get draft for a question if one exists.
   */
  static async getDraft(questionId: string): Promise<MainsDraftRecord | null> {
    try {
      const raw = await safeStorage.getItem(MAINS_DRAFTS_STORAGE_KEY);
      if (raw) {
        const draftsMap: Record<string, MainsDraftRecord> = JSON.parse(raw);
        if (draftsMap[questionId]) {
          return draftsMap[questionId];
        }
      }
    } catch {}

    // Fallback try remote
    try {
      const { userId, guestId } = await getCurrentUserIdOrGuestId();
      let query = supabase.from('mains_drafts').select('*').eq('question_id', questionId);
      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        query = query.eq('guest_id', guestId);
      }
      const { data } = await query.maybeSingle();
      if (data) {
        return {
          question_id: data.question_id,
          submission_mode: data.submission_mode,
          answer_text: data.answer_text,
          attachments: data.attachments || [],
          word_count: data.word_count || 0,
          last_saved_at: data.updated_at,
        };
      }
    } catch {}

    return null;
  }

  /**
   * Delete a saved draft (e.g. after successful submission).
   */
  static async deleteDraft(questionId: string): Promise<void> {
    try {
      const raw = await safeStorage.getItem(MAINS_DRAFTS_STORAGE_KEY);
      if (raw) {
        const draftsMap: Record<string, MainsDraftRecord> = JSON.parse(raw);
        delete draftsMap[questionId];
        await safeStorage.setItem(MAINS_DRAFTS_STORAGE_KEY, JSON.stringify(draftsMap));
      }
    } catch {}

    try {
      const { userId, guestId } = await getCurrentUserIdOrGuestId();
      let query = supabase.from('mains_drafts').delete().eq('question_id', questionId);
      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        query = query.eq('guest_id', guestId);
      }
      await query;
    } catch {}
  }

  /**
   * Create a new answer submission. Calculates attempt number automatically.
   */
  static async createSubmission(params: {
    questionId: string;
    paperId: MainsPaperId;
    submissionMode: MainsSubmissionMode;
    answerText: string;
    ocrExtractedText?: string;
    attachments?: MainsAttachmentRecord[];
  }): Promise<MainsSubmissionRecord> {
    const { userId, guestId } = await getCurrentUserIdOrGuestId();
    const question = getMainsQuestionById(params.questionId);

    const prevSubmissions = await this.getSubmissionsForQuestion(params.questionId);
    const attemptNumber = prevSubmissions.length + 1;

    const submissionId = 'sub_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    const effectiveText = params.answerText || params.ocrExtractedText || '';
    const wordCount = effectiveText.trim() ? effectiveText.trim().split(/\s+/).length : 0;

    const submission: MainsSubmissionRecord = {
      id: submissionId,
      user_id: userId || 'local_user',
      guest_id: guestId,
      question_id: params.questionId,
      paper_id: params.paperId,
      question_number: question?.question_number || '1',
      question_title: question?.title || (question?.text_english?.substring(0, 80) + '...') || 'Question',
      attempt_number: attemptNumber,
      submission_mode: params.submissionMode,
      answer_text: params.answerText,
      ocr_extracted_text: params.ocrExtractedText,
      word_count: wordCount,
      evaluation_status: 'evaluating',
      max_marks: question?.marks || 10,
      attachments: params.attachments || [],
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store locally
    await this.saveLocalSubmission(submission);

    // Delete draft after submission
    await this.deleteDraft(params.questionId);

    // Store to Supabase
    try {
      await supabase.from('mains_submissions').insert({
        id: submission.id,
        user_id: userId,
        guest_id: guestId,
        question_id: submission.question_id,
        paper_id: submission.paper_id,
        question_number: submission.question_number,
        attempt_number: submission.attempt_number,
        submission_mode: submission.submission_mode,
        answer_text: submission.answer_text,
        ocr_extracted_text: submission.ocr_extracted_text,
        word_count: submission.word_count,
        evaluation_status: submission.evaluation_status,
        max_marks: submission.max_marks,
        created_at: submission.submitted_at,
        updated_at: submission.updated_at,
      });

      if (submission.attachments.length > 0) {
        await supabase.from('mains_submission_attachments').insert(
          submission.attachments.map((att, index) => ({
            submission_id: submission.id,
            page_number: att.page_number || index + 1,
            file_uri: att.file_uri,
            file_type: att.file_type,
            file_name: att.file_name,
            file_size: att.file_size,
          }))
        );
      }
    } catch {}

    return submission;
  }

  /**
   * Save an evaluation report linked to a submission.
   */
  static async saveEvaluation(
    submissionId: string,
    evaluation: MainsEvaluationRecord
  ): Promise<MainsEvaluationRecord> {
    // Update local submission
    const all = await this.getAllLocalSubmissions();
    const subIndex = all.findIndex((s) => s.id === submissionId);
    if (subIndex >= 0) {
      all[subIndex].evaluation_status = 'evaluated';
      all[subIndex].marks_awarded = evaluation.total_score;
      all[subIndex].evaluation_id = evaluation.id;
      all[subIndex].evaluation = evaluation;
      all[subIndex].updated_at = new Date().toISOString();
      await safeStorage.setItem(MAINS_SUBMISSIONS_STORAGE_KEY, JSON.stringify(all));
    }

    // Save evaluation to local evaluations store
    try {
      const rawEval = await safeStorage.getItem(MAINS_EVALUATIONS_STORAGE_KEY);
      const evalMap: Record<string, MainsEvaluationRecord> = rawEval ? JSON.parse(rawEval) : {};
      evalMap[submissionId] = evaluation;
      await safeStorage.setItem(MAINS_EVALUATIONS_STORAGE_KEY, JSON.stringify(evalMap));
    } catch (e) {
      console.warn('Local evaluation save warning:', e);
    }

    // Remote sync
    try {
      const { userId, guestId } = await getCurrentUserIdOrGuestId();
      await supabase.from('mains_evaluations').upsert({
        id: evaluation.id,
        submission_id: submissionId,
        question_id: evaluation.question_id,
        user_id: userId,
        guest_id: guestId,
        total_score: evaluation.total_score,
        max_score: evaluation.max_score,
        score_percentage: evaluation.score_percentage,
        is_case_study: evaluation.is_case_study,
        marks_explanation: evaluation.marks_explanation,
        parameters: evaluation.parameters,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        improvement_suggestions: evaluation.improvement_suggestions,
        model_answer: evaluation.model_answer,
        model_answer_word_count: evaluation.model_answer_word_count,
        missing_points: evaluation.missing_points,
        examiners_remarks: evaluation.examiners_remarks,
        case_study_details: evaluation.case_study_details,
        disclaimer: evaluation.disclaimer,
        evaluated_at: evaluation.evaluated_at,
      });

      await supabase
        .from('mains_submissions')
        .update({
          evaluation_status: 'evaluated',
          marks_awarded: evaluation.total_score,
          updated_at: new Date().toISOString(),
        })
        .eq('id', submissionId);
    } catch {}

    return evaluation;
  }

  /**
   * Get all submissions by user/guest.
   */
  static async getUserSubmissions(paperId?: MainsPaperId): Promise<MainsSubmissionRecord[]> {
    const local = await this.getAllLocalSubmissions();
    let filtered = paperId ? local.filter((s) => s.paper_id === paperId) : local;

    // Attach evaluation objects if missing
    try {
      const rawEval = await safeStorage.getItem(MAINS_EVALUATIONS_STORAGE_KEY);
      if (rawEval) {
        const evalMap: Record<string, MainsEvaluationRecord> = JSON.parse(rawEval);
        filtered = filtered.map((s) => {
          if (!s.evaluation && evalMap[s.id]) {
            return { ...s, evaluation: evalMap[s.id] };
          }
          return s;
        });
      }
    } catch {}

    // Sort newest first
    return filtered.sort(
      (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    );
  }

  /**
   * Get all attempts for a specific question.
   */
  static async getSubmissionsForQuestion(questionId: string): Promise<MainsSubmissionRecord[]> {
    const all = await this.getUserSubmissions();
    return all
      .filter((s) => s.question_id === questionId)
      .sort((a, b) => a.attempt_number - b.attempt_number);
  }

  /**
   * Get a single submission by its ID.
   */
  static async getSubmissionById(submissionId: string): Promise<MainsSubmissionRecord | null> {
    const all = await this.getUserSubmissions();
    return all.find((s) => s.id === submissionId) || null;
  }

  /**
   * Get comprehensive student progress metrics.
   */
  static async getUserMainsStats(): Promise<MainsUserStats> {
    const allQuestions = getAllMainsQuestions();
    const paperSummaries = getMainsPaperSummaries();
    const submissions = await this.getUserSubmissions();

    const attemptedQuestionIds = new Set<string>();
    let totalMarksAwarded = 0;
    let totalMaxMarksAwarded = 0;
    let compliantWordCountSubmissions = 0;

    const paperStatsMap: Record<
      string,
      { total_questions: number; attempted: number; total_score: number; total_max: number }
    > = {};

    for (const p of paperSummaries) {
      paperStatsMap[p.paper_id] = {
        total_questions: p.total_questions,
        attempted: 0,
        total_score: 0,
        total_max: 0,
      };
    }

    const topicStatsMap: Record<
      string,
      { topic: string; attempted: number; total_score: number; total_max: number }
    > = {};

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let writingFrequencyCount = 0;

    for (const sub of submissions) {
      attemptedQuestionIds.add(sub.question_id);

      if (new Date(sub.submitted_at) >= sevenDaysAgo) {
        writingFrequencyCount++;
      }

      const q = getMainsQuestionById(sub.question_id);
      const targetLimit = q?.word_limit || 150;
      // Compliance: within 10% tolerance
      if (sub.word_count <= targetLimit * 1.15 && sub.word_count >= targetLimit * 0.7) {
        compliantWordCountSubmissions++;
      }

      if (sub.marks_awarded !== undefined && sub.max_marks > 0) {
        totalMarksAwarded += sub.marks_awarded;
        totalMaxMarksAwarded += sub.max_marks;

        if (paperStatsMap[sub.paper_id]) {
          paperStatsMap[sub.paper_id].total_score += sub.marks_awarded;
          paperStatsMap[sub.paper_id].total_max += sub.max_marks;
        }

        const topic = q?.topic || 'General Practice';
        if (!topicStatsMap[topic]) {
          topicStatsMap[topic] = { topic, attempted: 0, total_score: 0, total_max: 0 };
        }
        topicStatsMap[topic].attempted++;
        topicStatsMap[topic].total_score += sub.marks_awarded;
        topicStatsMap[topic].total_max += sub.max_marks;
      }

      if (paperStatsMap[sub.paper_id]) {
        paperStatsMap[sub.paper_id].attempted++;
      }
    }

    const totalQuestionsAvailable = allQuestions.length;
    const totalAttempted = attemptedQuestionIds.size;
    const totalPending = Math.max(0, totalQuestionsAvailable - totalAttempted);

    const averageEvaluatedMarksPct =
      totalMaxMarksAwarded > 0 ? (totalMarksAwarded / totalMaxMarksAwarded) * 100 : 0;

    const paperWiseStats: Record<
      string,
      { total_questions: number; attempted: number; avg_marks: number; avg_pct: number }
    > = {};

    for (const [pId, item] of Object.entries(paperStatsMap)) {
      const avgPct = item.total_max > 0 ? (item.total_score / item.total_max) * 100 : 0;
      const avgMarks = item.attempted > 0 ? item.total_score / item.attempted : 0;
      paperWiseStats[pId] = {
        total_questions: item.total_questions,
        attempted: item.attempted,
        avg_marks: parseFloat(avgMarks.toFixed(1)),
        avg_pct: parseFloat(avgPct.toFixed(1)),
      };
    }

    const topicWiseStats: Record<
      string,
      { topic: string; attempted: number; avg_score: number; max_score: number; avg_pct: number }
    > = {};

    const rankedTopics: { topic: string; score_pct: number }[] = [];

    for (const [tKey, item] of Object.entries(topicStatsMap)) {
      const pct = item.total_max > 0 ? (item.total_score / item.total_max) * 100 : 0;
      const avgScore = item.attempted > 0 ? item.total_score / item.attempted : 0;
      topicWiseStats[tKey] = {
        topic: item.topic,
        attempted: item.attempted,
        avg_score: parseFloat(avgScore.toFixed(1)),
        max_score: item.total_max,
        avg_pct: parseFloat(pct.toFixed(1)),
      };
      rankedTopics.push({ topic: item.topic, score_pct: parseFloat(pct.toFixed(1)) });
    }

    rankedTopics.sort((a, b) => b.score_pct - a.score_pct);
    const strongestTopics = rankedTopics.slice(0, 3);
    const weakestTopics = [...rankedTopics].reverse().slice(0, 3);

    const wordLimitCompliancePct =
      submissions.length > 0 ? (compliantWordCountSubmissions / submissions.length) * 100 : 100;

    return {
      total_questions_available: totalQuestionsAvailable,
      total_attempted: totalAttempted,
      total_pending: totalPending,
      average_evaluated_marks_pct: parseFloat(averageEvaluatedMarksPct.toFixed(1)),
      paper_wise_stats: paperWiseStats,
      topic_wise_stats: topicWiseStats,
      strongest_topics: strongestTopics,
      weakest_topics: weakestTopics,
      writing_frequency: writingFrequencyCount,
      word_limit_compliance_pct: parseFloat(wordLimitCompliancePct.toFixed(1)),
      recent_submissions: submissions.slice(0, 10),
    };
  }

  // Private local helpers
  private static async getAllLocalSubmissions(): Promise<MainsSubmissionRecord[]> {
    try {
      const raw = await safeStorage.getItem(MAINS_SUBMISSIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private static async saveLocalSubmission(sub: MainsSubmissionRecord): Promise<void> {
    try {
      const all = await this.getAllLocalSubmissions();
      const existingIdx = all.findIndex((s) => s.id === sub.id);
      if (existingIdx >= 0) {
        all[existingIdx] = sub;
      } else {
        all.unshift(sub);
      }
      await safeStorage.setItem(MAINS_SUBMISSIONS_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('Error saving local submission:', e);
    }
  }
}

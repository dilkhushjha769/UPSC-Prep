import AsyncStorage from '@react-native-async-storage/async-storage';
import { PYQQuestion } from '@/types/prelims';

const BOOKMARK_STORAGE_KEY = '@upsc_bookmarked_questions_v1';

// In-memory cache for fast synchronous checks
let cachedBookmarks: Record<string, PYQQuestion> | null = null;

export const BookmarkStorageService = {
  /**
   * Load all bookmarked questions from storage into memory cache
   */
  async getBookmarkedQuestions(): Promise<PYQQuestion[]> {
    if (cachedBookmarks) {
      return Object.values(cachedBookmarks);
    }
    try {
      const raw = await AsyncStorage.getItem(BOOKMARK_STORAGE_KEY);
      if (raw) {
        cachedBookmarks = JSON.parse(raw);
        return Object.values(cachedBookmarks || {});
      }
      cachedBookmarks = {};
      return [];
    } catch (e) {
      console.warn('Failed to load bookmarks from storage:', e);
      cachedBookmarks = cachedBookmarks || {};
      return Object.values(cachedBookmarks);
    }
  },

  /**
   * Get an array of all bookmarked question IDs
   */
  async getBookmarkedIds(): Promise<string[]> {
    const list = await this.getBookmarkedQuestions();
    return list.map((q) => q.id);
  },

  /**
   * Check if a specific question is currently bookmarked
   */
  async isBookmarked(questionId: string): Promise<boolean> {
    if (!cachedBookmarks) {
      await this.getBookmarkedQuestions();
    }
    return Boolean(cachedBookmarks && cachedBookmarks[questionId]);
  },

  /**
   * Fast synchronous check if cache is loaded
   */
  isBookmarkedSync(questionId: string): boolean {
    return Boolean(cachedBookmarks && cachedBookmarks[questionId]);
  },

  /**
   * Save a question to bookmarks
   */
  async saveBookmark(question: PYQQuestion): Promise<void> {
    if (!cachedBookmarks) {
      await this.getBookmarkedQuestions();
    }
    cachedBookmarks = {
      ...cachedBookmarks,
      [question.id]: question,
    };
    try {
      await AsyncStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(cachedBookmarks));
    } catch (e) {
      console.warn('Failed to save bookmark to storage:', e);
    }
  },

  /**
   * Remove a question from bookmarks
   */
  async removeBookmark(questionId: string): Promise<void> {
    if (!cachedBookmarks) {
      await this.getBookmarkedQuestions();
    }
    if (cachedBookmarks && cachedBookmarks[questionId]) {
      const copy = { ...cachedBookmarks };
      delete copy[questionId];
      cachedBookmarks = copy;
      try {
        await AsyncStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(cachedBookmarks));
      } catch (e) {
        console.warn('Failed to remove bookmark from storage:', e);
      }
    }
  },

  /**
   * Toggle bookmark state for a question
   * @returns true if question is now bookmarked, false if removed
   */
  async toggleBookmark(question: PYQQuestion): Promise<boolean> {
    if (!cachedBookmarks) {
      await this.getBookmarkedQuestions();
    }
    const alreadyBookmarked = Boolean(cachedBookmarks && cachedBookmarks[question.id]);
    if (alreadyBookmarked) {
      await this.removeBookmark(question.id);
      return false;
    } else {
      await this.saveBookmark(question);
      return true;
    }
  },
};

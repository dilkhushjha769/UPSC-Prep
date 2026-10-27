import React from 'react';
import { Text, TextStyle } from 'react-native';
import { DailyEventItem } from '@/data/currentAffairsData';

/**
 * Gemini AI Executive Brief Generation Prompt Specification
 * Adheres strictly to UPSC Civil Services Examination standards:
 * - 3 concise bullet points per news event
 * - Point 1: Main event, decision, judgment, report, or development
 * - Point 2: Most important details, provisions, figures, institutions, or mechanisms
 * - Point 3: Broader significance, implications, or governance relevance to India
 * - 15-30 words per bullet
 * - Inline markdown bolding (**keyword**) for important institutions, articles, reports, and terms
 * - Strict factual accuracy, no fabrication, multi-source cross-verification
 */
export const GEMINI_EXECUTIVE_BRIEF_SYSTEM_PROMPT = `You are a Senior UPSC Civil Services Examination Current Affairs Analyst and Editor.
Your role is to produce a high-yield, factually rigorous "Executive Brief" for daily current affairs news items.

### Content Structure (Strictly 3 Concise Bullets)
1. Point 1 (Event Core): State the primary event, decision, judgment, treaty, policy release, or development clearly without repeating the headline verbatim.
2. Point 2 (Key Provisions & Data): Highlight the critical details, statutory articles, numerical figures, institutions, or operational mechanisms.
3. Point 3 (Implications & Governance): Explain the strategic significance, constitutional/policy implications, or relevance to Indian governance and the UPSC CSE syllabus.

### Style & Formatting Rules
- Length: 15–30 words per bullet point. Use clear, precise, and formal English.
- Bullet Format: Output exactly 3 bullet points starting with "- ".
- Selective Keyword Bolding: Use markdown bold (**keyword**) ONLY for key institutional names, major reports, constitutional articles, government schemes, treaties, and technical terms.
- NEVER bold entire sentences or generic phrases.
- Avoid duplicate facts between bullets or verbatim repetition of the headline.
- Anti-Hallucination: Never invent dates, statistics, quotations, or constitutional articles. If a fact cannot be verified across authoritative sources (e.g. PIB, The Hindu, Supreme Court records, Ministry portals), omit or qualify it.
- Distinguish historical context (e.g. past accords, predecessor verdicts) clearly from the fresh development.`;

/**
 * Builds the user prompt sent to Gemini AI for generating an Executive Brief
 */
export function buildExecutiveBriefPrompt(event: Partial<DailyEventItem>): string {
  return `Analyze the following news item and generate an authoritative 3-bullet Executive Brief following the system instructions:

Headline: ${event.headline || 'N/A'}
Category: ${event.category || 'General'}
Paper: ${event.paper || 'GS'}
Source: ${event.source || 'Verified News'}
Date: ${event.date || 'Recent'}
Key Facts / Bullets:
${(event.bullets || []).map((b) => `- ${b}`).join('\n')}
${(event.prelimsFacts || []).map((f) => `- ${f}`).join('\n')}

Output exactly 3 bullet points starting with "- " with selective **keyword** bolding:`;
}

/**
 * Parse an Executive Brief from either an explicit bullets array or a summary text string.
 * Supports bulleted lists, newline-separated points, and sentence-based fallbacks.
 */
export function parseExecutiveBrief(
  summaryText?: string,
  summaryBullets?: string[]
): string[] {
  // 1. If explicit bullets array is provided, use it
  if (Array.isArray(summaryBullets) && summaryBullets.length > 0) {
    return summaryBullets.map((b) => cleanBulletString(b)).filter(Boolean);
  }

  if (!summaryText || typeof summaryText !== 'string') {
    return [];
  }

  const trimmed = summaryText.trim();
  if (!trimmed) {
    return [];
  }

  // 2. Check if summary contains markdown bullets (lines starting with - or * or •)
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const bulletLines = lines.filter((l) => /^[-*•]\s+/.test(l));

  if (bulletLines.length >= 2) {
    return bulletLines.map((b) => cleanBulletString(b)).filter(Boolean);
  }

  // 3. Fallback: Split by sentences (periods, exclamation, question mark followed by whitespace)
  const sentenceSplits = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => cleanBulletString(s))
    .filter(Boolean);

  if (sentenceSplits.length > 0) {
    return sentenceSplits;
  }

  return [cleanBulletString(trimmed)];
}

/**
 * Strips leading bullet symbols (- , * , • ) while preserving inline markdown bolding (**...**)
 */
function cleanBulletString(str: string): string {
  return str.replace(/^[-*•]\s*/, '').trim();
}

/**
 * Safely renders markdown bolding (**keyword**) inside React Native <Text>
 * Breaks text into nested <Text> components so words wrap smoothly across lines without layout glitches.
 */
export function renderExecutiveBriefText(
  text: string,
  baseStyle: TextStyle | TextStyle[],
  boldStyle: TextStyle | TextStyle[]
): React.ReactElement {
  if (!text) {
    return React.createElement(Text, { style: baseStyle }, '');
  }

  // Match **...** blocks
  const tokens = text.split(/(\*\*[^*]+\*\*)/g);

  return React.createElement(
    Text,
    { style: baseStyle },
    ...tokens.map((token, index) => {
      if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
        const innerContent = token.slice(2, -2);
        return React.createElement(
          Text,
          { key: `bold-${index}`, style: boldStyle },
          innerContent
        );
      }
      return token;
    })
  );
}

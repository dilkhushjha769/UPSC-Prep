import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, Lightbulb, BookOpen } from '@/components/common/LucideIcons';

export interface EditorialExplanationViewProps {
  isDark: boolean;
  correctAnswer?: string;
  coreConcept?: string;
  detailedAnalysis?: string[] | string;
  eliminationTechnique?: string;
  explanationText?: string;
  syllabusRelevance?: string;
  source?: string;
  showHeaderBadge?: boolean;
}

interface ParsedStep {
  number: number;
  title: string;
  content: string[];
}

export function EditorialExplanationView({
  isDark,
  correctAnswer,
  coreConcept,
  detailedAnalysis,
  eliminationTechnique,
  explanationText,
  syllabusRelevance,
  source,
  showHeaderBadge = true,
}: EditorialExplanationViewProps) {
  // If structured data is provided, use it directly. Otherwise parse the raw explanationText
  const { steps, conclusionText, finalHighlight } = useMemo(() => {
    const rawSteps: ParsedStep[] = [];
    let conclusion = eliminationTechnique || '';
    let highlight = correctAnswer ? `Therefore, Option (${correctAnswer.toUpperCase()}) is the correct answer.` : '';

    if (coreConcept) {
      rawSteps.push({
        number: 1,
        title: 'Core Concept',
        content: [coreConcept],
      });
    }

    if (detailedAnalysis) {
      const analysisLines = Array.isArray(detailedAnalysis)
        ? detailedAnalysis
        : detailedAnalysis.split('\n').map((l) => l.trim()).filter(Boolean);

      if (analysisLines.length > 0) {
        rawSteps.push({
          number: rawSteps.length + 1,
          title: 'Detailed Analysis',
          content: analysisLines,
        });
      }
    }

    // If no structured coreConcept/detailedAnalysis was provided, parse explanationText
    if (rawSteps.length === 0 && explanationText) {
      const text = explanationText.trim();
      const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

      if (paragraphs.length === 1) {
        // Check for "Statement 1", "Statement 2", etc.
        const stSplit = text.split(/(?=Statement\s+\d+|Option\s+[A-D])/i);
        if (stSplit.length > 1) {
          const intro = stSplit[0].trim();
          if (intro) {
            rawSteps.push({
              number: 1,
              title: 'Core Concept & Context',
              content: [intro],
            });
          }
          const analysisItems = stSplit.slice(1).map((s) => s.trim()).filter(Boolean);
          if (analysisItems.length > 0) {
            rawSteps.push({
              number: rawSteps.length + 1,
              title: 'Detailed Explanation',
              content: analysisItems,
            });
          }
        } else {
          rawSteps.push({
            number: 1,
            title: 'Concept & Explanation',
            content: [text],
          });
        }
      } else {
        // Multiple paragraphs
        paragraphs.forEach((p, idx) => {
          if (idx === paragraphs.length - 1 && /therefore|hence|thus|in summary|correct answer/i.test(p)) {
            conclusion = p;
          } else {
            rawSteps.push({
              number: rawSteps.length + 1,
              title: idx === 0 ? 'Core Concept & Background' : `Key Analysis Point ${idx}`,
              content: [p],
            });
          }
        });
      }
    }

    return {
      steps: rawSteps,
      conclusionText: conclusion,
      finalHighlight: highlight,
    };
  }, [coreConcept, detailedAnalysis, eliminationTechnique, explanationText, correctAnswer]);

  return (
    <View style={styles.container}>
      {/* 1. Header: Explanation Title & Official UPSC Key Badge */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <Text style={[styles.sectionHeading, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            Explanation
          </Text>
        </View>

      </View>

      {/* 2. Numbered Steps Breakdown */}
      {steps.map((step) => (
        <View key={`step-${step.number}`} style={styles.stepRow}>
          <View
            style={[
              styles.stepBadge,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6',
              },
            ]}>
            <Text style={[styles.stepBadgeText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {step.number}
            </Text>
          </View>

          <View style={styles.stepContentCol}>
            <Text style={[styles.stepTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {step.title}
            </Text>
            {step.content.map((line, lIdx) => (
              <Text
                key={`line-${lIdx}`}
                style={[styles.stepBodyLine, { color: isDark ? '#9CA3AF' : '#4B5563' }]}>
                {line}
              </Text>
            ))}
          </View>
        </View>
      ))}

      {/* 3. Conclusion / Examiner Elimination Strategy (Soft Emerald Card) */}
      <View
        style={[
          styles.conclusionCard,
          {
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4',
            borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#BBF7D0',
          },
        ]}>
        <View style={styles.conclusionHeaderRow}>
          <Lightbulb size={16} color="#10B981" strokeWidth={2.2} />
          <Text style={styles.conclusionHeaderTitle}>
            {eliminationTechnique ? 'Examiner Elimination Strategy' : 'Conclusion'}
          </Text>
        </View>

        {Boolean(conclusionText) && (
          <Text style={[styles.conclusionBody, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>
            {conclusionText}
          </Text>
        )}

        {Boolean(finalHighlight) && (
          <Text style={styles.verdictHighlight}>
            {finalHighlight}
          </Text>
        )}
      </View>

      {/* 4. Optional UPSC Syllabus Linkage */}
      {Boolean(syllabusRelevance) && (
        <View
          style={[
            styles.metaInfoCard,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
            },
          ]}>
          <BookOpen size={13} color={isDark ? '#60A5FA' : '#2563EB'} strokeWidth={2} />
          <Text style={[styles.metaInfoLabel, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            Syllabus Linkage:
          </Text>
          <Text style={[styles.metaInfoText, { color: isDark ? '#9CA3AF' : '#4B5563' }]}>
            {syllabusRelevance}
          </Text>
        </View>
      )}

      {/* 5. Optional Source Citation */}
      {Boolean(source) && (
        <Text style={[styles.sourceText, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
          Source: {source}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  officialBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#10B981',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stepContentCol: {
    flex: 1,
    gap: 5,
  },
  stepTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  stepBodyLine: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
    marginBottom: 4,
  },
  conclusionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginTop: 4,
  },
  conclusionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conclusionHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#10B981',
  },
  conclusionBody: {
    fontSize: 13.5,
    lineHeight: 21,
    fontWeight: '400',
  },
  verdictHighlight: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#10B981',
    lineHeight: 20,
  },
  metaInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  metaInfoLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  metaInfoText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  sourceText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: -4,
  },
});


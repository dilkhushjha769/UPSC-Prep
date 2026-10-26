import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';

interface LegalScreenProps {
  isDark: boolean;
  initialTab?: 'privacy' | 'terms';
  onBack: () => void;
}

export function LegalScreen({
  isDark,
  initialTab = 'privacy',
  onBack,
}: LegalScreenProps) {
  const [activeSegment, setActiveSegment] = useState<'privacy' | 'terms'>(initialTab);
  const { width } = useWindowDimensions();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const isDesktop = width >= 768;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: theme.bg,
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          accessibilityLabel="Back to Settings"
          style={[
            styles.backBtn,
            Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}>
          <ChevronLeft size={20} color={theme.textPrimary} strokeWidth={2.4} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {activeSegment === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
        </Text>

        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Segment Switcher */}
      <View
        style={[
          styles.segmentContainer,
          isDesktop && styles.desktopSegment,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveSegment('privacy')}
          style={[
            styles.segmentButton,
            activeSegment === 'privacy' && [
              styles.segmentActive,
              { backgroundColor: isDark ? '#FFFFFF' : '#0F172A' },
            ],
          ]}>
          <Text
            style={[
              styles.segmentText,
              {
                color:
                  activeSegment === 'privacy'
                    ? isDark
                      ? '#09090B'
                      : '#FFFFFF'
                    : theme.textMuted,
              },
            ]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveSegment('terms')}
          style={[
            styles.segmentButton,
            activeSegment === 'terms' && [
              styles.segmentActive,
              { backgroundColor: isDark ? '#FFFFFF' : '#0F172A' },
            ],
          ]}>
          <Text
            style={[
              styles.segmentText,
              {
                color:
                  activeSegment === 'terms'
                    ? isDark
                      ? '#09090B'
                      : '#FFFFFF'
                    : theme.textMuted,
              },
            ]}>
            Terms & Conditions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollBody,
          isDesktop && styles.desktopScrollBody,
        ]}
        showsVerticalScrollIndicator={false}>
        {activeSegment === 'privacy' ? (
          <View style={styles.documentCard}>
            <Text style={[styles.docMeta, { color: theme.textMuted }]}>
              LAST UPDATED: OCTOBER 2026 · VERSION 2.4
            </Text>
            <Text style={[styles.docHeading, { color: theme.textPrimary }]}>
              Privacy & Data Protection Policy
            </Text>
            <Text style={[styles.docParagraph, { color: theme.textSecondary }]}>
              At UPSC Prep, we take your personal and study data privacy seriously. This policy explains what information is collected, how it is stored securely, and how you retain complete control over your preparation records.
            </Text>

            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              1. Information We Collect
            </Text>
            <Text style={[styles.docParagraph, { color: theme.textSecondary }]}>
              • Profile Details: Name, email address, optional subject, target examination year, medium of examination, and chosen profile avatar.
            </Text>
            <Text style={[styles.docParagraph, { color: theme.textSecondary }]}>
              • Study Metrics: Focus session timestamps, daily target logs, MCQ practice scores, streak consistency metrics, and question review bookmarks.
            </Text>
            <Text style={[styles.docParagraph, { color: theme.textSecondary }]}>
              • Device & Telemetry: Minimal crash reports and anonymous performance diagnostics used exclusively to maintain app reliability.
            </Text>

            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              2. How Your Data Is Stored & Protected
            </Text>
            <Text style={[styles.docParagraph, { color: theme.textSecondary }]}>
              Your study records and profile details are encrypted at rest using industry-standard TLS 1.3 encryption in transit and AES-256 for persistent database storage. All local device caches utilize sandboxed AsyncStorage.
            </Text>

            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              3. Zero Third-Party Advertising
            </Text>
            <Text style={[styles.docParagraph, { color: theme.textSecondary }]}>
              We maintain an ad-free learning ecosystem. We do not sell, rent, or lease your personal information, test performance, or study activity to third-party commercial data brokers or advertisers.
            </Text>

            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              4. Data Ownership & Deletion Rights
            </Text>
            <Text style={[styles.docParagraph, { color: theme.textSecondary }]}>
              You have full sovereignty over your preparation journey. You can update your details, export your logs, or permanently purge your account and all associated test responses from our database at any time through the Settings screen.
            </Text>

            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              5. Contact Us
            </Text>
            <Text style={[styles.docParagraph, { color: theme.textSecondary }]}>
              If you have any questions regarding data governance or privacy compliance, please contact our Data Governance Officer at privacy@upscprep.org.
            </Text>
          </View>
        ) : (
          <View style={styles.documentCard}>
            <Text style={[styles.docMeta, { color: theme.textMuted }]}>
              EFFECTIVE DATE: OCTOBER 2026 · ALL RIGHTS RESERVED
            </Text>
            <Text style={[styles.docHeading, { color: theme.textPrimary }]}>
              Terms of Service & Usage Agreement
            </Text>
            <Text style={[styles.docParagraph, { color: theme.textSecondary }]}>
              Welcome to UPSC Prep. By downloading, accessing, or using the application, you agree to abide by the terms and conditions outlined below.
            </Text>

            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              1. Purpose of the Platform
            </Text>
            <Text style={[styles.docParagraph, { color: theme.textSecondary }]}>
              UPSC Prep is an educational companion developed solely to facilitate self-paced learning, revision tracking, and mock practice for civil services aspirants. The platform does not represent any official government commission.
            </Text>

            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              2. Intellectual Property & PYQ Materials
            </Text>
            <Text style={[styles.docParagraph, { color: theme.textSecondary }]}>
              All mock questions, explanations, editorial synthesis, curated syllabus maps, and app designs are protected by copyright. Official UPSC past examination questions are utilized strictly for fair educational reference and academic practice.
            </Text>

            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              3. User Responsibilities
            </Text>
            <Text style={[styles.docParagraph, { color: theme.textSecondary }]}>
              Users agree not to scrape, reverse engineer, decompile, or misuse the application&apos;s APIs, databases, or content databases through automated scripts or unauthorized extraction tools.
            </Text>

            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              4. Disclaimer of Warranties
            </Text>
            <Text style={[styles.docParagraph, { color: theme.textSecondary }]}>
              While every effort is made to maintain complete accuracy across answers and syllabus summaries, content is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind.
            </Text>

            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              5. Modifications to Terms
            </Text>
            <Text style={[styles.docParagraph, { color: theme.textSecondary }]}>
              We reserve the right to revise these Terms of Service periodically. Continued usage of the application constitutes acceptance of updated terms.
            </Text>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerRightPlaceholder: {
    width: 36,
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
  },
  desktopSegment: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  desktopScrollBody: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },
  documentCard: {
    paddingVertical: 10,
  },
  docMeta: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  docHeading: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  docParagraph: {
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 10,
  },
});

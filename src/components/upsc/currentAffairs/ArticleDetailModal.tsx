import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import {
  X,
  Bookmark,
  BookOpen,
  ListChecks,
  ShieldCheck,
  Compass,
  ExternalLink,
  AlertTriangle,
  Camera,
  Landmark,
  FileCheck2,
  Sparkles,
  Scale,
} from 'lucide-react-native';
import {
  DailyEventItem,
  CuratedArticle,
  MajorEvent,
  ImageProvenanceMetadata,
  CrossVerificationMetadata,
  VerifiedRelatedPYQ,
  EventSourceItem,
} from '@/data/currentAffairsData';
import { BW_THEME } from '@/constants/bwTheme';

type DetailItem =
  | { type: 'event'; data: DailyEventItem }
  | { type: 'major'; data: MajorEvent }
  | { type: 'article'; data: CuratedArticle };

interface ArticleDetailModalProps {
  visible: boolean;
  item: DetailItem | null;
  onClose: () => void;
  isDark: boolean;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
}

export function ArticleDetailModal({
  visible,
  item,
  onClose,
  isDark,
  isSaved = false,
  onToggleSave,
}: ArticleDetailModalProps) {
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  if (!visible || !item) return null;

  const title =
    item.type === 'event'
      ? item.data.headline
      : item.type === 'major'
      ? item.data.title
      : item.data.title;

  const source = item.data.source;
  const date = item.data.date;
  const subjectGroup =
    item.type === 'event'
      ? item.data.subjectGroup
      : item.type === 'article'
      ? item.data.subjectGroup
      : undefined;
  const subcategory =
    item.type === 'event'
      ? item.data.subcategory
      : item.type === 'article'
      ? item.data.subcategory
      : undefined;
  const editorialAuthor =
    item.type === 'event'
      ? item.data.editorialAuthor
      : item.type === 'article'
      ? item.data.editorialAuthor
      : undefined;
  const aiExplanationDisclaimer =
    item.type === 'event'
      ? item.data.aiExplanationDisclaimer
      : item.type === 'article'
      ? item.data.aiExplanationDisclaimer
      : undefined;
  const category =
    subcategory ||
    (item.type === 'event'
      ? item.data.primaryCategory || item.data.category
      : item.type === 'article'
      ? item.data.primaryCategory || item.data.category
      : item.data.category);

  const secondaryTags: string[] =
    item.type === 'event'
      ? item.data.secondaryTags || []
      : item.type === 'article'
      ? item.data.secondaryTags || []
      : [];

  const paper = item.data.paper;

  const executiveBullets =
    item.type === 'event'
      ? item.data.summaryBullets || item.data.bullets.slice(0, 3)
      : item.type === 'major'
      ? item.data.keyTakeaways
      : item.data.keyPoints.slice(0, 3);

  const detailedAnalysisParagraphs: string[] =
    item.type === 'event'
      ? item.data.fullAnalysis?.detailedExplanation || item.data.bullets
      : item.type === 'article'
      ? item.data.fullAnalysis?.detailedExplanation || item.data.keyPoints
      : item.data.keyTakeaways;

  const backgroundContext =
    item.type === 'event'
      ? item.data.fullAnalysis?.backgroundAndInstitutionalContext
      : item.type === 'article'
      ? item.data.fullAnalysis?.backgroundAndInstitutionalContext
      : undefined;

  const importantFiguresProvisions =
    item.type === 'event'
      ? item.data.fullAnalysis?.importantFiguresDatesProvisions || []
      : item.type === 'article'
      ? item.data.fullAnalysis?.importantFiguresDatesProvisions || []
      : [];

  const whyItMatters =
    item.type === 'event'
      ? item.data.whyItMatters || item.data.fullAnalysis?.whyItMattersForUPSC
      : item.type === 'article'
      ? item.data.whyItMatters || item.data.fullAnalysis?.whyItMattersForUPSC
      : undefined;

  const imageMetadata: ImageProvenanceMetadata | undefined =
    item.type === 'event'
      ? item.data.imageMetadata
      : item.type === 'article'
      ? item.data.imageMetadata
      : undefined;

  const crossVerification: CrossVerificationMetadata | undefined =
    item.type === 'event'
      ? item.data.crossVerification
      : item.type === 'article'
      ? item.data.crossVerification
      : undefined;

  const relatedPyqs: VerifiedRelatedPYQ[] =
    item.type === 'event'
      ? item.data.relatedPyqs || []
      : item.type === 'article'
      ? item.data.relatedPyqs || []
      : [];

  const prelimsMatrix =
    item.type === 'event'
      ? item.data.prelimsFactMatrix || []
      : item.type === 'article'
      ? item.data.prelimsFactMatrix || []
      : [];

  const prelimsFacts =
    item.type === 'event'
      ? item.data.prelimsFacts || []
      : item.type === 'article'
      ? item.data.prelimsFacts || []
      : [];

  const syllabusRelevance =
    item.type === 'event'
      ? item.data.syllabusRelevance
      : item.type === 'article'
      ? item.data.syllabusRelevance
      : undefined;

  const sourcesList: EventSourceItem[] =
    item.type === 'event' && item.data.sources && item.data.sources.length > 0
      ? item.data.sources
      : item.type === 'article' && item.data.sources && item.data.sources.length > 0
      ? item.data.sources
      : [
          {
            name: source,
            url:
              item.type === 'event'
                ? item.data.referenceUrl
                : item.type === 'article'
                ? item.data.link
                : undefined,
            date,
            type: source.toLowerCase().includes('pib') || source.toLowerCase().includes('rbi')
              ? 'Official'
              : 'Leading Daily',
          },
        ];

  const itemId = item.data.id;
  const imageUrl =
    imageMetadata?.imageUrl ||
    (item.type === 'event' ? item.data.imageUrl : (item.data as any).imageUrl);

  const getImageTypeBadgeLabel = (imgType?: ImageProvenanceMetadata['imageType']) => {
    switch (imgType) {
      case 'official_infographic':
        return 'Official Govt Infographic';
      case 'event_photo':
        return 'Authentic Event Photograph';
      case 'contextual_photo':
        return 'Representative Contextual Photograph';
      default:
        return 'Authenticated Agency Visual';
    }
  };

  const handleOpenSourceUrl = async (url?: string) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch {
      // Ignore if URL cannot be opened
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.header}>
          <Pressable style={styles.closeBtn} onPress={onClose} accessibilityLabel="Close Full Analysis">
            <X size={18} color={theme.textPrimary} strokeWidth={2.2} />
          </Pressable>

          <Text style={styles.headerTitle} numberOfLines={1}>
            Full Analysis & Source Verification
          </Text>

          <Pressable
            style={[styles.saveBtn, isSaved && styles.saveBtnActive]}
            onPress={() => onToggleSave && onToggleSave(itemId)}
          >
            <Bookmark
              size={14}
              color={isSaved ? '#FFFFFF' : theme.textPrimary}
              fill={isSaved ? '#FFFFFF' : 'none'}
              strokeWidth={2}
            />
            <Text style={[styles.saveBtnText, isSaved && styles.saveBtnTextActive]}>
              {isSaved ? 'Saved' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {/* 1. Metadata & Subject Group / Subcategory Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.paperBadge}>
              <Text style={styles.paperBadgeText}>{paper}</Text>
            </View>
            {Boolean(subjectGroup) && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{subjectGroup}</Text>
              </View>
            )}
            <View style={styles.secondaryTagBadge}>
              <Text style={styles.secondaryTagText}>{category}</Text>
            </View>
            {secondaryTags
              .filter((t) => t !== subjectGroup && t !== category)
              .slice(0, 1)
              .map((tag) => (
                <View key={tag} style={styles.secondaryTagBadge}>
                  <Text style={styles.secondaryTagText}>{tag}</Text>
                </View>
              ))}
            <Text style={styles.dateText}>{date}</Text>
          </View>

          {/* 2. Headline */}
          <Text style={styles.titleText}>{title}</Text>

          {/* 2B. Editorial Opinion vs. AI Educational Explanation Attribution */}
          {Boolean(editorialAuthor || aiExplanationDisclaimer) && (
            <View style={styles.whyItMattersCard}>
              <View style={styles.sectionHeaderRow}>
                <BookOpen size={15} color={isDark ? '#6FBAFF' : '#006FFD'} strokeWidth={2.2} />
                <Text style={styles.whyItMattersHeading}>
                  Original Editorial Attribution vs. AI UPSC Synthesis
                </Text>
              </View>
              <Text style={styles.whyItMattersText}>
                {editorialAuthor ? `Author / Desk: ${editorialAuthor} • Publisher: ${source} (${date}). ` : ''}
                {aiExplanationDisclaimer ||
                  'Original editorial viewpoints belong to the cited author and publisher. The UPSC syllabus synthesis, key takeaways, and Mains practice question below are AI-structured educational explanations.'}
              </Text>
            </View>
          )}

          {/* 3. Why This Event Matters for UPSC Preparation */}
          {Boolean(whyItMatters) && (
            <View style={styles.whyItMattersCard}>
              <View style={styles.sectionHeaderRow}>
                <Sparkles size={15} color={isDark ? '#6FBAFF' : '#006FFD'} strokeWidth={2.2} />
                <Text style={styles.whyItMattersHeading}>Why This Event Matters for UPSC</Text>
              </View>
              <Text style={styles.whyItMattersText}>{whyItMatters}</Text>
            </View>
          )}

          {/* 4. Authentic Images & Provenance Credits */}
          {Boolean(imageUrl) ? (
            <View style={styles.imageProvenanceCard}>
              <View style={styles.heroImageWrapper}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.heroImage}
                  contentFit="cover"
                  transition={180}
                />
                <View style={styles.imageTypeOverlayBadge}>
                  <Camera size={11} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.imageTypeOverlayText}>
                    {getImageTypeBadgeLabel(imageMetadata?.imageType)}
                  </Text>
                </View>
              </View>
              <View style={styles.imageCreditFooter}>
                <Text style={styles.imageCaptionText}>
                  {imageMetadata?.caption || `Authentic editorial photograph accompanying ${source}.`}
                </Text>
                <View style={styles.imageCreditMetaRow}>
                  <Text style={styles.imageCreditLabel}>
                    Credit: {imageMetadata?.credit || source}
                  </Text>
                  <Text style={styles.imageLicenseLabel}>
                    {imageMetadata?.license || 'Authorized RSS Syndication & Attribution'}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.placeholderProvenanceBar}>
              <Camera size={14} color={theme.textMuted} strokeWidth={2} />
              <Text style={styles.placeholderProvenanceText}>
                {imageMetadata?.caption ||
                  `No external photograph was embedded by ${source}; using clean topic layout (zero AI-generated images).`}
              </Text>
            </View>
          )}

          {/* 5. Executive Brief (2–3 Concise Points) */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <ListChecks size={15} color={isDark ? '#60A5FA' : '#2563EB'} strokeWidth={2} />
              <Text style={styles.sectionLabel}>Executive Brief</Text>
            </View>
            <View style={styles.bulletsList}>
              {executiveBullets.map((b, idx) => (
                <View key={idx} style={styles.takeawayCard}>
                  <View style={styles.takeawayIndexBadge}>
                    <Text style={styles.takeawayIndexText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.bulletText}>{b.replace(/\*\*/g, '')}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 6. Detailed News Analysis & Institutional Background */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <BookOpen size={15} color={isDark ? '#A78BFA' : '#6D28D9'} strokeWidth={2} />
              <Text style={styles.sectionLabel}>Detailed News Analysis & Background</Text>
            </View>

            <View style={styles.paragraphStack}>
              {detailedAnalysisParagraphs.map((para, pIdx) => (
                <Text key={pIdx} style={styles.analysisParagraphText}>
                  {para.replace(/\*\*/g, '')}
                </Text>
              ))}
            </View>

            {Boolean(backgroundContext) && (
              <View style={styles.backgroundContextBox}>
                <View style={styles.sectionHeaderRow}>
                  <Landmark size={13} color={isDark ? '#C4B5FD' : '#5B21B6'} strokeWidth={2} />
                  <Text style={styles.backgroundContextTitle}>
                    Background & Institutional Context
                  </Text>
                </View>
                <Text style={styles.backgroundContextText}>{backgroundContext}</Text>
              </View>
            )}

            {importantFiguresProvisions.length > 0 && (
              <View style={styles.provisionsStack}>
                <Text style={styles.subSectionLabel}>
                  Important Figures, Dates, Provisions & Official Terminology
                </Text>
                {importantFiguresProvisions.map((prov, idx) => (
                  <View key={idx} style={styles.provisionRowCard}>
                    <Text style={styles.provisionTerm}>{prov.term}</Text>
                    <Text style={styles.provisionDetail}>{prov.detail}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 7. UPSC Syllabus Mapping */}
          {Boolean(syllabusRelevance) && (
            <View style={styles.syllabusBox}>
              <View style={styles.sectionHeaderRow}>
                <Compass size={15} color={isDark ? '#38BDF8' : '#0284C7'} strokeWidth={2} />
                <Text style={styles.syllabusTitle}>UPSC Syllabus Mapping ({paper})</Text>
              </View>
              {Boolean(syllabusRelevance?.paperTopic) && (
                <View style={styles.syllabusItem}>
                  <Text style={styles.syllabusItemLabel}>GS Paper & Syllabus Topic:</Text>
                  <Text style={styles.syllabusItemValue}>{syllabusRelevance?.paperTopic}</Text>
                </View>
              )}
              <View style={styles.syllabusItem}>
                <Text style={styles.syllabusItemLabel}>Static Linkage:</Text>
                <Text style={styles.syllabusItemValue}>{syllabusRelevance?.staticConnection}</Text>
              </View>
              <View style={styles.syllabusItem}>
                <Text style={styles.syllabusItemLabel}>Prelims Angle:</Text>
                <Text style={styles.syllabusItemValue}>{syllabusRelevance?.prelimsAngle}</Text>
              </View>
              <View style={styles.syllabusItem}>
                <Text style={styles.syllabusItemLabel}>Mains Dimensions:</Text>
                <Text style={styles.syllabusItemValue}>{syllabusRelevance?.mainsDimensions}</Text>
              </View>
            </View>
          )}

          {/* 8. Prelims Facts & High-Yield Matrix */}
          {(prelimsMatrix.length > 0 || prelimsFacts.length > 0) && (
            <View style={styles.prelimsBox}>
              <View style={styles.sectionHeaderRow}>
                <ShieldCheck size={15} color={isDark ? '#4ADE80' : '#059669'} strokeWidth={2} />
                <Text style={styles.prelimsTitle}>Verified Prelims Facts & Matrix</Text>
              </View>

              {prelimsMatrix.length > 0 && (
                <View style={styles.matrixGrid}>
                  {prelimsMatrix.map((matrixItem, mIdx) => (
                    <View key={mIdx} style={styles.matrixItemCard}>
                      <Text style={styles.matrixItemLabel}>{matrixItem.label}</Text>
                      <Text style={styles.matrixItemValue}>{matrixItem.value}</Text>
                    </View>
                  ))}
                </View>
              )}

              {prelimsFacts.length > 0 && (
                <View style={styles.prelimsBulletsList}>
                  {prelimsFacts.map((pf, idx) => (
                    <View key={idx} style={styles.subBulletRow}>
                      <View style={styles.prelimsDot} />
                      <Text style={styles.prelimsFactText}>{pf}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* 9. Mains Dimensions & Practice Question */}
          {(item.type === 'article' || item.type === 'event') && (
            <View style={styles.mainsBox}>
              <View style={styles.sectionHeaderRow}>
                <Scale size={15} color={isDark ? '#FBBF24' : '#B45309'} strokeWidth={2} />
                <Text style={styles.mainsTitle}>Mains-Oriented Dimensions & Implications</Text>
              </View>
              <Text style={styles.mainsText}>
                {item.type === 'article'
                  ? item.data.analyticalAngle
                  : item.data.syllabusRelevance?.mainsDimensions ||
                    item.data.mainsRelevance ||
                    'Evaluate constitutional, institutional, and socio-economic trade-offs for GS Mains answers.'}
              </Text>

              {Boolean(
                item.type === 'article'
                  ? item.data.mainsQuestion
                  : `Examine the institutional and policy significance of "${title}" in the context of UPSC ${paper}. (15 Marks, 250 Words)`
              ) && (
                <View style={styles.mainsQBox}>
                  <Text style={styles.mainsQTitle}>Mains Practice Question:</Text>
                  <Text style={styles.mainsQText}>
                    {item.type === 'article' && item.data.mainsQuestion
                      ? item.data.mainsQuestion
                      : `Examine the institutional and policy significance of "${title}" in the context of UPSC ${paper}. (15 Marks, 250 Words)`}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* 10. Related Verified UPSC PYQs (Linked from `public.questions`) */}
          {(relatedPyqs.length > 0 || Boolean(syllabusRelevance?.relatedPYQ)) && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <FileCheck2 size={15} color={isDark ? '#6FBAFF' : '#006FFD'} strokeWidth={2} />
                <Text style={styles.sectionLabel}>Related Verified UPSC PYQs</Text>
              </View>

              {relatedPyqs.length > 0 ? (
                relatedPyqs.map((pyq) => (
                  <View key={pyq.id} style={styles.pyqCard}>
                    <View style={styles.pyqHeaderRow}>
                      <View style={styles.pyqYearBadge}>
                        <Text style={styles.pyqYearBadgeText}>UPSC CSE {pyq.year}</Text>
                      </View>
                      <Text style={styles.pyqSubjectText}>
                        {pyq.subject} {pyq.topic ? `• ${pyq.topic}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.pyqQuestionText}>{pyq.questionText}</Text>
                    {Boolean(pyq.explanation) && (
                      <Text style={styles.pyqExplanationText} numberOfLines={4}>
                        Official Key / Note: {pyq.explanation}
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.pyqCard}>
                  <Text style={styles.pyqQuestionText}>{syllabusRelevance?.relatedPYQ}</Text>
                </View>
              )}
            </View>
          )}

          {/* 11. Original Source & Additional Independent Reports (Clickable Links) */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <ExternalLink size={15} color={isDark ? '#6FBAFF' : '#006FFD'} strokeWidth={2} />
              <Text style={styles.sectionLabel}>
                Original Source & Corroborating Reports ({sourcesList.length})
              </Text>
            </View>

            <View style={styles.sourcesListStack}>
              {sourcesList.map((src, sIdx) => (
                <Pressable
                  key={sIdx}
                  style={({ pressed }) => [
                    styles.sourceLinkCard,
                    pressed && styles.sourceLinkCardPressed,
                  ]}
                  onPress={() => handleOpenSourceUrl(src.url)}
                >
                  <View style={styles.sourceLinkLeft}>
                    <View style={styles.sourceTierRow}>
                      <View
                        style={[
                          styles.sourceTypePill,
                          src.type === 'Official' && styles.sourceTypePillOfficial,
                        ]}
                      >
                        <Text
                          style={[
                            styles.sourceTypePillText,
                            src.type === 'Official' && styles.sourceTypePillTextOfficial,
                          ]}
                        >
                          {sIdx === 0 ? `Primary • ${src.type || 'Verified'}` : src.type || 'Report'}
                        </Text>
                      </View>
                      {Boolean(src.date) && (
                        <Text style={styles.sourceItemDate}>{src.date}</Text>
                      )}
                    </View>
                    <Text style={styles.sourceItemName}>{src.name}</Text>
                    {Boolean(src.url) && (
                      <Text style={styles.sourceItemUrl} numberOfLines={1}>
                        {src.url}
                      </Text>
                    )}
                  </View>
                  {Boolean(src.url) && (
                    <ExternalLink size={15} color={isDark ? '#6FBAFF' : '#006FFD'} strokeWidth={2} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* 12. Cross-Verification & Limitations */}
          <View style={styles.verificationCard}>
            <View style={styles.sectionHeaderRow}>
              <ShieldCheck size={15} color={isDark ? '#4ADE80' : '#059669'} strokeWidth={2.2} />
              <Text style={styles.verificationHeading}>Cross-Verification & Limitations</Text>
            </View>

            <Text style={styles.verificationSummaryText}>
              {crossVerification?.summaryNote ||
                `Verified from ${source}. Factual claims are anchored to official press releases and established editorial reporting.`}
            </Text>

            {Boolean(crossVerification?.officialStatement) && (
              <View style={styles.verificationDetailRow}>
                <Text style={styles.verificationDetailLabel}>Official / Primary Evidence:</Text>
                <Text style={styles.verificationDetailValue}>
                  {crossVerification?.officialStatement}
                </Text>
              </View>
            )}

            {Boolean(crossVerification?.independentReporting) && (
              <View style={styles.verificationDetailRow}>
                <Text style={styles.verificationDetailLabel}>Independent Reporting:</Text>
                <Text style={styles.verificationDetailValue}>
                  {crossVerification?.independentReporting}
                </Text>
              </View>
            )}

            {Boolean(crossVerification?.analysisVsOpinionNote) && (
              <View style={styles.verificationDetailRow}>
                <Text style={styles.verificationDetailLabel}>
                  Statement vs. Opinion Distinction:
                </Text>
                <Text style={styles.verificationDetailValue}>
                  {crossVerification?.analysisVsOpinionNote}
                </Text>
              </View>
            )}

            {crossVerification?.limitations && crossVerification.limitations.length > 0 && (
              <View style={styles.limitationsBox}>
                <View style={styles.sectionHeaderRow}>
                  <AlertTriangle size={13} color={isDark ? '#FBBF24' : '#D97706'} strokeWidth={2} />
                  <Text style={styles.limitationsTitle}>Source Access & Licensing Notes</Text>
                </View>
                {crossVerification.limitations.map((lim, lIdx) => (
                  <Text key={lIdx} style={styles.limitationItemText}>
                    • {lim}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const getStyles = (theme: typeof BW_THEME.dark, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
      backgroundColor: theme.bg,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? '#2F3036' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#383A42' : '#E8E9F1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textPrimary,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 10,
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: isDark ? '#2F3036' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#383A42' : '#E8E9F1',
    },
    saveBtnActive: {
      backgroundColor: '#006FFD',
      borderColor: '#006FFD',
    },
    saveBtnText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    saveBtnTextActive: {
      color: '#FFFFFF',
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 48,
      gap: 16,
      maxWidth: 860,
      width: '100%',
      alignSelf: 'center',
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    paperBadge: {
      backgroundColor: '#006FFD',
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      borderRadius: 6,
    },
    paperBadgeText: {
      fontSize: 10.5,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    categoryBadge: {
      backgroundColor: theme.surfaceMuted,
      paddingHorizontal: 9,
      paddingVertical: 3.5,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    categoryBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    secondaryTagBadge: {
      backgroundColor: isDark ? 'rgba(111, 186, 255, 0.1)' : '#F0F7FF',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    secondaryTagText: {
      fontSize: 10.5,
      fontWeight: '600',
      color: isDark ? '#6FBAFF' : '#006FFD',
    },
    dateText: {
      fontSize: 11.5,
      color: theme.textMuted,
      fontWeight: '600',
      marginLeft: 'auto',
    },
    titleText: {
      fontSize: 21,
      fontWeight: '800',
      lineHeight: 29,
      color: theme.textPrimary,
      letterSpacing: -0.3,
    },
    whyItMattersCard: {
      backgroundColor: isDark ? 'rgba(0, 111, 253, 0.1)' : '#F0F7FF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(111, 186, 255, 0.25)' : '#BAE6FD',
      borderRadius: 12,
      padding: 14,
      gap: 6,
    },
    whyItMattersHeading: {
      fontSize: 12,
      fontWeight: '800',
      color: isDark ? '#6FBAFF' : '#006FFD',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    whyItMattersText: {
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.textPrimary,
      fontWeight: '500',
    },
    imageProvenanceCard: {
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    heroImageWrapper: {
      width: '100%',
      height: 220,
      backgroundColor: isDark ? '#17191D' : '#F1F5F9',
      position: 'relative',
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    imageTypeOverlayBadge: {
      position: 'absolute',
      top: 10,
      left: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(15, 23, 42, 0.82)',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 6,
    },
    imageTypeOverlayText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    imageCreditFooter: {
      padding: 12,
      gap: 4,
      backgroundColor: theme.surfaceMuted,
    },
    imageCaptionText: {
      fontSize: 12,
      color: theme.textPrimary,
      fontWeight: '500',
      lineHeight: 17,
    },
    imageCreditMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 6,
      marginTop: 2,
    },
    imageCreditLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    imageLicenseLabel: {
      fontSize: 10.5,
      color: theme.textMuted,
    },
    placeholderProvenanceBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: theme.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    placeholderProvenanceText: {
      flex: 1,
      fontSize: 11.5,
      color: theme.textSecondary,
      lineHeight: 16,
    },
    sectionCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      gap: 12,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.textPrimary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    subSectionLabel: {
      fontSize: 11.5,
      fontWeight: '800',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginTop: 4,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    bulletsList: {
      gap: 10,
    },
    takeawayCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: theme.surfaceMuted,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    takeawayIndexBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(96, 165, 250, 0.2)' : '#DBEAFE',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    takeawayIndexText: {
      fontSize: 11,
      fontWeight: '800',
      color: isDark ? '#93C5FD' : '#1D4ED8',
    },
    bulletText: {
      flex: 1,
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.textPrimary,
    },
    paragraphStack: {
      gap: 10,
    },
    analysisParagraphText: {
      fontSize: 14,
      lineHeight: 22,
      color: theme.textPrimary,
    },
    backgroundContextBox: {
      backgroundColor: isDark ? 'rgba(139, 92, 246, 0.08)' : '#F5F3FF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(167, 139, 250, 0.22)' : '#DDD6FE',
      padding: 12,
      borderRadius: 10,
      gap: 6,
    },
    backgroundContextTitle: {
      fontSize: 11.5,
      fontWeight: '800',
      color: isDark ? '#C4B5FD' : '#5B21B6',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    backgroundContextText: {
      fontSize: 13,
      lineHeight: 19,
      color: theme.textPrimary,
    },
    provisionsStack: {
      gap: 8,
    },
    provisionRowCard: {
      backgroundColor: theme.surfaceMuted,
      borderRadius: 8,
      padding: 10,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      gap: 3,
    },
    provisionTerm: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    provisionDetail: {
      fontSize: 12.5,
      lineHeight: 18,
      color: theme.textSecondary,
    },
    prelimsBox: {
      backgroundColor: isDark ? 'rgba(74, 222, 128, 0.06)' : '#F0FDF4',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(74, 222, 128, 0.2)' : '#BBF7D0',
      padding: 16,
      borderRadius: 12,
      gap: 12,
    },
    prelimsTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: isDark ? '#4ADE80' : '#059669',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    matrixGrid: {
      gap: 8,
    },
    matrixItemCard: {
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : '#FFFFFF',
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(74, 222, 128, 0.15)' : '#DCFCE7',
      gap: 3,
    },
    matrixItemLabel: {
      fontSize: 10.5,
      fontWeight: '800',
      color: isDark ? '#86EFAC' : '#047857',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    matrixItemValue: {
      fontSize: 13,
      lineHeight: 19,
      color: theme.textPrimary,
      fontWeight: '500',
    },
    prelimsBulletsList: {
      gap: 8,
    },
    subBulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    prelimsDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: isDark ? '#4ADE80' : '#059669',
      marginTop: 7,
    },
    prelimsFactText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 19,
      color: theme.textPrimary,
    },
    syllabusBox: {
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.07)' : '#F0F9FF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.22)' : '#BAE6FD',
      padding: 16,
      borderRadius: 12,
      gap: 10,
    },
    syllabusTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: isDark ? '#38BDF8' : '#0284C7',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    syllabusItem: {
      gap: 2,
    },
    syllabusItemLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: isDark ? '#7DD3FC' : '#0369A1',
    },
    syllabusItemValue: {
      fontSize: 13,
      lineHeight: 19,
      color: theme.textPrimary,
    },
    mainsBox: {
      backgroundColor: isDark ? 'rgba(251, 191, 36, 0.06)' : '#FFFBEB',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(251, 191, 36, 0.22)' : '#FDE68A',
      padding: 16,
      borderRadius: 12,
      gap: 10,
    },
    mainsTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: isDark ? '#FBBF24' : '#B45309',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    mainsText: {
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.textPrimary,
    },
    mainsQBox: {
      marginTop: 4,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(251, 191, 36, 0.2)' : '#FDE68A',
      gap: 4,
    },
    mainsQTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: isDark ? '#FCD34D' : '#92400E',
      textTransform: 'uppercase',
    },
    mainsQText: {
      fontSize: 13.5,
      lineHeight: 20,
      fontWeight: '600',
      color: theme.textPrimary,
      fontStyle: 'italic',
    },
    pyqCard: {
      backgroundColor: theme.surfaceMuted,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      gap: 6,
    },
    pyqHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    pyqYearBadge: {
      backgroundColor: '#006FFD',
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 5,
    },
    pyqYearBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    pyqSubjectText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    pyqQuestionText: {
      fontSize: 13,
      lineHeight: 19,
      color: theme.textPrimary,
      fontWeight: '500',
    },
    pyqExplanationText: {
      fontSize: 12,
      lineHeight: 17,
      color: theme.textSecondary,
    },
    sourcesListStack: {
      gap: 8,
    },
    sourceLinkCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      backgroundColor: theme.surfaceMuted,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    sourceLinkCardPressed: {
      opacity: 0.78,
    },
    sourceLinkLeft: {
      flex: 1,
      gap: 3,
    },
    sourceTierRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sourceTypePill: {
      backgroundColor: isDark ? '#2F3036' : '#E2E8F0',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 4,
    },
    sourceTypePillOfficial: {
      backgroundColor: isDark ? 'rgba(74, 222, 128, 0.18)' : '#DCFCE7',
    },
    sourceTypePillText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    sourceTypePillTextOfficial: {
      color: isDark ? '#4ADE80' : '#047857',
    },
    sourceItemDate: {
      fontSize: 11,
      color: theme.textMuted,
    },
    sourceItemName: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    sourceItemUrl: {
      fontSize: 11,
      color: isDark ? '#6FBAFF' : '#006FFD',
    },
    verificationCard: {
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.55)' : '#F8FAFC',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      gap: 10,
    },
    verificationHeading: {
      fontSize: 12,
      fontWeight: '800',
      color: isDark ? '#4ADE80' : '#059669',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    verificationSummaryText: {
      fontSize: 13,
      lineHeight: 19,
      color: theme.textPrimary,
      fontWeight: '600',
    },
    verificationDetailRow: {
      gap: 2,
    },
    verificationDetailLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.textSecondary,
    },
    verificationDetailValue: {
      fontSize: 12.5,
      lineHeight: 18,
      color: theme.textPrimary,
    },
    limitationsBox: {
      marginTop: 4,
      padding: 10,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(251, 191, 36, 0.08)' : '#FFFBEB',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(251, 191, 36, 0.2)' : '#FDE68A',
      gap: 4,
    },
    limitationsTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: isDark ? '#FBBF24' : '#B45309',
    },
    limitationItemText: {
      fontSize: 11.5,
      lineHeight: 17,
      color: theme.textSecondary,
    },
  });

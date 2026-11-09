import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  ArrowLeft,
  ArrowUp,
  Bookmark,
  Check,
  CheckCircle2,
  MessageSquare,
  PenTool,
  Share2,
  Upload,
  User,
} from 'lucide-react-native';
import { MainsQuestionRecord, MainsSubmissionRecord } from '@/types/mains';
import { CommunityPost } from '@/types/community';
import { CommunityService } from '@/services/communityService';

export interface MainsQuestionDetailViewProps {
  question: MainsQuestionRecord;
  selectedYear: number;
  selectedPaperTitle: string;
  isDark: boolean;
  onBack: () => void;
  onStartWriting: (question: MainsQuestionRecord) => void;
  onViewEvaluation: (submission: MainsSubmissionRecord) => void;
}

interface DirectiveGuide {
  directive: string;
  definition: string;
  structure: { step: string; label: string; desc: string }[];
  tags: string[];
}

const DIRECTIVE_GUIDES: Record<string, DirectiveGuide> = {
  evaluate: {
    directive: 'Evaluate',
    definition: 'means weigh strengths and limits, then give a balanced verdict.',
    structure: [
      { step: '1.', label: 'Introduction', desc: 'Context & constitutional or strategic anchor (~30 words)' },
      { step: '2.', label: 'Opportunities', desc: 'Core drivers, institutional strengths, & positive outcomes' },
      { step: '3.', label: 'Limits & Bottlenecks', desc: 'Critical challenges, vulnerabilities, & implementation deficits' },
      { step: '4.', label: 'Way Forward', desc: 'Policy reforms, best practices, & actionable interventions' },
      { step: '5.', label: 'Conclusion', desc: 'Forward-looking synthesis (~25 words)' },
    ],
    tags: ['ASEAN centrality', 'Kaladan Project', 'RCEP', 'Indo-Pacific', 'Strategic Autonomy'],
  },
  examine: {
    directive: 'Examine',
    definition: 'means probe deeply into the issue, inspect facts, and identify core causes.',
    structure: [
      { step: '1.', label: 'Introduction', desc: 'Define key concept or relevant statutory/constitutional article' },
      { step: '2.', label: 'Factual Scrutiny', desc: 'Core dynamics, data points, & factual landscape' },
      { step: '3.', label: 'Underlying Factors', desc: 'Root causes, institutional hurdles, & structural friction' },
      { step: '4.', label: 'Remedial Roadmap', desc: 'Institutional safeguards & legislative reforms' },
      { step: '5.', label: 'Conclusion', desc: 'Reiterate balance between governance and accountability' },
    ],
    tags: ['Legislative Oversight', 'Article 21', 'Federal Primacy', 'Rule of Law', 'Judicial Review'],
  },
  discuss: {
    directive: 'Discuss',
    definition: 'means examine multiple dimensions, weigh competing perspectives, and conclude logically.',
    structure: [
      { step: '1.', label: 'Introduction', desc: 'Define institutional scope and recent context' },
      { step: '2.', label: 'Key Arguments For', desc: 'Constitutional justifications and operational necessity' },
      { step: '3.', label: 'Key Arguments Against', desc: 'Distortions, ethical risks, and misuse precedents' },
      { step: '4.', label: 'Safeguards', desc: 'SC judgments, committee recommendations (Sarkaria/Punchhi)' },
      { step: '5.', label: 'Conclusion', desc: 'Balanced summary anchored in constitutional morality' },
    ],
    tags: ['Discretionary Powers', 'Governor Role', 'Federalism', 'S.R. Bommai', 'Electoral Integrity'],
  },
  'critically analyse': {
    directive: 'Critically analyse',
    definition: 'means dissect strengths, critique operational flaws, and substantiate with evidence.',
    structure: [
      { step: '1.', label: 'Introduction', desc: 'Socio-political context or enactment objectives' },
      { step: '2.', label: 'Achievements', desc: 'Democratic empowerment, transparency, & audit gains' },
      { step: '3.', label: 'Critical Flaws', desc: 'Section 4 deficit, vacancies, appeals backlog, & dilution' },
      { step: '4.', label: 'Structural Reforms', desc: 'Autonomous selection, digital disclosure, & penalty enforcement' },
      { step: '5.', label: 'Conclusion', desc: 'Citizen-centric participatory democracy' },
    ],
    tags: ['RTI Act 2005', 'Transparency', 'Section 4 Disclosures', 'Whistleblower Protection', 'Good Governance'],
  },
  comment: {
    directive: 'Comment',
    definition: 'means offer informed opinion, evaluate key arguments, and assert balanced reasoning.',
    structure: [
      { step: '1.', label: 'Introduction', desc: 'Unpack the prompt statement and ground reality' },
      { step: '2.', label: 'Substantiating Arguments', desc: 'Ground realities, statistics, & committee findings' },
      { step: '3.', label: 'Counter-Perspectives', desc: 'Exceptions, progress indicators, & structural shifts' },
      { step: '4.', label: 'Path to Resolution', desc: 'Capacity building, systemic decentralization, & capacity building' },
      { step: '5.', label: 'Conclusion', desc: 'Substantive equality over procedural presence' },
    ],
    tags: ['Gender Empowerment', '73rd/74th Amendment', 'Sarpanch Pati Phenomenon', 'Grassroots Democracy'],
  },
};

export function MainsQuestionDetailView({
  question,
  selectedYear,
  selectedPaperTitle,
  isDark,
  onBack,
  onStartWriting,
}: MainsQuestionDetailViewProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  // Colors
  const accent = '#FF9500';
  const bg = isDark ? '#0B1018' : '#FAF9F6';
  const cardBg = isDark ? '#141C28' : '#FFFFFF';
  const cardBorder = isDark ? '#232D3F' : '#E8E3DA';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const textMuted = isDark ? '#64748B' : '#94A3B8';
  const subtleBg = isDark ? '#1A2230' : '#F8FAFC';

  // State
  const [activeTab, setActiveTab] = useState<'top' | 'newest' | 'mentor' | 'following'>('top');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [quickAnswerText, setQuickAnswerText] = useState('');
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [upvotesMap, setUpvotesMap] = useState<Record<string, number>>({});
  const [upvotedByUser, setUpvotedByUser] = useState<Record<string, boolean>>({});
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);

  // Directive Detection & Highlighting
  const { directiveWord, remainingText, directiveGuide } = useMemo(() => {
    const raw = question.text_english.trim();
    const cleanLower = raw.toLowerCase();

    // Check multi-word directives first
    const candidates = [
      'critically analyse',
      'critically analyze',
      'critically evaluate',
      'critically examine',
      'examine',
      'discuss',
      'comment',
      'evaluate',
      'elucidate',
      'analyze',
      'analyse',
      'explain',
      'illustrate',
    ];

    for (const cand of candidates) {
      if (cleanLower.startsWith(cand)) {
        const word = raw.slice(0, cand.length);
        const rest = raw.slice(cand.length);
        const guide = DIRECTIVE_GUIDES[cand] || DIRECTIVE_GUIDES.evaluate;
        return { directiveWord: word, remainingText: rest, directiveGuide: guide };
      }
    }

    // Default fallback
    const firstWordMatch = raw.match(/^([A-Za-z]+)\b/);
    if (firstWordMatch) {
      const first = firstWordMatch[1];
      const guideKey = first.toLowerCase();
      const guide = DIRECTIVE_GUIDES[guideKey] || DIRECTIVE_GUIDES.evaluate;
      return {
        directiveWord: first,
        remainingText: raw.slice(first.length),
        directiveGuide: guide,
      };
    }

    return {
      directiveWord: 'Question',
      remainingText: ` ${raw}`,
      directiveGuide: DIRECTIVE_GUIDES.evaluate,
    };
  }, [question.text_english]);

  // Load Community Posts & Submissions
  useEffect(() => {
    let active = true;
    CommunityService.getPostsForQuestion(question.id, question.paper_id, question.text_english)
      .then((posts) => {
        if (active) {
          setCommunityPosts(posts);
        }
      })
      .catch((e) => console.warn('Fetch question community posts warning:', e));

    return () => {
      active = false;
    };
  }, [question.id, question.paper_id, question.text_english]);

  // Word count in quick box
  const quickWordCount = useMemo(() => {
    const trimmed = quickAnswerText.trim();
    return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
  }, [quickAnswerText]);

  // Toggle upvote
  const handleToggleUpvote = (id: string, initialCount: number) => {
    setUpvotedByUser((prev) => {
      const isUpvoted = !!prev[id];
      const currentCount = upvotesMap[id] ?? initialCount;
      setUpvotesMap((cMap) => ({
        ...cMap,
        [id]: isUpvoted ? currentCount - 1 : currentCount + 1,
      }));
      return { ...prev, [id]: !isUpvoted };
    });
  };

  const handlePostQuickAnswer = () => {
    if (quickWordCount < 10) {
      Alert.alert('Answer too short', 'Please write at least 10 words before posting.');
      return;
    }
    Alert.alert(
      'Answer Posted 🎉',
      postAnonymously
        ? 'Your answer was shared anonymously with the UPSC community.'
        : 'Your answer is now live! Community aspirants & mentors can review it.'
    );
    setQuickAnswerText('');
  };

  const handleRequestReview = () => {
    Alert.alert(
      'Mentor Evaluation Request',
      'Your request for scored evaluation has been queued. A senior evaluator will review your structured answer with line-by-line comments.'
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {/* Top Breadcrumb Navigation */}
      <View style={[styles.topBreadcrumbRow, { borderBottomColor: cardBorder, backgroundColor: cardBg }]}>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onBack}
          style={styles.breadcrumbBackBtn}>
          <ArrowLeft size={16} color={accent} strokeWidth={2.4} />
          <Text style={[styles.breadcrumbText, { color: accent }]}>
            Back to {selectedYear} · {selectedPaperTitle}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrap}>
          {/* ================================================================= */}
          {/* 1. QUESTION HERO CARD (MATCHING IMAGE 2)                         */}
          {/* ================================================================= */}
          <View style={[styles.questionHeroCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {/* Meta Line */}
            <View style={styles.heroMetaRow}>
              <View style={[styles.qBadge, { backgroundColor: `${accent}15` }]}>
                <Text style={[styles.qBadgeText, { color: accent }]}>
                  Q{question.question_number}
                </Text>
              </View>
              <Text style={[styles.heroSpecText, { color: textSecondary }]}>
                {question.marks} marks · {question.word_limit} words
              </Text>
              <Text style={[styles.heroDividerBullet, { color: textMuted }]}>•</Text>
              <Text style={[styles.heroTopicText, { color: textSecondary }]} numberOfLines={1}>
                {question.subject_area} · {question.topic}
              </Text>
            </View>

            {/* Prompt with Directive in Brand Orange */}
            <Text style={styles.heroPromptText}>
              <Text style={[styles.directiveHighlight, { color: accent }]}>
                {directiveWord}
              </Text>
              <Text style={{ color: textPrimary }}>{remainingText}</Text>
            </Text>

            {/* Hero Action Buttons */}
            <View style={[styles.heroActionsRow, !isDesktop && styles.heroActionsRowMobile]}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onStartWriting(question)}
                style={[styles.primaryActionBtn, !isDesktop && { flex: 1.2, justifyContent: 'center' }, { backgroundColor: accent }]}>
                <PenTool size={15} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.primaryActionBtnText}>Write your answer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setIsBookmarked((prev) => !prev)}
                style={[
                  styles.secondaryOutlineBtn,
                  !isDesktop && { flex: 1, justifyContent: 'center' },
                  { borderColor: cardBorder, backgroundColor: isDark ? '#1B2433' : '#FFFFFF' },
                  isBookmarked && { borderColor: accent, backgroundColor: `${accent}12` },
                ]}>
                <Bookmark
                  size={15}
                  color={isBookmarked ? accent : textSecondary}
                  fill={isBookmarked ? accent : 'none'}
                />
                <Text
                  style={[
                    styles.secondaryOutlineBtnText,
                    { color: isBookmarked ? accent : textSecondary },
                  ]}>
                  {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() =>
                  Alert.alert('Share Link Copied', 'Question link copied to clipboard.')
                }
                style={[
                  styles.secondaryOutlineBtn,
                  { borderColor: cardBorder, backgroundColor: isDark ? '#1B2433' : '#FFFFFF' },
                ]}>
                <Share2 size={15} color={textSecondary} />
                <Text style={[styles.secondaryOutlineBtnText, { color: textSecondary }]}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ================================================================= */}
          {/* 2-COLUMN MAIN CONTENT (LEFT: ANSWERS, RIGHT: SIDEBAR)            */}
          {/* ================================================================= */}
          <View style={[styles.twoColRow, !isDesktop && styles.twoColRowMobile]}>
            {/* --------------------------------------------------------------- */}
            {/* LEFT COLUMN: QUICK ANSWER BOX + COMMUNITY ANSWERS FEED           */}
            {/* --------------------------------------------------------------- */}
            <View style={[styles.leftCol, !isDesktop && styles.leftColMobile]}>
              {/* Quick Answer Input Box */}
              <View
                style={[
                  styles.quickAnswerBox,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}>
                <View style={styles.quickAnswerInputHeader}>
                  <View style={[styles.avatarCircle, { backgroundColor: `${accent}20` }]}>
                    <Text style={[styles.avatarText, { color: accent }]}>AK</Text>
                  </View>
                  <TextInput
                    multiline
                    value={quickAnswerText}
                    onChangeText={setQuickAnswerText}
                    placeholder={`Write your answer in about ${question.word_limit} words. Get feedback from the community and mentors.`}
                    placeholderTextColor={textMuted}
                    style={[
                      styles.quickTextInput,
                      { color: textPrimary },
                      Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
                    ]}
                  />
                </View>

                {/* Footer Controls */}
                <View style={[styles.quickAnswerFooter, !isDesktop && styles.quickAnswerFooterMobile, { borderTopColor: cardBorder }]}>
                  <View style={[styles.quickFooterLeft, !isDesktop && styles.quickFooterLeftMobile]}>
                    <Text
                      style={[
                        styles.quickWordCountText,
                        { color: quickWordCount > question.word_limit ? '#EF4444' : textSecondary },
                      ]}>
                      {quickWordCount} / {question.word_limit} words
                    </Text>

                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => setPostAnonymously((prev) => !prev)}
                      style={styles.anonToggleRow}>
                      <View
                        style={[
                          styles.checkboxBox,
                          { borderColor: postAnonymously ? accent : cardBorder },
                          postAnonymously && { backgroundColor: accent },
                        ]}>
                        {postAnonymously && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                      <Text style={[styles.anonToggleText, { color: textSecondary }]}>
                        Post anonymously
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.quickFooterRight, !isDesktop && styles.quickFooterRightMobile]}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => onStartWriting(question)}
                      style={styles.uploadLinkBtn}>
                      <Upload size={13} color={accent} />
                      <Text style={[styles.uploadLinkText, { color: accent }]}>
                        Upload handwritten copy
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handlePostQuickAnswer}
                      style={[styles.postAnswerBtn, !isDesktop && { paddingHorizontal: 16 }, { backgroundColor: accent }]}>
                      <Text style={styles.postAnswerBtnText}>Post answer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Answers Header & Sorting Tabs */}
              <View style={[styles.answersHeaderRow, !isDesktop && styles.answersHeaderRowMobile]}>
                <Text style={[styles.answersCountHeading, { color: textPrimary }]}>
                  {241 + communityPosts.length} answers
                </Text>

                <View style={[styles.tabsWrap, !isDesktop && styles.tabsWrapMobile, { backgroundColor: subtleBg, borderColor: cardBorder }]}>
                  {(
                    [
                      { key: 'top', label: 'Top' },
                      { key: 'newest', label: 'Newest' },
                      { key: 'mentor', label: 'Mentor reviewed' },
                      { key: 'following', label: 'Following' },
                    ] as const
                  ).map((t) => (
                    <TouchableOpacity
                      key={t.key}
                      activeOpacity={0.8}
                      onPress={() => setActiveTab(t.key)}
                      style={[
                        styles.tabItem,
                        !isDesktop && styles.tabItemMobile,
                        activeTab === t.key && {
                          backgroundColor: cardBg,
                          shadowColor: '#000',
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.tabItemText,
                          {
                            color: activeTab === t.key ? textPrimary : textSecondary,
                            fontWeight: activeTab === t.key ? '700' : '500',
                          },
                        ]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* ANSWER CARD 1: Mentor Reviewed Answer (Matching Image 2 Reference) */}
              <View
                style={[
                  styles.answerCard,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}>
                {/* Author Bar */}
                <View style={styles.answerAuthorRow}>
                  <View style={styles.authorLeft}>
                    <View style={[styles.authorAvatar, { backgroundColor: '#E0E7FF' }]}>
                      <Text style={[styles.authorAvatarText, { color: '#4338CA' }]}>AR</Text>
                    </View>
                    <View>
                      <Text style={[styles.authorName, { color: textPrimary }]}>Ananya R.</Text>
                      <Text style={[styles.authorMeta, { color: textMuted }]}>
                        Typed · 247 words · 2 days ago
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.mentorBadgePill, { backgroundColor: '#ECFDF5' }]}>
                    <CheckCircle2 size={13} color="#059669" strokeWidth={2.4} />
                    <Text style={styles.mentorBadgePillText}>Mentor reviewed · 7/10</Text>
                  </View>
                </View>

                {/* Formatted Answer Content */}
                <View style={styles.answerBodyContent}>
                  <Text style={[styles.answerParagraph, { color: textPrimary }]}>
                    Act East, the 2014 upgrade of the Look East Policy, treats Southeast Asia as the
                    anchor of India&apos;s Indo-Pacific vision rather than a trading periphery.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: textPrimary }]}>OPPORTUNITIES</Text>
                  <View style={styles.bulletList}>
                    <Text style={[styles.bulletItem, { color: textPrimary }]}>
                      • <Text style={{ fontWeight: '600' }}>Connectivity:</Text> Kaladan project and the India-Myanmar-Thailand trilateral highway can open the Northeast to ASEAN markets.
                    </Text>
                    <Text style={[styles.bulletItem, { color: textPrimary }]}>
                      • <Text style={{ fontWeight: '600' }}>Maritime security:</Text> shared interest in freedom of navigation and a rules-based order.
                    </Text>
                    <Text style={[styles.bulletItem, { color: textPrimary }]}>
                      • <Text style={{ fontWeight: '600' }}>Supply chains:</Text> ASEAN offers diversification beyond a single dominant manufacturing hub.
                    </Text>
                  </View>

                  <Text style={[styles.sectionHeading, { color: textPrimary }]}>LIMITS</Text>
                  <View style={styles.bulletList}>
                    <Text style={[styles.bulletItem, { color: textPrimary }]}>
                      • India&apos;s exit from RCEP in 2019 weakens its economic voice in the region.
                    </Text>
                    <Text style={[styles.bulletItem, { color: textPrimary }]}>
                      • Persistent trade imbalance and slow project delivery erode credibility.
                    </Text>
                    <Text style={[styles.bulletItem, { color: textPrimary }]}>
                      • Instability in Myanmar and China&apos;s economic weight constrain leverage.
                    </Text>
                  </View>

                  <Text style={[styles.answerParagraph, { color: textPrimary, marginTop: 10 }]}>
                    <Text style={{ fontWeight: '600' }}>Way forward:</Text> a time-bound review of the India-ASEAN trade pact, faster border-state connectivity, and deeper digital and defence ties would convert intent into influence.
                  </Text>
                </View>

                {/* Mentor Feedback Box */}
                <View style={[styles.mentorFeedbackBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                  <View style={styles.mentorFeedbackHeader}>
                    <CheckCircle2 size={14} color="#16A34A" />
                    <Text style={styles.mentorFeedbackTitle}>Mentor feedback - Policy and IR</Text>
                  </View>
                  <Text style={styles.mentorFeedbackText}>
                    Strong structure and relevant examples. Add one data point on the ASEAN trade deficit and link the conclusion back to strategic autonomy.
                  </Text>
                </View>

                {/* Answer Actions Bar */}
                <View style={[styles.answerActionsRow, { borderTopColor: cardBorder }]}>
                  <View style={styles.actionPillsLeft}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => handleToggleUpvote('card1', 86)}
                      style={[
                        styles.counterPill,
                        { borderColor: cardBorder, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                        upvotedByUser.card1 && { borderColor: accent, backgroundColor: `${accent}10` },
                      ]}>
                      <ArrowUp
                        size={14}
                        color={upvotedByUser.card1 ? accent : textSecondary}
                        strokeWidth={2.4}
                      />
                      <Text
                        style={[
                          styles.counterPillText,
                          { color: upvotedByUser.card1 ? accent : textPrimary },
                        ]}>
                        {upvotesMap.card1 ?? 86}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={[
                        styles.counterPill,
                        { borderColor: cardBorder, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                      ]}>
                      <MessageSquare size={13} color={textSecondary} />
                      <Text style={[styles.counterPillText, { color: textPrimary }]}>14</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.actionPillsRight}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => onStartWriting(question)}
                      style={[
                        styles.compareBtn,
                        { borderColor: cardBorder, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                      ]}>
                      <Text style={[styles.compareBtnText, { color: textPrimary }]}>
                        Compare with mine
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={[
                        styles.iconOnlyBtn,
                        { borderColor: cardBorder, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                      ]}>
                      <Bookmark size={14} color={textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* ANSWER CARD 2: Peer Typed Answer */}
              <View
                style={[
                  styles.answerCard,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}>
                <View style={styles.answerAuthorRow}>
                  <View style={styles.authorLeft}>
                    <View style={[styles.authorAvatar, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[styles.authorAvatarText, { color: '#B45309' }]}>RS</Text>
                    </View>
                    <View>
                      <Text style={[styles.authorName, { color: textPrimary }]}>Rohit S.</Text>
                      <Text style={[styles.authorMeta, { color: textMuted }]}>
                        Typed · 238 words · 4 days ago
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.peerBadgePill, { backgroundColor: subtleBg }]}>
                    <Text style={[styles.peerBadgePillText, { color: textSecondary }]}>Peer answer</Text>
                  </View>
                </View>

                <View style={styles.answerBodyContent}>
                  <Text style={[styles.answerParagraph, { color: textPrimary }]}>
                    India&apos;s Act East policy is best understood as a geo-economic and strategic recalibration. Its opportunities lie in connectivity corridors, defence diplomacy and participation in regional institutions, while its limits stem from uneven implementation, a widening trade gap and ASEAN&apos;s reluctance to get caught between rival great powers...
                  </Text>
                  <Text style={[styles.readFullLink, { color: accent }]}>Read full answer</Text>
                </View>

                <View style={[styles.answerActionsRow, { borderTopColor: cardBorder }]}>
                  <View style={styles.actionPillsLeft}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => handleToggleUpvote('card2', 52)}
                      style={[
                        styles.counterPill,
                        { borderColor: cardBorder, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                        upvotedByUser.card2 && { borderColor: accent, backgroundColor: `${accent}10` },
                      ]}>
                      <ArrowUp
                        size={14}
                        color={upvotedByUser.card2 ? accent : textSecondary}
                        strokeWidth={2.4}
                      />
                      <Text
                        style={[
                          styles.counterPillText,
                          { color: upvotedByUser.card2 ? accent : textPrimary },
                        ]}>
                        {upvotesMap.card2 ?? 52}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={[
                        styles.counterPill,
                        { borderColor: cardBorder, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                      ]}>
                      <MessageSquare size={13} color={textSecondary} />
                      <Text style={[styles.counterPillText, { color: textPrimary }]}>6</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.actionPillsRight}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => onStartWriting(question)}
                      style={[
                        styles.compareBtn,
                        { borderColor: cardBorder, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                      ]}>
                      <Text style={[styles.compareBtnText, { color: textPrimary }]}>
                        Compare with mine
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* ANSWER CARD 3: Handwritten 2-Page Copy */}
              <View
                style={[
                  styles.answerCard,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}>
                <View style={styles.answerAuthorRow}>
                  <View style={styles.authorLeft}>
                    <View style={[styles.authorAvatar, { backgroundColor: '#F1F5F9' }]}>
                      <User size={15} color="#475569" />
                    </View>
                    <View>
                      <Text style={[styles.authorName, { color: textPrimary }]}>Anonymous aspirant</Text>
                      <Text style={[styles.authorMeta, { color: textMuted }]}>
                        Handwritten · 2 pages · 5 days ago
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.peerBadgePill, { backgroundColor: subtleBg }]}>
                    <Text style={[styles.peerBadgePillText, { color: textSecondary }]}>Peer answer</Text>
                  </View>
                </View>

                {/* 2-Column Handwritten Mock Page Sketches */}
                <View style={styles.handwrittenThumbnailsRow}>
                  <View style={[styles.paperThumbnail, { borderColor: cardBorder, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                    <View style={styles.paperMockHeader} />
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <View key={i} style={[styles.paperMockLine, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />
                    ))}
                  </View>
                  <View style={[styles.paperThumbnail, { borderColor: cardBorder, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                    <View style={styles.paperMockHeader} />
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <View key={i} style={[styles.paperMockLine, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />
                    ))}
                  </View>
                </View>

                <View style={[styles.answerActionsRow, { borderTopColor: cardBorder }]}>
                  <View style={styles.actionPillsLeft}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => handleToggleUpvote('card3', 31)}
                      style={[
                        styles.counterPill,
                        { borderColor: cardBorder, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                        upvotedByUser.card3 && { borderColor: accent, backgroundColor: `${accent}10` },
                      ]}>
                      <ArrowUp
                        size={14}
                        color={upvotedByUser.card3 ? accent : textSecondary}
                        strokeWidth={2.4}
                      />
                      <Text
                        style={[
                          styles.counterPillText,
                          { color: upvotedByUser.card3 ? accent : textPrimary },
                        ]}>
                        {upvotesMap.card3 ?? 31}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={[
                        styles.counterPill,
                        { borderColor: cardBorder, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                      ]}>
                      <MessageSquare size={13} color={textSecondary} />
                      <Text style={[styles.counterPillText, { color: textPrimary }]}>3</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.actionPillsRight}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => onStartWriting(question)}
                      style={[
                        styles.compareBtn,
                        { borderColor: cardBorder, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                      ]}>
                      <Text style={[styles.compareBtnText, { color: textPrimary }]}>
                        Compare with mine
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Show More Answers Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.showMoreAnswersBtn, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                <Text style={[styles.showMoreAnswersBtnText, { color: textPrimary }]}>
                  Show more answers
                </Text>
              </TouchableOpacity>
            </View>

            {/* --------------------------------------------------------------- */}
            {/* RIGHT COLUMN: ANSWER GUIDE & COMMUNITY SIDEBAR                   */}
            {/* --------------------------------------------------------------- */}
            <View style={[styles.rightCol, !isDesktop && styles.rightColMobile]}>
              {/* Card 1: ANSWER GUIDE */}
              <View style={[styles.sidebarCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.sidebarCardHeaderTitle, { color: textMuted }]}>
                  ANSWER GUIDE
                </Text>

                <Text style={[styles.directiveGuideHeading, { color: textPrimary }]}>
                  <Text style={{ color: accent, fontWeight: '700' }}>{directiveGuide.directive} </Text>
                  {directiveGuide.definition}
                </Text>

                <View style={styles.structureList}>
                  {directiveGuide.structure.map((item, idx) => (
                    <View key={idx} style={styles.structureRow}>
                      <Text style={[styles.stepNum, { color: textMuted }]}>{item.step}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.stepLabel, { color: textPrimary }]}>
                          {item.label}
                        </Text>
                        <Text style={[styles.stepDesc, { color: textSecondary }]}>
                          {item.desc}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Concept / Syllabus Tags */}
                <View style={styles.tagsCloud}>
                  {directiveGuide.tags.map((tag) => (
                    <View
                      key={tag}
                      style={[
                        styles.conceptTagPill,
                        { backgroundColor: subtleBg, borderColor: cardBorder },
                      ]}>
                      <Text style={[styles.conceptTagText, { color: accent }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Card 2: COMMUNITY STATS */}
              <View style={[styles.sidebarCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.sidebarCardHeaderTitle, { color: textMuted }]}>
                  COMMUNITY
                </Text>

                <View style={styles.communityStatsRow}>
                  <View style={styles.communityStatCol}>
                    <Text style={[styles.communityStatNumber, { color: textPrimary }]}>241</Text>
                    <Text style={[styles.communityStatLabel, { color: textSecondary }]}>
                      answers
                    </Text>
                  </View>

                  <View style={[styles.communityStatDivider, { backgroundColor: cardBorder }]} />

                  <View style={styles.communityStatCol}>
                    <Text style={[styles.communityStatNumber, { color: textPrimary }]}>15</Text>
                    <Text style={[styles.communityStatLabel, { color: textSecondary }]}>
                      mentor reviewed
                    </Text>
                  </View>
                </View>

                <View style={[styles.typicalLengthRow, { borderTopColor: cardBorder }]}>
                  <Text style={[styles.typicalLengthLabel, { color: textSecondary }]}>
                    Typical length
                  </Text>
                  <Text style={[styles.typicalLengthValue, { color: textPrimary }]}>
                    238 words
                  </Text>
                </View>
              </View>

              {/* Card 3: WANT A MENTOR TO REVIEW YOURS? */}
              <View style={[styles.sidebarCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.mentorCtaTitle, { color: textPrimary }]}>
                  Want a mentor to review yours?
                </Text>
                <Text style={[styles.mentorCtaDesc, { color: textSecondary }]}>
                  Post your answer, then request a scored review with line-by-line comments.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleRequestReview}
                  style={[styles.requestReviewBtn, { backgroundColor: accent }]}>
                  <Text style={styles.requestReviewBtnText}>Request review</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBreadcrumbRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  breadcrumbBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  breadcrumbText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  scrollBody: {
    paddingBottom: 60,
  },
  contentWrap: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },

  // 1. Question Hero Card
  questionHeroCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  qBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  heroSpecText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  heroDividerBullet: {
    fontSize: 12,
  },
  heroTopicText: {
    fontSize: 12.5,
    fontWeight: '500',
    flexShrink: 1,
  },
  heroPromptText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, serif',
      default: 'serif',
    }),
    marginBottom: 18,
  },
  directiveHighlight: {
    fontWeight: '800',
  },
  heroActionsRowMobile: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickAnswerFooterMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  },
  quickFooterLeftMobile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  quickFooterRightMobile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  answersHeaderRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 10,
  },
  tabsWrapMobile: {
    width: '100%',
    justifyContent: 'space-between',
  },
  tabItemMobile: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryOutlineBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },

  // 2-Column Grid
  twoColRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
  },
  twoColRowMobile: {
    flexDirection: 'column',
  },
  leftCol: {
    flex: 1,
    gap: 16,
  },
  leftColMobile: {
    width: '100%',
  },
  rightCol: {
    width: 330,
    gap: 16,
  },
  rightColMobile: {
    width: '100%',
  },

  // Quick Answer Box
  quickAnswerBox: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  quickAnswerInputHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickTextInput: {
    flex: 1,
    minHeight: 80,
    fontSize: 13.5,
    lineHeight: 20,
    padding: 0,
    textAlignVertical: 'top',
  },
  quickAnswerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    flexWrap: 'wrap',
    gap: 10,
  },
  quickFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  quickWordCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  anonToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkboxBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anonToggleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  quickFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  uploadLinkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  postAnswerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  postAnswerBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Answers Header
  answersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  answersCountHeading: {
    fontSize: 16,
    fontWeight: '700',
  },
  tabsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  tabItem: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  tabItemText: {
    fontSize: 12,
  },

  // Answer Cards
  answerCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  answerAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarText: {
    fontSize: 12,
    fontWeight: '700',
  },
  authorName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  authorMeta: {
    fontSize: 11.5,
  },
  mentorBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
  },
  mentorBadgePillText: {
    color: '#059669',
    fontSize: 11.5,
    fontWeight: '700',
  },
  peerBadgePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
  },
  peerBadgePillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  answerBodyContent: {
    gap: 8,
  },
  answerParagraph: {
    fontSize: 13.5,
    lineHeight: 21,
  },
  sectionHeading: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 6,
  },
  bulletList: {
    gap: 5,
  },
  bulletItem: {
    fontSize: 13,
    lineHeight: 20,
  },
  readFullLink: {
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 2,
  },

  // Mentor Feedback Box
  mentorFeedbackBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  mentorFeedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mentorFeedbackTitle: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  mentorFeedbackText: {
    color: '#166534',
    fontSize: 12.5,
    lineHeight: 18,
  },

  // Handwritten Thumbnails
  handwrittenThumbnailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 4,
  },
  paperThumbnail: {
    width: 90,
    height: 120,
    borderRadius: 6,
    borderWidth: 1,
    padding: 8,
    gap: 6,
  },
  paperMockHeader: {
    width: '40%',
    height: 4,
    backgroundColor: '#94A3B8',
    borderRadius: 2,
    marginBottom: 4,
  },
  paperMockLine: {
    width: '100%',
    height: 3,
    borderRadius: 1.5,
  },

  // Answer Actions Row
  answerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionPillsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  counterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionPillsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compareBtn: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  compareBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconOnlyBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
  },

  showMoreAnswersBtn: {
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  showMoreAnswersBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Sidebar Cards
  sidebarCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sidebarCardHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  directiveGuideHeading: {
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
  },
  structureList: {
    gap: 10,
  },
  structureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700',
    width: 14,
  },
  stepLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  stepDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  tagsCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  conceptTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  conceptTagText: {
    fontSize: 11,
    fontWeight: '600',
  },

  communityStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  communityStatCol: {
    alignItems: 'center',
  },
  communityStatNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  communityStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  communityStatDivider: {
    width: 1,
    height: 30,
  },
  typicalLengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  typicalLengthLabel: {
    fontSize: 12,
  },
  typicalLengthValue: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  mentorCtaTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  mentorCtaDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  requestReviewBtn: {
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestReviewBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
});


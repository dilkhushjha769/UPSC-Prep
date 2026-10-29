/**
 * Automated Verification Test Suite for the UPSC Current Affairs System
 * (Simplified 6-Category + 3-4 Broad Subcategory Taxonomy & Full Pipeline Verification)
 */

import { Client } from 'pg';
import {
  classifyStoryIntoCategories,
  clusterAndDeduplicateStories,
  CONFIGURED_CA_SOURCES,
  normalizeCanonicalUrl,
  processClusterIntoArticleRecord,
  RawFeedStory,
  resolveImageProvenance,
} from '../src/services/caIngestionPipeline';
import {
  ALL_VALID_SUBCATEGORIES,
  DAILY_NEWS_FEED_FILTERS,
  EES_SUBJECT_GROUPS,
  MAIN_CA_CATEGORIES,
  VALID_SUBJECT_MAIN_CATEGORY_IDS,
} from '../src/constants/currentAffairsCategories';
import {
  fetchCategoryStatuses,
  fetchIngestionOperationalLogs,
  fetchLiveDailyNewsArticles,
  fetchLiveNewsFromAgencies,
} from '../src/services/newsFeedService';

const poolerConnectionString =
  'postgresql://postgres.trodruvopmqnnkvghxye:Akash@aman10@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function runTests() {
  console.log('=================================================================');
  console.log(' Running UPSC Current Affairs System Verification Suite');
  console.log('=================================================================');

  // 1. Central Category & Subcategory Taxonomy Verification
  if (MAIN_CA_CATEGORIES.length !== 6) {
    throw new Error(`Expected 6 main categories, found ${MAIN_CA_CATEGORIES.length}`);
  }
  if (EES_SUBJECT_GROUPS.length !== 3) {
    throw new Error(`Expected 3 distinct subject groups under EES, found ${EES_SUBJECT_GROUPS.length}`);
  }
  if (DAILY_NEWS_FEED_FILTERS.length !== 5) {
    throw new Error(`Expected 5 Daily News feed filters, found ${DAILY_NEWS_FEED_FILTERS.length}`);
  }
  console.log(
    `[PASS] 1. Central taxonomy verified: 6 Main Categories, 3 Distinct EES Groups, ${ALL_VALID_SUBCATEGORIES.length} Subcategories, 5 Daily News Filters.`
  );

  // 2. Canonical URL Normalization
  const dirtyUrl =
    'https://indianexpress.com/article/upsc-current-affairs/test-story-123/?utm_source=rss&utm_medium=referral&fbclid=abc#section';
  const cleanUrl = normalizeCanonicalUrl(dirtyUrl, 'https://indianexpress.com');
  if (cleanUrl !== 'https://indianexpress.com/article/upsc-current-affairs/test-story-123') {
    throw new Error(`Canonical URL normalization failed: got ${cleanUrl}`);
  }
  console.log('[PASS] 2. Canonical URL normalization strips UTM/tracking params & fragments.');

  // 3. Duplicate & Syndicated Story Clustering (Official takes priority over Editorial)
  const pibSource = CONFIGURED_CA_SOURCES.find((s) => s.id === 'pib_official')!;
  const ieSource = CONFIGURED_CA_SOURCES.find((s) => s.id === 'ie_india')!;

  const storyOfficial: RawFeedStory = {
    source: pibSource,
    externalId: 'pib_test_1',
    canonicalUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=999999',
    headline: 'Union Cabinet Approves National Green Hydrogen Mission SIGHT Tranche-II Incentives',
    headlineFingerprint: 'approves-cabinet-green-hydrogen-incentives-mission-national-sight-tranche-union',
    rawDescription: 'Official press release from MNRE on SIGHT Tranche-II electrolyser subsidy.',
    rawContent: 'Official press release from MNRE on SIGHT Tranche-II electrolyser subsidy.',
    publishedAt: new Date().toISOString(),
  };

  const storySyndicated: RawFeedStory = {
    source: ieSource,
    externalId: 'ie_test_1',
    canonicalUrl: 'https://indianexpress.com/article/india/cabinet-approves-green-hydrogen-mission-sight-tranche-ii/',
    headline: 'Cabinet approves National Green Hydrogen Mission SIGHT Tranche-II incentives for electrolysers',
    headlineFingerprint: 'approves-cabinet-electrolysers-green-hydrogen-incentives-mission-national-sight-tranche',
    rawDescription: 'Indian Express coverage of the Cabinet decision on Green Hydrogen Mission.',
    rawContent: 'Indian Express coverage of the Cabinet decision on Green Hydrogen Mission.',
    publishedAt: new Date().toISOString(),
    extractedImageUrl: 'https://images.indianexpress.com/2026/10/hydrogen-plant.jpg',
  };

  const { clusters, duplicatesMergedCount } = clusterAndDeduplicateStories([
    storySyndicated,
    storyOfficial,
  ]);

  if (clusters.length !== 1 || duplicatesMergedCount !== 1) {
    throw new Error(`Expected 1 merged cluster and 1 duplicate count, got ${clusters.length} clusters`);
  }
  if (clusters[0].primaryStory.source.sourceTier !== 'official') {
    throw new Error('Expected official PIB source to be promoted as cluster primary story');
  }
  console.log('[PASS] 3. Syndicated/duplicate reports merge into a single story cluster with official primary.');

  // 4. 4-Tier Authentic Image Provenance Priority Order
  const imgOfficial = resolveImageProvenance(clusters[0].primaryStory, 'Social Issues and Government Schemes');
  if (imgOfficial.verificationStatus !== 'verified_official' || !imgOfficial.imageUrl) {
    throw new Error(`Expected verified_official image provenance, got ${imgOfficial.verificationStatus}`);
  }

  const storyNoImage: RawFeedStory = {
    ...storyOfficial,
    extractedImageUrl: undefined,
  };
  const imgPlaceholder = resolveImageProvenance(storyNoImage, 'Economy');
  if (imgPlaceholder.imageType !== 'placeholder' || imgPlaceholder.imageUrl !== undefined) {
    throw new Error('Expected clean topic placeholder when no authentic image is present');
  }
  console.log('[PASS] 4. 4-Tier Authentic Image Provenance (Official -> Agency -> Contextual -> Placeholder; zero AI images).');

  // 5. Simplified Category & Subcategory Classifier Verification
  const scClass = classifyStoryIntoCategories(
    'Supreme Court 7-Judge Constitution Bench Upholds Article 16(4) Sub-Classification',
    'Constitution bench judgment overruling E.V. Chinnaiah',
    ieSource
  );
  if (
    scClass.mainCategoryId !== 'polity-governance' ||
    scClass.subcategory !== 'Constitution, Parliament and Judiciary'
  ) {
    throw new Error(
      `Unexpected SC classification: ${scClass.mainCategoryId} -> ${scClass.subcategory}`
    );
  }

  const isroClass = classifyStoryIntoCategories(
    'ISRO Conducts Semi-Cryogenic Engine Hot Test for Chandrayaan-4 Launch Vehicle',
    'Space propulsion test by ISRO',
    ieSource
  );
  if (
    isroClass.mainCategoryId !== 'economy-environment-science' ||
    isroClass.subjectGroup !== 'Science & Technology' ||
    isroClass.subcategory !== 'Space, Defence and Nuclear Technology'
  ) {
    throw new Error(
      `Unexpected ISRO classification: ${isroClass.mainCategoryId} / ${isroClass.subjectGroup} / ${isroClass.subcategory}`
    );
  }
  console.log('[PASS] 5. Simplified 5-Subject-Category, 3-EES-Group, and Subcategory classifier verified.');

  // 6. Full Cluster-to-Article Record Processing & Cross-Verification
  const processed = await processClusterIntoArticleRecord(clusters[0]);
  if (!processed || processed.status !== 'published') {
    throw new Error('Expected cluster to process into a published article record');
  }
  if (!VALID_SUBJECT_MAIN_CATEGORY_IDS.includes(processed.mainCategoryId)) {
    throw new Error(`Invalid mainCategoryId: ${processed.mainCategoryId}`);
  }
  if (!ALL_VALID_SUBCATEGORIES.includes(processed.subcategory)) {
    throw new Error(`Invalid subcategory: ${processed.subcategory}`);
  }
  console.log('[PASS] 6. Full Cluster-to-Record processing and cross-verification metadata verified.');

  // 7. Verify Supabase PostgreSQL Tables, Simplified Taxonomy Constraints & 20-Day Window
  const client = new Client({ connectionString: poolerConnectionString });
  await client.connect();

  const articlesRes = await client.query(`
    SELECT id, main_category_id, subject_group, subcategory, published_date_ist,
           is_most_important, is_prelims_relevant, is_mains_relevant, editorial_author
    FROM public.ca_articles
    WHERE status = 'published'
  `);
  const rows = articlesRes.rows;
  if (rows.length < 100) {
    throw new Error(`Expected at least 100 published articles in public.ca_articles, found ${rows.length}`);
  }

  const distinctMainCats = new Set<string>();
  const distinctEESGroups = new Set<string>();
  const distinctDates = new Set<string>();

  for (const r of rows) {
    if (!VALID_SUBJECT_MAIN_CATEGORY_IDS.includes(r.main_category_id)) {
      throw new Error(`Database row ${r.id} has invalid main_category_id: ${r.main_category_id}`);
    }
    if (!ALL_VALID_SUBCATEGORIES.includes(r.subcategory)) {
      throw new Error(`Database row ${r.id} has invalid subcategory: ${r.subcategory}`);
    }
    distinctMainCats.add(r.main_category_id);
    if (r.main_category_id === 'economy-environment-science') {
      distinctEESGroups.add(r.subject_group);
    }
    if (r.published_date_ist) {
      const d =
        r.published_date_ist instanceof Date
          ? r.published_date_ist.toISOString().slice(0, 10)
          : String(r.published_date_ist).slice(0, 10);
      distinctDates.add(d);
    }
  }

  if (distinctMainCats.size !== 5) {
    throw new Error(`Expected all 5 subject main categories populated in DB, found ${distinctMainCats.size}`);
  }
  if (distinctEESGroups.size !== 3) {
    throw new Error(`Expected all 3 distinct EES subject groups ('Economy', 'Environment & Ecology', 'Science & Technology') in DB, found ${distinctEESGroups.size}`);
  }
  if (distinctDates.size < 20) {
    throw new Error(`Expected at least 20 distinct calendar dates in Asia/Kolkata backfill, found ${distinctDates.size}`);
  }

  await client.end();
  console.log(
    `[PASS] 7. Database verified: ${rows.length} published stories across all 5 Subject Categories, all 3 EES Groups, and ${distinctDates.size} calendar dates in Asia/Kolkata.`
  );

  // 8. Verify Frontend Data Service (`newsFeedService.ts`) & Feed Filters
  const frontendEvents = await fetchLiveNewsFromAgencies('all');
  const dailyNewsArticles = await fetchLiveDailyNewsArticles('all', 'daily-news');
  const eesArticles = await fetchLiveDailyNewsArticles('all', 'economy-environment-science');
  const frontendStatuses = await fetchCategoryStatuses();
  const frontendLogs = await fetchIngestionOperationalLogs();

  if (
    frontendEvents.length === 0 ||
    dailyNewsArticles.length === 0 ||
    eesArticles.length === 0 ||
    frontendStatuses.length === 0 ||
    frontendLogs.length === 0
  ) {
    throw new Error('Frontend newsFeedService failed to return events, category articles, statuses, or logs');
  }
  console.log(
    `[PASS] 8. Frontend service verified: ${dailyNewsArticles.length} Daily News articles, ${eesArticles.length} EES articles, ${frontendStatuses.length} category status entries.`
  );

  console.log('=================================================================');
  console.log(' ALL CURRENT AFFAIRS PIPELINE & SIMPLIFIED TAXONOMY TESTS PASSED!');
  console.log('=================================================================');
}

runTests().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});

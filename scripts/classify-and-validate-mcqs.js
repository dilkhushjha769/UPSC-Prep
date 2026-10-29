const fs = require('fs');
const path = require('path');

const pyqsDir = path.resolve(__dirname, '../assets/data/pyqs');
const pyqsToImportDir = path.resolve(__dirname, '../assets/data/pyqs_to_import');

// Load original topics backup so re-runs always read clean original raw_topic
const snapshotPath = path.resolve(__dirname, 'audit_original_topics_backup.json');
const originalSnapshot = fs.existsSync(snapshotPath)
  ? JSON.parse(fs.readFileSync(snapshotPath, 'utf8'))
  : null;

const SUBJECT_META = {
  history_culture: { name: 'History and Culture', paper: 'GS1', paperName: 'General Studies Paper I' },
  geography: { name: 'Geography', paper: 'GS1', paperName: 'General Studies Paper I' },
  polity_governance: { name: 'Indian Polity and Governance', paper: 'GS1', paperName: 'General Studies Paper I' },
  economy: { name: 'Economy', paper: 'GS1', paperName: 'General Studies Paper I' },
  environment_ecology: { name: 'Environment and Ecology', paper: 'GS1', paperName: 'General Studies Paper I' },
  science_technology: { name: 'Science and Technology', paper: 'GS1', paperName: 'General Studies Paper I' },
  current_affairs_misc: { name: 'Current Affairs and Miscellaneous', paper: 'GS1', paperName: 'General Studies Paper I' },
  csat_reading_comprehension: { name: 'Reading Comprehension', paper: 'CSAT', paperName: 'General Studies Paper II (CSAT)' },
  csat_reasoning: { name: 'Logical and Analytical Reasoning', paper: 'CSAT', paperName: 'General Studies Paper II (CSAT)' },
  csat_quant_numeracy: { name: 'Quantitative Aptitude and Basic Numeracy', paper: 'CSAT', paperName: 'General Studies Paper II (CSAT)' },
  csat_data_interpretation: { name: 'Data Interpretation', paper: 'CSAT', paperName: 'General Studies Paper II (CSAT)' },
};

const TOPIC_META = {
  // History and Culture
  ancient_indian_history: { subjectId: 'history_culture', name: 'Ancient Indian History' },
  medieval_indian_history: { subjectId: 'history_culture', name: 'Medieval Indian History' },
  modern_indian_history: { subjectId: 'history_culture', name: 'Modern Indian History' },
  indian_national_movement: { subjectId: 'history_culture', name: 'Indian National Movement' },
  art_and_culture: { subjectId: 'history_culture', name: 'Art and Culture' },
  architecture_sculpture_painting: { subjectId: 'history_culture', name: 'Architecture, Sculpture and Painting' },
  literature_music_dance: { subjectId: 'history_culture', name: 'Literature, Music and Dance' },

  // Geography
  physical_geography: { subjectId: 'geography', name: 'Physical Geography' },
  indian_geography: { subjectId: 'geography', name: 'Indian Geography' },
  world_geography: { subjectId: 'geography', name: 'World Geography' },
  climatology: { subjectId: 'geography', name: 'Climatology' },
  oceanography: { subjectId: 'geography', name: 'Oceanography' },
  geomorphology: { subjectId: 'geography', name: 'Geomorphology' },
  resources_and_industries: { subjectId: 'geography', name: 'Resources and Industries' },
  population_and_human_geography: { subjectId: 'geography', name: 'Population and Human Geography' },
  mapping_and_places_in_news: { subjectId: 'geography', name: 'Mapping and Places in News' },

  // Indian Polity and Governance
  constitution: { subjectId: 'polity_governance', name: 'Constitution' },
  preamble_and_constitutional_features: { subjectId: 'polity_governance', name: 'Preamble and Constitutional Features' },
  fundamental_rights_and_duties: { subjectId: 'polity_governance', name: 'Fundamental Rights and Duties' },
  directive_principles: { subjectId: 'polity_governance', name: 'Directive Principles' },
  parliament: { subjectId: 'polity_governance', name: 'Parliament' },
  president_and_vice_president: { subjectId: 'polity_governance', name: 'President and Vice-President' },
  prime_minister_and_council_of_ministers: { subjectId: 'polity_governance', name: 'Prime Minister and Council of Ministers' },
  judiciary: { subjectId: 'polity_governance', name: 'Judiciary' },
  federalism_and_centre_state_relations: { subjectId: 'polity_governance', name: 'Federalism and Centre-State Relations' },
  constitutional_bodies: { subjectId: 'polity_governance', name: 'Constitutional Bodies' },
  statutory_and_regulatory_bodies: { subjectId: 'polity_governance', name: 'Statutory and Regulatory Bodies' },
  elections_and_representation: { subjectId: 'polity_governance', name: 'Elections and Representation' },
  local_government: { subjectId: 'polity_governance', name: 'Local Government' },
  governance_and_public_policy: { subjectId: 'polity_governance', name: 'Governance and Public Policy' },

  // Economy
  national_income_and_economic_growth: { subjectId: 'economy', name: 'National Income and Economic Growth' },
  inflation: { subjectId: 'economy', name: 'Inflation' },
  banking_and_monetary_policy: { subjectId: 'economy', name: 'Banking and Monetary Policy' },
  fiscal_policy_and_budget: { subjectId: 'economy', name: 'Fiscal Policy and Budget' },
  taxation: { subjectId: 'economy', name: 'Taxation' },
  money_and_financial_markets: { subjectId: 'economy', name: 'Money and Financial Markets' },
  external_sector_and_balance_of_payments: { subjectId: 'economy', name: 'External Sector and Balance of Payments' },
  agriculture_and_food_management: { subjectId: 'economy', name: 'Agriculture and Food Management' },
  infrastructure: { subjectId: 'economy', name: 'Infrastructure' },
  employment_and_poverty: { subjectId: 'economy', name: 'Employment and Poverty' },
  government_schemes_and_economic_development: { subjectId: 'economy', name: 'Government Schemes and Economic Development' },

  // Environment and Ecology
  ecosystems: { subjectId: 'environment_ecology', name: 'Ecosystems' },
  biodiversity: { subjectId: 'environment_ecology', name: 'Biodiversity' },
  protected_areas: { subjectId: 'environment_ecology', name: 'Protected Areas' },
  species_and_conservation: { subjectId: 'environment_ecology', name: 'Species and Conservation' },
  climate_change: { subjectId: 'environment_ecology', name: 'Climate Change' },
  pollution: { subjectId: 'environment_ecology', name: 'Pollution' },
  environmental_laws_and_institutions: { subjectId: 'environment_ecology', name: 'Environmental Laws and Institutions' },
  international_environmental_conventions: { subjectId: 'environment_ecology', name: 'International Environmental Conventions' },
  renewable_energy: { subjectId: 'environment_ecology', name: 'Renewable Energy' },
  sustainable_development: { subjectId: 'environment_ecology', name: 'Sustainable Development' },

  // Science and Technology
  physics_in_everyday_life: { subjectId: 'science_technology', name: 'Physics in Everyday Life' },
  chemistry_in_everyday_life: { subjectId: 'science_technology', name: 'Chemistry in Everyday Life' },
  biology_and_human_health: { subjectId: 'science_technology', name: 'Biology and Human Health' },
  biotechnology: { subjectId: 'science_technology', name: 'Biotechnology' },
  space_technology: { subjectId: 'science_technology', name: 'Space Technology' },
  information_technology_and_ai: { subjectId: 'science_technology', name: 'Information Technology and AI' },
  defence_technology: { subjectId: 'science_technology', name: 'Defence Technology' },
  emerging_technologies: { subjectId: 'science_technology', name: 'Emerging Technologies' },

  // Current Affairs and Miscellaneous
  national_and_international_developments: { subjectId: 'current_affairs_misc', name: 'National and International Developments' },
  international_organisations: { subjectId: 'current_affairs_misc', name: 'International Organisations' },
  reports_and_indices: { subjectId: 'current_affairs_misc', name: 'Reports and Indices' },
  important_places_and_events: { subjectId: 'current_affairs_misc', name: 'Important Places and Events' },
  government_initiatives: { subjectId: 'current_affairs_misc', name: 'Government Initiatives' },
  science_and_environment_in_the_news: { subjectId: 'current_affairs_misc', name: 'Science and Environment in the News' },

  // CSAT Paper II
  reading_comprehension: { subjectId: 'csat_reading_comprehension', name: 'Reading Comprehension' },
  logical_reasoning: { subjectId: 'csat_reasoning', name: 'Logical Reasoning' },
  analytical_reasoning: { subjectId: 'csat_reasoning', name: 'Analytical Reasoning' },
  decision_making_problem_solving: { subjectId: 'csat_reasoning', name: 'Decision-Making and Problem-Solving' },
  basic_numeracy: { subjectId: 'csat_quant_numeracy', name: 'Basic Numeracy' },
  number_systems: { subjectId: 'csat_quant_numeracy', name: 'Number Systems' },
  percentages_ratios_proportions: { subjectId: 'csat_quant_numeracy', name: 'Percentages, Ratios and Proportions' },
  averages_and_mixtures: { subjectId: 'csat_quant_numeracy', name: 'Averages and Mixtures' },
  profit_loss_interest: { subjectId: 'csat_quant_numeracy', name: 'Profit, Loss and Interest' },
  time_speed_distance: { subjectId: 'csat_quant_numeracy', name: 'Time, Speed and Distance' },
  time_and_work: { subjectId: 'csat_quant_numeracy', name: 'Time and Work' },
  permutations_and_combinations: { subjectId: 'csat_quant_numeracy', name: 'Permutations and Combinations' },
  probability: { subjectId: 'csat_quant_numeracy', name: 'Probability' },
  data_interpretation: { subjectId: 'csat_data_interpretation', name: 'Data Interpretation' },
  tables_charts_graphs: { subjectId: 'csat_data_interpretation', name: 'Tables, Charts and Graphs' },
};

function hasAny(text, terms) {
  return terms.some((t) => text.includes(t));
}

function deriveSubtopic(topicId, rawTopic, fullText) {
  const parts = String(rawTopic || '').split('/').map((s) => s.trim()).filter(Boolean);
  const specificPart = parts.length > 1 ? parts.slice(1).join(' — ') : '';

  if (topicId === 'reading_comprehension') {
    if (hasAny(fullText, ['assumption', 'assumptions'])) return { id: 'rc_underlying_assumptions', name: 'Underlying Assumptions & Validity' };
    if (hasAny(fullText, ['crux', 'central idea', 'critical message', 'crucial message', 'main idea', 'sums up'])) return { id: 'rc_crux_central_idea', name: 'Crux, Central Idea & Critical Message' };
    if (hasAny(fullText, ['inference', 'corollary', 'inferred'])) return { id: 'rc_logical_inference', name: 'Logical & Rational Inference / Corollary' };
    return { id: 'rc_implications_conclusions', name: 'Practical Implications, Conclusions & Author View' };
  }

  if (specificPart && specificPart.length >= 3 && specificPart.length <= 65) {
    const slug = specificPart.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 48);
    return { id: `${topicId}_${slug}`, name: specificPart };
  }

  const defaultSubtopics = {
    ancient_indian_history: 'Vedic, Mauryan, Gupta & Sangam Age',
    medieval_indian_history: 'Sultanate, Vijayanagara & Mughal India',
    modern_indian_history: 'British Rule, Socio-Religious Reforms & Acts',
    indian_national_movement: 'Freedom Struggle & National Mass Movements',
    art_and_culture: 'Indian Philosophy, Buddhism, Jainism & Heritage',
    architecture_sculpture_painting: 'Temples, Rock-Cut Caves, Sculptures & Paintings',
    literature_music_dance: 'Classical Literature, Performing Arts & Music',
    physical_geography: 'Earth Systems, Soils & Natural Vegetation',
    indian_geography: 'Physiography, Rivers & Drainage of India',
    world_geography: 'Continents, Straits, Lakes & Global Landforms',
    climatology: 'Atmosphere, Winds, Cyclones & Monsoon Dynamics',
    oceanography: 'Ocean Currents, Tides, Temperature & Salinity',
    geomorphology: 'Tectonics, Volcanism, Earthquakes & Landforms',
    resources_and_industries: 'Minerals, Energy Resources & Industrial Geography',
    population_and_human_geography: 'Demographics, Settlements & Human Geography',
    mapping_and_places_in_news: 'Conflict Regions, Borders & Places in News',
    constitution: 'Schedules, Amendments, Citizenship & Emergency',
    preamble_and_constitutional_features: 'Preamble, Basic Structure & Constitutionalism',
    fundamental_rights_and_duties: 'Fundamental Rights (Part III), Writs & Duties (Part IV-A)',
    directive_principles: 'Directive Principles of State Policy (Part IV)',
    parliament: 'Houses of Parliament, Bills, Committees & Procedures',
    president_and_vice_president: 'President, Vice-President & Governor',
    prime_minister_and_council_of_ministers: 'PM, Council of Ministers & Collective Responsibility',
    judiciary: 'Supreme Court, High Courts & Judicial Review',
    federalism_and_centre_state_relations: 'Centre-State Relations & 5th/6th Schedules',
    constitutional_bodies: 'Election Commission, CAG, Finance Commission & UPSC',
    statutory_and_regulatory_bodies: 'Statutory Commissions, Tribunals & Regulatory Bodies',
    elections_and_representation: 'RPA 1950/1951, Anti-Defection & Electoral System',
    local_government: 'Panchayati Raj (73rd Amendment) & Urban Local Bodies',
    governance_and_public_policy: 'RTI, E-Governance, Welfare Laws & Public Policy',
    national_income_and_economic_growth: 'GDP, GVA, Capital Formation & Economic Growth',
    inflation: 'Price Indices (CPI/WPI) & Inflation Dynamics',
    banking_and_monetary_policy: 'RBI, Monetary Policy, Money Supply & Banking Sector',
    fiscal_policy_and_budget: 'Union Budget, Deficits, FRBM & Public Debt',
    taxation: 'Direct Taxes, GST & Tax Structure',
    money_and_financial_markets: 'Money Market, Capital Market, Bonds & SEBI',
    external_sector_and_balance_of_payments: 'Balance of Payments, Exchange Rate, Trade & FDI',
    agriculture_and_food_management: 'MSP, PDS, Agricultural Credit & Cropping Systems',
    infrastructure: 'Transport, Energy, Ports & PPP Models',
    employment_and_poverty: 'Labour Force, Unemployment & Poverty Indicators',
    government_schemes_and_economic_development: 'Flagship Socio-Economic Schemes & Financial Inclusion',
    ecosystems: 'Food Webs, Biogeochemical Cycles & Wetland Ecology',
    biodiversity: 'Biodiversity Hotspots, Invasive Species & Flora',
    protected_areas: 'National Parks, Tiger Reserves, Biosphere Reserves & Ramsar Sites',
    species_and_conservation: 'Threatened Fauna, IUCN Status & Animal Behaviour',
    climate_change: 'Greenhouse Gases, Carbon Sequestration & IPCC',
    pollution: 'Air/Water Pollution, Waste Management & Bioremediation',
    environmental_laws_and_institutions: 'WPA 1972, EPA 1986, FRA 2006, NGT & Statutory Bodies',
    international_environmental_conventions: 'UNFCCC, CBD, CITES, Ramsar & Global Climate Alliances',
    renewable_energy: 'Solar, Green Hydrogen, Fuel Cells & Biofuels',
    sustainable_development: 'SDGs, Circular Economy & Sustainable Practices',
    physics_in_everyday_life: 'Electromagnetic Waves, Nuclear Physics & Optics',
    chemistry_in_everyday_life: 'Polymers, Batteries & Everyday Chemical Processes',
    biology_and_human_health: 'Cell Biology, Diseases, Vaccines, Immunity & AMR',
    biotechnology: 'CRISPR Gene Editing, GM Crops, DNA Tech & Stem Cells',
    space_technology: 'Space Missions, Launch Vehicles, Orbits & Astrophysics',
    information_technology_and_ai: 'AI, 5G/Telecom, Blockchain, Quantum & Cybersecurity',
    defence_technology: 'Missiles, Fighter Aircraft, Drones, Stealth & Naval Systems',
    emerging_technologies: 'Nanotechnology, Carbon Materials, 3D Printing & Robotics',
    national_and_international_developments: 'Diplomacy, Security Treaties, Awards & Sports',
    international_organisations: 'UN System, Bretton Woods, G20, BRICS, SCO & ASEAN',
    reports_and_indices: 'Global & National Reports and Indices',
    important_places_and_events: 'International Observances, Summits & Key Events',
    government_initiatives: 'National Missions, Portals & Policy Initiatives',
    science_and_environment_in_the_news: 'Contemporary Breakthroughs & Nobel Prizes',
    logical_reasoning: 'Syllogism, Coding-Decoding, Clocks, Calendars & Cubes',
    analytical_reasoning: 'Data Sufficiency, Seating, Blood Relations & Puzzles',
    decision_making_problem_solving: 'Interpersonal Communication & Decision-Making',
    basic_numeracy: 'Number Series, Equations, Set Theory, Ages & Geometry',
    number_systems: 'Divisibility, Remainders, Unit Digits, Factors & Primes',
    percentages_ratios_proportions: 'Percentages, Successive Change, Ratios & Proportions',
    averages_and_mixtures: 'Averages, Weighted Mean, Mixtures & Alligation',
    profit_loss_interest: 'Profit, Loss, Discounts, Simple & Compound Interest',
    time_speed_distance: 'Speed, Distance, Trains, Boats & Circular Tracks',
    time_and_work: 'Work Efficiency, Man-Days & Pipes/Cisterns',
    permutations_and_combinations: 'Arrangements, Selections & Counting Principles',
    probability: 'Classical Probability & Random Experiments',
    data_interpretation: 'Quantitative Data Analysis & Inference',
    tables_charts_graphs: 'Statistical Tables, Graphs, Bar & Pie Charts',
  };

  const name = defaultSubtopics[topicId] || TOPIC_META[topicId].name;
  return { id: `${topicId}_core`, name };
}

function classifyStageA(q, isCsat, passagesMap, qNum, originalRawTopic) {
  const rawTopic = (originalRawTopic || q.topic || q.category || '').trim();
  const rtLower = rawTopic.toLowerCase();
  const prefix = rtLower.split('/')[0].trim();
  const qText = (q.question || q.question_text || q.question_en || q.text || '').trim();
  const statements = Array.isArray(q.statements) ? q.statements.join(' ') : '';
  const opts = JSON.stringify(q.options || '');
  const exp = (q.explanation || q.explanation_en || q.solution || '').trim();
  const fullText = `${qText} ${statements} ${opts} ${exp}`.toLowerCase();
  const stemAndStatements = `${qText} ${statements} ${opts}`.toLowerCase();

  const secondaryTags = [];
  let topicId = null;
  let rationale = '';
  let baseConfidence = 0.94;

  // ============================================================================
  // 1. CSAT PAPER II CLASSIFICATION (STRICTLY SEPARATED FROM GS1)
  // ============================================================================
  if (isCsat) {
    const hasPassage =
      Boolean(q.passage || q.passage_text) ||
      Boolean(q.passage_id && passagesMap.has(q.passage_id)) ||
      passagesMap.has(`q_${qNum}`);

    if (
      hasAny(stemAndStatements, [
        'with reference to the table',
        'the graph indicates',
        'bar chart',
        'pie chart',
        'study the following table',
        'tele-density and gdp growth',
        'table giving gdp growth',
      ])
    ) {
      topicId = 'tables_charts_graphs';
      rationale = 'CSAT question explicitly analyzing a statistical table, chart, or graph.';
      baseConfidence = 0.96;
    } else if (hasPassage || (rtLower.includes('reading comprehension') && !stemAndStatements.includes('table'))) {
      topicId = 'reading_comprehension';
      rationale = 'CSAT passage-based Reading Comprehension question evaluating inference, crux, or assumption.';
      baseConfidence = 0.98;
    } else if (rtLower.includes('data interpretation') || rtLower.includes('pie chart') || rtLower.includes('cost and revenue graphs')) {
      topicId = rtLower.includes('graph') || rtLower.includes('chart') || rtLower.includes('table') || hasAny(stemAndStatements, ['graph', 'chart', 'table', 'diagram'])
        ? 'tables_charts_graphs'
        : 'data_interpretation';
      rationale = `CSAT Data Interpretation question (${rawTopic}).`;
      baseConfidence = 0.95;
    } else if (hasAny(rtLower, ['interpersonal', 'communication', 'conflict resolution', 'questionnaire', 'decision'])) {
      topicId = 'decision_making_problem_solving';
      rationale = `CSAT Decision-Making & Interpersonal Communication question (${rawTopic}).`;
      baseConfidence = 0.95;
    } else if (rtLower.includes('data sufficiency') || hasAny(stemAndStatements, ['s1 and s2', 'statement-i and statement-ii are sufficient', 'sufficient to answer the question'])) {
      topicId = 'analytical_reasoning';
      secondaryTags.push('Data Sufficiency');
      if (hasAny(rtLower, ['number', 'prime', 'remainder', 'digit'])) secondaryTags.push('Number Systems');
      rationale = `CSAT Analytical Reasoning (Data Sufficiency) question (${rawTopic}).`;
      baseConfidence = 0.94;
    } else if (hasAny(rtLower, ['probability']) || hasAny(stemAndStatements, ['probability that', 'drawn at random', 'picked at random'])) {
      topicId = 'probability';
      rationale = `CSAT Probability question (${rawTopic}).`;
      baseConfidence = 0.96;
    } else if (
      hasAny(rtLower, ['permutation', 'combination', 'combinatorics']) ||
      hasAny(stemAndStatements, ['in how many ways', 'how many different ways', 'can be arranged', 'can be selected', 'handshakes'])
    ) {
      topicId = 'permutations_and_combinations';
      rationale = `CSAT Permutations, Combinations & Counting principle question (${rawTopic}).`;
      baseConfidence = 0.95;
    } else if (
      hasAny(rtLower, ['time and work', 'pipes and cisterns', 'frog in a well']) ||
      hasAny(stemAndStatements, ['complete a piece of work', 'finish the work', 'pipes a and b', 'fill a tank', 'empty the tank'])
    ) {
      topicId = 'time_and_work';
      rationale = `CSAT Time and Work / Pipes & Cisterns question (${rawTopic}).`;
      baseConfidence = 0.96;
    } else if (
      hasAny(rtLower, ['time, speed and distance', 'circular motion', 'races and games', 'boats and streams', 'kinematics']) ||
      hasAny(stemAndStatements, ['km/hr', 'km/h', 'average speed', 'circular track', 'runs twice as fast', 'train of length', 'upstream', 'downstream'])
    ) {
      topicId = 'time_speed_distance';
      rationale = `CSAT Time, Speed and Distance / Motion problem (${rawTopic}).`;
      baseConfidence = 0.96;
    } else if (
      hasAny(rtLower, ['profit and loss', 'compound interest', 'simple interest']) ||
      hasAny(stemAndStatements, ['cost price', 'selling price', 'marked price', 'profit of', 'compound interest', 'simple interest'])
    ) {
      topicId = 'profit_loss_interest';
      rationale = `CSAT Profit, Loss and Interest computation (${rawTopic}).`;
      baseConfidence = 0.96;
    } else if (
      hasAny(rtLower, ['average', 'mixture', 'alligation', 'harmonic mean']) ||
      hasAny(stemAndStatements, ['average weight', 'average score', 'average age', 'average marks', 'milk and water', 'vessel contains'])
    ) {
      topicId = 'averages_and_mixtures';
      rationale = `CSAT Averages, Mixtures & Alligation problem (${rawTopic}).`;
      baseConfidence = 0.95;
    } else if (
      hasAny(rtLower, ['percentage', 'ratio', 'proportion', 'partnership']) ||
      hasAny(stemAndStatements, ['increased by', 'decreased by', 'ratio of', 'in the ratio'])
    ) {
      topicId = 'percentages_ratios_proportions';
      rationale = `CSAT Percentages, Ratios and Proportions question (${rawTopic}).`;
      baseConfidence = 0.95;
    } else if (
      hasAny(rtLower, [
        'number system',
        'number theory',
        'number properties',
        'divisibility',
        'remainder',
        'lcm',
        'hcf',
        'cryptarithmetic',
        'exponents',
        'unit digit',
      ]) ||
      hasAny(stemAndStatements, ['remainder when', 'divisible by', 'unit digit', 'prime number', 'hcf', 'lcm'])
    ) {
      topicId = 'number_systems';
      rationale = `CSAT Number Systems (Divisibility, Remainders, Factors, Digits) question (${rawTopic}).`;
      baseConfidence = 0.96;
    } else if (
      hasAny(rtLower, [
        'syllogism',
        'coding',
        'clock',
        'calendar',
        'dice',
        'cube',
        'letter series',
        'letter pattern',
        'letter sequence',
        'letter analogy',
        'letter formatting',
        'alphabet',
        'mirror image',
        'spatial reasoning',
        'visual reasoning',
        'non-verbal',
        'matrix reasoning',
        'pattern completion',
        'odd one out',
        'sequence transformation',
      ])
    ) {
      topicId = 'logical_reasoning';
      rationale = `CSAT Logical Reasoning question (${rawTopic}).`;
      baseConfidence = 0.95;
    } else if (
      hasAny(rtLower, [
        'seating',
        'family tree',
        'blood relation',
        'direction',
        'ranking',
        'order and ranking',
        'logic puzzle',
        'weighing puzzle',
        'measurement puzzle',
        'logical deduction',
        'deductive logic',
        'logical arrangement',
        'logical grouping',
        'logical relationships',
        'logical inequalities',
      ])
    ) {
      topicId = 'analytical_reasoning';
      rationale = `CSAT Analytical Reasoning (Puzzles, Seating, Blood Relations, Directions, Ranking) question (${rawTopic}).`;
      baseConfidence = 0.95;
    } else {
      topicId = 'basic_numeracy';
      rationale = `CSAT Quantitative & Basic Numeracy question (${rawTopic}).`;
      baseConfidence = 0.92;
    }

    const meta = TOPIC_META[topicId];
    const subj = SUBJECT_META[meta.subjectId];
    const subtopic = deriveSubtopic(topicId, rawTopic, fullText);
    return {
      paper: subj.paperName,
      paper_type: 'CSAT',
      subject_id: meta.subjectId,
      subject: subj.name,
      topic_id: topicId,
      topic: meta.name,
      subtopic_id: subtopic.id,
      subtopic: subtopic.name,
      secondary_tags: secondaryTags,
      confidence: baseConfidence,
      rationale,
    };
  }

  // ============================================================================
  // 2. GS PAPER I CLASSIFICATION
  // ============================================================================

  // --- A. HISTORY AND CULTURE ---
  if (
    hasAny(prefix, [
      'ancient',
      'medieval',
      'early medieval',
      'modern indian history',
      'modern history',
      'art and culture',
      'art & culture',
      'culture & anthropology',
      'ancient indian culture',
      'medieval indian culture',
      'post-independence',
      'agricultural history',
      'constitutional development',
    ])
  ) {
    if (
      hasAny(rtLower, ['architecture', 'sculpture', 'painting', 'monument', 'stupa', 'cave', 'temple', 'iconography', 'visual art']) ||
      hasAny(stemAndStatements, ['stupa', 'nagara', 'dravida', 'ajanta', 'ellora', 'mahabalipuram', 'rock-cut', 'chausath yogini', 'konark', 'khajuraho', 'mural', 'miniature painting', 'bani thani', 'kalamkari', 'sculptur'])
    ) {
      topicId = 'architecture_sculpture_painting';
      rationale = `GS1 History & Culture question focusing on Architecture, Sculpture or Painting (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['literature', 'music', 'dance', 'playwright', 'text', 'sanskrit', 'sangam literature', 'poetry']) ||
      hasAny(stemAndStatements, ['playwright', 'kalidasa', 'bhasa', 'natyashastra', 'dhrupad', 'tansen', 'tyagaraja', 'bharatanatyam', 'kathak', 'sattriya', 'kuchipudi', 'manipuri', 'odissi', 'buranji', 'malfuzat', 'avadhana'])
    ) {
      topicId = 'literature_music_dance';
      rationale = `GS1 History & Culture question on Literature, Music or Dance (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['buddhism', 'jainism', 'bhakti', 'sufi', 'philosophy', 'festival', 'calendar', 'gi tag', 'intangible', 'sects', 'religion', 'culture', 'tribal language']) &&
      !hasAny(rtLower, ['modern indian', 'british', 'governor', 'land revenue', 'empire', 'administration'])
    ) {
      topicId = 'art_and_culture';
      rationale = `GS1 Art and Culture question covering religious/philosophical traditions or cultural heritage (${rawTopic}).`;
    } else if (
      rtLower.includes('modern') ||
      rtLower.includes('post-independence') ||
      rtLower.includes('constitutional development')
    ) {
      if (
        hasAny(rtLower, [
          'swadeshi',
          'non-cooperation',
          'civil disobedience',
          'quit india',
          'gandhi',
          'congress',
          'home rule',
          'revolutionary',
          '1857',
          'freedom struggle',
          'national movement',
          'cripps',
          'cabinet mission',
          'ina',
          'round table',
          'khilafat',
          'rowlatt',
          'nehru report',
          'partition',
          'subhas chandra',
          'bhagat singh',
          'ghadar',
        ]) ||
        hasAny(stemAndStatements, [
          'quit india',
          'swadeshi',
          'non-cooperation',
          'civil disobedience',
          'mahatma gandhi',
          'indian national congress',
          'home rule',
          'cripps',
          'cabinet mission',
          'gandhi-irwin',
          'salt satyagraha',
          'azad hind',
        ])
      ) {
        topicId = 'indian_national_movement';
        rationale = `GS1 Modern History question on the Indian National Movement (${rawTopic}).`;
      } else {
        topicId = 'modern_indian_history';
        rationale = `GS1 Modern Indian History question on colonial policies, reforms, uprisings, or acts (${rawTopic}).`;
      }
    } else if (hasAny(rtLower, ['medieval', 'sultanate', 'mughal', 'vijayanagara', 'chola', 'maratha'])) {
      topicId = 'medieval_indian_history';
      rationale = `GS1 Medieval Indian History question (${rawTopic}).`;
    } else {
      topicId = 'ancient_indian_history';
      rationale = `GS1 Ancient Indian History question (${rawTopic}).`;
    }
  }

  // --- B. ENVIRONMENT AND ECOLOGY (checked before Polity/Economy so "Environmental Governance/Economics" route accurately) ---
  else if (
    hasAny(prefix, [
      'environment',
      'environmental',
      'ecology',
      'climate',
      'biodiversity',
      'wildlife',
      'botany',
      'economic botany',
      'marine biology',
      'waste management',
      'renewable energy',
      'energy efficiency',
      'sustainable development',
      'tribal welfare & forest law',
      'international environment',
    ]) ||
    (prefix === 'energy' && hasAny(rtLower, ['solar', 'clean', 'biofuel', 'renewable', 'hydrogen']))
  ) {
    if (
      hasAny(rtLower, ['protected area', 'national park', 'wildlife sanctuary', 'tiger reserve', 'biosphere reserve', 'ramsar', 'wetland site']) ||
      hasAny(stemAndStatements, ['national park', 'tiger reserve', 'biosphere reserve', 'wildlife sanctuary', 'ramsar', 'kaziranga', 'keoladeo', 'sundarbans', 'bhitarkanika', 'corbett', 'kanha', 'bandipur', 'mudumalai', 'papikonda', 'kuno', 'desert national park'])
    ) {
      topicId = 'protected_areas';
      rationale = `GS1 Environment question on Protected Areas (National Parks, Reserves, Ramsar Wetlands) (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['law', 'act', 'legislation', 'institution', 'governance', 'ngt', 'wildlife protection', 'forest rights', 'biodiversity act', 'cpcb', 'board', 'authority', 'tribunal', 'committee']) ||
      hasAny(stemAndStatements, ['wildlife protection act', 'environment protection act', 'forest rights act', 'biological diversity act', 'national green tribunal', 'central pollution control board', 'animal welfare board', 'genetic engineering appraisal', 'gadgil committee', 'kasturirangan', 'national ganga river basin'])
    ) {
      topicId = 'environmental_laws_and_institutions';
      rationale = `GS1 Environment question on Environmental Laws, Committees, and Statutory Institutions (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['convention', 'treaty', 'protocol', 'international', 'unfccc', 'paris', 'kyoto', 'cbd', 'cites', 'cms', 'unccd', 'alliance', 'coalition', 'initiative', 'fund', 'redd', 'teeb', 'page']) ||
      hasAny(stemAndStatements, ['unfccc', 'paris agreement', 'kyoto protocol', 'convention on biological diversity', 'nagoya', 'cartagena', 'cites', 'cms', 'bonn convention', 'unccd', 'wetlands international', 'birdlife international', 'traffic', 'iucn', 'global environment facility', 'climate action tracker', 'climate group', 'ep100', 'under2 coalition', 'new york declaration on forests', 'economics of ecosystems and biodiversity', 'partnership for action on green economy', 'reducing emissions from deforestation'])
    ) {
      topicId = 'international_environmental_conventions';
      rationale = `GS1 Environment question on International Environmental Conventions & Global Initiatives (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['pollution', 'pollutant', 'waste', 'air quality', 'water quality', 'fly ash', 'coal ash', 'smog', 'acid rain', 'heavy metal', 'plastic', 'hazardous chemical', 'bioremediation', 'eutrophication', 'sand mining']) ||
      hasAny(stemAndStatements, ['air quality index', 'pm2.5', 'benzene', 'fly ash', 'coal ash', 'red mud', 'copper slag', 'microbeads', 'microplastic', 'contain plastic', 'bisphenol', 'triclosan', 'pfas', 'carbofuran', 'methyl parathion', 'hydrofluorocarbon', 'acid rain', 'ozone depletion', 'bioremediation', 'membrane bioreactor', 'bio-mining', 'pyrolysis', 'e-waste', 'extended producer responsibility', 'sand mining', 'reduce air pollution'])
    ) {
      topicId = 'pollution';
      rationale = `GS1 Environment question on Pollution, Waste Management, or Bioremediation (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['climate change', 'climate science', 'global warming', 'greenhouse', 'carbon', 'methane', 'sequestration', 'ipcc', 'acidification', 'climate pollutant']) ||
      hasAny(stemAndStatements, ['greenhouse gas', 'global warming', 'carbon sequestration', 'blue carbon', 'social cost of carbon', 'carbon credit', 'methane hydrate', 'nitrous oxide', 'sulfur hexafluoride', 'ocean acidification'])
    ) {
      topicId = 'climate_change';
      rationale = `GS1 Environment question on Climate Change, GHGs & Carbon Cycle (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['renewable', 'solar', 'wind', 'hydrogen', 'fuel cell', 'biofuel', 'ethanol', 'biomass', 'biogas', 'geothermal', 'clean transport', 'energy efficiency'])
    ) {
      topicId = 'renewable_energy';
      rationale = `GS1 Environment question on Renewable Energy & Clean Fuels (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['sustainable development', 'sustainable finance', 'green building', 'sdg', 'circular economy', 'greenwashing', 'earth hour', 'natural farming', 'conservation agriculture', 'urban forestry', 'afforestation']) ||
      hasAny(stemAndStatements, ['greenwashing', 'miyawaki', 'common carbon metric', 'sustainable development goals'])
    ) {
      topicId = 'sustainable_development';
      rationale = `GS1 Environment question on Sustainable Development & Green Practices (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['species', 'fauna', 'avian', 'animal', 'bird', 'mammal', 'reptile', 'marine biology', 'wildlife', 'endangered', 'conservation', 'entomology', 'insect', 'behaviour', 'butterfly', 'camel']) ||
      hasAny(stemAndStatements, ['great indian bustard', 'hornbill', 'amur falcon', 'kharai camel', 'gharial', 'gangetic dolphin', 'dugong', 'olive ridley', 'sangai', 'lion-tailed macaque', 'nilgiri tahr', 'snow leopard', 'asiatic lion', 'one-horned rhino', 'cheetah', 'elephant', 'pangolin', 'hedgehog', 'marmot', 'red panda', 'orangutan', 'bonobo', 'waggle dance', 'cicada', 'marsupial', 'ceylon frogmouth', 'coppersmith barbet', 'peacock tarantula', 'parasitoid', 'poisonous species', 'cultivators of fungi', 'state butterfly'])
    ) {
      topicId = 'species_and_conservation';
      rationale = `GS1 Environment question on Wildlife Species, Animal Behaviour & Conservation (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['ecosystem', 'food chain', 'food web', 'biogeochemical', 'nitrogen', 'phosphorus', 'peatland', 'mangrove', 'wetland', 'coral', 'symbiosis', 'mutualism', 'succession', 'plant adaptation']) ||
      hasAny(stemAndStatements, ['detritivore', 'food chain', 'nitrogen fixation', 'phosphorus cycle', 'peatland', 'wetland', 'mangrove', 'leaf modification', 'coevolved', 'mycorrhiza', 'lichen', 'symbiotic'])
    ) {
      topicId = 'ecosystems';
      rationale = `GS1 Environment question on Ecosystems, Trophic Dynamics & Adaptations (${rawTopic}).`;
    } else {
      topicId = 'biodiversity';
      rationale = `GS1 Environment question on Biodiversity, Invasive Species & Flora (${rawTopic}).`;
    }
  }

  // --- C. SCIENCE AND TECHNOLOGY ---
  else if (
    hasAny(prefix, [
      'science',
      'science and technology',
      'technology',
      'emerging technologies',
      'biotechnology',
      'genetics',
      'virology',
      'biology',
      'cell biology',
      'microbiology',
      'health',
      'physics',
      'applied physics',
      'nuclear',
      'chemistry',
      'consumer chemistry',
      'space',
      'astrophysics',
      'defence',
      'indian defence',
      'information technology',
      'digital technology',
      'display technology',
      'telecommunications',
      'cybersecurity',
      'nanotechnology',
      'aviation technology',
      'human evolution',
      'personalities in science',
    ])
  ) {
    if (
      hasAny(rtLower, ['clean energy']) ||
      hasAny(stemAndStatements, ['green hydrogen', 'fuel cell electric vehicle', 'coal gasification', 'distributed energy resource'])
    ) {
      topicId = 'renewable_energy';
      secondaryTags.push('Science and Technology');
      rationale = `GS1 Clean Energy / Renewable Technology question (${rawTopic}).`;
    } else if (stemAndStatements.includes('waggle dance')) {
      topicId = 'species_and_conservation';
      secondaryTags.push('Science and Technology');
      rationale = `GS1 Animal Behaviour & Species question (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['space', 'astrophysics', 'satellite', 'orbit', 'isro', 'astronomy', 'cosmology']) ||
      hasAny(stemAndStatements, ['isro', 'pslv', 'gslv', 'geostationary', 'chandrayaan', 'mangalyaan', 'aditya-l1', 'gaganyaan', 'astrosat', 'navic', 'irnss', 'cassini', 'juno', 'voyager', 'james webb', 'event horizon', 'lisa', 'gravitational wave', 'black hole', 'pulsar', 'neutron star', 'cepheid', 'nebula', 'neutrino', 'general theory of relativity'])
    ) {
      topicId = 'space_technology';
      rationale = `GS1 Science & Tech question on Space Technology, Satellites, or Astrophysics (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['biotechnology', 'genetics', 'dna', 'rna', 'crispr', 'gm ', 'genetically modified', 'stem cell', 'cloning', 'genome', 'sequencing']) ||
      hasAny(stemAndStatements, ['crispr', 'cas9', 'gene editing', 'genome sequencing', 'genomeindia', 'transcriptome', 'dna barcoding', 'edna', 'microsatellite', 'metagenomics', 'somatic cell nuclear transfer', 'pronuclear transfer', 'mitochondrial replacement', 'stem cell', 'car-t', 'rna interference', 'gm mustard', 'dmh-11', 'bt brinjal', 'bollgard'])
    ) {
      topicId = 'biotechnology';
      rationale = `GS1 Science & Tech question on Biotechnology, Genetics & Gene Editing (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['biology', 'health', 'disease', 'virus', 'virology', 'vaccine', 'immunity', 'bacteria', 'microbiology', 'nutrition', 'medicine', 'cell', 'human evolution', 'extremophile']) ||
      hasAny(stemAndStatements, ['plant cell', 'mitochondria', 't-cell', 'b-cell', 'vaccine', 'mrna', 'pneumococcal', 'zika', 'ebola', 'nipah', 'dengue', 'malaria', 'kala-azar', 'tuberculosis', 'hepatitis', 'hiv', 'h1n1', 'coronavirus', 'ace2', 'adenovirus', 'antimicrobial resistance', 'colistin', 'probiotic', 'vitamin', 'nitric oxide', 'wolbachia', 'extremophile'])
    ) {
      topicId = 'biology_and_human_health';
      rationale = `GS1 Science & Tech question on Biology, Infectious Diseases, Vaccines & Human Health (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['defence', 'missile', 'drone', 'uav', 'aircraft', 'submarine', 'naval', 'stealth', 'radar', 'weapon', 'military']) ||
      hasAny(stemAndStatements, ['ballistic missile', 'cruise missile', 'agni', 'brahmos', 's-400', 'thaad', 'stealth technology', 'rafale', 'tejas', 'chinook', 'apache', 'prana', 'drone', 'uav', 'ins vikrant', 'arihant', 'kalvari', 'black box'])
    ) {
      topicId = 'defence_technology';
      rationale = `GS1 Science & Tech question on Defence & Aerospace Technology (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['information technology', 'digital', 'artificial intelligence', 'ai', 'blockchain', 'crypto', 'web 3', 'cyber', 'telecom', '5g', 'lte', 'li-fi', 'iot', 'internet of things', 'quantum', 'software', 'cloud', 'open-source', 'communication', 'ar vs vr', 'wearable', 'project loon']) ||
      hasAny(stemAndStatements, ['large language model', 'llm', 'dhruv64', 'microprocessor', 'project loon', 'augmented reality', 'virtual reality', 'wearable', 'artificial intelligence', 'blockchain', 'non-fungible token', 'web 3.0', 'metaverse', 'saas', 'cloud computing', 'open-source', 'cowin', 'digilocker', 'quantum computing', 'qubit', '5g', 'lte', 'volte', 'li-fi', 'visible light communication', 'nfc', 'rfid', 'bluetooth', 'wi-fi', 'internet of things', 'wannacry', 'pegasus', 'public key infrastructure', 'vpn'])
    ) {
      topicId = 'information_technology_and_ai';
      rationale = `GS1 Science & Tech question on IT, AI, Telecom, Blockchain, or Cybersecurity (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['nanotech', 'emerging tech', '3d print', 'robotics', 'carbon nanotube', 'graphene', 'metamaterial', 'superconduct']) ||
      hasAny(stemAndStatements, ['nanoparticle', 'carbon nanotube', 'graphene', 'carbon fiber', '3d printing', 'robotics', 'deep ocean mission'])
    ) {
      topicId = 'emerging_technologies';
      rationale = `GS1 Science & Tech question on Emerging Technologies (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['chemistry', 'chemical', 'polymer', 'plastic', 'battery', 'material', 'acid', 'catalyst']) ||
      hasAny(stemAndStatements, ['polyethylene', 'polycarbonate', 'hydrogel', 'activated carbon', 'cloud seeding', 'silver iodide', 'potassium bromate', 'trans fat', 'hydrogenation', 'nitric acid'])
    ) {
      topicId = 'chemistry_in_everyday_life';
      rationale = `GS1 Science & Tech question on Chemistry in Everyday Life (${rawTopic}).`;
    } else {
      topicId = 'physics_in_everyday_life';
      rationale = `GS1 Science & Tech question on Physics in Everyday Life & Nuclear Energy (${rawTopic}).`;
    }
  }

  // --- D. GEOGRAPHY ---
  else if (
    hasAny(prefix, [
      'geography',
      'indian geography',
      'physical geography',
      'world geography',
      'economic geography',
      'indian physical geography',
      'indian cultural geography',
      'physical & regional geography',
      'world geography & international economics',
      'climatology',
      'oceanography',
      'earth sciences',
      'demography',
      'world demography',
      'mining law',
      'energy resources',
    ]) ||
    (prefix === 'energy' && hasAny(rtLower, ['petroleum', 'crude oil', 'thermal', 'coal']))
  ) {
    if (
      hasAny(rtLower, ['climatology', 'atmosphere', 'monsoon', 'cyclone', 'cloud', 'dew', 'fog', 'temperature', 'isotherm', 'wind', 'el nino', 'indian ocean dipole']) ||
      hasAny(stemAndStatements, ['isotherm', 'temperature inversion', 'tropical cyclone', 'jet stream', 'indian ocean dipole', 'madden-julian', 'clouds', 'dew drops', 'specific heat'])
    ) {
      topicId = 'climatology';
      rationale = `GS1 Geography question on Climatology & Atmospheric Processes (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['oceanography', 'ocean', 'marine', 'sea level', 'tides', 'salinity', 'coral']) ||
      hasAny(stemAndStatements, ['ocean current', 'equatorial counter current', 'thermocline', 'tides', 'upwelling', 'ice cap', 'freshwater on earth'])
    ) {
      topicId = 'oceanography';
      rationale = `GS1 Geography question on Oceanography & Hydrosphere (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['geomorphology', 'earthquake', 'volcano', 'tectonic', 'earth sciences', 'interior', 'seismic', 'rock']) ||
      hasAny(stemAndStatements, ['p-wave', 's-wave', 'earthquake', 'pyroclastic', 'volcanic', 'plate tectonic', 'continental drift', 'mantle', 'lithosphere'])
    ) {
      topicId = 'geomorphology';
      rationale = `GS1 Geography question on Geomorphology & Earth's Interior (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['mineral', 'mining', 'resource', 'coal', 'energy', 'industry', 'industrial', 'petroleum', 'crude oil', 'thermal power', 'uranium', 'thorium', 'cobalt', 'lithium', 'sand']) ||
      hasAny(stemAndStatements, ['monazite', 'rare earth', 'ilmenite', 'coal controller', 'minor mineral', 'chromite', 'cobalt', 'bauxite', 'copper', 'iron ore', 'west texas intermediate', 'furnace oil', 'coal-based thermal'])
    ) {
      topicId = 'resources_and_industries';
      rationale = `GS1 Geography question on Mineral/Energy Resources and Industries (${rawTopic}).`;
    } else if (hasAny(rtLower, ['demography', 'population', 'settlement', 'tribe', 'tribal', 'migration', 'urban'])) {
      topicId = 'population_and_human_geography';
      rationale = `GS1 Geography question on Population, Demography & Human Geography (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['places in news', 'conflict', 'border', 'mapping', 'geopolitics']) ||
      hasAny(stemAndStatements, ['shares a border with', 'bordering', 'donbas', 'kachin', 'tigray', 'nagorno', 'panjshir', 'levant', 'sahel', 'kuril', 'golan heights', 'north sea', 'red sea', 'black sea'])
    ) {
      topicId = 'mapping_and_places_in_news';
      rationale = `GS1 Geography question on World Mapping, Borders & Places in News (${rawTopic}).`;
    } else if (hasAny(rtLower, ['world geography'])) {
      topicId = 'world_geography';
      rationale = `GS1 World Geography question on global rivers, lakes, mountains, or regions (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['indian geography', 'indian physical', 'indian cultural']) ||
      hasAny(stemAndStatements, ['himalaya', 'western ghats', 'eastern ghats', 'ganga', 'brahmaputra', 'indus', 'godavari', 'krishna', 'cauvery', 'narmada', 'chambal', 'teesta', 'amarkantak', 'siachen', 'chilika', 'pulicat', 'kolleru'])
    ) {
      topicId = 'indian_geography';
      rationale = `GS1 Indian Geography question on Indian physiography, rivers, or lakes (${rawTopic}).`;
    } else {
      topicId = 'physical_geography';
      rationale = `GS1 Physical Geography question (${rawTopic}).`;
    }
  }

  // --- E. ECONOMY ---
  else if (
    hasAny(prefix, [
      'economy',
      'indian economy',
      'economics',
      'macroeconomics',
      'microeconomics',
      'development economics',
      'monetary economics',
      'international economics',
      'international economy',
      'banking',
      'banking governance',
      'banking technology',
      'central banking',
      'monetary',
      'financial',
      'indian financial architecture',
      'fintech',
      'finance',
      'corporate finance',
      'corporate governance',
      'infrastructure finance',
      'agriculture finance',
      'public finance',
      'taxation',
      'international taxation',
      'international trade',
      'international monetary',
      'international finance',
      'external sector',
      'trade',
      'agriculture',
      'public distribution',
      'infrastructure',
      'manufacturing',
      'labour',
      'skill development',
      'urban development',
      'social security',
      'social welfare',
      'social development',
      'sociology & economics',
      'government schemes',
      'economic planning',
      'economic reports',
      'insurance',
    ])
  ) {
    if (
      hasAny(rtLower, ['agriculture', 'public distribution', 'crop', 'msp', 'food', 'fertilizer', 'irrigation', 'horticulture', 'livestock', 'fisheries']) ||
      hasAny(stemAndStatements, ['minimum support price', 'public investment in agriculture', 'food corporation of india', 'kisan credit card', 'e-nam'])
    ) {
      topicId = 'agriculture_and_food_management';
      if (hasAny(rtLower, ['ecology', 'botany', 'climate'])) secondaryTags.push('Environment and Ecology');
      rationale = `GS1 Economy & Agriculture question on cropping systems, MSP, PDS, or agri-inputs (${rawTopic}).`;
    } else if (hasAny(rtLower, ['inflation', 'price index', 'cpi', 'wpi', 'deflator'])) {
      topicId = 'inflation';
      rationale = `GS1 Economy question on Inflation & Price Indices (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['banking', 'monetary', 'rbi', 'reserve bank', 'money supply', 'money multiplier', 'repo', 'crr', 'slr', 'npa', 'insolvency', 'payment', 'upi', 'cbdc', 'digital rupee', 'fintech']) ||
      hasAny(stemAndStatements, ['reserve bank of india', 'monetary policy', 'money multiplier', 'repo rate', 'cash reserve ratio', 'open market operations', 'urban cooperative bank', 'regional rural bank', 'non-performing', 'banks board bureau', 'public sector banks'])
    ) {
      topicId = 'banking_and_monetary_policy';
      rationale = `GS1 Economy question on Banking, RBI & Monetary Policy (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['taxation', 'tax', 'gst', 'customs', 'duty', 'equalization levy', 'beps']) ||
      hasAny(stemAndStatements, ['goods and services tax', 'gst', 'income tax', 'equalization levy', 'tax-to-gdp', 'global minimum tax'])
    ) {
      topicId = 'taxation';
      rationale = `GS1 Economy question on Direct/Indirect Taxation & GST (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['fiscal', 'budget', 'deficit', 'public debt', 'sovereign debt', 'frbm', 'public finance', 'disinvestment']) ||
      hasAny(stemAndStatements, ['fiscal deficit', 'revenue deficit', 'primary deficit', 'frbm', 'capital expenditure', 'revenue expenditure', 'union budget', 'sovereign debt', 'central government debt'])
    ) {
      topicId = 'fiscal_policy_and_budget';
      rationale = `GS1 Economy question on Fiscal Policy, Union Budget & Public Debt (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['financial market', 'money market', 'capital market', 'financial instrument', 'debt instrument', 'bond', 'g-sec', 'treasury bill', 'stock', 'sebi', 'mutual fund', 'invit', 'reit', 'venture capital', 'corporate finance', 'corporate governance', 'insurance', 'fsdc']) ||
      hasAny(stemAndStatements, ['treasury bill', 'government securities', 'sovereign gold bond', 'inflation-indexed bond', 'masala bond', 'convertible bond', 'call money', 'commercial paper', 'certificate of deposit', 'sebi', 'invit', 'reit', 'exchange traded fund', 'financial instruments', 'financial stability and development council'])
    ) {
      topicId = 'money_and_financial_markets';
      rationale = `GS1 Economy question on Money and Financial Markets (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['external sector', 'balance of payments', 'bop', 'international trade', 'trade', 'exchange rate', 'neer', 'reer', 'fdi', 'forex', 'devaluation', 'currency', 'export', 'import', 'intellectual property', 'wto', 'international monetary', 'international finance', 'imf', 'debt architecture']) ||
      hasAny(stemAndStatements, ['balance of payments', 'current account', 'capital account', 'neer', 'reer', 'devaluation', 'foreign direct investment', 'external debt', 'foreign exchange reserves', 'special drawing rights', 'gold tranche', 'rapid financing instrument', 'g20 common framework', 'trims', 'trips'])
    ) {
      topicId = 'external_sector_and_balance_of_payments';
      rationale = `GS1 Economy question on External Sector, Balance of Payments, Exchange Rate & Trade (${rawTopic}).`;
    } else if (hasAny(rtLower, ['infrastructure', 'transport', 'port', 'waterway', 'railway', 'aviation', 'ppp', 'coal', 'power', 'urban development'])) {
      topicId = 'infrastructure';
      rationale = `GS1 Economy question on Infrastructure, Energy & Transport (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['employment', 'unemployment', 'labour', 'poverty', 'inequality', 'gig', 'human capital', 'care economy', 'sociology']) ||
      hasAny(stemAndStatements, ['multidimensional poverty', 'casual worker', 'unemployment'])
    ) {
      topicId = 'employment_and_poverty';
      rationale = `GS1 Economy question on Employment, Labour & Poverty (${rawTopic}).`;
    } else if (hasAny(rtLower, ['scheme', 'inclusion', 'welfare', 'social security', 'skill', 'msme', 'shg', 'self-help', 'subsidy', 'manufacturing', 'pli'])) {
      topicId = 'government_schemes_and_economic_development';
      rationale = `GS1 Economy question on Government Schemes, MSMEs & Economic Development (${rawTopic}).`;
    } else {
      topicId = 'national_income_and_economic_growth';
      rationale = `GS1 Economy question on National Income, GDP & Economic Growth (${rawTopic}).`;
    }
  }

  // --- F. INDIAN POLITY AND GOVERNANCE ---
  else if (
    hasAny(prefix, [
      'indian polity',
      'political theory',
      'political science',
      'governance',
      'governance and public administration',
      'governance and decision making',
      'public administration',
      'indian governance',
      'health governance',
      'e-governance',
      'statutory bodies',
      'human rights',
      'legislation',
      'social legislation',
      'data protection',
      'education policy',
    ])
  ) {
    if (
      hasAny(rtLower, ['preamble', 'constitutionalism', 'constitutional government', 'jurisprudence', 'liberty', 'equality', 'political theory', 'political science', 'parliamentary system', 'basic structure', 'rule of law', 'state']) &&
      !hasAny(rtLower, ['article 14', 'article 19', 'article 21', 'fundamental right', 'dpsp', 'directive principle', 'schedule', 'amendment'])
    ) {
      topicId = 'preamble_and_constitutional_features';
      rationale = `GS1 Polity question on Preamble, Basic Structure, or Constitutional Philosophy (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['fundamental right', 'fundamental duties', 'right to privacy', 'untouchability', 'awards and honours', 'writ', 'article 14', 'article 19', 'article 21', 'article 32', 'preventive detention', 'right to property']) ||
      hasAny(stemAndStatements, ['fundamental right', 'fundamental duties', 'bharat ratna and padma', 'article 14', 'article 15', 'article 16', 'article 17', 'article 18', 'article 19', 'article 21', 'article 32', 'habeas corpus', 'mandamus', 'quo warranto', 'certiorari'])
    ) {
      topicId = 'fundamental_rights_and_duties';
      rationale = `GS1 Polity question on Fundamental Rights, Writs, or Fundamental Duties (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['directive principles', 'dpsp', 'welfare state', 'uniform civil code']) ||
      hasAny(stemAndStatements, ['directive principles of state policy', 'part iv of the constitution', 'uniform civil code', 'concentration of wealth'])
    ) {
      topicId = 'directive_principles';
      rationale = `GS1 Polity question on Directive Principles of State Policy (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['parliament', 'lok sabha', 'rajya sabha', 'speaker', 'money bill', 'budgetary procedure', 'mplads', 'committee', 'legislative', 'bill', 'session', 'motion', 'privilege', 'whip']) ||
      hasAny(stemAndStatements, ['lok sabha', 'rajya sabha', 'speaker of', 'money bill', 'joint sitting', 'parliamentary committee', 'public accounts committee', 'departmental standing committee', 'questions asked by the members', 'members of parliament local area'])
    ) {
      topicId = 'parliament';
      rationale = `GS1 Polity question on Parliament, Legislative Procedures, or Committees (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['president', 'vice-president', 'governor', 'ordinance', 'pardon']) ||
      hasAny(stemAndStatements, ['president of india', 'election of the president', 'impeachment of the president', 'governor of a state', 'ordinance'])
    ) {
      topicId = 'president_and_vice_president';
      rationale = `GS1 Polity question on President, Vice-President, or Governor (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['prime minister', 'council of ministers', 'cabinet', 'chief minister']) ||
      hasAny(stemAndStatements, ['council of ministers', 'prime minister', 'cabinet secretariat', '91st constitutional amendment'])
    ) {
      topicId = 'prime_minister_and_council_of_ministers';
      rationale = `GS1 Polity question on Prime Minister & Council of Ministers (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['judiciary', 'supreme court', 'high court', 'judicial', 'contempt', 'lok adalat', 'gram nyayalaya', 'legal services', 'legal profession', 'bail', 'custody', 'advocate', 'prison', 'criminal law']) ||
      hasAny(stemAndStatements, ['supreme court', 'high court', 'judicial review', 'chief justice of india', 'contempt of court', 'article 142', 'lok adalat', 'gram nyayalaya', 'nalsa', 'judicial custody', 'advocates act', 'bar council'])
    ) {
      topicId = 'judiciary';
      rationale = `GS1 Polity question on Judiciary, Courts, or Legal System (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['federalism', 'centre-state', 'fifth schedule', 'sixth schedule', 'scheduled area', 'inter-state', 'seventh schedule', 'union list', 'state list']) ||
      hasAny(stemAndStatements, ['fifth schedule', 'sixth schedule', 'centre-state', 'federalism', 'autonomous district council'])
    ) {
      topicId = 'federalism_and_centre_state_relations';
      rationale = `GS1 Polity question on Federalism, Centre-State Relations, or 5th/6th Schedules (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['constitutional bodies', 'finance commission', 'cag', 'comptroller', 'attorney general', 'election commission', 'ncst', 'ncsc', 'ncbc', 'upsc', 'gst council']) ||
      hasAny(stemAndStatements, ['finance commission', 'comptroller and auditor general', 'attorney general of india', 'national commission for scheduled'])
    ) {
      topicId = 'constitutional_bodies';
      rationale = `GS1 Polity question on Constitutional Bodies (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['statutory', 'regulatory', 'nhrc', 'human rights', 'niti aayog', 'lokpal', 'tribunal', 'law commission', 'bar council', 'board'])
    ) {
      topicId = 'statutory_and_regulatory_bodies';
      rationale = `GS1 Polity question on Statutory and Regulatory Bodies (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['election', 'anti-defection', 'tenth schedule', 'representation of the people', 'delimit', 'voting', 'political part', 'office of profit']) ||
      hasAny(stemAndStatements, ['representation of the people act', 'tenth schedule', 'anti-defection', 'model code of conduct'])
    ) {
      topicId = 'elections_and_representation';
      rationale = `GS1 Polity question on Elections, Representation, or Anti-Defection (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['local government', 'panchayat', 'municipality', '73rd', '74th', 'gram sabha', 'pesa', 'district planning']) ||
      hasAny(stemAndStatements, ['panchayati raj', 'gram sabha', '73rd constitutional amendment', 'pesa act', 'metropolitan planning committee'])
    ) {
      topicId = 'local_government';
      rationale = `GS1 Polity question on Local Government / Panchayati Raj (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['schedule', 'amendment', 'citizenship', 'emergency', 'constituent assembly', 'constitution day', 'article 368', 'ninth schedule']) ||
      hasAny(stemAndStatements, ['ninth schedule', 'article 368', 'constituent assembly', 'citizenship act', 'president\'s rule', 'national emergency', 'amendment to the constitution'])
    ) {
      topicId = 'constitution';
      rationale = `GS1 Polity question on Constitutional Provisions, Schedules, Amendments, or Emergency (${rawTopic}).`;
    } else {
      topicId = 'governance_and_public_policy';
      rationale = `GS1 Governance, Public Policy & Welfare Legislation question (${rawTopic}).`;
    }
  }

  // --- G. CURRENT AFFAIRS AND MISCELLANEOUS ---
  else {
    if (
      hasAny(rtLower, ['international organization', 'international bodies', 'international grouping', 'trade grouping', 'international financial institution', 'un ', 'united nations', 'g20', 'brics', 'sco', 'asean', 'gcc', 'oecd', 'imf', 'world bank', 'wto']) ||
      hasAny(stemAndStatements, ['united nations', 'general assembly', 'security council', 'unesco', 'who', 'ilo', 'fao', 'imf', 'international monetary and financial committee', 'new development bank', 'asian infrastructure investment bank', 'world bank', 'ibrd', 'unops', 'wto', 'g20', 'g-20', 'brics', 'aiib', 'adb', 'shanghai cooperation', 'asean', 'rcep', 'bimstec', 'gcc', 'opec', 'oecd'])
    ) {
      topicId = 'international_organisations';
      rationale = `GS1 Current Affairs & IR question on International Organisations and Multilateral Groupings (${rawTopic}).`;
    } else if (
      hasAny(rtLower, ['report', 'index', 'indices']) ||
      hasAny(stemAndStatements, ['ease of doing business', 'global hunger index', 'human development index', 'gender inequality index', 'world economic outlook', 'global financial stability report', 'rule of law index'])
    ) {
      topicId = 'reports_and_indices';
      rationale = `GS1 Current Affairs question on Global/National Reports and Indices (${rawTopic}).`;
    } else if (hasAny(rtLower, ['government initiative', 'education initiative', 'standards', 'certification', 'mission', 'portal', 'food safety', 'intellectual property'])) {
      topicId = 'government_initiatives';
      rationale = `GS1 Current Affairs question on Government Policies, Initiatives & Standards (${rawTopic}).`;
    } else if (hasAny(rtLower, ['nobel', 'science and environment in the news']) || stemAndStatements.includes('nobel prize')) {
      topicId = 'science_and_environment_in_the_news';
      rationale = `GS1 Current Affairs question on Science & Environment in the News (${rawTopic}).`;
    } else if (hasAny(rtLower, ['observance', 'event', 'summit', 'commemoration', 'disputed island', 'current conflict', 'world conflict', 'humanitarian', 'sahel', 'ethnic communities'])) {
      topicId = 'important_places_and_events';
      rationale = `GS1 Current Affairs question on Important Places and Global Events (${rawTopic}).`;
    } else {
      topicId = 'national_and_international_developments';
      rationale = `GS1 Current Affairs & International Relations question (${rawTopic}).`;
    }
  }

  // Add secondary tags when rawTopic spans two domains
  if (rtLower.includes('environment') && TOPIC_META[topicId].subjectId !== 'environment_ecology') {
    secondaryTags.push('Environment and Ecology');
    baseConfidence = 0.86;
  }
  if (rtLower.includes('international') && TOPIC_META[topicId].subjectId !== 'current_affairs_misc') {
    secondaryTags.push('International Relations');
  }
  if (rtLower.includes('agriculture') && topicId !== 'agriculture_and_food_management') {
    secondaryTags.push('Agriculture');
    baseConfidence = 0.87;
  }
  if (rtLower.includes('science') && TOPIC_META[topicId].subjectId !== 'science_technology') {
    secondaryTags.push('Science and Technology');
    baseConfidence = 0.86;
  }

  const meta = TOPIC_META[topicId];
  const subj = SUBJECT_META[meta.subjectId];
  const subtopic = deriveSubtopic(topicId, rawTopic, fullText);

  return {
    paper: subj.paperName,
    paper_type: 'GS1',
    subject_id: meta.subjectId,
    subject: subj.name,
    topic_id: topicId,
    topic: meta.name,
    subtopic_id: subtopic.id,
    subtopic: subtopic.name,
    secondary_tags: [...new Set(secondaryTags)],
    confidence: baseConfidence,
    rationale,
  };
}

function validateStageB(q, stageA, isCsat) {
  const qText = (q.question || q.question_text || q.question_en || q.text || '').trim();
  const statements = Array.isArray(q.statements) ? q.statements.join(' ') : '';
  const exp = (q.explanation || q.explanation_en || q.solution || '').trim();
  const contentText = `${qText} ${statements} ${exp}`.toLowerCase();

  let finalConfidence = stageA.confidence;
  let validationStatus = 'verified';
  const validationNotes = [];
  const secondaryTags = [...stageA.secondary_tags];

  if (isCsat && stageA.paper_type !== 'CSAT') {
    throw new Error(`Paper boundary violation: CSAT question classified as ${stageA.paper_type}`);
  }
  if (!isCsat && stageA.paper_type !== 'GS1') {
    throw new Error(`Paper boundary violation: GS1 question classified as ${stageA.paper_type}`);
  }

  if (q.verification_note) {
    finalConfidence = Math.min(finalConfidence, 0.78);
    validationStatus = 'needs_review';
    validationNotes.push(`Answer key verification note: ${q.verification_note}`);
  }

  if (!isCsat) {
    const hasPolitySignals = hasAny(contentText, ['constitution of india', 'article ', 'parliament', 'supreme court', 'lok sabha', 'rajya sabha', 'fundamental right', 'directive principle', 'governor', 'president of india']);
    const hasEnvSignals = hasAny(contentText, ['iucn', 'national park', 'wildlife sanctuary', 'biosphere reserve', 'biodiversity', 'greenhouse gas', 'climate change', 'ramsar', 'wetland', 'endangered', 'ecosystem', 'pollution']);
    const hasEcoSignals = hasAny(contentText, ['reserve bank of india', 'monetary policy', 'fiscal deficit', 'balance of payments', 'gdp', 'inflation', 'minimum support price', 'sebi', 'treasury bill', 'gst']);
    const hasHistSignals = hasAny(contentText, ['indus valley', 'ashoka', 'maurya', 'gupta', 'mughal', 'vijayanagara', 'sultanate', 'east india company', 'mahatma gandhi', 'indian national congress', 'swadeshi', 'quit india', 'buddhism', 'jainism']);
    const hasSciSignals = hasAny(contentText, ['isro', 'satellite', 'orbit', 'crispr', 'dna', 'vaccine', 'virus', 'missile', 'blockchain', 'artificial intelligence', 'quantum', 'nanotechnology']);
    const hasGeoSignals = hasAny(contentText, ['tributary', 'himalaya', 'western ghats', 'equator', 'tropic of', 'ocean current', 'cyclone', 'monsoon', 'latitude', 'plate tectonic']);

    const signalCount = [hasPolitySignals, hasEnvSignals, hasEcoSignals, hasHistSignals, hasSciSignals, hasGeoSignals].filter(Boolean).length;

    if (signalCount >= 2) {
      if (validationStatus === 'verified') {
        validationStatus = 'verified_cross_tagged';
      }
      finalConfidence = Math.min(finalConfidence, 0.88);
      if (hasPolitySignals && stageA.subject_id !== 'polity_governance') secondaryTags.push('Indian Polity and Governance');
      if (hasEnvSignals && stageA.subject_id !== 'environment_ecology') secondaryTags.push('Environment and Ecology');
      if (hasEcoSignals && stageA.subject_id !== 'economy') secondaryTags.push('Economy');
      if (hasHistSignals && stageA.subject_id !== 'history_culture') secondaryTags.push('History and Culture');
      if (hasSciSignals && stageA.subject_id !== 'science_technology') secondaryTags.push('Science and Technology');
      if (hasGeoSignals && stageA.subject_id !== 'geography') secondaryTags.push('Geography');
    }
  } else {
    const rawTopic = (q.raw_topic || q.topic || '').toLowerCase();
    if (rawTopic.includes('macroeconomics') || (rawTopic.includes('reading comprehension') && stageA.topic_id === 'tables_charts_graphs')) {
      validationNotes.push(`Stage B confirmed correction from mislabeled raw topic "${q.raw_topic || q.topic}" to "${stageA.topic}".`);
    }
  }

  const confidenceBand =
    finalConfidence >= 0.90 ? 'High' : finalConfidence >= 0.70 ? 'Medium' : 'Low';

  return {
    ...stageA,
    secondary_tags: [...new Set(secondaryTags)],
    classification_confidence: Number(finalConfidence.toFixed(2)),
    confidence_band: confidenceBand,
    validation_status: validationStatus,
    validation_notes: validationNotes.length > 0 ? validationNotes.join(' | ') : null,
  };
}

const files = fs.readdirSync(pyqsDir).filter((f) => f.endsWith('.json')).sort();

const summary = {
  totalQuestions: 0,
  byPaper: { GS1: 0, CSAT: 0 },
  byYear: {},
  bySubject: {},
  byTopic: {},
  byConfidenceBand: { High: 0, Medium: 0, Low: 0 },
  byValidationStatus: { verified: 0, verified_cross_tagged: 0, needs_review: 0 },
  reclassifiedFromRaw: [],
  reviewQueue: [],
};

const backupSnapshot = originalSnapshot || {};

for (const file of files) {
  const fullPath = path.join(pyqsDir, file);
  const raw = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const meta = raw.meta || {};

  const yearMatch = file.match(/20\d{2}/) || (meta.exam && String(meta.exam).match(/20\d{2}/));
  const year = meta.year || (yearMatch ? parseInt(yearMatch[0], 10) : 2025);

  const isCsat =
    (meta.paper && meta.paper.toLowerCase().includes('csat')) ||
    (meta.paper && meta.paper.toLowerCase().includes('paper-ii')) ||
    file.toLowerCase().includes('paper2');

  raw.meta = {
    ...meta,
    exam: 'UPSC CSE Prelims',
    year,
    paper: isCsat ? 'General Studies Paper II (CSAT)' : 'General Studies Paper I',
    paper_type: isCsat ? 'CSAT' : 'GS1',
  };

  const passagesMap = new Map();
  if (Array.isArray(raw.passages)) {
    for (const p of raw.passages) {
      if (p.id && p.text) passagesMap.set(p.id, p.text);
      if (Array.isArray(p.question_numbers)) {
        for (const qn of p.question_numbers) passagesMap.set(`q_${qn}`, p.text);
      }
    }
  }

  if (!backupSnapshot[file]) backupSnapshot[file] = [];

  (raw.questions || []).forEach((q, idx) => {
    const qNum = q.number || q.question_number || q.q_no || idx + 1;
    const savedOrig = backupSnapshot[file].find((item) => item.qNum === qNum);
    const originalTopic = savedOrig ? savedOrig.original_topic : (q.raw_topic || q.topic || '');

    if (!savedOrig) {
      backupSnapshot[file].push({
        qNum,
        original_topic: originalTopic,
        original_subject: q.subject || null,
      });
    }

    q.raw_topic = originalTopic;

    const stageA = classifyStageA(q, isCsat, passagesMap, qNum, originalTopic);
    const verified = validateStageB(q, stageA, isCsat);

    q.id = q.id || `upsc_${year}_${verified.paper_type.toLowerCase()}_q${qNum}`;
    q.exam = 'UPSC CSE Prelims';
    q.year = year;
    q.paper = verified.paper;
    q.paper_type = verified.paper_type;
    q.subject_id = verified.subject_id;
    q.subject = verified.subject;
    q.topic_id = verified.topic_id;
    q.topic = verified.topic;
    q.subtopic_id = verified.subtopic_id;
    q.subtopic = verified.subtopic;
    q.secondary_tags = verified.secondary_tags;
    q.classification_confidence = verified.classification_confidence;
    q.confidence_band = verified.confidence_band;
    q.classification_rationale = verified.rationale;
    q.validation_status = verified.validation_status;
    if (verified.validation_notes) {
      q.validation_notes = verified.validation_notes;
    }

    summary.totalQuestions++;
    summary.byPaper[verified.paper_type]++;
    const yKey = `${year} (${verified.paper_type})`;
    summary.byYear[yKey] = (summary.byYear[yKey] || 0) + 1;
    summary.bySubject[`[${verified.paper_type}] ${verified.subject}`] =
      (summary.bySubject[`[${verified.paper_type}] ${verified.subject}`] || 0) + 1;
    summary.byTopic[`[${verified.paper_type}] ${verified.subject} → ${verified.topic}`] =
      (summary.byTopic[`[${verified.paper_type}] ${verified.subject} → ${verified.topic}`] || 0) + 1;
    summary.byConfidenceBand[verified.confidence_band]++;
    summary.byValidationStatus[verified.validation_status]++;

    if (originalTopic !== verified.topic) {
      summary.reclassifiedFromRaw.push({
        id: q.id,
        year,
        paper: verified.paper_type,
        qNum,
        rawTopic: originalTopic,
        newSubject: verified.subject,
        newTopic: verified.topic,
        newSubtopic: verified.subtopic,
      });
    }

    if (verified.validation_status === 'needs_review' || verified.confidence_band !== 'High') {
      summary.reviewQueue.push({
        id: q.id,
        file,
        year,
        paper: verified.paper_type,
        qNum,
        subject: verified.subject,
        topic: verified.topic,
        subtopic: verified.subtopic,
        rawTopic: originalTopic,
        confidence: verified.classification_confidence,
        band: verified.confidence_band,
        status: verified.validation_status,
        note: verified.validation_notes || verified.rationale,
      });
    }
  });

  fs.writeFileSync(fullPath, JSON.stringify(raw, null, 2) + '\n', 'utf8');

  const toImportPath = path.join(pyqsToImportDir, file);
  if (fs.existsSync(toImportPath)) {
    fs.writeFileSync(toImportPath, JSON.stringify(raw, null, 2) + '\n', 'utf8');
  }
}

if (!fs.existsSync(snapshotPath)) {
  fs.writeFileSync(snapshotPath, JSON.stringify(backupSnapshot, null, 2), 'utf8');
}

const reportPath = path.resolve(__dirname, 'classification_audit_report.json');
fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2), 'utf8');

console.log('=== REFINED TWO-STAGE CLASSIFICATION & VALIDATION COMPLETE ===');
console.log(`Total Questions Classified & Validated: ${summary.totalQuestions}`);
console.log('By Paper:', summary.byPaper);
console.log('By Confidence Band:', summary.byConfidenceBand);
console.log('By Validation Status:', summary.byValidationStatus);
console.log(`Normalized / Reclassified from Raw Topic strings: ${summary.reclassifiedFromRaw.length} / ${summary.totalQuestions}`);
console.log('\n=== COUNTS BY SUBJECT ===');
Object.entries(summary.bySubject)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log(`  ${k}: ${v}`));

console.log('\n=== COUNTS BY TOPIC ===');
Object.entries(summary.byTopic)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .forEach(([k, v]) => console.log(`  ${k}: ${v}`));

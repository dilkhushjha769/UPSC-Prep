/**
 * Canonical UPSC Civil Services Prelims Taxonomy
 * Hierarchy: Exam → Year → Paper → Subject → Topic → Subtopic → Question
 */

export type CanonicalPaperCode = 'GS1' | 'CSAT';
export type CanonicalPaperName = 'General Studies Paper I' | 'General Studies Paper II (CSAT)';
export type ConfidenceBand = 'High' | 'Medium' | 'Low';
export type ValidationStatus = 'verified' | 'verified_cross_tagged' | 'needs_review';

export interface TaxonomySubtopic {
  id: string;
  name: string;
  keywords: string[];
}

export interface TaxonomyTopic {
  id: string;
  subjectId: string;
  paper: CanonicalPaperCode;
  name: string;
  code: string;
  description: string;
  subtopics: TaxonomySubtopic[];
}

export interface TaxonomySubject {
  id: string;
  paper: CanonicalPaperCode;
  paperName: CanonicalPaperName;
  name: string;
  shortName: string;
  iconName: string;
  accentColor: string;
  lightBg: string;
  topics: TaxonomyTopic[];
}

export const UPSC_PRELIMS_TAXONOMY: TaxonomySubject[] = [
  // ============================================================================
  // GENERAL STUDIES PAPER I (GS1)
  // ============================================================================
  {
    id: 'history_culture',
    paper: 'GS1',
    paperName: 'General Studies Paper I',
    name: 'History and Culture',
    shortName: 'History & Culture',
    iconName: 'library-outline',
    accentColor: '#D97706',
    lightBg: '#FEF3C7',
    topics: [
      {
        id: 'ancient_indian_history',
        subjectId: 'history_culture',
        paper: 'GS1',
        name: 'Ancient Indian History',
        code: 'HIS-01',
        description: 'Prehistory, Indus Valley Civilization, Vedic Age, Mahajanapadas, Mauryan, Post-Mauryan, Gupta & Sangam periods.',
        subtopics: [
          { id: 'aih_ivc_prehistory', name: 'Prehistory & Indus Valley Civilization', keywords: ['harappa', 'mohenjo', 'dholavira', 'lothal', 'kalibangan', 'rakhigarhi', 'indus valley', 'chalcolithic', 'neolithic', 'paleolithic', 'kot diji', 'chanhudaro'] },
          { id: 'aih_vedic_mahajanapadas', name: 'Vedic Age & Mahajanapadas', keywords: ['rigveda', 'atharvaveda', 'samaveda', 'yajurveda', 'upanishad', 'vedic', 'mahajanapada', 'magadha', 'sabha', 'samiti', 'kshetra'] },
          { id: 'aih_mauryan_post_mauryan', name: 'Mauryan & Post-Mauryan Empires', keywords: ['ashoka', 'maurya', 'kautilya', 'arthashastra', 'edict', 'inscriptions', 'satavahana', 'kushana', 'kanishka', 'shunga', 'indo-greek', 'kharavela'] },
          { id: 'aih_gupta_post_gupta', name: 'Gupta & Post-Gupta Period', keywords: ['gupta', 'samudragupta', 'chandragupta', 'harsha', 'harshavardhana', 'vardhana', 'vishti', 'ghatika', 'hundi', 'palas', 'pratiharas', 'rashtrakutas'] },
          { id: 'aih_sangam_south_india', name: 'Sangam Age & Ancient South India', keywords: ['sangam', 'chera', 'chola', 'pandya', 'pallava', 'muziris', 'korkai', 'poompuhar', 'aryadeva', 'dignaga', 'nathamuni'] },
          { id: 'aih_inscriptions_coins_terms', name: 'Ancient Administration, Terms, Coins & Travelers', keywords: ['inscription', 'epigraphy', 'numismatics', 'coins', 'hsuan tsang', 'xuanzang', 'fa-hien', 'megasthenes', 'eripatti', 'taniyurs', 'kulyavapa', 'dronavapa'] },
        ],
      },
      {
        id: 'medieval_indian_history',
        subjectId: 'history_culture',
        paper: 'GS1',
        name: 'Medieval Indian History',
        code: 'HIS-02',
        description: 'Early Medieval dynasties, Delhi Sultanate, Vijayanagara & Bahmani Empires, Mughal Empire, and regional kingdoms.',
        subtopics: [
          { id: 'mih_early_medieval_cholas', name: 'Early Medieval Dynasties & Imperial Cholas', keywords: ['chola', 'rajaraja', 'rajendra', 'paramara', 'chandela', 'solanki', 'kakatiya', 'hoysala', 'yadava', 'tripartite'] },
          { id: 'mih_delhi_sultanate', name: 'Delhi Sultanate Administration & Society', keywords: ['sultanate', 'iltutmish', 'balban', 'alauddin khilji', 'tughlaq', 'lodi', 'iqta', 'amiran-i-sada', 'diwan-i', 'fawazil', 'barani'] },
          { id: 'mih_vijayanagara_bahmani', name: 'Vijayanagara & Bahmani Kingdoms', keywords: ['vijayanagara', 'krishnadevaraya', 'harihara', 'bukka', 'bahmani', 'amara-nayaka', 'abdur razzaq', 'nuniz', 'paes', 'bhatkal'] },
          { id: 'mih_mughal_maratha', name: 'Mughal Empire, Marathas & Regional Kingdoms', keywords: ['mughal', 'babur', 'humayun', 'akbar', 'jahangir', 'shah jahan', 'aurangzeb', 'mansabdari', 'jagirdari', 'zamindar', 'maratha', 'shivaji', 'peshwa', 'ahom', 'aurang', 'banian', 'mirasidar'] },
        ],
      },
      {
        id: 'modern_indian_history',
        subjectId: 'history_culture',
        paper: 'GS1',
        name: 'Modern Indian History',
        code: 'HIS-03',
        description: 'European advent, British colonial policies, land revenue systems, socio-religious reforms, and constitutional acts.',
        subtopics: [
          { id: 'mod_european_british_expansion', name: 'Advent of Europeans & British Expansion', keywords: ['east india company', 'portuguese', 'dutch', 'french', 'carnatic', 'plassey', 'buxar', 'subsidiary alliance', 'doctrine of lapse', 'anglo-mysore', 'anglo-maratha', 'anglo-sikh'] },
          { id: 'mod_land_revenue_economic_impact', name: 'Colonial Economic Policies & Land Revenue Systems', keywords: ['permanent settlement', 'ryotwari', 'mahalwari', 'cornwallis', 'thomas munro', 'drain of wealth', 'dadabhai naoroji', 'deindustrialization', 'famine', 'indentured'] },
          { id: 'mod_socio_religious_reforms', name: 'Socio-Religious Reform Movements', keywords: ['brahmo samaj', 'raja ram mohan roy', 'arya samaj', 'ishwar chandra vidyasagar', 'jyotirao phule', 'satyashodhak', 'theosophical', 'aligarh', 'vivekananda', 'periyar', 'ambedkar'] },
          { id: 'mod_peasant_tribal_uprisings', name: 'Peasant, Tribal & Civil Uprisings', keywords: ['santhal', 'munda', 'birsa munda', 'ulghulan', 'indigo revolt', 'pabna', 'deccan riots', 'moplah', 'tebhaga', 'bardoli', 'ekka', 'sanyasi'] },
          { id: 'mod_constitutional_acts_education', name: 'Constitutional Acts, Education & Press under British Rule', keywords: ['charter act', 'regulating act', 'pitt', 'government of india act 1858', '1909', '1919', '1935', 'minto-morley', 'montagu-chelmsford', 'wood despatch', 'macaulay', 'vernacular press', 'ilbert bill', 'hunter commission', 'sadler'] },
        ],
      },
      {
        id: 'indian_national_movement',
        subjectId: 'history_culture',
        paper: 'GS1',
        name: 'Indian National Movement',
        code: 'HIS-04',
        description: 'Revolt of 1857, INC sessions, Swadeshi, Gandhian mass movements, revolutionary nationalism, and Independence.',
        subtopics: [
          { id: 'inm_1857_early_nationalism', name: 'Revolt of 1857 & Moderate-Extremist Phase', keywords: ['1857', 'indian national congress', 'moderates', 'extremists', 'surat split', 'indian association', 'surendranath banerjee', 'gokhale', 'tilak'] },
          { id: 'inm_swadeshi_home_rule', name: 'Swadeshi Movement, Home Rule & Lucknow Pact', keywords: ['swadeshi', 'partition of bengal', '1905', 'home rule', 'annie besant', 'lucknow pact', 'ghadar', 'komagata maru'] },
          { id: 'inm_gandhian_movements', name: 'Gandhian Mass Movements (NCM, CDM, Quit India)', keywords: ['mahatma gandhi', 'champaran', 'kheda', 'ahmedabad', 'rowlatt', 'jallianwala', 'khilafat', 'non-cooperation', 'civil disobedience', 'dandi', 'salt satyagraha', 'gandhi-irwin', 'round table', 'poona pact', 'quit india', '1942'] },
          { id: 'inm_revolutionary_left_ina', name: 'Revolutionary Movement, Trade Unions, INA & Transfer of Power', keywords: ['bhagat singh', 'hsra', 'anushilan', 'kakori', 'chittagong', 'subhas chandra bose', 'ina', 'azad hind', 'royal indian navy', 'cripps', 'wavell', 'cabinet mission', 'mountbatten', 'nehru report', 'august offer', 'desher katha'] },
        ],
      },
      {
        id: 'art_and_culture',
        subjectId: 'history_culture',
        paper: 'GS1',
        name: 'Art and Culture',
        code: 'HIS-05',
        description: 'Indian philosophical schools, Buddhism & Jainism doctrines, Bhakti & Sufi traditions, festivals, and heritage.',
        subtopics: [
          { id: 'ac_buddhism_jainism', name: 'Buddhism & Jainism Philosophy & Sects', keywords: ['buddha', 'buddhism', 'mahayana', 'hinayana', 'theravada', 'vajrayana', 'bodhisattva', 'maitreya', 'parmita', 'sthaviravadins', 'mahasanghikas', 'lokottaravadin', 'jain', 'jainism', 'tirthankara', 'mahavira', 'svetambara', 'digambara', 'anekantavada', 'syadvada', 'sthanakvasi'] },
          { id: 'ac_philosophy_bhakti_sufi', name: 'Indian Philosophical Schools, Bhakti & Sufi Movements', keywords: ['nyaya', 'vaisheshika', 'samkhya', 'yoga', 'mimamsa', 'vedanta', 'advaita', 'vishishtadvaita', 'shankaracharya', 'ramanujacharya', 'madhvacharya', 'nimbarka', 'vallabhacharya', 'bhakti', 'sufi', 'chishti', 'suhrawardi', 'kabir', 'nanak', 'mirabai', 'basavanna', 'lingayat'] },
          { id: 'ac_festivals_calendars_gi', name: 'Festivals, Calendars, GI Tags & Cultural Heritage', keywords: ['saka', 'vikram samvat', 'calendar', 'festival', 'hornbill', 'chapchar kut', 'kalamkari', 'patola', 'sujni', 'upada', 'unesco intangible', 'garba', 'kumbh'] },
        ],
      },
      {
        id: 'architecture_sculpture_painting',
        subjectId: 'history_culture',
        paper: 'GS1',
        name: 'Architecture, Sculpture and Painting',
        code: 'HIS-06',
        description: 'Cave architecture, Nagara/Dravida/Vesara temples, stupas, sculptural schools, and mural/miniature paintings.',
        subtopics: [
          { id: 'asp_cave_stupa_sculpture', name: 'Stupas, Rock-Cut Caves & Sculptural Schools', keywords: ['stupa', 'sanchi', 'amaravati', 'bharhut', 'ajanta', 'ellora', 'elephanta', 'karle', 'bhaja', 'kanheri', 'udayagiri', 'barabar', 'gandhara', 'mathura', 'yaksha', 'mahabalipuram', 'mamallapuram'] },
          { id: 'asp_temple_indo_islamic', name: 'Temple Architecture & Indo-Islamic Monuments', keywords: ['nagara', 'dravida', 'vesara', 'khajuraho', 'konark', 'modhera', 'somnath', 'brihadisvara', 'chola bronze', 'chausath yogini', 'mitakshara', 'fatehpur sikri', 'buland darwaza', 'gol gumbaz', 'qutub'] },
          { id: 'asp_paintings_visual_arts', name: 'Mural, Miniature & Folk Paintings', keywords: ['painting', 'mural', 'miniature', 'pahari', 'kangra', 'basohli', 'kishangarh', 'bani thani', 'mughal painting', 'madhubani', 'warli', 'pattachitra', 'lepakshi', 'bagh', 'sittanavasal'] },
        ],
      },
      {
        id: 'literature_music_dance',
        subjectId: 'history_culture',
        paper: 'GS1',
        name: 'Literature, Music and Dance',
        code: 'HIS-07',
        description: 'Classical Sanskrit, Pali, Prakrit & regional literature, classical & folk dances, music, and theatre.',
        subtopics: [
          { id: 'lmd_classical_regional_literature', name: 'Ancient, Medieval & Regional Literature', keywords: ['kalidasa', 'visakhadatta', 'banabhatta', 'ashvaghosha', 'bhasa', 'shudraka', 'panini', 'patanjali', 'natyashastra', 'arthashastra', 'tirukkural', 'silappadikaram', 'manimekalai', 'amirkhusrau', 'tulsidas', 'buranji', 'avadhana', 'malfuzat'] },
          { id: 'lmd_music_dance_theatre', name: 'Classical & Folk Dances, Music & Theatre', keywords: ['bharatanatyam', 'kathak', 'kathakali', 'kuchipudi', 'odissi', 'manipuri', 'mohiniyattam', 'sattriya', 'hindustani', 'carnatic', 'dhrupad', 'khayal', 'thumri', 'tansen', 'tyagaraja', 'yakshagana', 'therukoothu', 'puppet'] },
        ],
      },
    ],
  },

  // ============================================================================
  // GEOGRAPHY (GS1)
  // ============================================================================
  {
    id: 'geography',
    paper: 'GS1',
    paperName: 'General Studies Paper I',
    name: 'Geography',
    shortName: 'Geography',
    iconName: 'earth-outline',
    accentColor: '#0284C7',
    lightBg: '#E0F2FE',
    topics: [
      {
        id: 'physical_geography',
        subjectId: 'geography',
        paper: 'GS1',
        name: 'Physical Geography',
        code: 'GEO-01',
        description: 'Solar system, Earth motions, latitude/longitude, seasons, soils, and general physical systems.',
        subtopics: [
          { id: 'pg_earth_solar_motions', name: 'Earth Motions, Insolation, Solstices & Time Zones', keywords: ['solstice', 'equinox', 'tropic of cancer', 'latitude', 'longitude', 'international date line', 'coriolis', 'insolation', 'albedo', 'magnetic field', 'solar flare'] },
          { id: 'pg_soils_biomes', name: 'Soils, Biomes & Natural Vegetation', keywords: ['podzol', 'chernozem', 'laterite', 'alluvial', 'black soil', 'regur', 'savanna', 'taiga', 'tundra', 'steppe', 'equatorial forest', 'tropical rainforest', 'deciduous'] },
        ],
      },
      {
        id: 'indian_geography',
        subjectId: 'geography',
        paper: 'GS1',
        name: 'Indian Geography',
        code: 'GEO-02',
        description: 'Physiography of India, Himalayan & Peninsular river systems, lakes, passes, and Indian climate.',
        subtopics: [
          { id: 'ig_physiography_mountains', name: 'Physiographic Divisions, Mountains, Peaks & Passes', keywords: ['himalaya', 'western ghats', 'eastern ghats', 'aravalli', 'vindhya', 'satpura', 'nilgiri', 'amarkantak', 'siachen', 'nubra', 'baralacha', 'nathu la', 'zanskar', 'pir panjal', 'andaman', 'barren island'] },
          { id: 'ig_rivers_lakes_drainage', name: 'Indian River Systems, Tributaries & Lakes', keywords: ['ganga', 'brahmaputra', 'indus', 'jhelum', 'chenab', 'ravi', 'beas', 'sutlej', 'godavari', 'krishna', 'cauvery', 'kaveri', 'narmada', 'tapti', 'mahanadi', 'teesta', 'chambal', 'son', 'luni', 'chilika', 'pulicat', 'kolleru', 'wular', 'loktak', 'sambhar', 'pangong'] },
        ],
      },
      {
        id: 'world_geography',
        subjectId: 'geography',
        paper: 'GS1',
        name: 'World Geography',
        code: 'GEO-03',
        description: 'World continents, mountain ranges, deserts, major rivers, seas, lakes, and straits.',
        subtopics: [
          { id: 'wg_continents_rivers_lakes', name: 'World Rivers, Lakes, Deserts & Mountain Ranges', keywords: ['mekong', 'danube', 'volga', 'thames', 'nile', 'congo', 'zambesi', 'niger', 'amazon', 'mississippi', 'lake victoria', 'lake tanganyika', 'baikal', 'aral sea', 'dead sea', 'caspian', 'red sea', 'black sea', 'mediterranean', 'andes', 'alps', 'rockies', 'atacama', 'sahara', 'gobi'] },
        ],
      },
      {
        id: 'climatology',
        subjectId: 'geography',
        paper: 'GS1',
        name: 'Climatology',
        code: 'GEO-04',
        description: 'Atmosphere structure, temperature inversion, pressure belts, winds, jet streams, cyclones, clouds, and monsoon.',
        subtopics: [
          { id: 'clim_atmosphere_winds_clouds', name: 'Atmosphere, Winds, Clouds & Temperature Dynamics', keywords: ['troposphere', 'stratosphere', 'isotherm', 'temperature inversion', 'dew', 'fog', 'clouds', 'cirrus', 'cumulus', 'stratus', 'nimbus', 'trade winds', 'westerlies', 'roaring forties', 'jet stream'] },
          { id: 'clim_cyclones_monsoon_enso', name: 'Cyclones, Monsoon, El Nino, IOD & MJO', keywords: ['cyclone', 'tropical cyclone', 'extratropical', 'monsoon', 'el nino', 'la nina', 'indian ocean dipole', 'iod', 'madden-julian', 'mjo', 'polar vortex', 'heat wave'] },
        ],
      },
      {
        id: 'oceanography',
        subjectId: 'geography',
        paper: 'GS1',
        name: 'Oceanography',
        code: 'GEO-05',
        description: 'Ocean relief, temperature, salinity, ocean currents, tides, coral reefs, and marine resources.',
        subtopics: [
          { id: 'ocean_currents_tides_salinity', name: 'Ocean Currents, Tides, Temperature & Marine Relief', keywords: ['ocean current', 'gulf stream', 'kuroshio', 'oyashio', 'humboldt', 'peru current', 'agulhas', 'benguela', 'canary', 'salinity', 'thermocline', 'tides', 'upwelling', 'continental shelf', 'mid-oceanic ridge', 'freshwater', 'ice cap'] },
        ],
      },
      {
        id: 'geomorphology',
        subjectId: 'geography',
        paper: 'GS1',
        name: 'Geomorphology',
        code: 'GEO-06',
        description: 'Earth interior, seismic waves, plate tectonics, earthquakes, volcanoes, rocks, and landforms.',
        subtopics: [
          { id: 'geom_tectonics_volcanoes_quakes', name: 'Earth Interior, Plate Tectonics, Earthquakes & Volcanism', keywords: ['earthquake', 'seismic', 'p-wave', 's-wave', 'epicentre', 'hypocentre', 'volcano', 'pyroclastic', 'magma', 'lava', 'plate tectonics', 'subduction', 'mantle', 'crust', 'igneous', 'sedimentary', 'metamorphic', 'weathering', 'karst', 'glacial'] },
        ],
      },
      {
        id: 'resources_and_industries',
        subjectId: 'geography',
        paper: 'GS1',
        name: 'Resources and Industries',
        code: 'GEO-07',
        description: 'Mineral & energy resources, critical minerals, coal, petroleum, renewable sites, and industrial corridors.',
        subtopics: [
          { id: 'ri_minerals_energy_resources', name: 'Metallic, Non-Metallic & Critical Minerals and Energy', keywords: ['coal', 'iron ore', 'bauxite', 'copper', 'mica', 'monazite', 'thorium', 'uranium', 'lithium', 'cobalt', 'nickel', 'rare earth', 'ilmenite', 'rutile', 'zircon', 'shale gas', 'coalbed methane', 'minor mineral', 'sand mining', 'chromite', 'kyanite', 'sillimanite'] },
        ],
      },
      {
        id: 'population_and_human_geography',
        subjectId: 'geography',
        paper: 'GS1',
        name: 'Population and Human Geography',
        code: 'GEO-08',
        description: 'Demographics, fertility, census indicators, migration, urbanization, and human settlements.',
        subtopics: [
          { id: 'phg_demography_settlements', name: 'Demographic Transition, Fertility, Migration & Tribes', keywords: ['fertility rate', 'replacement level', 'demographic', 'population', 'census', 'sex ratio', 'urbanization', 'pvtg', 'changpa', 'gond', 'bhil', 'jarawa', 'onge', 'shompen', 'toda'] },
        ],
      },
      {
        id: 'mapping_and_places_in_news',
        subjectId: 'geography',
        paper: 'GS1',
        name: 'Mapping and Places in News',
        code: 'GEO-09',
        description: 'Countries, borders, conflict zones, straits, seas, and geographical locations frequently in the news.',
        subtopics: [
          { id: 'mpn_borders_conflicts_regions', name: 'Borders, Conflict Zones & Geopolitical Regions in News', keywords: ['border', 'shares a border', 'north sea', 'red sea', 'black sea', 'caspian sea', 'mediterranean', 'donbas', 'kachin', 'tigray', 'nagorno-karabakh', 'zaporizhzhia', 'kherson', 'golan heights', 'kuril', 'panjshir', 'sahel', 'levant', 'catalonia', 'crimea', 'mindanao', 'oromia', 'kivu', 'sumed'] },
        ],
      },
    ],
  },

  // ============================================================================
  // INDIAN POLITY AND GOVERNANCE (GS1)
  // ============================================================================
  {
    id: 'polity_governance',
    paper: 'GS1',
    paperName: 'General Studies Paper I',
    name: 'Indian Polity and Governance',
    shortName: 'Polity & Governance',
    iconName: 'shield-checkmark-outline',
    accentColor: '#EA580C',
    lightBg: '#FFEDD5',
    topics: [
      {
        id: 'constitution',
        subjectId: 'polity_governance',
        paper: 'GS1',
        name: 'Constitution',
        code: 'POL-01',
        description: 'Historical background, Constituent Assembly, Schedules, Amendments (Art. 368), Citizenship, and Emergency provisions.',
        subtopics: [
          { id: 'const_schedules_amendments_emergency', name: 'Schedules, Constitutional Amendments, Citizenship & Emergency', keywords: ['schedule', 'first schedule', 'ninth schedule', 'amendment', 'article 368', 'constituent assembly', 'citizenship', 'domicile', 'emergency', 'article 352', 'article 356', 'president rule', 'article 360', 'constitution day'] },
        ],
      },
      {
        id: 'preamble_and_constitutional_features',
        subjectId: 'polity_governance',
        paper: 'GS1',
        name: 'Preamble and Constitutional Features',
        code: 'POL-02',
        description: 'Preamble philosophy, Basic Structure doctrine, Constitutionalism, Rule of Law, Liberty, Equality, and Parliamentary system.',
        subtopics: [
          { id: 'pcf_preamble_basic_structure_theory', name: 'Preamble, Basic Structure, Constitutionalism & Liberty', keywords: ['preamble', 'basic structure', 'kesavananda', 'minerva mills', 'constitutionalism', 'limited government', 'rule of law', 'liberty', 'equality', 'fraternity', 'sovereign', 'secular', 'republic', 'parliamentary system', 'cabinet form', 'state'] },
        ],
      },
      {
        id: 'fundamental_rights_and_duties',
        subjectId: 'polity_governance',
        paper: 'GS1',
        name: 'Fundamental Rights and Duties',
        code: 'POL-03',
        description: 'Part III (Articles 12–35), Right to Equality, Liberty, Privacy, Writs, and Part IV-A Fundamental Duties.',
        subtopics: [
          { id: 'frd_part3_rights_writs_duties', name: 'Fundamental Rights (Art. 12–35), Writs & Fundamental Duties (Art. 51A)', keywords: ['fundamental right', 'fundamental duties', 'article 14', 'article 15', 'article 16', 'article 17', 'untouchability', 'article 18', 'article 19', 'article 20', 'article 21', 'right to privacy', 'puttaswamy', 'article 22', 'preventive detention', 'article 23', 'article 24', 'article 25', 'article 29', 'article 30', 'article 32', 'writ', 'habeas corpus', 'mandamus', 'certiorari', 'prohibition', 'quo warranto', 'right to property', 'article 300a'] },
        ],
      },
      {
        id: 'directive_principles',
        subjectId: 'polity_governance',
        paper: 'GS1',
        name: 'Directive Principles',
        code: 'POL-04',
        description: 'Part IV (Articles 36–51), Socialist, Gandhian & Liberal principles, Uniform Civil Code, and FR-DPSP harmony.',
        subtopics: [
          { id: 'dpsp_part4_provisions', name: 'Directive Principles of State Policy (Art. 36–51)', keywords: ['directive principles', 'dpsp', 'part iv', 'article 37', 'article 38', 'article 39', 'concentration of wealth', 'article 40', 'article 44', 'uniform civil code', 'article 48', 'article 50', 'separation of judiciary', 'article 51', 'welfare state'] },
        ],
      },
      {
        id: 'parliament',
        subjectId: 'polity_governance',
        paper: 'GS1',
        name: 'Parliament',
        code: 'POL-05',
        description: 'Lok Sabha & Rajya Sabha, Speaker, legislative bills, Money Bills, budget, committees, motions, and privileges.',
        subtopics: [
          { id: 'parl_houses_bills_committees', name: 'Houses of Parliament, Presiding Officers, Bills & Committees', keywords: ['parliament', 'lok sabha', 'rajya sabha', 'speaker', 'deputy speaker', 'chairman', 'money bill', 'article 109', 'article 110', 'joint sitting', 'article 108', 'Consolidated Fund', 'contingency fund', 'public account', 'parliamentary committee', 'public accounts committee', 'estimates committee', 'departmental standing', 'question hour', 'zero hour', 'no-confidence', 'censure', 'adjournment', 'prorogation', 'dissolution', 'whip', 'private member bill', 'parole', 'state legislative assembly'] },
        ],
      },
      {
        id: 'president_and_vice_president',
        subjectId: 'polity_governance',
        paper: 'GS1',
        name: 'President and Vice-President',
        code: 'POL-06',
        description: 'Election, impeachment, executive/legislative/ordinance/pardoning powers of President, Vice-President, and Governor.',
        subtopics: [
          { id: 'pvp_president_vp_governor', name: 'President, Vice-President & Governor Powers and Election', keywords: ['president of india', 'electoral college', 'impeachment', 'ordinance', 'article 123', 'pardoning power', 'article 72', 'veto', 'vice-president', 'governor', 'article 153', 'article 200', 'discretionary power'] },
        ],
      },
      {
        id: 'prime_minister_and_council_of_ministers',
        subjectId: 'polity_governance',
        paper: 'GS1',
        name: 'Prime Minister and Council of Ministers',
        code: 'POL-07',
        description: 'Prime Minister, Union Council of Ministers, collective responsibility, Cabinet Secretariat, and Chief Minister.',
        subtopics: [
          { id: 'pm_com_collective_responsibility', name: 'PM, Council of Ministers, 91st Amendment & Cabinet Secretariat', keywords: ['prime minister', 'council of ministers', 'collective responsibility', 'article 74', 'article 75', '91st amendment', '15 percent', 'cabinet secretariat', 'cabinet committee', 'chief minister', 'chief secretary'] },
        ],
      },
      {
        id: 'judiciary',
        subjectId: 'polity_governance',
        paper: 'GS1',
        name: 'Judiciary',
        code: 'POL-08',
        description: 'Supreme Court, High Courts, judicial review, collegium, impeachment of judges, contempt of court, and ADR.',
        subtopics: [
          { id: 'jud_sc_hc_judicial_review', name: 'Supreme Court, High Courts, Judicial Review & Legal Services', keywords: ['supreme court', 'high court', 'chief justice', 'collegium', 'njac', 'judicial review', 'article 136', 'article 142', 'article 143', 'curative petition', 'contempt of court', 'impeachment of judge', 'judges inquiry act', 'adhoc judge', 'retired judge', 'lok adalat', 'nalsa', 'legal services', 'gram nyayalaya', 'judicial custody', 'police custody', 'advocate', 'bar council'] },
        ],
      },
      {
        id: 'federalism_and_centre_state_relations',
        subjectId: 'polity_governance',
        paper: 'GS1',
        name: 'Federalism and Centre-State Relations',
        code: 'POL-09',
        description: 'Federal features, Seventh Schedule lists, Inter-State relations, and Fifth & Sixth Schedule areas.',
        subtopics: [
          { id: 'fed_centre_state_schedules', name: 'Federalism, Seventh Schedule & 5th/6th Schedule Administration', keywords: ['federal', 'federalism', 'centre-state', 'union list', 'state list', 'concurrent list', 'residuary power', 'article 249', 'inter-state council', 'zonal council', 'fifth schedule', 'sixth schedule', 'scheduled area', 'tribal advisory council', 'autonomous district'] },
        ],
      },
      {
        id: 'constitutional_bodies',
        subjectId: 'polity_governance',
        paper: 'GS1',
        name: 'Constitutional Bodies',
        code: 'POL-10',
        description: 'Election Commission, UPSC, Finance Commission, CAG, Attorney General, and National Commissions.',
        subtopics: [
          { id: 'cb_ec_fc_cag_ag_commissions', name: 'EC, Finance Commission, CAG, Attorney General & Commissions', keywords: ['election commission', 'finance commission', 'comptroller and auditor general', 'cag', 'attorney general', 'solicitor general', 'advocate general', 'upsc', 'ncsc', 'ncst', 'ncbc', '102nd amendment', 'gst council'] },
        ],
      },
      {
        id: 'statutory_and_regulatory_bodies',
        subjectId: 'polity_governance',
        paper: 'GS1',
        name: 'Statutory and Regulatory Bodies',
        code: 'POL-11',
        description: 'NHRC, NITI Aayog, Lokpal, CVC, CIC, Law Commission, and statutory commissions/boards.',
        subtopics: [
          { id: 'srb_nhrc_niti_lokpal_boards', name: 'NHRC, NITI Aayog, Lokpal, Tribunals & Statutory Authorities', keywords: ['human rights commission', 'nhrc', 'niti aayog', 'lokpal', 'cvc', 'information commission', 'law commission', 'delimitation commission', 'bar council', 'tea board', 'coffee board', 'rubber board', 'spices board', 'central ground water authority', 'compensatory afforestation'] },
        ],
      },
      {
        id: 'elections_and_representation',
        subjectId: 'polity_governance',
        paper: 'GS1',
        name: 'Elections and Representation',
        code: 'POL-12',
        description: 'Representation of the People Acts (1950/1951), Tenth Schedule (Anti-Defection), voting rights, and electoral reforms.',
        subtopics: [
          { id: 'er_rpa_antidefection_voting', name: 'RPA 1950/1951, Anti-Defection Law (10th Schedule) & Elections', keywords: ['representation of the people act', 'anti-defection', 'tenth schedule', 'disqualification', 'office of profit', 'model code of conduct', 'evm', 'vvpat', 'nota', 'postal ballot', 'delimitation', 'proportional representation', 'first past the post'] },
        ],
      },
      {
        id: 'local_government',
        subjectId: 'polity_governance',
        paper: 'GS1',
        name: 'Local Government',
        code: 'POL-13',
        description: '73rd & 74th Constitutional Amendments, Panchayati Raj Institutions, Gram Sabha, PESA Act, and Municipalities.',
        subtopics: [
          { id: 'lg_pri_ulb_pesa', name: 'Panchayati Raj (73rd Amendment), Municipalities (74th) & PESA', keywords: ['panchayat', 'panchayati raj', '73rd amendment', '74th amendment', 'gram sabha', 'pesa', 'district planning committee', 'metropolitan planning', 'state election commission', 'state finance commission', 'municipality', 'urban local'] },
        ],
      },
      {
        id: 'governance_and_public_policy',
        subjectId: 'polity_governance',
        paper: 'GS1',
        name: 'Governance and Public Policy',
        code: 'POL-14',
        description: 'Good governance, RTI, e-governance, Aadhaar, social legislation, civil services, and public policy.',
        subtopics: [
          { id: 'gpp_rti_digital_welfare_laws', name: 'RTI, E-Governance, Social Legislation & Public Administration', keywords: ['right to information', 'rti', 'aadhaar', 'digital signature', 'e-governance', 'citizen charter', 'social audit', 'maternity benefit', 'domestic violence', 'juvenile', 'pocso', 'prison', 'misa', 'pota', 'tada', 'uapa', 'official secrets', 'bureaucracy', 'civil services'] },
        ],
      },
    ],
  },

  // ============================================================================
  // ECONOMY (GS1)
  // ============================================================================
  {
    id: 'economy',
    paper: 'GS1',
    paperName: 'General Studies Paper I',
    name: 'Economy',
    shortName: 'Economy',
    iconName: 'trending-up-outline',
    accentColor: '#059669',
    lightBg: '#D1FAE5',
    topics: [
      {
        id: 'national_income_and_economic_growth',
        subjectId: 'economy',
        paper: 'GS1',
        name: 'National Income and Economic Growth',
        code: 'ECO-01',
        description: 'GDP, GNP, GVA, per capita income, capital formation, ICOR, savings, and economic planning.',
        subtopics: [
          { id: 'nieg_gdp_gva_capital_formation', name: 'GDP, GVA, Capital Formation, ICOR & Economic Growth', keywords: ['gross domestic product', 'gdp', 'gross value added', 'gva', 'national income', 'per capita', 'capital formation', 'icor', 'capital-output ratio', 'potential gdp', 'recession', 'economic growth', 'five-year plan', 'purchasing power parity', 'ppp'] },
        ],
      },
      {
        id: 'inflation',
        subjectId: 'economy',
        paper: 'GS1',
        name: 'Inflation',
        code: 'ECO-02',
        description: 'WPI, CPI, inflation targeting, demand-pull vs cost-push inflation, and inflation effects on debtors/creditors.',
        subtopics: [
          { id: 'inf_cpi_wpi_targeting', name: 'CPI, WPI, Deflator & Inflation Dynamics', keywords: ['inflation', 'wholesale price index', 'wpi', 'consumer price index', 'cpi', 'deflation', 'disinflation', 'stagflation', 'core inflation', 'headline inflation', 'base effect', 'price stability'] },
        ],
      },
      {
        id: 'banking_and_monetary_policy',
        subjectId: 'economy',
        paper: 'GS1',
        name: 'Banking and Monetary Policy',
        code: 'ECO-03',
        description: 'RBI functions, MPC, Repo/Reverse Repo, CRR, SLR, OMO, money supply (M1–M4), money multiplier, banks, and NPAs.',
        subtopics: [
          { id: 'bmp_rbi_mpc_money_supply', name: 'RBI, Monetary Policy Tools, Money Supply & Money Multiplier', keywords: ['reserve bank of india', 'rbi', 'monetary policy', 'repo rate', 'reverse repo', 'marginal standing facility', 'msf', 'bank rate', 'cash reserve ratio', 'crr', 'statutory liquidity ratio', 'slr', 'open market operations', 'omo', 'sterilization', 'money multiplier', 'high powered money', 'reserve money', 'm1', 'm2', 'm3', 'legal tender', 'digital rupee', 'cbdc'] },
          { id: 'bmp_banks_npa_financial_inclusion', name: 'Commercial & Cooperative Banks, NBFCs, NPAs & Payment Systems', keywords: ['commercial bank', 'urban cooperative bank', 'regional rural bank', 'small finance bank', 'payment bank', 'nbfc', 'non-performing asset', 'npa', 'bad bank', 'insolvency', 'ibc', 'sarfaesi', 'basel', 'capital adequacy', 'priority sector lending', 'lead bank', 'bank board bureau', 'inter-creditor', 'npci', 'upi', 'bhim', 'rupay', 'atm'] },
        ],
      },
      {
        id: 'fiscal_policy_and_budget',
        subjectId: 'economy',
        paper: 'GS1',
        name: 'Fiscal Policy and Budget',
        code: 'ECO-04',
        description: 'Union Budget, Revenue vs Capital accounts, Fiscal/Revenue/Primary deficits, FRBM Act, and public debt.',
        subtopics: [
          { id: 'fpb_budget_deficits_debt', name: 'Union Budget, Deficits, FRBM Act & Public Debt', keywords: ['fiscal deficit', 'revenue deficit', 'primary deficit', 'effective revenue deficit', 'monetized deficit', 'frbm', 'fiscal responsibility', 'revenue expenditure', 'capital expenditure', 'capital receipt', 'revenue receipt', 'disinvestment', 'public debt', 'ways and means advances', 'tax expenditure', 'votable'] },
        ],
      },
      {
        id: 'taxation',
        subjectId: 'economy',
        paper: 'GS1',
        name: 'Taxation',
        code: 'ECO-05',
        description: 'Direct & Indirect taxes, GST structure, Laffer curve, tax buoyancy, Angel tax, and international taxation.',
        subtopics: [
          { id: 'tax_direct_indirect_gst', name: 'Direct Taxes, GST, Tax Buoyancy & International Tax Rules', keywords: ['goods and services tax', 'gst', 'income tax', 'corporate tax', 'minimum alternate tax', 'equalization levy', 'angel tax', 'tax-to-gdp', 'tax buoyancy', 'tax elasticity', 'progressive tax', 'regressive', 'customs duty', 'excise duty', 'base erosion', 'beps', 'global minimum tax', 'pillar two'] },
        ],
      },
      {
        id: 'money_and_financial_markets',
        subjectId: 'economy',
        paper: 'GS1',
        name: 'Money and Financial Markets',
        code: 'ECO-06',
        description: 'Money market (T-bills, Call money, CP, CD) and Capital market (G-Secs, Bonds, Equities, SEBI, InvITs, REITs).',
        subtopics: [
          { id: 'mfm_money_capital_markets_gsec', name: 'Money Market, Capital Market, G-Secs, Bonds & SEBI', keywords: ['treasury bill', 't-bill', 'call money', 'commercial paper', 'certificate of deposit', 'government securities', 'g-sec', 'retail direct', 'sovereign gold bond', 'inflation-indexed bond', 'masala bond', 'convertible bond', 'zero coupon', 'sebi', 'stock exchange', 'nifty', 'sensex', 'mutual fund', 'exchange traded fund', 'etf', 'invit', 'reit', 'alternative investment fund', 'venture capital', 'angel investor', 'insider trading', 'short selling', 'beta'] },
        ],
      },
      {
        id: 'external_sector_and_balance_of_payments',
        subjectId: 'economy',
        paper: 'GS1',
        name: 'External Sector and Balance of Payments',
        code: 'ECO-07',
        description: 'Balance of Payments (Current & Capital accounts), NEER/REER, exchange rate, FDI/FPI, Forex reserves, and WTO.',
        subtopics: [
          { id: 'es_bop_exchange_trade_fdi', name: 'Balance of Payments, Exchange Rate (NEER/REER), FDI/FPI & Trade', keywords: ['balance of payments', 'current account', 'capital account', 'trade balance', 'balance of trade', 'neer', 'reer', 'effective exchange rate', 'devaluation', 'depreciation', 'convertibility', 'foreign direct investment', 'fdi', 'foreign portfolio', 'fpi', 'external commercial borrowing', 'external debt', 'foreign exchange reserves', 'forex', 'special drawing rights', 'sdr', 'trims', 'trips', 'agreement on agriculture', 'amber box', 'blue box', 'green box', 'most favoured nation', 'free trade agreement', 'currency swap', 'swift'] },
        ],
      },
      {
        id: 'agriculture_and_food_management',
        subjectId: 'economy',
        paper: 'GS1',
        name: 'Agriculture and Food Management',
        code: 'ECO-08',
        description: 'MSP, FRP, CACP, FCI, PDS, buffer stock, agricultural credit, Kisan Credit Card, cropping systems, and irrigation.',
        subtopics: [
          { id: 'afm_msp_pds_crops_credit', name: 'MSP, Procurement, PDS, Agri-Credit & Cropping Systems', keywords: ['minimum support price', 'msp', 'fair and remunerative price', 'frp', 'cacp', 'food corporation of india', 'fci', 'public distribution system', 'pds', 'buffer stock', 'kisan credit card', 'e-nam', 'apmc', 'fertilizer', 'urea', 'neem-coated', 'micro-irrigation', 'fertigation', 'zero tillage', 'system of rice intensification', 'sri', 'kharif', 'rabi', 'pulses', 'oilseeds', 'millets', 'sugarcane', 'cotton', 'jute', 'tea', 'coffee', 'niger seed'] },
        ],
      },
      {
        id: 'infrastructure',
        subjectId: 'economy',
        paper: 'GS1',
        name: 'Infrastructure',
        code: 'ECO-09',
        description: 'Transport, ports, national waterways, railways, energy sector, coal/power policies, and PPP models.',
        subtopics: [
          { id: 'infra_transport_energy_ppp', name: 'Transport, Ports, Waterways, Energy & PPP Infrastructure', keywords: ['infrastructure', 'public-private partnership', 'ppp', 'viability gap funding', 'swiss challenge', 'hybrid annuity', 'national investment and infrastructure fund', 'niif', 'dedicated freight corridor', 'bharatmala', 'sagarmala', 'udan', 'inland waterway', 'major port', 'smart city', 'discom', 'uday', 'petroleum and natural gas'] },
        ],
      },
      {
        id: 'employment_and_poverty',
        subjectId: 'economy',
        paper: 'GS1',
        name: 'Employment and Poverty',
        code: 'ECO-10',
        description: 'Employment indicators, LFPR, casualization, gig economy, poverty estimation, and human capital.',
        subtopics: [
          { id: 'ep_labour_unemployment_poverty', name: 'Unemployment, Labour Force, Poverty Estimation & Inequality', keywords: ['unemployment', 'disguised unemployment', 'labour force', 'worker population', 'casual worker', 'gig economy', 'poverty line', 'tendulkar', 'rangarajan', 'multidimensional poverty', 'gini', 'lorenz curve', 'human capital', 'demographic dividend', 'care economy'] },
        ],
      },
      {
        id: 'government_schemes_and_economic_development',
        subjectId: 'economy',
        paper: 'GS1',
        name: 'Government Schemes and Economic Development',
        code: 'ECO-11',
        description: 'Flagship socio-economic schemes, financial inclusion, MSMEs, SHGs, skill development, and inclusive growth.',
        subtopics: [
          { id: 'gsed_schemes_msme_inclusion', name: 'Flagship Welfare Schemes, MSMEs, SHGs & Financial Inclusion', keywords: ['jan dhan', 'pmjdy', 'mudra', 'stand up india', 'atal pension', 'pm-kisan', 'fasal bima', 'krishi sinchayee', 'soil health card', 'svamitva', 'svanidhi', 'ayushman bharat', 'poshan', 'ujjwala', 'saubhagya', 'jal jeevan', 'mgnrega', 'self-help group', 'shg', 'msme', 'production linked incentive', 'pli', 'startup india', 'make in india', 'national pension system', 'shram yogi'] },
        ],
      },
    ],
  },

  // ============================================================================
  // ENVIRONMENT AND ECOLOGY (GS1)
  // ============================================================================
  {
    id: 'environment_ecology',
    paper: 'GS1',
    paperName: 'General Studies Paper I',
    name: 'Environment and Ecology',
    shortName: 'Environment & Ecology',
    iconName: 'leaf-outline',
    accentColor: '#16A34A',
    lightBg: '#DCFCE7',
    topics: [
      {
        id: 'ecosystems',
        subjectId: 'environment_ecology',
        paper: 'GS1',
        name: 'Ecosystems',
        code: 'ENV-01',
        description: 'Ecological concepts, food webs, trophic levels, biogeochemical cycles, wetlands, mangroves, and succession.',
        subtopics: [
          { id: 'eco_trophic_cycles_wetlands', name: 'Food Webs, Biogeochemical Cycles, Wetlands & Peatlands', keywords: ['ecosystem', 'food chain', 'food web', 'trophic', 'detritivore', 'decomposer', 'primary productivity', 'ecological succession', 'niche', 'ecotone', 'edge effect', 'nitrogen cycle', 'nitrogen fixation', 'phosphorus cycle', 'carbon cycle', 'sulphur cycle', 'wetland', 'peatland', 'mangrove', 'coral reef', 'kelp', 'symbiotic', 'mycorrhiza', 'lichen'] },
        ],
      },
      {
        id: 'biodiversity',
        subjectId: 'environment_ecology',
        paper: 'GS1',
        name: 'Biodiversity',
        code: 'ENV-02',
        description: 'Biodiversity gradients, hotspots, invasive alien species, and plant/fungal/insect diversity.',
        subtopics: [
          { id: 'bio_hotspots_invasive_flora', name: 'Biodiversity Hotspots, Invasive Species & Floral Diversity', keywords: ['biodiversity', 'hotspot', 'endemic', 'invasive', 'prosopis juliflora', 'lantana', 'water hyacinth', 'parthenium', 'senna spectabilis', 'red sanders', 'himalayan nettle', 'guchhi', 'moringa', 'tamarind', 'mahua', 'teak', 'bamboo', 'palmolein', 'sea buckthorn'] },
        ],
      },
      {
        id: 'protected_areas',
        subjectId: 'environment_ecology',
        paper: 'GS1',
        name: 'Protected Areas',
        code: 'ENV-03',
        description: 'National Parks, Wildlife Sanctuaries, Tiger Reserves, Biosphere Reserves, and Ramsar sites.',
        subtopics: [
          { id: 'pa_np_tr_br_ramsar', name: 'National Parks, Tiger Reserves, Biosphere Reserves & Ramsar Sites', keywords: ['national park', 'wildlife sanctuary', 'tiger reserve', 'biosphere reserve', 'conservation reserve', 'community reserve', 'critical wildlife habitat', 'critical tiger habitat', 'eco-sensitive zone', 'ramsar', 'montreux', 'kaziranga', 'keoladeo', 'sundarbans', 'manas', 'namdapha', 'pakke', 'bhitarkanika', 'similipal', 'corbett', 'kanha', 'bandipur', 'nagarhole', 'mudumalai', 'sathyamangalam', 'periyar', 'silent valley', 'papikonda', 'nagarjunasagar', 'kuno', 'desert national park', 'agastyamala', 'panna', 'hokera', 'renuka', 'rudrasagar', 'sasthamkotta', 'bakhira', 'thol', 'wadhwana', 'sultanpur'] },
        ],
      },
      {
        id: 'species_and_conservation',
        subjectId: 'environment_ecology',
        paper: 'GS1',
        name: 'Species and Conservation',
        code: 'ENV-04',
        description: 'IUCN Red List species, mammals, birds, reptiles, amphibians, marine fauna, animal behaviour, and conservation projects.',
        subtopics: [
          { id: 'sc_fauna_iucn_behaviour', name: 'Indian Fauna, IUCN Status, Animal Behaviour & Conservation Projects', keywords: ['iucn', 'endangered', 'critically endangered', 'great indian bustard', 'gharial', 'gangetic dolphin', 'irrawaddy dolphin', 'dugong', 'sea cow', 'olive ridley', 'sangai', 'khangchendzonga', 'lion-tailed macaque', 'nilgiri tahr', 'snow leopard', 'asiatic lion', 'one-horned rhino', 'cheetah', 'elephant', 'pangolin', 'hedgehog', 'marmot', 'red panda', 'sloth bear', 'orangutan', 'bonobo', 'lemur', 'golden mahseer', 'ceylon frogmouth', 'coppersmith barbet', 'waggle dance', 'honeybee', 'cicada', 'butterfly', 'marsupial', 'viviparous', 'nocturnal'] },
        ],
      },
      {
        id: 'climate_change',
        subjectId: 'environment_ecology',
        paper: 'GS1',
        name: 'Climate Change',
        code: 'ENV-05',
        description: 'Greenhouse gases, global warming potential, carbon sequestration, blue carbon, carbon markets, and IPCC.',
        subtopics: [
          { id: 'cc_ghg_sequestration_carbon', name: 'Greenhouse Gases, Carbon Sequestration, Carbon Markets & IPCC', keywords: ['climate change', 'global warming', 'greenhouse gas', 'methane', 'nitrous oxide', 'sulfur hexafluoride', 'perfluorocarbon', 'hydrofluorocarbon', 'carbon dioxide', 'carbon sequestration', 'carbon capture', 'blue carbon', 'social cost of carbon', 'carbon credit', 'carbon footprint', 'clean development mechanism', 'ipcc', 'net zero', 'permafrost', 'ocean acidification', 'cirrus cloud thinning'] },
        ],
      },
      {
        id: 'pollution',
        subjectId: 'environment_ecology',
        paper: 'GS1',
        name: 'Pollution',
        code: 'ENV-06',
        description: 'Air & water pollution, fly ash, heavy metals, smog, acid rain, waste management rules, and bioremediation.',
        subtopics: [
          { id: 'pol_air_water_waste_bioremediation', name: 'Air/Water Pollution, Fly Ash, Waste Rules & Bioremediation', keywords: ['pollution', 'air quality index', 'pm2.5', 'pm10', 'sulfur dioxide', 'nitrogen oxide', 'ozone', 'smog', 'acid rain', 'fly ash', 'red mud', 'copper slag', 'microbeads', 'microplastics', 'bisphenol', 'triclosan', 'pfas', 'perfluoroalkyl', 'heavy metal', 'mercury', 'lead', 'arsenic', 'uranium contamination', 'bod', 'biological oxygen demand', 'eutrophication', 'algal bloom', 'bioremediation', 'bio-mining', 'pyrolysis', 'plasma gasification', 'e-waste', 'extended producer responsibility', 'solid waste'] },
        ],
      },
      {
        id: 'environmental_laws_and_institutions',
        subjectId: 'environment_ecology',
        paper: 'GS1',
        name: 'Environmental Laws and Institutions',
        code: 'ENV-07',
        description: 'Wildlife Protection Act 1972, Environment Protection Act 1986, Forest Rights Act 2006, Biodiversity Act 2002, and NGT.',
        subtopics: [
          { id: 'eli_wpa_epa_fra_ngt', name: 'WPA 1972, EPA 1986, FRA 2006, BDA 2002, NGT & Statutory Bodies', keywords: ['wildlife protection act', 'schedule i', 'vermin', 'environment protection act', 'forest conservation act', 'forest rights act', 'biological diversity act', 'national green tribunal', 'ngt', 'central pollution control board', 'cpcb', 'animal welfare board', 'national tiger conservation authority', 'ntca', 'wildlife crime control', 'genetic engineering appraisal', 'geac', 'Indian forest act', 'coastal regulation zone'] },
        ],
      },
      {
        id: 'international_environmental_conventions',
        subjectId: 'environment_ecology',
        paper: 'GS1',
        name: 'International Environmental Conventions',
        code: 'ENV-08',
        description: 'UNFCCC, Paris Agreement, CBD, CITES, CMS, Ramsar, UNCCD, Minamata, Montreal/Kigali, and global environmental funds.',
        subtopics: [
          { id: 'iec_unfccc_cbd_cites_treaties', name: 'UNFCCC, Paris Agreement, CBD, CITES, Ramsar & Global Alliances', keywords: ['unfccc', 'kyoto protocol', 'paris agreement', 'intended nationally determined', 'indc', 'momentum for change', 'convention on biological diversity', 'cbd', 'nagoya', 'cartagena', 'aichi', 'kunming-montreal', 'global biodiversity framework', 'cites', 'bonn convention', 'cms', 'unccd', 'ramsar convention', 'wetlands international', 'birdlife international', 'traffic', 'iucn', 'global environment facility', 'green climate fund', 'redd+', 'climate action tracker', 'climate group', 'ep100', 'under2 coalition', 'talanoa', 'new york declaration on forests', 'common carbon metric', 'climate smart agriculture', 'conservation agriculture'] },
        ],
      },
      {
        id: 'renewable_energy',
        subjectId: 'environment_ecology',
        paper: 'GS1',
        name: 'Renewable Energy',
        code: 'ENV-09',
        description: 'Solar energy, wind power, green hydrogen, fuel cells, biofuels, coal gasification, and International Solar Alliance.',
        subtopics: [
          { id: 're_solar_hydrogen_biofuels', name: 'Solar, Green Hydrogen, Fuel Cells, Biofuels & Clean Tech', keywords: ['solar', 'photovoltaic', 'international solar alliance', 'wind energy', 'green hydrogen', 'fuel cell', 'hydrogen-enriched cng', 'biofuel', 'ethanol', 'biodiesel', 'jatropha', 'biomass', 'biogas', 'syngas', 'coal gasification', 'geothermal', 'pumped storage'] },
        ],
      },
      {
        id: 'sustainable_development',
        subjectId: 'environment_ecology',
        paper: 'GS1',
        name: 'Sustainable Development',
        code: 'ENV-10',
        description: 'SDGs, Club of Rome, Rio Summit, Agenda 21, greenwashing, circular economy, and sustainable agriculture.',
        subtopics: [
          { id: 'sd_sdgs_circular_green_economy', name: 'SDGs, Rio Principles, Greenwashing & Sustainable Practices', keywords: ['sustainable development', 'sustainable development goals', 'sdg', 'rio+', 'agenda 21', 'brundtland', 'limits to growth', 'club of rome', 'greenwashing', 'circular economy', 'ecological footprint', 'earth hour', 'permacculture', 'zero budget natural farming', 'mulching', 'cover crop'] },
        ],
      },
    ],
  },

  // ============================================================================
  // SCIENCE AND TECHNOLOGY (GS1)
  // ============================================================================
  {
    id: 'science_technology',
    paper: 'GS1',
    paperName: 'General Studies Paper I',
    name: 'Science and Technology',
    shortName: 'Science & Tech',
    iconName: 'flask-outline',
    accentColor: '#7C3AED',
    lightBg: '#EDE9FE',
    topics: [
      {
        id: 'physics_in_everyday_life',
        subjectId: 'science_technology',
        paper: 'GS1',
        name: 'Physics in Everyday Life',
        code: 'SCI-01',
        description: 'Optics, electromagnetic waves, nuclear fission/fusion, radioactivity, lasers, LEDs, and physical phenomena.',
        subtopics: [
          { id: 'pel_optics_nuclear_waves', name: 'Electromagnetic Spectrum, Nuclear Physics, Lasers & Everyday Physics', keywords: ['nuclear reactor', 'heavy water', 'fissile', 'fusion', 'iter', 'radioactivity', 'electromagnetic', 'infrared', 'ultraviolet', 'microwave', 'radio wave', 'laser', 'ligo', 'led', 'oled', 'sodium lamp', 'fiber optics', 'total internal reflection', 'accelerometer', 'gyroscope', 'piezoelectric', 'pressure cooker'] },
        ],
      },
      {
        id: 'chemistry_in_everyday_life',
        subjectId: 'science_technology',
        paper: 'GS1',
        name: 'Chemistry in Everyday Life',
        code: 'SCI-02',
        description: 'Chemicals in daily life, polymers, batteries, materials, catalysts, water purification, and industrial chemistry.',
        subtopics: [
          { id: 'cel_materials_batteries_polymers', name: 'Polymers, Batteries, Everyday Chemicals & Industrial Materials', keywords: ['lithium-ion', 'battery', 'polyethylene', 'polycarbonate', 'pet', 'teflon', 'hydrogel', 'activated carbon', 'zeolite', 'cloud seeding', 'silver iodide', 'potassium bromate', 'trans fat', 'hydrogenation', 'palm oil', 'soap', 'detergent', 'bleaching', 'nitric acid', 'sulfuric acid'] },
        ],
      },
      {
        id: 'biology_and_human_health',
        subjectId: 'science_technology',
        paper: 'GS1',
        name: 'Biology and Human Health',
        code: 'SCI-03',
        description: 'Cell biology, human physiology, viral/bacterial/parasitic diseases, vaccines, immunity, AMR, and nutrition.',
        subtopics: [
          { id: 'bhh_cells_diseases_vaccines_amr', name: 'Cell Biology, Infectious Diseases, Vaccines, Immunity & AMR', keywords: ['plant cell', 'animal cell', 'mitochondria', 'endoplasmic', 't-cell', 'b-cell', 'antibody', 'vaccine', 'mrna vaccine', 'conjugate vaccine', 'pneumococcal', 'zika', 'ebola', 'nipah', 'dengue', 'malaria', 'kala-azar', 'tuberculosis', 'hepatitis', 'hiv', 'h1n1', 'coronaviruses', 'sars', 'mers', 'ace2', 'adenovirus', 'retrovirus', 'antimicrobial resistance', 'antibiotic', 'colistin', 'probiotic', 'prebiotic', 'vitamin', 'nitric oxide', 'wolbachia'] },
        ],
      },
      {
        id: 'biotechnology',
        subjectId: 'science_technology',
        paper: 'GS1',
        name: 'Biotechnology',
        code: 'SCI-04',
        description: 'Genetics, DNA/RNA, CRISPR-Cas9, GM crops, mitochondrial replacement, stem cells, cloning, and bioinformatics.',
        subtopics: [
          { id: 'biotech_crispr_gm_dna_sequencing', name: 'CRISPR Gene Editing, GM Crops, DNA Profiling & Stem Cells', keywords: ['crispr', 'cas9', 'gene editing', 'genome sequencing', 'indiagenome', 'earth biogenome', 'transcriptome', 'proteomics', 'dna barcoding', 'environmental dna', 'edna', 'microsatellite', 'aerial metagenomics', 'somatic cell nuclear transfer', 'pronuclear transfer', 'mitochondrial replacement', 'three-parent', 'stem cell', 'induced pluripotent', 'car-t', 'rna interference', 'rnai', 'gm mustard', 'dmh-11', 'bt brinjal', 'bt cotton', 'bollchen', 'bollgard', 'golden rice', 'biofilm', 'bio-decomposer'] },
        ],
      },
      {
        id: 'space_technology',
        subjectId: 'science_technology',
        paper: 'GS1',
        name: 'Space Technology',
        code: 'SCI-05',
        description: 'Orbits, PSLV/GSLV, ISRO & global space missions, navigation systems (NavIC), telescopes, and astrophysics.',
        subtopics: [
          { id: 'space_isro_missions_astrophysics', name: 'Space Missions, Launch Vehicles, Satellite Orbits & Astrophysics', keywords: ['isro', 'pslv', 'gslv', 'cryogenic', 'scramjet', 'orbit', 'geostationary', 'geosynchronous', 'sun-synchronous', 'low earth orbit', 'lagrange point', 'chandrayaan', 'mangalyaan', 'aditya-l1', 'gaganyaan', 'astrosat', 'navic', 'irnss', 'gps', 'cassini', 'juno', 'voyager', 'new horizons', 'osiris-rex', 'james webb', 'hubble', 'event horizon', 'lisa', 'evolved lisa', 'gravitational wave', 'black hole', 'singularity', 'pulsar', 'neutron star', 'white dwarf', 'cepheid', 'nebula', 'neutrino', 'belle ii', 'goldilocks zone'] },
        ],
      },
      {
        id: 'information_technology_and_ai',
        subjectId: 'science_technology',
        paper: 'GS1',
        name: 'Information Technology and AI',
        code: 'SCI-06',
        description: 'Artificial Intelligence, 5G/LTE, Li-Fi, IoT, Blockchain, Web 3.0, Quantum computing, and cybersecurity.',
        subtopics: [
          { id: 'it_ai_telecom_blockchain_cyber', name: 'AI, Telecom (5G/Li-Fi), Blockchain, Web 3.0, Quantum & Cybersecurity', keywords: ['artificial intelligence', 'machine learning', 'neural network', 'gpt', 'deepfake', 'blockchain', 'cryptocurrency', 'non-fungible token', 'nft', 'web 3.0', 'metaverse', 'saas', 'software as a service', 'cloud computing', 'edge computing', 'open-source', 'cowin', 'digilocker', 'diksha', 'arogya setu', 'quantum computing', 'qubit', '5g', 'lte', 'volte', 'li-fi', 'visible light communication', 'near field communication', 'nfc', 'rfid', 'bluetooth', 'wi-fi', 'internet of things', 'iot', 'cyber', 'wannacry', 'petya', 'eternalblue', 'pegasus', 'spyware', 'ransomware', 'public key infrastructure', 'virtual private network', 'vpn'] },
        ],
      },
      {
        id: 'defence_technology',
        subjectId: 'science_technology',
        paper: 'GS1',
        name: 'Defence Technology',
        code: 'SCI-07',
        description: 'Missiles (ballistic, cruise, air defence), fighter aircraft, UAVs/drones, submarines, stealth, and radars.',
        subtopics: [
          { id: 'def_missiles_drones_stealth_naval', name: 'Missile Systems, Fighter Aircraft, Drones, Stealth & Naval Tech', keywords: ['missile', 'ballistic', 'cruise missile', 'agni', 'prithvi', 'brahmos', 'akash', 'nag', 'trishul', 'astra', 's-400', 'thaad', 'iron dome', 'patriot', 'hypersonic', 'fractional orbital', 'stealth', 'radar', 'rafale', 'tejas', 'chinook', 'apache', 'prana', 'drone', 'uav', 'loitering munition', 'ins vikrant', 'arihant', 'scorpene', 'kalvari', 'torpedo', 'maritime domain'] },
        ],
      },
      {
        id: 'emerging_technologies',
        subjectId: 'science_technology',
        paper: 'GS1',
        name: 'Emerging Technologies',
        code: 'SCI-08',
        description: 'Nanotechnology, carbon nanotubes, graphene, 3D printing, robotics, and advanced materials.',
        subtopics: [
          { id: 'et_nanotech_3dprinting_robotics', name: 'Nanotechnology, Carbon Materials, 3D Printing & Robotics', keywords: ['nanotechnology', 'nanoparticle', 'carbon nanotube', 'graphene', 'carbon fiber', '3d printing', 'additive manufacturing', 'robotics', 'autonomous', 'driverless', 'hyperloop', 'superconductor', 'metamaterial'] },
        ],
      },
    ],
  },

  // ============================================================================
  // CURRENT AFFAIRS AND MISCELLANEOUS (GS1)
  // ============================================================================
  {
    id: 'current_affairs_misc',
    paper: 'GS1',
    paperName: 'General Studies Paper I',
    name: 'Current Affairs and Miscellaneous',
    shortName: 'Current Affairs & IR',
    iconName: 'globe-outline',
    accentColor: '#2563EB',
    lightBg: '#DBEAFE',
    topics: [
      {
        id: 'national_and_international_developments',
        subjectId: 'current_affairs_misc',
        paper: 'GS1',
        name: 'National and International Developments',
        code: 'CA-01',
        description: 'International diplomacy, bilateral agreements, nuclear treaties, geopolitics, sports, awards, and national events.',
        subtopics: [
          { id: 'nid_diplomacy_treaties_awards_sports', name: 'International Diplomacy, Security Treaties, Sports & National Awards', keywords: ['bilateral', 'summit', 'declaration', 'non-proliferation', 'npt', 'nsg', 'mtcr', 'wassenaar', 'australia group', 'chemical weapons', 'opcw', 'international criminal court', 'rome statute', 'unclos', 'exclusive economic zone', 'south china sea', 'belt and road', 'ashgabat', 'chabahar', 'instc', 'bharat ratna', 'padma', 'khel ratna', 'arjuna award', 'olympics', 'chess', 'world test championship', 'kho kho'] },
        ],
      },
      {
        id: 'international_organisations',
        subjectId: 'current_affairs_misc',
        paper: 'GS1',
        name: 'International Organisations',
        code: 'CA-02',
        description: 'UN bodies, WTO, IMF, World Bank, G20, BRICS, SCO, ASEAN, GCC, OPEC, AIIB, and multilateral groupings.',
        subtopics: [
          { id: 'io_un_bretton_woods_regional_blocs', name: 'UN System, IMF/World Bank/WTO, G20, BRICS, SCO, ASEAN & Regional Blocs', keywords: ['united nations', 'general assembly', 'security council', 'unesco', 'unicef', 'unep', 'undp', 'unops', 'unclos', 'who', 'ilo', 'fao', 'ifpri', 'imf', 'international monetary fund', 'world bank', 'ibrd', 'ida', 'ifc', 'miga', 'wto', 'world trade organization', 'g20', 'g-20', 'g7', 'brics', 'new development bank', 'aiib', 'asian infrastructure', 'adb', 'asian development bank', 'sco', 'shanghai cooperation', 'asean', 'rcep', 'apec', 'bimstec', 'saarc', 'iora', 'mekong-ganga', 'gcc', 'gulf cooperation', 'oic', 'opec', 'oecd', 'fatf', 'interpol', 'east asia summit', 'arctic council', 'turkic states', 'sahel'] },
        ],
      },
      {
        id: 'reports_and_indices',
        subjectId: 'current_affairs_misc',
        paper: 'GS1',
        name: 'Reports and Indices',
        code: 'CA-03',
        description: 'Major international and national indices, reports, and publications by global & domestic institutions.',
        subtopics: [
          { id: 'ri_global_national_reports', name: 'Global & National Indices and Institutional Reports', keywords: ['index', 'report', 'ease of doing business', 'global hunger index', 'human development index', 'gender inequality', 'global gender gap', 'world economic outlook', 'global financial stability', 'world development report', 'global competitiveness', 'rule of law index', 'corruption perception', 'logistics performance', 'global innovation index', 'press freedom'] },
        ],
      },
      {
        id: 'important_places_and_events',
        subjectId: 'current_affairs_misc',
        paper: 'GS1',
        name: 'Important Places and Events',
        code: 'CA-04',
        description: 'Significant global and domestic events, summits, historical commemorations, and strategic sites.',
        subtopics: [
          { id: 'ipe_events_commemorations', name: 'Global Events, Summits & Strategic Developments', keywords: ['international year of', 'observance', 'commemoration', 'centenary', 'summit', 'conference'] },
        ],
      },
      {
        id: 'government_initiatives',
        subjectId: 'current_affairs_misc',
        paper: 'GS1',
        name: 'Government Initiatives',
        code: 'CA-05',
        description: 'National missions, portals, education/health initiatives, and regulatory frameworks.',
        subtopics: [
          { id: 'gi_national_missions_policies', name: 'National Policies, Missions, Portals & Regulatory Initiatives', keywords: ['national education policy', 'swayam', 'nif', 'vidyanjali', 'nishtha', 'national career service', 'quality council', 'agmark', 'fssai', 'bureau of indian standards', 'trai', 'unnat bharat'] },
        ],
      },
      {
        id: 'science_and_environment_in_the_news',
        subjectId: 'current_affairs_misc',
        paper: 'GS1',
        name: 'Science and Environment in the News',
        code: 'CA-06',
        description: 'Nobel Prizes, contemporary scientific breakthroughs, and newly reported environmental initiatives.',
        subtopics: [
          { id: 'sen_nobel_breakthroughs', name: 'Nobel Prizes & Contemporary Scientific Breakthroughs', keywords: ['nobel prize', 'breakthrough', 'recently in the news'] },
        ],
      },
    ],
  },

  // ============================================================================
  // GENERAL STUDIES PAPER II (CSAT) — STRICTLY SEPARATE FROM GS PAPER I
  // ============================================================================
  {
    id: 'csat_reading_comprehension',
    paper: 'CSAT',
    paperName: 'General Studies Paper II (CSAT)',
    name: 'Reading Comprehension',
    shortName: 'Comprehension',
    iconName: 'book-outline',
    accentColor: '#0284C7',
    lightBg: '#E0F2FE',
    topics: [
      {
        id: 'reading_comprehension',
        subjectId: 'csat_reading_comprehension',
        paper: 'CSAT',
        name: 'Reading Comprehension',
        code: 'CSAT-RC01',
        description: 'Passage-based questions testing logical inference, central idea/crux, underlying assumptions, and implications.',
        subtopics: [
          { id: 'rc_logical_inference', name: 'Logical & Rational Inference / Corollary', keywords: ['inference', 'corollary', 'inferred', 'implied'] },
          { id: 'rc_crux_central_idea', name: 'Crux, Central Idea & Critical Message', keywords: ['crux', 'central idea', 'critical message', 'crucial message', 'main idea', 'sums up'] },
          { id: 'rc_underlying_assumptions', name: 'Underlying Assumptions & Validity', keywords: ['assumption', 'assumptions'] },
          { id: 'rc_implications_conclusions', name: 'Practical Implications, Conclusions & Author View', keywords: ['implication', 'conclusion', 'conclusions', 'statement', 'reflects'] },
        ],
      },
    ],
  },
  {
    id: 'csat_reasoning',
    paper: 'CSAT',
    paperName: 'General Studies Paper II (CSAT)',
    name: 'Logical and Analytical Reasoning',
    shortName: 'Reasoning',
    iconName: 'extension-puzzle-outline',
    accentColor: '#7C3AED',
    lightBg: '#EDE9FE',
    topics: [
      {
        id: 'logical_reasoning',
        subjectId: 'csat_reasoning',
        paper: 'CSAT',
        name: 'Logical Reasoning',
        code: 'CSAT-LR01',
        description: 'Syllogisms, deductive statements, coding-decoding, letter/symbol sequences, clocks, calendars, and cubes/dice.',
        subtopics: [
          { id: 'lr_syllogism_deduction', name: 'Syllogism & Deductive Logic', keywords: ['syllogism', 'all ', 'some ', 'conclusion', 'deductive', 'statement'] },
          { id: 'lr_coding_alphabet_series', name: 'Coding-Decoding, Alphabet & Letter Series', keywords: ['coded as', 'code language', 'coding', 'english alphabet', 'letter series', 'missing letter', 'sequence of letters', 'word'] },
          { id: 'lr_clocks_calendars', name: 'Clocks, Calendars & Date Computation', keywords: ['clock', 'hour hand', 'minute hand', 'calendar', 'leap year', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'day of the week', 'birthday'] },
          { id: 'lr_cubes_dice_spatial', name: 'Cubes, Dice, Mirror Images & Spatial Reasoning', keywords: ['cube', 'dice', 'painted', 'faces', 'mirror image', 'rotated', 'spatial', 'figure', 'matrix', 'triangles'] },
        ],
      },
      {
        id: 'analytical_reasoning',
        subjectId: 'csat_reasoning',
        paper: 'CSAT',
        name: 'Analytical Reasoning',
        code: 'CSAT-LR02',
        description: 'Data sufficiency, seating arrangements, blood relations, direction sense, ranking, and complex logic puzzles.',
        subtopics: [
          { id: 'ar_data_sufficiency', name: 'Data Sufficiency (2-Statement & 3-Statement)', keywords: ['data sufficiency', 's1 and s2', 'statement-i', 'statement-1', 'sufficient to answer'] },
          { id: 'ar_seating_logic_puzzles', name: 'Seating Arrangements, Scheduling & Logic Puzzles', keywords: ['sitting', 'seating', 'circular table', 'row', 'puzzle', 'floor', 'lecture', 'weighing'] },
          { id: 'ar_blood_relations_directions', name: 'Blood Relations & Direction Sense', keywords: ['brother', 'sister', 'mother', 'father', 'wife', 'husband', 'son', 'daughter', 'uncle', 'cousin', 'family', 'north', 'south', 'east', 'west', 'turns left', 'turns right', 'direction'] },
          { id: 'ar_ranking_ordering', name: 'Order, Ranking & Comparison', keywords: ['rank', 'tallest', 'shortest', 'heavier', 'lighter', 'older', 'younger', 'queue', 'position from the top', 'left end'] },
        ],
      },
      {
        id: 'decision_making_problem_solving',
        subjectId: 'csat_reasoning',
        paper: 'CSAT',
        name: 'Decision-Making and Problem-Solving',
        code: 'CSAT-LR03',
        description: 'Interpersonal skills, communication skills, conflict resolution, and conditional rule problem-solving.',
        subtopics: [
          { id: 'dm_interpersonal_problem_solving', name: 'Interpersonal Communication & Problem-Solving', keywords: ['interpersonal', 'communication', 'conflict resolution', 'questionnaire', 'decision', 'problem-solving'] },
        ],
      },
    ],
  },
  {
    id: 'csat_quant_numeracy',
    paper: 'CSAT',
    paperName: 'General Studies Paper II (CSAT)',
    name: 'Quantitative Aptitude and Basic Numeracy',
    shortName: 'Basic Numeracy',
    iconName: 'calculator-outline',
    accentColor: '#059669',
    lightBg: '#D1FAE5',
    topics: [
      {
        id: 'basic_numeracy',
        subjectId: 'csat_quant_numeracy',
        paper: 'CSAT',
        name: 'Basic Numeracy',
        code: 'CSAT-QN01',
        description: 'Number series, linear equations, inequalities, set theory/Venn diagrams, ages, fractions, and geometry/mensuration.',
        subtopics: [
          { id: 'bn_number_series_progressions', name: 'Number Series, AP/GP & Pattern Recognition', keywords: ['number series', 'next term', 'wrong term', 'missing number', 'arithmetic progression', 'geometric progression', 'sequence'] },
          { id: 'bn_algebra_equations_inequalities', name: 'Linear Equations, Inequalities & Algebraic Expressions', keywords: ['equation', 'inequalities', 'x + y', 'integer', 'polynomial', 'maxima', 'minima'] },
          { id: 'bn_sets_venn_ages_fractions', name: 'Set Theory, Venn Diagrams, Ages & Fractions', keywords: ['venn', 'set theory', 'speak english', 'play cricket', 'age of', 'years old', 'fraction', 'numerator', 'denominator', 'recurring decimal'] },
          { id: 'bn_geometry_mensuration', name: 'Geometry, Mensuration & Coordinate Basics', keywords: ['triangle', 'circle', 'rectangle', 'square', 'cylinder', 'cone', 'sphere', 'perimeter', 'area', 'volume', 'diagonal', 'chord', 'collinear', 'chess board', 'tiling'] },
        ],
      },
      {
        id: 'number_systems',
        subjectId: 'csat_quant_numeracy',
        paper: 'CSAT',
        name: 'Number Systems',
        code: 'CSAT-QN02',
        description: 'Divisibility rules, remainder theorem, unit digits/cyclicity, prime numbers, factors, LCM/HCF, and cryptarithmetic.',
        subtopics: [
          { id: 'ns_divisibility_remainders', name: 'Divisibility Rules & Remainder Theorem', keywords: ['remainder', 'divided by', 'divisible by', 'divisibility'] },
          { id: 'ns_unit_digit_exponents', name: 'Unit Digit, Last Digit, Cyclicity & Exponents', keywords: ['unit digit', 'units place', 'last digit', 'power', '2^', '3^', '7^', 'trailing zero', 'number of zeros'] },
          { id: 'ns_primes_factors_lcm_hcf', name: 'Prime Numbers, Factors, Multiples, LCM & HCF', keywords: ['prime', 'composite', 'factor', 'divisor', 'lcm', 'hcf', 'lowest common multiple', 'highest common factor', 'natural number', 'consecutive'] },
          { id: 'ns_digits_cryptarithmetic', name: 'Digit Problems, Place Value & Cryptarithmetic', keywords: ['two-digit', 'three-digit', 'four-digit', 'digit', 'interchanged', 'reversed', 'cryptarithmetic', 'each letter represents'] },
        ],
      },
      {
        id: 'percentages_ratios_proportions',
        subjectId: 'csat_quant_numeracy',
        paper: 'CSAT',
        name: 'Percentages, Ratios and Proportions',
        code: 'CSAT-QN03',
        description: 'Percentage increase/decrease, successive percentages, income-expenditure, ratios, proportions, and partnerships.',
        subtopics: [
          { id: 'prp_percentages', name: 'Percentage Change, Successive Change & Pass/Fail Marks', keywords: ['percent', '%', 'increased by', 'decreased by', 'passing marks', 'voters', 'income', 'expenditure'] },
          { id: 'prp_ratios_proportions_partnership', name: 'Ratios, Proportions, Variations & Partnership', keywords: ['ratio', 'proportion', 'proportional', 'partnership', 'invested', 'share of'] },
        ],
      },
      {
        id: 'averages_and_mixtures',
        subjectId: 'csat_quant_numeracy',
        paper: 'CSAT',
        name: 'Averages and Mixtures',
        code: 'CSAT-QN04',
        description: 'Arithmetic mean, weighted average, replacement changes, mixtures, and alligation.',
        subtopics: [
          { id: 'am_averages_alligation', name: 'Averages, Weighted Mean, Mixtures & Alligation', keywords: ['average', 'mean', 'mixture', 'alligation', 'milk and water', 'vessel', 'bottle', 'concentration', 'diluted'] },
        ],
      },
      {
        id: 'profit_loss_interest',
        subjectId: 'csat_quant_numeracy',
        paper: 'CSAT',
        name: 'Profit, Loss and Interest',
        code: 'CSAT-QN05',
        description: 'Cost price, selling price, marked price, discounts, simple interest, and compound interest.',
        subtopics: [
          { id: 'pli_profit_loss_interest', name: 'Profit & Loss, Discounts, Simple & Compound Interest', keywords: ['profit', 'loss', 'cost price', 'selling price', 'marked price', 'discount', 'simple interest', 'compound interest', 'principal', 'rate of interest'] },
        ],
      },
      {
        id: 'time_speed_distance',
        subjectId: 'csat_quant_numeracy',
        paper: 'CSAT',
        name: 'Time, Speed and Distance',
        code: 'CSAT-QN06',
        description: 'Average speed, relative speed, trains, boats & streams, and circular track races.',
        subtopics: [
          { id: 'tsd_speed_trains_boats_races', name: 'Linear Motion, Trains, Boats & Circular Track Races', keywords: ['speed', 'km/hr', 'km/h', 'm/s', 'distance', 'train', 'platform', 'boat', 'upstream', 'downstream', 'circular track', 'race', 'runs'] },
        ],
      },
      {
        id: 'time_and_work',
        subjectId: 'csat_quant_numeracy',
        paper: 'CSAT',
        name: 'Time and Work',
        code: 'CSAT-QN07',
        description: 'Work efficiency, man-days, alternate day work, and pipes & cisterns.',
        subtopics: [
          { id: 'tw_work_pipes_cisterns', name: 'Work Efficiency, Man-Days & Pipes/Cisterns', keywords: ['complete a piece of work', 'finish the work', 'days to complete', 'efficiency', 'pipe', 'cistern', 'tank', 'tap', 'leak', 'frog'] },
        ],
      },
      {
        id: 'permutations_and_combinations',
        subjectId: 'csat_quant_numeracy',
        paper: 'CSAT',
        name: 'Permutations and Combinations',
        code: 'CSAT-QN08',
        description: 'Fundamental counting principles, arrangements, selections, number/word formation, and grid paths.',
        subtopics: [
          { id: 'pnc_arrangements_selections', name: 'Permutations, Combinations, Counting & Grid Paths', keywords: ['how many ways', 'permutation', 'combination', 'chosen', 'selected', 'arranged', 'committee', 'handshake', 'chessboard', 'grid', 'distinct'] },
        ],
      },
      {
        id: 'probability',
        subjectId: 'csat_quant_numeracy',
        paper: 'CSAT',
        name: 'Probability',
        code: 'CSAT-QN09',
        description: 'Classical probability involving coins, dice, cards, balls in bags, and independent events.',
        subtopics: [
          { id: 'prob_events', name: 'Probability of Events (Coins, Dice, Balls & Selections)', keywords: ['probability', 'at random', 'randomly', 'bag contains', 'tossed', 'coin'] },
        ],
      },
    ],
  },
  {
    id: 'csat_data_interpretation',
    paper: 'CSAT',
    paperName: 'General Studies Paper II (CSAT)',
    name: 'Data Interpretation',
    shortName: 'Data Interpretation',
    iconName: 'bar-chart-outline',
    accentColor: '#D97706',
    lightBg: '#FEF3C7',
    topics: [
      {
        id: 'data_interpretation',
        subjectId: 'csat_data_interpretation',
        paper: 'CSAT',
        name: 'Data Interpretation',
        code: 'CSAT-DI01',
        description: 'Quantitative analysis, growth rates, averages, and logical deductions from statistical datasets.',
        subtopics: [
          { id: 'di_quantitative_analysis', name: 'Statistical Data Analysis & Quantitative Inference', keywords: ['data interpretation', 'average', 'percentage growth', 'following data'] },
        ],
      },
      {
        id: 'tables_charts_graphs',
        subjectId: 'csat_data_interpretation',
        paper: 'CSAT',
        name: 'Tables, Charts and Graphs',
        code: 'CSAT-DI02',
        description: 'Interpretation of multi-variable tables, bar charts, line graphs, and pie charts.',
        subtopics: [
          { id: 'tcg_tables_charts_graphs', name: 'Statistical Tables, Pie Charts, Bar & Line Graphs', keywords: ['table', 'graph', 'pie chart', 'bar chart', 'diagram', 'tele-density'] },
        ],
      },
    ],
  },
];

export const ALL_TAXONOMY_TOPICS: TaxonomyTopic[] = UPSC_PRELIMS_TAXONOMY.flatMap((s) => s.topics);

export function getTaxonomySubjectById(subjectId: string): TaxonomySubject | undefined {
  return UPSC_PRELIMS_TAXONOMY.find((s) => s.id === subjectId);
}

export function getTaxonomyTopicById(topicId: string): TaxonomyTopic | undefined {
  return ALL_TAXONOMY_TOPICS.find((t) => t.id === topicId);
}


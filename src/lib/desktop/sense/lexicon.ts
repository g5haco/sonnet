// Vocabulary for matching window titles to a focus session: stopwords, study words, course-code departments and a
// small subject lexicon. Kept small and plain on purpose: every match has to be explainable to the student.
import type { FocusSessionContext } from "./types";

// Plain English plus browser, site and file boilerplate: never evidence either way.
const STOP = new Set(
  (`a an and are as at be by for from has have how i in into is it its me my of on or our so than that the their them
  then there these this those to was we what when where which who why will with you your about after all also am any
  been before being but can could did do does doing done each few get got had he her here him his if just like make
  more most much no not now off only other out over own same she should some such too under up very via vs want way
  were while would yes yet new tab page home untitled window watch video videos official channel com www http https
  org net edu htm php aspx index online free best top full part finish finishing start starting work working read
  write go going through things stuff today tonight tomorrow due need try last first next rest lots really get let
  prepare preparing understand understanding memorize complete completing submit concept concepts question questions
  topic topics everything focus focused minute minutes hour hours material materials help using use basics basic
  overview important main quick quickly easy simple ultimate versus day days one two three
  general survey advanced applied elementary honors seminar foundations special modern contemporary
  youtube reddit google chrome microsoft edge mozilla firefox brave opera vivaldi arc safari discord wikipedia docs
  sheets drive search gmail inbox outlook spotify premium netflix twitch tiktok instagram facebook twitter
  github gitlab quizlet chegg khan coursera desmos chatgpt claude gemini copilot perplexity notion onenote overleaf
  canvas instructure blackboard moodle brightspace personal profile inprivate incognito sonnet welcome calculator
  settings` +
    // file extensions
    ` ts js tsx jsx py md txt ipynb rs rb yml yaml toml lock log csv doc docx pdf ppt pptx xls xlsx png jpg jpeg gif
  mp4 mkv mp3 exe zip`)
    .split(/\s+/),
);

// Generic study vocabulary. Not topic evidence (it fits every course), but a shared one is weak overlap and any of
// them in a title is an educational signal.
const STUDY = new Set(
  `study studying quiz quizzes exam exams test midterm final finals homework hw assignment assignments notes note
  chapter ch lecture lectures review class course intro introduction principles fundamentals unit week lab project
  paper essay reading problem problems set practice worksheet module modules lesson tutorial explain explained
  explanation guide learn learning syllabus slides textbook solution solutions draft outline prep cram flashcards discussion section grade
  report presentation`.split(/\s+/),
);

// A few dozen terms per common subject. depts: course-code prefixes (BIOL 1610). names: words that name the subject.
// Multi-word entries match as consecutive words.
const SUBJECTS: Record<string, { depts: string; names: string; terms: string }> = {
  biology: {
    depts: "biol bio bisc bsc mcb",
    names: "biology, biological, bio, life science",
    terms: `cell, cellular, mitosis, meiosis, dna, rna, gene, genes, genetics, genome, chromosome, protein, enzyme,
      photosynthesis, cellular respiration, mitochondria, chloroplast, membrane, organelle, ribosome, evolution,
      natural selection, darwin, species, ecology, ecosystem, organism, bacteria, virus, microbiology, metabolism, atp,
      transcription, mutation, allele, heredity, mendel, punnett, phenotype, genotype, osmosis, homeostasis, hormone,
      immune, taxonomy, botany, zoology, biochemistry, crispr, glycolysis, krebs cycle, cytoplasm, eukaryote,
      prokaryote, chlorophyll, cell division, anatomy, physiology,
      citric acid cycle, electron transport chain, oxidative phosphorylation, fermentation, pyruvate, interphase,
      prophase, metaphase, anaphase, telophase, cytokinesis, chromatid, gamete, haploid, diploid, dna replication,
      cell cycle, hardy weinberg, nucleotide, amino acid`,
  },
  chemistry: {
    depts: "chem chm",
    names: "chemistry, chemical, chem, orgo",
    terms: `atom, atomic, molecule, molecular, periodic table, compound, reaction, chemical reaction, stoichiometry,
      mole, molarity, molality, acid, ph, titration, equilibrium, enthalpy, entropy, thermodynamics, kinetics,
      oxidation, redox, electron, proton, neutron, isotope, ion, ionic, covalent, orbital, valence, lewis structure,
      organic chemistry, hydrocarbon, alkane, alkene, polymer, solubility, catalyst, ideal gas, gas laws, avogadro,
      electrochemistry, buffer, nomenclature, spectroscopy, electronegativity, hybridization, chemical bond,
      reactant, limiting reactant, theoretical yield, percent yield, molar mass,
      empirical formula, anode, cathode, electrode, galvanic, voltaic, salt bridge, reduction potential, cell potential,
      half reaction, precipitate, dilution, electrolysis`,
  },
  math: {
    depts: "math mth mat mac",
    names: "math, maths, mathematics, mathematical, calc",
    terms: `calculus, precalculus, algebra, linear algebra, geometry, trigonometry, trig, derivative, integral,
      integration, differentiation, differential equation, equation, polynomial, quadratic, matrix, matrices, vector,
      eigenvalue, eigenvector, logarithm, exponential, theorem, proof, graphing, sine, cosine, factoring, fraction,
      probability, set theory, discrete math, combinatorics, inequality, asymptote, parabola, chain rule, product rule,
      riemann sum, limits, taylor series, arithmetic, numerical, topology,
      fourier, fourier series, fourier transform, power series, convergence,
      divergence, ratio test, integration by parts, partial fractions, improper integral, partial derivative,
      multivariable, laplace transform`,
  },
  statistics: {
    depts: "stat stats sta",
    names: "statistics, statistical, stats",
    terms: `probability, distribution, normal distribution, regression, linear regression, correlation, variance,
      standard deviation, median, hypothesis, hypothesis test, confidence interval, sampling, anova, chi square,
      bayes, bayesian, binomial, poisson, histogram, boxplot, dataset, data analysis, rstudio, spss, significance,
      null hypothesis, outlier,
      sample size, standard error, central limit theorem, margin of error,
      random variable, expected value, residual`,
  },
  physics: {
    depts: "phys phy",
    names: "physics, physical science",
    terms: `velocity, acceleration, newton, momentum, kinetic energy, potential energy, kinetic, gravity, gravitational,
      friction, torque, projectile, kinematics, electricity, magnetism, electromagnetic, circuit, voltage, ohm,
      capacitor, wave, frequency, optics, quantum, relativity, thermodynamics, oscillation, pendulum, inertia,
      free body diagram, electric field, magnetic field, joule, displacement, centripetal,
      angular momentum, conservation of energy,
      simple harmonic motion, refraction, diffraction, photon, wavelength, coulomb`,
  },
  cs: {
    depts: "cs csci cse cpsc comp cis csc cmsc coms ece",
    names: "computer science, compsci, comp sci, programming, coding, software, computing",
    terms: `algorithm, data structure, recursion, array, linked list, pointer, hash table, hashmap, binary search,
      binary tree, sorting, quicksort, mergesort, queue, python, java, javascript, typescript, compiler, debugging,
      debugger, git, leetcode, database, sql, api, html, css, frontend, backend, runtime, object oriented, oop, syntax,
      linux, unix, operating system, machine learning, neural network, segmentation fault, stack overflow, assembly,
      cpu, kernel, regex, json, nodejs, django, flask, numpy, pandas, jupyter, cpp, golang, kotlin, haskell, matlab,
      time complexity, space complexity, dynamic programming, graph traversal,
      breadth first, depth first, dijkstra, heap, hash function, tree traversal, unit test, memory leak, inheritance,
      polymorphism, encapsulation`,
  },
  psychology: {
    depts: "psyc psych psy",
    names: "psychology, psychological, psych",
    terms: `cognitive, cognition, behavior, behaviour, behavioral, conditioning, classical conditioning,
      operant conditioning, pavlov, freud, piaget, perception, sensation, neuroscience, neuron, neurotransmitter,
      dopamine, serotonin, personality, disorder, depression, anxiety, therapy, developmental, social psychology,
      attachment, motivation, emotion, consciousness, schizophrenia, dsm, research methods, maslow, bandura, skinner,
      memory, cognitive bias, mental health,
      forgetting, encoding, retrieval, amnesia, long term memory,
      short term memory, working memory, neuroplasticity, hippocampus, amygdala, cortex, reinforcement, stimulus,
      placebo, cognitive dissonance, conformity`,
  },
  economics: {
    depts: "econ eco ecn",
    names: "economics, economic, economy, econ",
    terms: `supply and demand, supply, demand, market, inflation, gdp, elasticity, monopoly, oligopoly, equilibrium,
      marginal, marginal cost, utility, opportunity cost, fiscal, fiscal policy, monetary policy, interest rate,
      unemployment, recession, macroeconomics, microeconomics, tariff, keynes, keynesian, consumer surplus, surplus,
      game theory, externality, aggregate demand, comparative advantage, federal reserve,
      price ceiling, price floor,
      deadweight loss, demand curve, supply curve, inelastic, production possibilities, scarcity, perfect competition,
      marginal revenue, marginal utility`,
  },
  history: {
    depts: "hist hst",
    names: "history, historical, historian",
    terms: `world war, civil war, cold war, revolution, revolutionary, empire, dynasty, colonial, colonialism, medieval,
      renaissance, ancient, roman empire, rome, egypt, mesopotamia, constitution, independence, slavery,
      reconstruction, holocaust, treaty, monarchy, feudalism, industrial revolution, napoleon, lincoln,
      primary source, civilization, crusades, ottoman, imperialism, reformation, enlightenment, great depression,
      civil rights, wwi, wwii, ww1, ww2,
      migration, immigration, abolition, suffrage, segregation, emancipation,
      gilded age, progressive era, jim crow, manifest destiny, vietnam war, colonization`,
  },
  english: {
    depts: "engl eng wrtg writ wrt lit",
    names: "english, writing, literature, literary, composition, rhetoric",
    terms: `thesis statement, argumentative, rhetorical, citation, mla, apa, paragraph, grammar, novel, poem, poetry,
      shakespeare, hamlet, macbeth, gatsby, metaphor, symbolism, narrative, character analysis, literary analysis,
      annotated bibliography, bibliography, works cited, prose, fiction, orwell, austen, dickens, plagiarism,
      peer review, close reading, figurative language,
      rhetorical analysis, ethos, pathos, counterargument,
      topic sentence, annotation, short story, protagonist, antagonist, irony, allusion, imagery`,
  },
  politics: {
    depts: "pols poli psci govt gov plsc posc",
    names: "political science, politics, political, government",
    terms: `congress, senate, democracy, constitution, election, federalism, supreme court, legislature, policy,
      parliament, judicial, legislative, executive branch, amendment, bill of rights, republic, voting, ideology,
      liberalism, conservatism, separation of powers, checks and balances, international relations, diplomacy,
      sovereignty, electoral college, political party, public policy,
      filibuster, gerrymandering, lobbying,
      civil liberties, judicial review`,
  },
  kinesiology: {
    depts: "kins kin kine kines anat phsl exsc",
    names: "kinesiology, anatomy, physiology, exercise science, anatomical, physiological",
    terms: `muscle, skeletal, skeleton, bone, ligament, tendon, cardiovascular, respiratory, nervous system,
      biomechanics, exercise, strength training, motor control, heart rate, artery, vein, spine, vertebra, femur,
      humerus, nutrition, metabolism, aerobic, anaerobic, muscle contraction, range of motion,
      rotator cuff, quadriceps, hamstring, biceps,
      triceps, deltoid, flexion, abduction, adduction, sarcomere, motor unit`,
  },
  business: {
    depts: "acct acc actg fin busn mgmt mgt mktg mkt",
    names: "accounting, finance, business, management, marketing",
    terms: `ledger, balance sheet, income statement, cash flow, debit, journal entry, depreciation, asset, liability,
      equity, gaap, audit, tax, revenue, expense, accrual, amortization, financial statement, trial balance,
      accounts payable, accounts receivable, net income, retained earnings, investment, valuation, supply chain, swot,
      break even, contribution margin,
      managerial accounting, cost accounting, inventory, budgeting, variance analysis`,
  },
  music: {
    depts: "mus musc muth",
    names: "music, musical, music theory",
    terms: `chord, harmony, melody, rhythm, interval, key signature, time signature, cadence, counterpoint, sonata,
      symphony, composer, sheet music, notation, tempo, bach, beethoven, mozart, ear training, solfege, scales,
      orchestra, choir, aural skills, music history,
      triad, seventh chord, roman numeral analysis, voice leading,
      figured bass, modulation, tonic, major scale, minor scale`,
  },
  languages: {
    depts: "span spn fren frn germ ger chin jpn japn ling ital kor arab latn asl",
    names: "spanish, french, german, chinese, japanese, korean, italian, latin, arabic, mandarin, linguistics",
    terms: `vocabulary, vocab, conjugation, verb, grammar, pronunciation, duolingo, translation, tense, subjunctive,
      preterite, kanji, hiragana, katakana, pinyin,
      imperfect, past tense, future tense, verb conjugation`,
  },
  health: {
    depts: "nurs nur hsc phar nutr",
    names: "nursing, pharmacology, nutrition, public health, health science",
    terms: `patient, nclex, dosage, medication, vital signs, care plan, pathophysiology, clinical, diagnosis,
      epidemiology, nutrient, vitamin, calorie, disease,
      pharmacokinetics, pathology, infection, acute care,
      nursing diagnosis`,
  },
  gamedev: {
    depts: "game igme eae gam gdd",
    names: "game design, game development, game dev, gamedev, game programming, level design",
    terms: `unity, unreal engine, godot, gamemaker, game engine, platformer, sprite, shader, playtest, playtesting,
      game mechanics, devlog, game jam, player controller, character controller, rigidbody, tilemap,
      collision detection, physics engine, blender, csharp, ue5, game loop, prefab, raycast`,
  },
};

// Subject names too everyday to count as academic on their own ("Official Music Video", "Business Insider").
const EVERYDAY = new Set(["bio", "music", "musical", "writing", "business", "politics", "political", "marketing", "management", "finance", "software", "coding", "exercise", "nutrition", "unity"]);

// Subjects whose material often serves each other (a biology student reading chemistry). Material for an unrelated
// subject during a session is someone else's homework, not this session's.
const RELATED: Record<string, string[]> = {
  biology: ["chemistry", "health", "kinesiology", "psychology", "statistics"],
  chemistry: ["biology", "physics", "math", "health"],
  math: ["statistics", "physics", "cs", "economics", "business", "chemistry"],
  statistics: ["math", "cs", "economics", "business", "psychology", "biology", "health"],
  physics: ["math", "chemistry", "cs"],
  cs: ["math", "statistics", "physics", "gamedev"],
  psychology: ["biology", "statistics", "health"],
  economics: ["math", "statistics", "business", "politics", "history"],
  history: ["politics", "english", "economics", "languages"],
  english: ["history", "languages"],
  politics: ["history", "economics"],
  kinesiology: ["biology", "health", "physics", "chemistry"],
  business: ["economics", "math", "statistics"],
  music: [],
  languages: ["english", "history"],
  health: ["biology", "chemistry", "kinesiology", "psychology", "statistics"],
  gamedev: ["cs", "math", "physics"],
};
const SUBJECT_NAME: Record<string, string> = { cs: "computer science", gamedev: "game design", languages: "a language", health: "health science" };
export const subjectName = (key: string) => SUBJECT_NAME[key] ?? key;

const ZW = /[\u200b-\u200d\u2060\ufeff]/g;

// Lowercase word tokens, accents folded, letters and digits split ("BIOL1610" -> biol 1610). `files` also drops file
// extensions and splits "cellDivision" (file and project names). Drops stopwords and single letters.
export const words = (s: string, files = false): string[] =>
  (files ? s.replace(/\.[a-z0-9]{1,5}\b/gi, " ").replace(/(\p{Ll})(\p{Lu})/gu, "$1 $2") : s)
    .replace(ZW, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/(\p{L})(?=\p{N})/gu, "$1 ")
    .replace(/(\p{N})(?=\p{L})/gu, "$1 ")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => (w.length > 1 || /\d/.test(w)) && !STOP.has(w));

// Plurals only: cells -> cell, theories -> theory. Both sides go through it, so odd stems still compare equal.
const stem = (w: string) =>
  w.length > 4 && w.endsWith("ies") ? w.slice(0, -3) + "y" : w.length > 3 && /[^siuo]s$/.test(w) ? w.slice(0, -1) : w;

// Same word, or the same long root (biology ~ biological, economy ~ economics). Numbers only match exactly.
const near = (a: string, b: string) => {
  if (a === b) return true;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return i >= 6 && i >= Math.min(a.length, b.length) - 1 && !/\d/.test(a);
};

type Term = { stem: string; term: string };
const termOf = (t: string): Term => ({ stem: words(t).map(stem).join(" "), term: t });
const list = (s: string) => s.split(/,\s*/).map((t) => t.trim()).filter(Boolean);
const terms = (s: string) => list(s).map(termOf).filter((t) => t.stem); // a term made only of stopwords never matches

const LEX = Object.entries(SUBJECTS).map(([key, s]) => ({
  key,
  depts: new Set(s.depts.split(" ")),
  names: terms(s.names),
  terms: terms(s.terms),
}));
export const LEXICON_SIZE = LEX.reduce((n, s) => n + s.names.length + s.terms.length, 0);

const hasTerm = (t: Term, toks: string[], joined: string) =>
  t.stem.includes(" ") ? joined.includes(` ${t.stem} `) : toks.some((w) => near(w, t.stem));

const NAME_STEMS = new Set(LEX.flatMap((s) => s.names.map((t) => t.stem)));

// Subjects whose words appear in `toks` (stems), each with the first word found.
function subjectsOf(toks: string[]): Map<string, string> {
  const joined = ` ${toks.join(" ")} `;
  const found = new Map<string, string>();
  for (const s of LEX)
    for (const t of [...s.names, ...s.terms])
      if (!EVERYDAY.has(t.term) && hasTerm(t, toks, joined)) {
        found.set(s.key, t.term);
        break;
      }
  return found;
}
// Any subject's word or phrase: an academic title even if it's not this session's.
export const academic = (toks: string[]) => subjectsOf(toks).values().next().value ?? null;

// Tools every subject uses: never evidence of another subject ("fed_funds_rate.ipynb - JupyterLab").
const TOOLS = new Set(["jupyter", "rstudio", "spss", "matlab", "numpy", "pandas", "git", "json", "excel"]);

// Numbered pieces of work: "Exam 3", "PS6", "HW 5", "Chapter 7", "SN1". Keyed so "ch 7" and "Chapter 7" agree.
const REF =
  /(?<![a-z0-9])(?:(exam|quiz|midterm|lab|hw|homework|ps|pset|problem set|project|chapter|ch|unit|module|week|lecture|case|paper|essay)\s?#?(\d{1,2})|([a-z]{1,3})(\d{1,2}))(?![a-z0-9])/gi;
const SAME: Record<string, string> = { ch: "chapter", hw: "homework", ps: "problem set", pset: "problem set" };
export const refsOf = (text: string) =>
  new Map(
    [...text.matchAll(REF)].map((m) => {
      const w = (m[1] ?? m[3]).toLowerCase();
      return [`${SAME[w] ?? w} ${Number(m[2] ?? m[4])}`, m[0]] as const;
    }),
  );

// The title's subjects when none is this session's: "related" ones lean on task, unrelated ones are other homework.
export function otherSubject(c: Ctx, toks: string[]): { subject: string; term: string; related: boolean } | null {
  if (!c.subjects.size) return null;
  const found = [...subjectsOf(toks)].filter(([, term]) => !TOOLS.has(term));
  if (!found.length || found.some(([s]) => c.subjects.has(s))) return null;
  const close = found.find(([s]) => [...c.subjects].some((own) => RELATED[own]?.includes(s) || RELATED[s]?.includes(own)));
  const [subject, term] = close ?? found[0];
  return { subject, term, related: !!close };
}

// A word of `text` (four letters or more) is one of the session's own words: "Celeste" in "play Celeste for the report".
export const named = (c: Ctx, text: string) =>
  words(text).map(stem).some((w) => w.length >= 4 && c.terms.some((t) => t.direct && t.stem === w));

// Course codes as written in titles and contexts: "BIOL 1610", "CS-2420", "biol1610".
const CODE = /(?<![\p{L}\d])([A-Za-z]{2,5})[\s_-]?(\d{3,4})(?!\d)/u;
const UPPER_CODE = /(?<![\p{L}\d])([A-Z]{2,5})[\s_-]?(\d{3,4})(?!\d)/u;
const TITLE_CODES = new RegExp(UPPER_CODE.source, "gu");

const isStudy = (w: string) => STUDY.has(w) || STUDY.has(stem(w));

export type Hit = { term: string; source: string; direct: boolean };
export type Ctx = {
  any: boolean; // the session has any goal, course or assignment text
  label: string; // how reasons name the session: "BIOL 1610", "your goal", "your session"
  code: { key: string; label: string } | null; // { key: "biol1610", label: "BIOL 1610" }
  // The context's own words first, then its subjects' lexicon. name: the word names a subject ("psychology").
  terms: (Term & { source: string; direct: boolean; name: boolean })[];
  weak: { stem: string; term: string; source: string }[]; // shared study words and course numbers
  subjects: Set<string>;
  games: boolean; // the session is about games (game design, a game's modding): game titles aren't clear leisure
  refs: Map<string, { label: string; source: string }>; // numbered references in the goal or assignment: Exam 3, PS6
  media: boolean; // the session studies media, film, communication or sport: leisure content can be the material
};

const clip = (s: string, n = 40) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
export const GAMES =
  /\b(minecraft|fortnite|roblox|valorant|league of legends|overwatch|apex legends|call of duty|warzone|gta ?(?:v|5|6|online)?|grand theft auto|genshin|pok[eé]mon|zelda|super mario|mario kart|smash bros|elden ring|terraria|rocket league|counter-?strike|cs ?go|cs2|dota ?2?|hearthstone|clash royale|clash of clans|brawl stars|subway surfers|geometry dash|fnaf|five nights at freddy'?s|hollow knight|stardew valley|animal crossing|the sims|skyrim|pubg|rainbow six|marvel rivals|helldivers|baldur'?s gate|nba 2k|madden)\b/i;
const GAMEY =
  /\b(games?|gaming|gameplay|esports?|game ?dev|unity|unreal|godot|interactive entertainment|playtest\w*|level design|igme|eae)\b/i;
// Sessions that study leisure media itself.
const MEDIA =
  /\b(media|communications?|comm|journalism|film|cinema|television|tv studies|pop(?:ular)? culture|advertising|sports? (?:management|marketing|studies|media)|spm|music business|entertainment)\b/i;

export function readContext(ctx: FocusSessionContext): Ctx {
  const course = ctx.courseName?.trim() ?? "";
  const assignment = ctx.assignmentTitle?.trim() ?? "";
  const goal = ctx.goal?.trim() ?? "";
  // Any case in the course name; elsewhere only in capitals, so "pages 120" in a goal isn't a course.
  const m = course.match(CODE) ?? [assignment, goal].map((s) => s.match(UPPER_CODE)).find(Boolean);
  const code = m ? { key: (m[1] + m[2]).toLowerCase(), label: `${m[1].toUpperCase()} ${m[2]}`, dept: m[1].toLowerCase() } : null;
  const courseLabel = course ? (course.match(CODE) ? code!.label : clip(course)) : "";
  const fields: [string, string][] = [
    [course, courseLabel],
    [assignment, `“${clip(assignment)}”`],
    [goal, "your goal"],
  ];
  const c: Ctx = {
    any: !!(course || assignment || goal),
    label: courseLabel || (assignment ? `“${clip(assignment)}”` : goal ? "your goal" : "your session"),
    code: code && { key: code.key, label: code.label },
    terms: [],
    weak: [],
    subjects: new Set(),
    games: [course, assignment, goal].some((s) => GAMEY.test(s) || GAMES.test(s)),
    media: [course, assignment, goal].some((s) => MEDIA.test(s)),
    refs: new Map(
      ([[assignment, `“${clip(assignment)}”`], [goal, "your goal"]] as const).flatMap(([text, source]) =>
        [...refsOf(text)].map(([key, label]) => [key, { label, source }] as const),
      ),
    ),
  };
  // A department counts in the course name, in a course code, or written in capitals ("CS homework").
  const upper = new Set([assignment, goal].flatMap((s) => s.match(/\b[A-Z]{2,5}\b/g) ?? []).map((w) => w.toLowerCase()));
  const isDept = (w: string, source: string) =>
    (source === courseLabel || w === code?.dept || upper.has(w)) && LEX.some((x) => x.depts.has(w));
  const subjectSource = new Map<string, string>();
  for (const [text, source] of fields) {
    if (!text) continue;
    const toks = words(text);
    const stems = toks.map(stem);
    const joined = ` ${stems.join(" ")} `;
    toks.forEach((w, i) => {
      if (isStudy(w) || /^\d+$/.test(w)) {
        if (!/^\d{1,2}$/.test(w)) c.weak.push({ stem: stems[i], term: w, source });
      } else if (w.length > 2 || isDept(w, source)) {
        c.terms.push({ stem: stems[i], term: w, source, direct: true, name: NAME_STEMS.has(stems[i]) || isDept(w, source) });
      }
    });
    for (const x of LEX) {
      const dept = toks.some((w) => x.depts.has(w) && isDept(w, source));
      if (!subjectSource.has(x.key) && (dept || [...x.names, ...x.terms].some((t) => hasTerm(t, stems, joined))))
        subjectSource.set(x.key, source);
    }
  }
  for (const x of LEX) {
    const source = subjectSource.get(x.key);
    if (!source) continue;
    c.subjects.add(x.key);
    for (const t of x.names) c.terms.push({ ...t, source, direct: false, name: true });
    for (const t of x.terms) c.terms.push({ ...t, source, direct: false, name: false });
  }
  if (c.subjects.has("gamedev")) c.games = true;
  return c;
}

export type Evidence = {
  empty: boolean; // no words at all beyond boilerplate (a bare "YouTube" or "Discord")
  tokens: string[]; // content words (stems), study words and numbers excluded
  hit: Hit | null; // the title fits the session: its course code, its own words or its subjects' lexicon
  // Topic words the title shares exactly with the session (the course code, its own words, its subjects' terms; not
  // subject names or near forms). A lone one is easily a coincidence ("Chemical Brothers", "Psych Club").
  topical: number;
  weak: string | null; // only a shared study word, course number or word root: blocks enforcement, proves nothing
  other: string | null; // the title names a different course code
  coded: boolean; // the title names any course code
};

export function evidence(page: string, c: Ctx, files = false, extra: string[] = []): Evidence {
  const raw = words(page, files);
  const stems = raw.map(stem);
  const tokens = stems.filter((w, i) => !isStudy(raw[i]) && !/^\d+$/.test(w));
  const joined = ` ${stems.join(" ")} `;
  const codes = [...page.matchAll(TITLE_CODES)].map((m) => ({ key: (m[1] + m[2]).toLowerCase(), label: `${m[1]} ${m[2]}` }));
  const own = !!c.code && codes.some((x) => x.key === c.code!.key);
  let hit: Hit | null = own ? { term: c.code!.label, source: c.label, direct: true } : null;
  const topical = new Set<string>(own ? [c.code!.key] : []);
  // The same numbered piece of work ("Exam 3 review session" for “Exam 3: Cardiovascular Drugs”).
  for (const key of refsOf(page).keys()) {
    const ref = c.refs.get(key);
    if (!ref) continue;
    topical.add(key);
    hit ??= { term: ref.label, source: ref.source, direct: true };
  }
  for (const t of c.terms) {
    const exact = t.stem.includes(" ") ? joined.includes(` ${t.stem} `) : tokens.includes(t.stem);
    if (exact && !t.name) topical.add(t.stem);
    // Run-together names (r/learnprogramming) contain a term rather than equal it.
    if (!hit && (exact || hasTerm(t, tokens, joined) || (t.stem.length >= 5 && !t.stem.includes(" ") && extra.some((w) => w.includes(t.stem)))))
      hit = { term: t.term, source: t.source, direct: t.direct };
  }
  const weak =
    c.weak.find((t) => stems.includes(t.stem))?.term ??
    c.terms.find((t) => t.direct && t.stem.length >= 4 && tokens.some((w) => w.startsWith(t.stem)))?.term ??
    null;
  const other = !hit && c.code ? (codes.find((x) => x.key !== c.code!.key)?.label ?? null) : null;
  return { empty: !raw.length, tokens, hit, topical: topical.size, weak: hit ? null : weak, other, coded: codes.length > 0 };
}

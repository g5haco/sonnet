// Layer 2: contextual evidence from the title (site, channel, subreddit, project, words) against the session.
// Confidences are fixed per case so every result can be explained; only near-certain leisure reaches 0.9.
import type { FocusClassification } from "./types";
import { academic, evidence, GAMES, otherSubject, subjectName, words, type Ctx, type Evidence, type Hit } from "./lexicon";
import { abstain, blank, cap, type Kind, type Surface } from "./rules";

// Unmistakable leisure: gameplay, pranks, reactions, memes, price challenges ("$1 vs $1,000,000"), game titles,
// sports leagues, fun subreddits.
const STRONG =
  /\b(?:game ?play|let'?s ?play|play ?through|speed ?runs?|speedrunning|pranks?|pranked|reacting to|reaction (?:video|compilation)|memes?|funny moments|funniest|try not to laugh|fails compilation|mukbang|rage ?quit|skibidi|brain ?rot|mr ?beast)\b|\$\d[\d,.]*\s*vs\.?\s*\$\d/i;
const SPORTS = /\b(?:nba|nfl|mlb|nhl|ufc|wwe|premier league|champions league|la liga|super bowl|world cup|formula 1)\b/i;
const FUN_SUBS =
  /\br\/(?:funny|memes|dankmemes|me_irl|meirl|gaming|pcgaming|games|videos|pics|aww|askreddit|teenagers|nba|nfl|soccer|sports|leagueoflegends|minecraft|fortnite\w*|genshin_impact|anime|movies|television|tifu|amitheasshole|aita\w*|interestingasfuck|nextfuckinglevel|beamazed|mildlyinteresting|showerthoughts|wholesomememes|publicfreakout|relationship_advice|unexpected|tiktokcringe|roblox|valorant|overwatch|apexlegends|hiphopheads|popculturechat|music|todayilearned)\b/i;
// Entertainment formats: the format says what the content is, whatever topic word the title also has. Includes
// encyclopedia disambiguators like "(album)" or "(TV series)".
const FORMAT =
  /\b(?:official (?:music )?video|official audio|music video|lyrics?|lyric video|trailer|teaser|full episode|full movie|vlog|unboxing|haul|grwm|get ready with me|(?:day|week|month|year)s? in (?:my|the) life|tier list|true crime|to fall asleep to|sleep stor(?:y|ies)|bedtime stor(?:y|ies))\b|\((?:[\w ]* )?(?:album|band|song|single|film|tv series|video game|musician|rapper|singer)\)/i;
// Leans toward leisure but has study uses too.
const MILD = /\b(?:episode \d+|season \d+|ep\.? ?\d+|highlights|live ?stream|walk ?through|asmr|#?shorts|challenge|1v1|clutch|montage|fan ?cam|rumou?rs|gossip|leaks?)\b/i;
// Personal life and hobbies: plans, events, fantasy sports, tabletop games, tickets, weather, cooking, shopping
// notices, countdowns, personal investing.
const PERSONAL =
  /\b(?:(?:halloween|christmas|holiday|birthday|graduation|house|dinner|costume|frat) part(?:y|ies)|party planning|wedding|vacation|spring break|road ?trip|itinerary|fantasy (?:football|basketball|baseball|hockey|league|draft|team)|d&d|dnd|dungeons (?:&|and) dragons|tabletop|tour dates|concerts?|concert tickets|ticketmaster|festival|weather|horoscope|recipes?|grocer(?:y|ies)|meal prep|outfits?|wish ?list|gift ideas|dating (?:apps?|profile|advice)|tinder|days until|countdown to|baking|cooking|your order|order (?:has )?shipped|out for delivery|tracking number|stock price|watchlist)\b/i;
// A saved PDF of tickets or a booking.
const PERSONAL_FILE = /\b(?:tickets?|boarding pass|reservation|booking confirmation)\b/i;
// Coursework wording: class material whatever the subject.
const COURSEWORK =
  /\b(?:lectures?|chapters?|ch\.? ?\d+|syllabus|homework|hw ?\d+|exams?|midterm|quiz(?:zes)?|lab|practice problems?|problem set|worked examples?|textbook|crash course|professor|study|studying|notes|assignments?|course|solutions?|ocw)\b/i;
// Educational wording, broader ("how to tie a tie" is a tutorial, not coursework).
const STUDYISH =
  /\b(?:tutorials?|explained|explanation|lessons?|how (?:to|do|does|did)|introduction|intro to|review|practice|problems?|step by step|for beginners|proof|derivation|documentation|definition|what is)\b/i;
// An episode or talk rather than a song: "Why we forget", "Ep. 12", "podcast".
const TALK = /\b(?:why|how|what|podcast|episode|ep\.? ?\d+|interview|lecture|explained|science of)\b/i;
const STUDY_SUBS =
  /\br\/(?:homeworkhelp|learnprogramming|learnmath|askscience|askhistorians|studytips|getstudying|apstudents|explainlikeimfive|askmath|cscareerquestions|learnpython|learnjava|learnjavascript|chemhelp|physicshelp|biology|chemistry|physics|math|statistics|economics|psychology|programming|compsci|mcat|premed|engineeringstudents|gradschool|languagelearning)\b/i;
const BACKGROUND =
  /\b(?:lo-?fi|study music|music (?:for|to) (?:study|focus|concentrat\w*)|focus music|deep focus|concentration|white noise|brown noise|rain sounds|ambient|classical music|instrumental|study with me|pomodoro|beats to (?:relax|study))\b/i;
const SOCIAL =
  /\b(?:gaming|games?|memes?|shitpost\w*|off-?topic|lounge|hangout|chill|vc|voice|music|anime|clips|lfg|nsfw|club|party|squad|crew|roommates?|random|soccer|football|basketball|volleyball|baseball|softball|hockey|intramurals?)\b/i;
const GROUP = /\b(?:study|studying|homework|hw|course|project|exam|midterm|quiz|lab|tutor\w*|office hours|lecture|notes|assignment)\b/i;
// Hobby projects in an editor.
const HOBBY = /\b(?:discord|minecraft|roblox|spotify|twitch|steam|fortnite|music|bot|mods?|modpack|fantasy)\b/i;
const CHAT_BARE = /^(?:Discord|Friends|Home|Nitro|Discover|Shop|Message Requests|WhatsApp|Telegram|Messenger|Slack|Microsoft Teams|Teams|Chat|Activity|Calendar)?$/i;
const QUANT = ["math", "statistics", "physics", "chemistry", "economics", "business", "cs", "gamedev"];

type Signals = Evidence & {
  strong: string | null; // unmistakable leisure wording
  format: string | null; // an entertainment format (music video, trailer, vlog)
  personal: string | null; // personal plans or hobbies
  mild: string | null; // leisure-leaning wording
  study: string | null; // coursework wording: lecture, practice problem, syllabus, a course code
  learn: string | null; // coursework or educational wording (tutorial, explained, how to)
  acad: string | null; // any subject's term
  ed: string | null; // learn or acad
  gamey: boolean; // a session about games and game content: the content overlaps the session
  text: string; // the title as words (file names split)
};

const first = (re: RegExp, s: string) => s.match(re)?.[0].toLowerCase() ?? null;

function signals(s: Surface, c: Ctx): Signals {
  const files = ["ide", "pdf", "doc", "explorer"].includes(s.kind);
  // "CS2420_Syllabus_Fall2026.pdf" -> "CS 2420 Syllabus Fall 2026.pdf", so word patterns see the words.
  const text = files ? s.page.replace(/_+/g, " ").replace(/(\p{Ll})(\p{Lu})/gu, "$1 $2").replace(/(\p{L})(?=\p{N})/gu, "$1 ") : s.page;
  const sub = s.page.match(/\br\/(\w+)/)?.[1]?.toLowerCase();
  const e = evidence(s.page, c, files, sub ? [sub] : []);
  const strong = first(STRONG, text) ?? first(GAMES, text) ?? first(SPORTS, text) ?? first(FUN_SUBS, text);
  // In a session about games, game content overlaps the session: never clear leisure.
  const gamey = !!(c.games && strong && (GAMES.test(text) || /gam|play|speed|rage/.test(strong)));
  const study = first(COURSEWORK, text) ?? first(STUDY_SUBS, text) ?? (e.coded ? "a course code" : null);
  const learn = study ?? first(STUDYISH, text);
  const acad = academic(e.tokens);
  return {
    ...e,
    weak: e.weak ?? (gamey && !e.hit ? strong : null),
    strong,
    format: first(FORMAT, text),
    personal: first(PERSONAL, text) ?? (s.kind === "pdf" ? first(PERSONAL_FILE, text) : null),
    mild: first(MILD, text),
    study,
    learn,
    acad,
    ed: learn ?? acad,
    gamey,
    text,
  };
}

const WHERE: Partial<Record<Kind, string>> = {
  video: "Video title", reddit: "Reddit post", fun: "Title", web: "Page title", search: "Search", app: "Window title",
  chat: "Chat", music: "Title", lms: "Course page", ref: "Page", calc: "Calculator", ai: "Chat title", doc: "Document",
  pdf: "PDF", ide: "Project", terminal: "Terminal", explorer: "Folder", call: "Meeting", mail: "Email",
};
const where = (s: Surface) => WHERE[s.kind] ?? "Title";
const fits = (s: Surface, h: Hit) =>
  h.term === h.source ? `${where(s)} names ${h.source}.` : `${where(s)} mentions ${h.term}, which fits ${h.source}.`;
const r2 = (n: number) => Math.round(n * 100) / 100;
const on = (confidence: number, reason: string): FocusClassification => ({ label: "ON_TASK", confidence: r2(confidence), reason, method: "heuristic" });
const off = (confidence: number, reason: string): FocusClassification => ({ label: "DISTRACTING", confidence: r2(confidence), reason, method: "heuristic" });
// UNCERTAIN with a lean is weak evidence (heuristic); without one, nothing decided it (abstain).
const unsure = (reason: string, lean?: "ON_TASK" | "DISTRACTING"): FocusClassification =>
  lean ? { ...abstain(reason), method: "heuristic", lean } : abstain(reason);
// Programming words: "Advent of Code speedrun" is a coding stream, not clear leisure.
const CODING = /\b(?:code|coding|programming|algorithms?|leetcode|python|java(?:script)?|c\+\+|rust|debug\w*|compiler)\b/i;
// A session word and a title word share their first five letters (react/reacting, meme/memes, draft/drafts).
const stemOverlap = (c: Ctx, text: string) => {
  const own = [...c.terms.filter((t) => t.direct).map((t) => t.term), ...c.weak.map((t) => t.term)]
    .filter((w) => w.length >= 5)
    .map((w) => w.slice(0, 5));
  return words(text).some((w) => w.length >= 5 && own.includes(w.slice(0, 5)));
};
// Nothing to compare with: no context, or only words like "study".
const open = (c: Ctx) => !c.any || (!c.subjects.size && !c.terms.some((t) => t.direct));

// Leisure (wording, format or personal plans) that outweighs a single shared word: "The Chemical Brothers (Official
// Video)" in a chemistry session, a psych club's party planning in a psychology one. Two topic words, or study wording
// with a real topic word, keep the match; a subject's name alone never does ("the chemistry of baking"). Never
// enforceable.
function lone(s: Surface, c: Ctx, x: Signals): FocusClassification | null {
  const fun = x.strong ?? x.format ?? x.personal;
  if (!x.hit || !fun || x.gamey || (x.learn && x.topical > 0)) return null;
  if (x.topical >= 2) return unsure(`${fits(s, x.hit)} But it also looks like ${x.personal && !x.strong ? "personal plans" : "entertainment"} (${fun}).`);
  return off(x.strong ? 0.75 : 0.7, `${where(s)} looks like ${x.personal && !x.strong && !x.format ? "personal plans" : "entertainment"} (${fun}); “${x.hit.term}” alone doesn't make it ${c.label}.`);
}

// Educational content that doesn't match the session: coursework when there's nothing to compare with, another
// subject's homework when the subject is unrelated, a lean when related.
function elsewhere(s: Surface, c: Ctx, x: Signals): FocusClassification {
  if (open(c))
    return x.study || (x.learn && x.acad)
      ? on(0.6, "Looks like coursework, and the session has no goal to compare with.")
      : unsure("Looks educational; the session has no goal to compare with.", "ON_TASK");
  const o = otherSubject(c, x.tokens);
  if (o && !o.related && !x.weak) return off(0.6, `Looks like ${subjectName(o.subject)} (${o.term}), not ${c.label}.`);
  if (o) return unsure(`Looks like ${subjectName(o.subject)} (${o.term}): related, but not clearly ${c.label}.`, "ON_TASK");
  return unsure(`Looks like study material, but not clearly for ${c.label}.`);
}

export function judge(s: Surface, c: Ctx): FocusClassification {
  const x = signals(s, c);
  switch (s.kind) {
    case "chat":
      return chat(s, c, x);
    case "music":
      return music(s, c, x);
    case "lms":
      if (x.hit) return on(0.9, fits(s, x.hit));
      if (x.other) return unsure(`A course site page for another course (${x.other}).`, "ON_TASK");
      return on(0.7, "Your course site (Canvas, Blackboard, Moodle and the like) is coursework.");
    case "calc":
      if (x.hit) return on(0.85, fits(s, x.hit));
      // A study tool asked a personal question ("days until christmas").
      if (x.personal || x.strong) return off(0.7, `${where(s)} query looks personal (${x.personal ?? x.strong})${c.any ? `, not ${c.label}` : ""}.`);
      if (QUANT.some((q) => c.subjects.has(q))) return on(0.85, `A calculator fits ${c.label}.`);
      return unsure(c.any ? `A calculator is a neutral tool; ${c.label} doesn't obviously need one.` : "A calculator; the session has no goal to compare with.", "ON_TASK");
    case "ref":
    case "ai":
    case "doc":
    case "pdf":
      return material(s, c, x);
    case "ide":
      return ide(s, c, x);
    case "terminal":
      // A bare shell says nothing about what's being run, even in a programming course.
      if (x.hit) return on(0.75, fits(s, x.hit));
      return unsure("A terminal; it doesn't say what it's for.", "ON_TASK");
    case "explorer":
      if (x.hit) return on(0.75, fits(s, x.hit));
      if (x.other) return unsure(`Folder for another course (${x.other}).`, "ON_TASK");
      // Game install folders: steamapps, Epic Games, Riot Games.
      if (!c.games && /steam(?:apps)?|epic games|riot games|\bgames\b/i.test(s.page))
        return c.any ? off(0.65, `Folder holds games, not ${c.label}.`) : unsure("Folder holds games.", "DISTRACTING");
      if (x.strong || x.personal) return unsure(`Folder looks like games, entertainment or personal files (${x.strong ?? x.personal}).`, "DISTRACTING");
      return unsure("Browsing files.");
    case "call":
      if (x.hit) return on(0.8, fits(s, x.hit));
      if (x.ed || GROUP.test(s.page)) return on(0.7, "This call looks like a class or study session.");
      return unsure("A video call; the title doesn't say what it's for.");
    case "mail":
      if (x.hit) return on(0.7, fits(s, x.hit));
      if (x.personal || x.strong) return off(0.7, `Email looks personal (${x.personal ?? x.strong}), not ${c.label}.`);
      return unsure("Email; the subject doesn't tie it to your session.");
    default:
      return content(s, c, x);
  }
}

// Video sites, Reddit, fun sites, web pages, searches and unknown apps: the title's own words decide.
function content(s: Surface, c: Ctx, x: Signals): FocusClassification {
  const w = where(s);
  const fun = s.base !== undefined;
  const feed = fun || s.kind === "video" || s.kind === "reddit"; // where people go for entertainment
  const not = c.any ? ` and nothing ties it to ${c.label}` : "";
  if (blank(s) || (x.empty && !fun)) {
    if (s.kind === "video") return unsure(`No video to judge, just ${s.name}'s pages.`, "DISTRACTING");
    // The open-ended feed itself is browsing, whatever the session.
    if (s.kind === "reddit") return off(c.any ? 0.7 : 0.6, "Browsing Reddit's feed.");
    return unsure(s.browser ? "An empty or untitled browser tab." : "Not enough in the title to judge.");
  }
  // Reddit pages without a subreddit (Popular, All) are the feed too.
  if (s.kind === "reddit" && !x.hit && !/\br\/\w/.test(s.page)) return off(c.any ? 0.7 : 0.6, "Browsing Reddit's feed.");
  // An unknown app titled with its own name: a product name, so a shared word in it is a coincidence.
  const product = s.kind === "app" && words(s.name.replace(/\.exe$/i, "")).every((n) => words(s.page).includes(n));
  if (x.hit && product) return unsure(`${cap(s.name)} is an app this doesn't know; its name alone doesn't tie it to ${c.label}.`);
  if (x.hit) {
    if (x.gamey) return on(0.75, fits(s, x.hit));
    const loner = lone(s, c, x);
    if (loner) return loner;
    if (x.strong) return unsure(`${fits(s, x.hit)} But it also looks like entertainment (${x.strong}).`);
    // A course's own group or page on a social site, or a post on exactly the session's topic on a general social
    // site (X, Facebook, Pinterest): the site is only the venue.
    const venue = x.coded || x.study || GROUP.test(x.text) || (s.base! <= 0.75 && x.hit.direct && x.topical > 0);
    if (fun) return venue ? on(0.7, `${fits(s, x.hit)} ${cap(s.name)} is only where it's posted.`) : unsure(`${fits(s, x.hit)} But ${s.name} is mostly entertainment.`, "ON_TASK");
    return on((x.hit.direct ? 0.85 : 0.8) - (x.mild || x.format ? 0.1 : 0), fits(s, x.hit));
  }
  const guarded = !!(x.weak || x.ed || x.other);
  if (x.strong) {
    // 0.92 is enforceable, so only for a session with a known subject that isn't media study, an entertainment site,
    // and no overlap of any kind: no shared word stem (react/reaction, meme/memes), no academic or programming term.
    const clear = c.subjects.size > 0 && !c.media && !x.acad && !CODING.test(x.text) && !stemOverlap(c, x.text);
    const conf = !c.any ? 0.8 : guarded ? 0.75 : !feed ? 0.8 : clear ? 0.92 : 0.75;
    return off(conf, `${w} looks like entertainment (${x.strong})${not}.`);
  }
  if (x.personal) return off(c.any ? 0.75 : 0.65, `${w} looks like personal plans or hobbies (${x.personal})${not}.`);
  if (fun) {
    // Educational wording leaves it open; a subject-sounding word alone ("Gravity Falls") keeps it lower. The site
    // alone never reaches 0.9 (documentaries stream too), and media studies can be about it.
    if (x.learn || x.other) return unsure(`${cap(s.name)} is mostly entertainment, though this looks educational.`, "DISTRACTING");
    const top = c.media ? 0.75 : x.weak || x.acad ? 0.8 : 0.85;
    return off(c.any ? Math.min(s.base!, top) : s.base! - 0.1, `${cap(s.name)} is mostly entertainment${not}.`);
  }
  if (BACKGROUND.test(s.page)) return unsure("Background study music.", "ON_TASK");
  const leisure = x.format ?? x.mild;
  if (leisure) {
    if (guarded) return unsure(`${w} looks like entertainment (${leisure}), though it may be educational.`, "DISTRACTING");
    return off(c.any ? 0.75 : 0.65, `${w} looks like entertainment (${leisure})${not}.`);
  }
  if (x.other) return unsure(`${w} names another course (${x.other}).`, "ON_TASK");
  if (x.ed) return elsewhere(s, c, x);
  // A Reddit thread with nothing educational and nothing of the session: Reddit is mostly leisure.
  if (s.kind === "reddit" && c.any && !x.weak) return off(0.65, `Reddit post with nothing tying it to ${c.label}.`);
  return unsure(`Nothing in the ${w.toLowerCase()} ties it to ${c.label}.`, feed ? "DISTRACTING" : undefined);
}

// Discord channels and servers, other messengers. The channel outweighs the server: #memes on a psychology club's
// server is still memes. Names of people are never matched or quoted.
function chat(s: Surface, c: Ctx, x: Signals): FocusClassification {
  // Slack: "random (Channel) - Workspace" is a channel like Discord's "#random | Server".
  const p = s.page.replace(/^Discord\s\|\s/i, "").replace(/\s[-–—|]\s?Discord$/i, "").replace(/^(.+?) \(Channel\)\s[-–—]\s/i, "#$1 | ").trim();
  if (CHAT_BARE.test(p)) return unsure(`Not enough to tell which ${s.name === "Discord" ? "Discord chat" : "chat"} this is.`);
  // People aren't matched by name, but a handle carrying the session's course code is about the course.
  if (p.startsWith("@"))
    return c.code && p.toLowerCase().replace(/[^a-z0-9]/g, "").includes(c.code.key)
      ? on(0.7, `A direct message with someone tied to ${c.code.label}.`)
      : unsure("A direct message; it doesn't say what it's about.");
  const social = (t: string) => first(STRONG, t) ?? first(GAMES, t) ?? first(MILD, t) ?? first(SOCIAL, t) ?? first(PERSONAL, t);
  const [head, ...rest] = p.split(/\s+\|\s+/);
  const channel = head.startsWith("#") ? head : "";
  const tail = channel ? rest.join(" | ") : p; // the server, or the whole name when there's no channel
  if (channel) {
    const fun = social(channel);
    if (fun) return off(c.any ? 0.7 : 0.6, `The ${channel} channel is social (${fun}), whatever the server is about.`);
    const hit = evidence(channel, c).hit;
    if (hit) return on(0.8, fits(s, hit));
    if (GROUP.test(channel)) return on(0.75, `The ${channel} channel looks like study help.`);
  }
  const fun = social(tail);
  const hit = evidence(tail, c).hit;
  if (hit) return fun ? unsure(`${fits(s, hit)} But it also looks social (${fun}).`) : on(channel ? 0.75 : 0.8, fits(s, hit));
  if (x.other) return unsure(`Chat for another course (${x.other}).`, "ON_TASK");
  if (GROUP.test(tail) || x.weak) return fun ? unsure("This chat mixes study and social names.") : on(0.7, "This chat looks like a study group.");
  if (fun) return off(c.any ? 0.7 : 0.6, `This chat looks social (${fun})${c.any ? `, not ${c.label}` : ""}.`);
  return unsure(`Nothing in the chat's name ties it to ${c.label}.`, s.name === "Discord" ? "DISTRACTING" : undefined);
}

// Spotify and the like: a music session needs it; an episode about the session's own topic is study; background
// study music leans on task. Only the session's own words count (song titles hit lexicon words by chance).
function music(s: Surface, c: Ctx, x: Signals): FocusClassification {
  if (c.subjects.has("music")) return on(0.7, `Music fits ${c.label}.`);
  if (x.hit?.direct && !x.format)
    return TALK.test(s.page) ? on(0.7, fits(s, x.hit)) : unsure(`${fits(s, x.hit)} It may just be a song title.`, "ON_TASK");
  if (BACKGROUND.test(s.page)) return unsure("Background study music.", "ON_TASK");
  if (!c.any) return unsure(`${cap(s.name)} is open; the session has no goal to compare with.`, "DISTRACTING");
  return off(0.6, `${cap(s.name)} isn't part of ${c.label}.`);
}

// Study materials and tools: documents, PDFs, reference and study sites, AI assistants.
function material(s: Surface, c: Ctx, x: Signals): FocusClassification {
  const w = where(s);
  const file = s.kind === "doc" || s.kind === "pdf";
  const fun = x.strong ?? x.format ?? x.personal;
  if (x.hit) return lone(s, c, x) ?? on(0.85, fits(s, x.hit));
  if (x.other) return unsure(`${w} names another course (${x.other}).`, "ON_TASK");
  if (fun) {
    // A study app used for something else: fantasy sports notes, a trip budget, a campaign log.
    const what = x.personal && !x.strong ? "personal plans or hobbies" : "entertainment";
    return off(c.any ? 0.7 : 0.65, `${w} looks like ${what} (${fun})${c.any ? `, not ${c.label}` : ""}.`);
  }
  if (file && x.weak) return on(0.7, `${w} shares “${x.weak}” with ${c.label}.`);
  if (x.empty || blank(s))
    return unsure(s.kind === "ai" ? "An AI chat; the title doesn't say what it's about." : `${cap(s.name)}; the title doesn't say what it's about.`, "ON_TASK");
  if (open(c)) {
    if (s.tag === "study" || (file && x.ed)) return on(0.65, file ? "Looks like study material." : "A study site.");
    return unsure("Looks like reading or study help; the session has no goal to compare with.", "ON_TASK");
  }
  if (s.tag === "code" && (c.subjects.has("cs") || c.games)) return on(0.75, `A coding reference fits ${c.label}.`);
  const o = otherSubject(c, x.tokens);
  if (o && !o.related && !x.weak) return off(0.6, `Looks like ${subjectName(o.subject)} (${o.term}), not ${c.label}.`);
  if (o) return unsure(`Looks like ${subjectName(o.subject)} (${o.term}): related, but not clearly ${c.label}.`, "ON_TASK");
  // Course material (a chapter, lecture slides, a syllabus) or a study site, and nothing points to another subject.
  if (s.tag === "study" || (file && x.study)) return on(0.65, `${file ? "Course material" : "A study site"}, and nothing points to another subject than ${c.label}.`);
  return unsure(`${w} doesn't mention ${c.label} or its topics.`);
}

// Editors: the project and file names against the session.
function ide(s: Surface, c: Ctx, x: Signals): FocusClassification {
  const w = where(s);
  const coding = c.subjects.has("cs") || c.games;
  if (x.hit) return on(0.85, fits(s, x.hit));
  if (x.other) return unsure(`${w} names another course (${x.other}).`, "ON_TASK");
  if (x.weak) return on(0.7, `${w} shares “${x.weak}” with ${c.label}.`);
  const hobby = c.games ? null : first(HOBBY, x.text) ?? first(GAMES, x.text);
  if (hobby) return c.any ? off(0.65, `${w} looks like a hobby project (${hobby}), not ${c.label}.`) : unsure(`${w} looks like a hobby project (${hobby}).`, "DISTRACTING");
  if (x.empty) return coding ? on(0.6, `Coding fits ${c.label}.`) : unsure("An editor with no project named.", "ON_TASK");
  if (open(c)) return x.study ? on(0.65, "This project looks like coursework.") : unsure("Coding; the session has no goal to compare with.", "ON_TASK");
  if (coding) return unsure(`Coding, but the project doesn't mention ${c.label}.`, "ON_TASK");
  const o = otherSubject(c, x.tokens);
  if (o && !o.related) return off(0.6, `${w} looks like ${subjectName(o.subject)} (${o.term}), not ${c.label}.`);
  return unsure(`Coding, but the project doesn't mention ${c.label} or its topics.`);
}

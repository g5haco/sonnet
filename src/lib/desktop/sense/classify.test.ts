import { describe, expect, it, vi } from "vitest";
import type { FocusActivityEvent } from "../focus-sense";
import { classify, classifyEvents, classifyLocal, createSemanticCache, offlineProvider, semanticRequest } from "./classify";
import { isEnforceable, type ActivityInput, type FocusSessionContext, type SemanticProvider } from "./types";
import { LEXICON_SIZE, words } from "./lexicon";

const bio: FocusSessionContext = { sessionId: "1", courseName: "BIOL 1610 Intro Biology", goal: "study for the mitosis quiz" };
const cs: FocusSessionContext = { sessionId: "1", courseName: "CS 3540 Game Design", goal: "finish the platformer prototype" };
const math: FocusSessionContext = { sessionId: "1", courseName: "MATH 1210 Calculus I" };
const music: FocusSessionContext = { sessionId: "1", courseName: "MUTH 1110 Music Theory" };
const none: FocusSessionContext = { sessionId: "1" };

const win = (processName: string | null, windowTitle: string | null, more: Partial<ActivityInput> = {}): ActivityInput =>
  Object.freeze({ processName, appName: null, windowTitle, redacted: null, hasWindow: true, ...more });
const chrome = (page: string) => win("chrome.exe", `${page} - Google Chrome`);
const local = (input: ActivityInput, ctx = bio) => classifyLocal(input, ctx);

describe("classifyLocal", () => {
  it("YouTube: a biology lecture is on task, gameplay is enforceable distraction", () => {
    const lecture = local(chrome("Mitosis vs Meiosis: Side by Side Comparison - YouTube"));
    expect(lecture).toMatchObject({ label: "ON_TASK", method: "heuristic" });
    expect(lecture.reason).toContain("mitosis");
    const game = local(chrome("Minecraft Hardcore Gameplay Ep. 12 - YouTube"));
    expect(game.label).toBe("DISTRACTING");
    expect(isEnforceable(game)).toBe(true);
  });

  it("Discord: study channel on task, gaming server distracting, bare Discord uncertain", () => {
    expect(local(win("Discord.exe", "#cell-bio-help | BIOL 1610 Study Group - Discord")).label).toBe("ON_TASK");
    expect(local(win("Discord.exe", "Discord | #homework-help | Chem Squad")).label).toBe("ON_TASK");
    const social = local(win("Discord.exe", "#memes | Gaming Squad - Discord"));
    expect(social.label).toBe("DISTRACTING");
    expect(isEnforceable(social)).toBe(false);
    const bare = local(win("Discord.exe", "Discord"));
    expect(bare).toMatchObject({ label: "UNCERTAIN", confidence: 0, needsSemantic: false });
  });

  it("Reddit: a biology question on task, r/funny distracting", () => {
    expect(local(win("firefox.exe", "Why do cells need to divide? : r/biology — Mozilla Firefox")).label).toBe("ON_TASK");
    expect(local(win("firefox.exe", "r/learnprogramming on Reddit: How do pointers work? — Mozilla Firefox"), cs).label).toBe("ON_TASK");
    expect(local(win("firefox.exe", "My cat after the vet visit : r/funny — Mozilla Firefox")).label).toBe("DISTRACTING");
  });

  it("course sites and course PDFs are on task", () => {
    expect(local(chrome("Modules: BIOL-1610-001")).label).toBe("ON_TASK");
    expect(local(chrome("Dashboard - Canvas")).label).toBe("ON_TASK");
    expect(local(win("Acrobat.exe", "BIOL1610_Lecture5_CellCycle.pdf - Adobe Acrobat Reader (64-bit)")).label).toBe("ON_TASK");
    expect(local(chrome("chapter12_cell_division.pdf")).label).toBe("ON_TASK");
    // Another course's material: leans on task, but isn't this session's.
    expect(local(win("Acrobat.exe", "HIST1700_Syllabus.pdf - Adobe Acrobat Reader"))).toMatchObject({ label: "UNCERTAIN", lean: "ON_TASK" });
  });

  it("IDE: the session's project on task, an unrelated one never enforceable", () => {
    expect(local(win("Code.exe", "PlayerController.cs - platformer-prototype - Visual Studio Code"), cs).label).toBe("ON_TASK");
    for (const ctx of [bio, cs]) {
      const r = local(win("Code.exe", "index.ts - budget-app - Visual Studio Code"), ctx);
      expect(["UNCERTAIN", "DISTRACTING"]).toContain(r.label);
      expect(isEnforceable(r)).toBe(false);
    }
  });

  it("reads subjects from any part of the context", () => {
    const hw = { sessionId: "1", goal: "CS homework" };
    expect(local(chrome("Hash tables in C++ - YouTube"), hw)).toMatchObject({ label: "ON_TASK" });
    const lab = { sessionId: "1", assignmentTitle: "Lab 4: Enzymes" };
    expect(local(chrome("Photosynthesis in 5 minutes - YouTube"), lab)).toMatchObject({ label: "ON_TASK" });
    expect(local(win("Discord.exe", "#general | General Psychology fans - Discord"), { sessionId: "1", courseName: "PSYC 1010 General Psychology" }).reason).not.toContain("general");
  });

  it("calculator during math is on task", () => {
    expect(local(win("ApplicationFrameHost.exe", "Calculator"), math)).toMatchObject({ label: "ON_TASK", confidence: 0.85 });
    expect(local(chrome("Untitled Graph | Desmos"), math).label).toBe("ON_TASK");
  });

  it("a game exe is enforceable distraction, with or without context", () => {
    for (const ctx of [bio, none]) {
      for (const input of [win("RobloxPlayerBeta.exe", "Roblox"), win("javaw.exe", "Minecraft* 1.20.1 - Singleplayer"), win("VALORANT-Win64-Shipping.exe", "VALORANT")]) {
        const r = local(input, ctx);
        expect(r).toMatchObject({ label: "DISTRACTING", method: "rule" });
        expect(isEnforceable(r)).toBe(true);
      }
    }
  });

  it("anything overlapping the session is never enforceable", () => {
    // Game design: game-dev videos fit, gameplay and games only lean.
    expect(local(chrome("How I made my first game in Unity | Devlog - YouTube"), cs).label).toBe("ON_TASK");
    for (const input of [chrome("Hollow Knight speedrun any% - YouTube"), chrome("Minecraft gameplay - YouTube"), win("Minecraft.Windows.exe", "Minecraft")])
      expect(isEnforceable(local(input, cs))).toBe(false);
    // Music theory needs Spotify.
    expect(local(win("Spotify.exe", "Spotify Premium"), music).label).toBe("ON_TASK");
    expect(local(win("Spotify.exe", "Spotify Premium"))).toMatchObject({ label: "DISTRACTING" });
    // A lone subject word doesn't outweigh leisure, but it does keep it below enforcement.
    const memes = local(chrome("Biology memes that hit different - YouTube"));
    expect(memes.label).toBe("DISTRACTING");
    expect(isEnforceable(memes)).toBe(false);
    // Educational wording keeps leisure below enforcement.
    expect(isEnforceable(local(chrome("Minecraft redstone tutorial - YouTube")))).toBe(false);
  });

  it("without session context leisure stays below enforcement (games excepted)", () => {
    for (const input of [chrome("Fortnite gameplay - YouTube"), chrome("Netflix"), chrome("Play Chess Online - Chess.com"), win("Discord.exe", "#memes | Gaming Squad - Discord")]) {
      const r = local(input, none);
      expect(r.label).toBe("DISTRACTING");
      expect(r.confidence).toBeLessThan(0.9);
    }
    // With no goal, coursework counts as study; a generic how-to only leans.
    expect(local(chrome("Mitosis explained - YouTube"), none)).toMatchObject({ label: "ON_TASK", confidence: 0.6 });
    expect(local(win("Acrobat.exe", "PHYS2210_Syllabus_Spring.pdf - Adobe Acrobat Reader"), none).label).toBe("ON_TASK");
    expect(local(chrome("How to fold a fitted sheet - YouTube"), none)).toMatchObject({ label: "UNCERTAIN", lean: "ON_TASK" });
  });

  it("leisure formats and personal plans outweigh a lone shared word", () => {
    for (const title of ["Cell Block Tango (Official Music Video) - YouTube", "Hardy Weinberg Family Vlog - YouTube", "Biology Club Halloween party planning - Google Docs"]) {
      const r = local(chrome(title));
      expect(r.label).toBe("DISTRACTING");
      expect(isEnforceable(r)).toBe(false);
    }
    // Two topic words, or study wording, keep the match.
    expect(local(chrome("Mitosis and meiosis memes - YouTube")).label).toBe("UNCERTAIN");
    expect(local(chrome("Mitosis explained in a music video - YouTube")).label).toBe("ON_TASK");
  });

  it("personal plans in study apps are distracting, never enforceable", () => {
    for (const input of [win("EXCEL.EXE", "Wedding seating chart and budget.xlsx - Excel"), chrome("Fantasy basketball league notes - Google Docs"), chrome("concert tickets near me - Google Search")]) {
      const r = local(input);
      expect(r.label).toBe("DISTRACTING");
      expect(r.confidence).toBeLessThan(0.9);
    }
  });

  it("another subject's material: unrelated is distracting, related only leans", () => {
    const econ = local(chrome("Supply and demand explained - YouTube"));
    expect(econ).toMatchObject({ label: "DISTRACTING", confidence: 0.6 });
    expect(econ.reason).toContain("economics");
    expect(local(chrome("Stoichiometry practice problems - YouTube"))).toMatchObject({ label: "UNCERTAIN", lean: "ON_TASK" });
  });

  it("course material with nothing pointing elsewhere is on task", () => {
    const hist = { sessionId: "1", courseName: "HIST 1700 American Civilization", goal: "reading response" };
    expect(local(win("Acrobat.exe", "Week5_Lecture_Slides.pdf - Adobe Acrobat Reader"), hist)).toMatchObject({ label: "ON_TASK", confidence: 0.65 });
    expect(local(chrome("Solved: How many moles are in 12 g of carbon? | Chegg.com"), { sessionId: "1", courseName: "CHEM 1210" }).label).toBe("ON_TASK");
  });

  it("reviewer probes: plausible study is never enforceable", () => {
    const ctx = (courseName: string, goal?: string, assignmentTitle?: string) => ({ sessionId: "1", courseName, goal, assignmentTitle });
    const probes: [ActivityInput, FocusSessionContext][] = [
      // A streaming site alone tops out below 0.9.
      [chrome("Our Planet | Netflix"), bio],
      [chrome("Watch My Octopus Teacher | Netflix Official Site"), bio],
      [chrome("Netflix"), ctx("FILM 2100 Film Analysis")],
      // Game-design sessions: a gamedev course makes games part of the session.
      [win("hollow_knight.exe", "Hollow Knight"), ctx("EAE 1010 Intro to Interactive Entertainment")],
      [win("Celeste.exe", "Celeste"), ctx("IGME 202", "playtest report")],
      // Minecraft Education is a classroom tool.
      [win("Minecraft.Education.exe", "Minecraft Education"), ctx("EDUC 3300 Teaching with Technology")],
      [win("Minecraft.Windows.exe", "Minecraft Education"), ctx("EDUC 3300 Teaching with Technology")],
      // Leisure wording that the session itself studies or shares a stem with.
      [chrome("Reacting to TikTok cringe compilation - YouTube"), ctx("PSYC 3400 Media Psychology", "analyze parasocial reaction content")],
      [chrome("MrBeast reacts to the craziest videos - YouTube"), ctx("COMM 3000", undefined, "Content analysis: YouTube reaction channels")],
      [chrome("NFL Draft 2026 Round 1 - YouTube"), ctx("SPM 3000 Sport Management")],
      [chrome("Why memes go viral - YouTube"), ctx("COMM 2110 Digital Media")],
      [chrome("Advent of Code day 5 speedrun - Twitch"), ctx("CS 2420 Data Structures")],
    ];
    for (const [input, c] of probes) expect(isEnforceable(local(input, c)), input.windowTitle ?? "").toBe(false);
    expect(local(win("Minecraft.Education.exe", "Minecraft Education"), ctx("EDUC 3300")).label).not.toBe("DISTRACTING");
    // Still enforceable: a known game and clear leisure in an unrelated session.
    expect(isEnforceable(local(win("RobloxPlayerBeta.exe", "Roblox")))).toBe(true);
    expect(isEnforceable(local(chrome("Minecraft Hardcore Gameplay Ep. 12 - YouTube")))).toBe(true);
  });

  it("round 3: references, formats, venues and app semantics", () => {
    const pharm = { sessionId: "1", courseName: "NURS 3300 Pathophysiology", goal: "review for the exam", assignmentTitle: "Quiz 4: Renal" };
    // The same numbered piece of work is a direct match, even in email.
    expect(local(chrome("Quiz 4 moved to Friday - me@school.edu - State University Mail"), pharm).label).toBe("ON_TASK");
    expect(local(chrome("Your package is out for delivery - me@school.edu - State University Mail"), pharm).label).toBe("DISTRACTING");
    expect(local(chrome("PH3 vs PH4 notes - ChatGPT"), { sessionId: "1", goal: "PH3 problems" }).label).toBe("ON_TASK");
    // Reddit's other feeds, and threads with nothing of the session.
    expect(local(chrome("All posts on Reddit"))).toMatchObject({ label: "DISTRACTING" });
    expect(local(chrome("r/mechanicalkeyboards on Reddit: My new build"))).toMatchObject({ label: "DISTRACTING", confidence: 0.65 });
    // Formats: lifestyle vlogs, sleep stories, encyclopedia disambiguators, gossip.
    for (const t of ["A Month in My Life in Seoul - YouTube", "Ghost Stories to Fall Asleep To - YouTube", "Mitochondria (band) - Wikipedia", "celtics trade rumors - Google Search"]) {
      const r = local(chrome(t));
      expect(r.label).toBe("DISTRACTING");
      expect(isEnforceable(r)).toBe(false);
    }
    // A subject's name with study wording doesn't outweigh a hobby.
    expect(local(chrome("The Biology of Sourdough Baking Explained - King Arthur"))).toMatchObject({ label: "DISTRACTING" });
    // A subject-sounding word on a streaming site keeps it below enforcement, not out of DISTRACTING.
    const cell = local(chrome("Cells at Work! Season 1 Episode 3 - Crunchyroll"), { sessionId: "1", courseName: "HIST 1700" });
    expect(cell.label).toBe("DISTRACTING");
    expect(isEnforceable(cell)).toBe(false);
    // A general social site is only the venue for a post squarely on the session's topic.
    expect(local(chrome("Mitosis timelapse under the microscope / X"))).toMatchObject({ label: "ON_TASK" });
    // An unknown app named in its own title: a shared word in a product name is a coincidence.
    expect(local(win("Cell Factory.exe", "Cell Factory"))).toMatchObject({ label: "UNCERTAIN" });
    // Tools aren't another subject.
    expect(local(chrome("spending_model.ipynb - JupyterLab"), { sessionId: "1", courseName: "ECON 2020" }).label).not.toBe("DISTRACTING");
    // DMs: a handle carrying the course code; Slack's random channel; launcher popups; bare shells; game folders.
    const cs = { sessionId: "1", courseName: "CS 2420 Data Structures" };
    expect(local(win("Discord.exe", "@cs2420-tutor-ana - Discord"), cs).label).toBe("ON_TASK");
    expect(local(win("slack.exe", "random (Channel) - Robotics Club - Slack"), cs).label).toBe("DISTRACTING");
    expect(local(win("steamwebhelper.exe", "Steam - News"), cs)).toMatchObject({ label: "UNCERTAIN", lean: "DISTRACTING" });
    expect(local(win("WindowsTerminal.exe", "Windows PowerShell"), cs).label).toBe("UNCERTAIN");
    expect(local(win("explorer.exe", "Epic Games - File Explorer"), cs).label).toBe("DISTRACTING");
    // Personal queries in study tools, saved tickets.
    expect(local(chrome("how many days until thanksgiving - Wolfram|Alpha"), cs).label).toBe("DISTRACTING");
    expect(local(win("Acrobat.exe", "Taylor_Swift_Tickets_Dec3.pdf - Adobe Acrobat Reader"), cs).label).toBe("DISTRACTING");
  });

  it("feeds, hobby projects, named games, venues, talks and neutral tools", () => {
    const feed = local(chrome("Reddit - Dive into anything"));
    expect(feed.label).toBe("DISTRACTING");
    expect(isEnforceable(feed)).toBe(false);
    expect(local(chrome("$10 vs $10,000 Gaming Setup! - YouTube"), none).label).toBe("DISTRACTING");
    const ds = { sessionId: "1", courseName: "CS 2420 Data Structures", goal: "finish the hash table project" };
    expect(local(win("Code.exe", "main.py - minecraft-server-bot - Visual Studio Code"), ds)).toMatchObject({ label: "DISTRACTING", confidence: 0.65 });
    expect(local(win("Code.exe", "main.py - minecraft-server-bot - Visual Studio Code"), cs).label).not.toBe("DISTRACTING");
    const design = { sessionId: "1", courseName: "CS 3540 Game Design", goal: "analyze Hollow Knight's level design" };
    expect(local(win("hollow_knight.exe", "Hollow Knight"), design)).toMatchObject({ label: "ON_TASK", method: "heuristic" });
    expect(local(chrome("Better wall jumps in Godot - YouTube"), design).label).toBe("ON_TASK");
    expect(local(chrome("(5) BIOL 1610 Exam Review Group | Facebook")).label).toBe("ON_TASK");
    const memory = { sessionId: "1", courseName: "PSYC 1010", goal: "memory and forgetting" };
    expect(local(win("Spotify.exe", "How Memory Works - Some Science Podcast"), memory).label).toBe("ON_TASK");
    expect(local(win("Spotify.exe", "Memories - Some Band"), memory)).toMatchObject({ label: "UNCERTAIN", lean: "ON_TASK" });
    expect(local(win("ApplicationFrameHost.exe", "Calculator"), { sessionId: "1", courseName: "ENGL 2010" })).toMatchObject({ label: "UNCERTAIN" });
    // The channel outweighs the server.
    expect(local(win("Discord.exe", "#memes | BIOL 1610 Study Group - Discord")).label).toBe("DISTRACTING");
    expect(local(win("ms-teams.exe", "Chat | Intramural Volleyball | Microsoft Teams")).label).toBe("DISTRACTING");
  });

  it("enforceable only for near-certain leisure", () => {
    // A streaming site alone stays below 0.9 (documentaries stream too).
    expect(local(chrome("Stranger Things | Netflix"))).toMatchObject({ label: "DISTRACTING", confidence: 0.85 });
    expect(isEnforceable(local(chrome("Some streamer - Twitch")))).toBe(false);
    expect(isEnforceable(local(chrome("Taylor Swift - Anti-Hero (Official Music Video) - YouTube")))).toBe(false);
    expect(isEnforceable(local(chrome("Chemical reaction rates explained - YouTube")))).toBe(false);
  });

  it("Sonnet itself is on task", () => {
    expect(local(win("sonnet-desktop.exe", "Sonnet"))).toMatchObject({ label: "ON_TASK", method: "rule" });
    expect(local(chrome("Flashcards · Sonnet")).label).toBe("ON_TASK");
  });

  it("strips every browser's suffix", () => {
    const page = "Mitosis explained - YouTube";
    for (const [p, t] of [
      ["msedge.exe", `${page} - Personal - Microsoft\u200b Edge`],
      ["msedge.exe", `${page} and 2 more pages - Work - Microsoft Edge`],
      ["firefox.exe", `${page} — Mozilla Firefox`],
      ["brave.exe", `${page} - Brave`],
      ["opera.exe", `${page} - Opera`],
      ["vivaldi.exe", `${page} - Vivaldi`],
    ]) {
      expect(local(win(p, t)).label).toBe("ON_TASK");
      expect(semanticRequest(win(p, t), bio)?.title).toBe(page);
    }
  });

  it("redacted, private and missing windows abstain without the title", () => {
    const cases = [
      win(null, null, { redacted: "excluded" }),
      win("chrome.exe", null, { redacted: "private" }),
      win(null, null, { hasWindow: false }),
      win(null, null),
    ];
    for (const input of cases) {
      const r = local(input);
      expect(r).toMatchObject({ label: "UNCERTAIN", confidence: 0, method: "abstain", needsSemantic: false });
      expect(semanticRequest(input, bio)).toBeNull();
    }
    // A known process without a title is judged by the process.
    expect(local(win("RobloxPlayerBeta.exe", null)).label).toBe("DISTRACTING");
    expect(local(win("Discord.exe", null))).toMatchObject({ label: "UNCERTAIN" });
  });

  it("semanticRequest sends only the minimal payload", () => {
    const ctx = { ...bio, courseId: "c1", assignmentId: "a1", assignmentTitle: "Lab 4", assignmentKind: "quiz" as const };
    expect(semanticRequest(chrome("I Survived 100 Days in the Wilderness - YouTube"), ctx)).toEqual({
      context: { goal: bio.goal, courseName: bio.courseName, assignmentTitle: "Lab 4" },
      app: "chrome.exe",
      title: "I Survived 100 Days in the Wilderness - YouTube",
    });
    // App-only titles, chats, email and terminals never leave.
    for (const input of [chrome("YouTube"), win("Discord.exe", "#general | Friends - Discord"), chrome("Inbox (3) - me@x.edu - Gmail"), win("WindowsTerminal.exe", "C:\\Users\\me\\proj"), win("WINWORD.EXE", "Document1 - Word")])
      expect(semanticRequest(input, bio)).toBeNull();
  });

  it("is pure: inputs and context are untouched", () => {
    const ctx = Object.freeze({ ...bio });
    expect(() => local(chrome("Mitosis - YouTube"), ctx)).not.toThrow();
  });

  it("lexicon terms all tokenize to something", () => {
    expect(LEXICON_SIZE).toBeGreaterThan(400);
    expect(words("Cell Division - Personal - YouTube")).toEqual(["cell", "division"]);
  });
});

const fake = (impl: SemanticProvider["classify"]) => {
  const classify = vi.fn(impl);
  return { provider: { name: "fake", local: true, classify } satisfies SemanticProvider, classify };
};
const ambiguous = (n: number) => chrome(`I tried thing number ${n} - YouTube`);

describe("classify", () => {
  it("offline provider or none: uncertain, abstain, with why", async () => {
    for (const provider of [undefined, offlineProvider]) {
      const [r] = await classify([ambiguous(1)], bio, { provider });
      expect(r).toMatchObject({ label: "UNCERTAIN", confidence: 0, method: "abstain" });
      expect(r.reason).toMatch(/No semantic check/);
    }
  });

  it("never calls the provider when nothing needs it", async () => {
    const { provider, classify: spy } = fake(async (rs) => rs.map(() => null));
    const out = await classify([chrome("Mitosis - YouTube"), win("RobloxPlayerBeta.exe", "Roblox"), win(null, null, { redacted: "private" })], bio, { provider });
    expect(spy).not.toHaveBeenCalled();
    expect(out.map((r) => r.label)).toEqual(["ON_TASK", "DISTRACTING", "UNCERTAIN"]);
    expect(out.every((r) => !("needsSemantic" in r))).toBe(true);
  });

  it("uses a confident verdict, capped below enforcement", async () => {
    const { provider } = fake(async (rs) => rs.map(() => ({ label: "DISTRACTING" as const, confidence: 0.99, reason: "Survival videos are entertainment." })));
    const [r] = await classify([ambiguous(1)], bio, { provider });
    expect(r).toEqual({ label: "DISTRACTING", confidence: 0.85, reason: "Survival videos are entertainment.", method: "semantic" });
    expect(isEnforceable(r)).toBe(false);
  });

  it("low confidence and UNCERTAIN verdicts abstain", async () => {
    const { provider } = fake(async () => [
      { label: "ON_TASK", confidence: 0.4, reason: "Maybe." },
      { label: "UNCERTAIN", confidence: 0.9, reason: "Can't tell." },
    ]);
    const [a, b] = await classify([ambiguous(1), ambiguous(2)], bio, { provider });
    expect(a).toMatchObject({ label: "UNCERTAIN", confidence: 0, method: "abstain", lean: "ON_TASK" });
    expect(b).toMatchObject({ label: "UNCERTAIN", method: "abstain" });
  });

  it("a provider that throws, times out or returns garbage leaves UNCERTAIN", async () => {
    const providers = [
      fake(async () => {
        throw new Error("down");
      }).provider,
      fake(() => new Promise(() => {})).provider,
      fake(async () => "nope" as never).provider,
      fake(async () => [{ label: "MAYBE", confidence: 2, reason: 1 }, null] as never).provider,
    ];
    for (const provider of providers) {
      const out = await classify([ambiguous(1), ambiguous(2)], bio, { provider, timeoutMs: 20 });
      for (const r of out) expect(r).toMatchObject({ label: "UNCERTAIN", confidence: 0, method: "abstain" });
    }
  });

  it("redacted inputs never reach the provider", async () => {
    const { provider, classify: spy } = fake(async (rs) => rs.map(() => null));
    await classify([win("chrome.exe", null, { redacted: "private" }), win(null, null, { redacted: "excluded" }), ambiguous(1)], bio, { provider });
    const sent = spy.mock.calls.flatMap(([rs]) => rs);
    expect(sent).toHaveLength(1);
    expect(Object.keys(sent[0]).sort()).toEqual(["app", "context", "title"]);
    expect(JSON.stringify(sent)).not.toMatch(/sessionId|"1"/);
  });

  it("batches up to 20 per call, dedupes, and caches", async () => {
    const { provider, classify: spy } = fake(async (rs) => rs.map(() => ({ label: "ON_TASK" as const, confidence: 0.8, reason: "Fits." })));
    const inputs = [...Array.from({ length: 25 }, (_, i) => ambiguous(i)), ambiguous(0), ambiguous(1)];
    const cache = createSemanticCache();
    const out = await classify(inputs, bio, { provider, cache });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls.map(([rs]) => rs.length)).toEqual([20, 5]);
    expect(out.every((r) => r.method === "semantic")).toBe(true);
    expect(cache).toMatchObject({ size: 25, misses: 25, hits: 0 });

    await classify(inputs.slice(0, 3), bio, { provider, cache });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(cache.hits).toBe(3);

    const one = fake(async (rs) => rs.map(() => null));
    await classify(Array.from({ length: 20 }, (_, i) => ambiguous(100 + i)), bio, { provider: one.provider, cache });
    expect(one.classify).toHaveBeenCalledTimes(1);
    expect(cache.size).toBe(25); // failures aren't cached
  });

  it("never throws", async () => {
    const out = await classify([{ processName: 5, windowTitle: {}, appName: null, redacted: null, hasWindow: true } as never], bio);
    expect(out[0]).toMatchObject({ label: "UNCERTAIN", method: "abstain" });
  });
});

describe("classifyEvents", () => {
  const ev = (seq: number, kind: FocusActivityEvent["kind"], windowTitle: string | null = null): FocusActivityEvent => ({
    seq,
    timestamp: seq * 1000,
    sessionId: "1",
    platform: "windows",
    kind,
    source: kind === "context" ? "foreground-window" : "monitor",
    idle: false,
    appName: "Google Chrome",
    processName: kind === "context" ? "chrome.exe" : null,
    windowTitle,
    redacted: null,
    confidence: kind === "context" ? "full" : "none",
  });

  it("nulls markers and heartbeats, classifies identical contexts once", async () => {
    const { provider, classify: spy } = fake(async (rs) => rs.map(() => ({ label: "DISTRACTING" as const, confidence: 0.7, reason: "Off topic." })));
    const events = [
      ev(1, "start"),
      ev(2, "context", "Mitosis - YouTube - Google Chrome"),
      ev(3, "context", "I tried thing 1 - YouTube - Google Chrome"),
      ev(4, "heartbeat"),
      ev(5, "context", "I tried thing 1 - YouTube - Google Chrome"),
      ev(6, "stop"),
    ];
    const out = await classifyEvents(events, bio, { provider });
    expect(out.map((e) => e.classification?.label ?? null)).toEqual([null, "ON_TASK", "DISTRACTING", null, "DISTRACTING", null]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toHaveLength(1);
    expect(out[1].seq).toBe(2);
  });
});

// Layer 1: what the foreground window is (from its process name and title), and the rules that need no context.
import type { ActivityInput, FocusClassification } from "./types";
import { named, type Ctx } from "./lexicon";

export type Kind =
  | "sonnet" | "game" | "launcher" | "system" // decided by rules
  | "video" | "reddit" | "fun" | "web" | "search" | "app" // content, judged by the title
  | "chat" | "music" | "lms" | "ref" | "calc" | "ai" | "doc" | "pdf" | "ide" | "terminal" | "explorer" | "call" | "mail";

export type Surface = {
  kind: Kind;
  name: string; // for reasons: "YouTube", "Discord", "Minecraft"
  page: string; // the title without the browser's suffix or a notification count; "" when there's none
  browser: boolean;
  base?: number; // fun sites: DISTRACTING confidence when nothing ties them to the session
  // ref: a study-only site / a coding reference. game: "maybe" = not a known title, "edu" = a classroom edition.
  tag?: "study" | "code" | "maybe" | "edu";
};

const BROWSERS = new Set(
  "chrome.exe msedge.exe firefox.exe brave.exe opera.exe opera_gx.exe vivaldi.exe arc.exe chromium.exe zen.exe librewolf.exe waterfox.exe floorp.exe thorium.exe iexplore.exe".split(" "),
);
// "Page - Google Chrome", "Page — Mozilla Firefox", "Page - Personal - Microsoft\u200b Edge" (the zero-width space is
// removed first), "Page and 3 more pages - Work - Microsoft Edge".
const BROWSER_SUFFIX =
  /(?:\s+and \d+ more pages?)?(?:\s+[-–—]\s+(?:Personal|Work|School|Guest|Default|Profile \d+))?\s+[-–—]\s+(?:Google Chrome|Mozilla Firefox|Microsoft Edge|Brave|Opera(?: GX)?|Vivaldi|Arc|Chromium|Zen Browser|LibreWolf|Waterfox|Floorp|Thorium|Internet Explorer)(?:\s+\([^)]*\))?$/i;
const BROWSER_ONLY = /^(?:Google Chrome|Mozilla Firefox|Microsoft Edge|Brave|Opera(?: GX)?|Vivaldi|Arc|Chromium|New Tab|Start Page|Speed Dial)$/i;
// Desktop apps' own suffixes, so project and file names are what's left.
const APP_SUFFIX =
  /\s+[-–—|]\s+(?:Visual Studio Code(?: - Insiders)?|Cursor|Windsurf|Microsoft Visual Studio|Eclipse IDE|RStudio|Sublime Text.*|Notepad\+\+|Notepad|Adobe Acrobat.*|Acrobat Reader.*|SumatraPDF|Foxit.*|Obsidian v[\d.]+|(?:Microsoft )?(?:Word|PowerPoint|Excel|OneNote)|LibreOffice \w+|VLC media player|Discord|Slack|Microsoft Teams|Zoom(?: Workplace)?)$/i;

const ZW = /[\u200b-\u200d\u2060\ufeff]/g;

const APPS: Record<string, [Kind, string]> = {};
const add = (kind: Kind, name: string, exes: string) => exes.split(" ").forEach((e) => (APPS[e] = [kind, name]));
add("sonnet", "Sonnet", "sonnet-desktop.exe");
add("ide", "Visual Studio Code", "code.exe code-insiders.exe");
add("ide", "an editor", "cursor.exe windsurf.exe devenv.exe idea64.exe idea.exe pycharm64.exe pycharm.exe webstorm64.exe clion64.exe rider64.exe goland64.exe phpstorm64.exe rustrover64.exe datagrip64.exe studio64.exe eclipse.exe sublime_text.exe notepad++.exe rstudio.exe matlab.exe spyder.exe unity.exe unrealeditor.exe zed.exe atom.exe thonny.exe bluej.exe pythonw.exe");
add("pdf", "a PDF reader", "acrobat.exe acrord32.exe sumatrapdf.exe foxitpdfreader.exe foxitreader.exe pdfxedit.exe okular.exe");
add("doc", "Word", "winword.exe");
add("doc", "PowerPoint", "powerpnt.exe");
add("doc", "Excel", "excel.exe");
add("doc", "a notes app", "onenote.exe notion.exe obsidian.exe evernote.exe notepad.exe wordpad.exe soffice.bin soffice.exe xournalpp.exe");
add("ref", "a study app", "anki.exe zotero.exe");
add("calc", "Calculator", "calculatorapp.exe calc.exe calculator.exe geogebra.exe speedcrunch.exe qalculate.exe qalculate-qt.exe");
add("chat", "Discord", "discord.exe discordptb.exe discordcanary.exe");
add("chat", "a messaging app", "whatsapp.exe telegram.exe slack.exe ms-teams.exe teams.exe messenger.exe signal.exe groupme.exe line.exe wechat.exe weixin.exe skype.exe element.exe");
add("music", "Spotify", "spotify.exe");
add("music", "a music app", "applemusic.exe itunes.exe deezer.exe tidal.exe musicbee.exe foobar2000.exe");
add("video", "a video player", "vlc.exe wmplayer.exe mpc-hc.exe mpc-hc64.exe mpc-be64.exe potplayermini64.exe mpv.exe microsoft.media.player.exe video.ui.exe");
add("terminal", "a terminal", "windowsterminal.exe wt.exe powershell.exe pwsh.exe cmd.exe conhost.exe mintty.exe alacritty.exe wezterm-gui.exe");
add("explorer", "File Explorer", "explorer.exe");
add("call", "a video call", "zoom.exe webex.exe");
add("mail", "email", "outlook.exe olk.exe thunderbird.exe hxoutlook.exe");
add("launcher", "Steam", "steam.exe steamwebhelper.exe");
add("launcher", "Epic Games", "epicgameslauncher.exe");
add("launcher", "Battle.net", "battle.net.exe");
add("launcher", "Riot Client", "riotclientux.exe riotclientservices.exe");
add("launcher", "The Minecraft Launcher", "minecraftlauncher.exe");
add("launcher", "This", "eadesktop.exe origin.exe galaxyclient.exe upc.exe ubisoftconnect.exe xboxpcapp.exe itch.exe");
add("system", "Windows", "searchhost.exe searchapp.exe startmenuexperiencehost.exe shellexperiencehost.exe textinputhost.exe systemsettings.exe taskmgr.exe snippingtool.exe screenclippinghost.exe lockapp.exe logonui.exe dwm.exe");

const GAMES: Record<string, string> = {
  "robloxplayerbeta.exe": "Roblox", "minecraft.windows.exe": "Minecraft", "leagueclient.exe": "League of Legends",
  "leagueclientux.exe": "League of Legends", "league of legends.exe": "League of Legends",
  "valorant-win64-shipping.exe": "Valorant", "valorant.exe": "Valorant", "fortniteclient-win64-shipping.exe": "Fortnite",
  "cs2.exe": "Counter-Strike 2", "csgo.exe": "Counter-Strike", "dota2.exe": "Dota 2", "overwatch.exe": "Overwatch",
  "gta5.exe": "GTA V", "gta5_enhanced.exe": "GTA V", "playgtav.exe": "GTA V", "rocketleague.exe": "Rocket League",
  "r5apex.exe": "Apex Legends", "r5apex_dx12.exe": "Apex Legends", "genshinimpact.exe": "Genshin Impact",
  "yuanshen.exe": "Genshin Impact", "starrail.exe": "Honkai: Star Rail", "zenlesszonezero.exe": "Zenless Zone Zero",
  "eldenring.exe": "Elden Ring", "cod.exe": "Call of Duty", "rainbowsix.exe": "Rainbow Six Siege",
  "rainbowsix_vulkan.exe": "Rainbow Six Siege", "tslgame.exe": "PUBG", "destiny2.exe": "Destiny 2",
  "terraria.exe": "Terraria", "stardew valley.exe": "Stardew Valley", "hollow_knight.exe": "Hollow Knight",
  "among us.exe": "Among Us", "osu!.exe": "osu!", "geometrydash.exe": "Geometry Dash", "helldivers2.exe": "Helldivers 2",
  "marvel-win64-shipping.exe": "Marvel Rivals", "witcher3.exe": "The Witcher 3", "cyberpunk2077.exe": "Cyberpunk 2077",
  "bg3.exe": "Baldur's Gate 3", "bg3_dx11.exe": "Baldur's Gate 3", "ts4_x64.exe": "The Sims 4", "rdr2.exe": "Red Dead Redemption 2",
  "factorio.exe": "Factorio", "rimworldwin64.exe": "RimWorld", "hearthstone.exe": "Hearthstone", "wow.exe": "World of Warcraft",
  "ffxiv_dx11.exe": "Final Fantasy XIV", "warframe.x64.exe": "Warframe", "pathofexile.exe": "Path of Exile",
  "pathofexile_x64.exe": "Path of Exile", "diablo iv.exe": "Diablo IV", "fallguys_client_game.exe": "Fall Guys",
  "brawlhalla.exe": "Brawlhalla", "thefinals.exe": "The Finals", "deltarune.exe": "Deltarune", "undertale.exe": "Undertale",
  "celeste.exe": "Celeste", "cuphead.exe": "Cuphead", "balatro.exe": "Balatro", "lethal company.exe": "Lethal Company",
  "phasmophobia.exe": "Phasmophobia", "fc25.exe": "EA Sports FC", "fc24.exe": "EA Sports FC",
};
// Store apps (ApplicationFrameHost.exe) and others known only by their title.
const GAME_WINDOW = /^(?:Microsoft Solitaire Collection|Solitaire.*|Candy Crush.*|Minecraft(?! Education).*|Roblox)$/i;

// Sites by title, first match wins. base: DISTRACTING confidence for a fun site that nothing ties to the session.
type Site = [RegExp, Kind, string, Partial<Surface>?];
const SITES: Site[] = [
  [/^Sonnet$|^Sonnet · |\s·\sSonnet$/, "sonnet", "Sonnet"],
  [/\.pdf\b/i, "pdf", "a PDF"],
  [/YouTube Music/i, "music", "YouTube Music"],
  [/(?:^|\s[-–—]\s?)YouTube$/i, "video", "YouTube"],
  [/\bvimeo\b/i, "video", "Vimeo"],
  [/\breddit\b|(?:^|\s)r\/\w/i, "reddit", "Reddit"],
  [/(?:^|\s[-–—|]\s)Discord$|^Discord(?:\s\||$)/i, "chat", "Discord"],
  [/^WhatsApp$|WhatsApp Web|\s[-–—|]\sWhatsApp$|^Telegram(?: Web)?$|(?:^|\s\|\s)Messenger$|messenger\.com|\s[-–—]\sSlack$|^Slack$|Microsoft Teams|\bGroupMe\b/i, "chat", "a messaging app"],
  [/\bNetflix\b|Disney\+|\bHulu\b|Prime Video|Crunchyroll|Paramount\+|\bPeacock\b|HBO Max/i, "fun", "a streaming service", { base: 0.9 }],
  [/(?:^|\s[-–—]\s)Twitch$/i, "fun", "Twitch", { base: 0.85 }],
  [/\bTikTok\b/i, "fun", "TikTok", { base: 0.85 }],
  [/\bInstagram\b/i, "fun", "Instagram", { base: 0.85 }],
  [/\bSnapchat\b/i, "fun", "Snapchat", { base: 0.85 }],
  [/\b9GAG\b/i, "fun", "9GAG", { base: 0.9 }],
  [/\s\/\sX$|^X$|\bTwitter\b/, "fun", "X", { base: 0.75 }],
  [/\bFacebook\b/i, "fun", "Facebook", { base: 0.75 }],
  [/\bPinterest\b|\bTumblr\b|(?:^|\s[•·|-]\s)Threads$/i, "fun", "a social site", { base: 0.75 }],
  [/\bRobinhood\b|\bCoinbase\b|\bWebull\b|E\*TRADE/i, "fun", "a trading app", { base: 0.7 }],
  [/\bPoki\b|CrazyGames|Cool ?Math Games|Coolmath|Miniclip|Kongregate|\bFriv\b|Armor Games|Chess\.com|lichess|agar\.io|slither\.io|Krunker|1v1\.lol|GeoGuessr|\bWordle\b|NYT Games|\son Steam$|^Roblox$|\s-\sRoblox$/i, "fun", "a games site", { base: 0.9 }],
  [/Amazon\.(?:com|ca|co\.uk)|\|\sAmazon|\beBay\b|\bEtsy\b|\bSHEIN\b|\bTemu\b|AliExpress|Walmart\.com|Best Buy/i, "fun", "a shopping site", { base: 0.7 }],
  [/\bESPN\b|Bleacher Report|\bBuzzFeed\b|\bTMZ\b|\bIMDb\b|Letterboxd|\bFandom\b/i, "fun", "an entertainment site", { base: 0.7 }],
  // Canvas titles rarely name Canvas ("Modules: BIOL 1610-001"), so its page names count too.
  [/^(?:Course )?(?:Modules|Assignments|Announcements|Discussions|Syllabus|Quizzes|Grades(?: for [^:]+)?|People)\s?:\s|\bCanvas\b|Instructure|Blackboard|\bMoodle\b|Brightspace|\bD2L\b|Gradescope|Google Classroom|Schoology|\bPiazza\b|Ed Discussion|Top Hat|iClicker|WebAssign|MindTap|Cengage|Mastering (?:Biology|Chemistry|Physics|A&P|Engineering)|Pearson|McGraw|zyBooks|\bALEKS\b|Perusall|Panopto|Echo360|Kaltura|Turnitin/i, "lms", "your course site"],
  [/^Calculator$|Desmos|Wolfram|GeoGebra|Symbolab|Mathway|Photomath/i, "calc", "a calculator"],
  [/\bChatGPT\b|(?:^|\s[-–—]\s)Claude$|\bGemini\b|\bCopilot\b|Perplexity|DeepSeek/i, "ai", "an AI assistant"],
  [/Google (?:Docs|Slides|Sheets|Drive)|My Drive|Overleaf|\|\sNotion$|^Notion$|\bOneNote\b|Evernote|\.(?:docx?|pptx?|xlsx?)\b|Microsoft Word|PowerPoint|\s-\sExcel$|LibreOffice|Grammarly/i, "doc", "a document"],
  [/Khan Academy|Quizlet|\bChegg\b|Course Hero|Coursera|\bedX\b|LibreTexts|OpenStax|Brilliant\.org|Google Scholar|\bJSTOR\b|PubMed|\bNCBI\b|SparkNotes|LitCharts|CliffsNotes|Studocu|Numerade|Brainly|Codecademy|freeCodeCamp|Duolingo|Purdue OWL|\bAnki\b/i, "ref", "a study site", { tag: "study" }],
  [/Stack Overflow|Stack Exchange|GitHub|GitLab|MDN Web Docs|GeeksforGeeks|W3Schools|LeetCode|HackerRank|Documentation|python\.org/i, "ref", "a coding reference", { tag: "code" }],
  [/Wikipedia|Britannica|Investopedia/i, "ref", "a reference site"],
  [/\s-\sGoogle Search$|\s-\sSearch$|\s-\sBing$|at DuckDuckGo$/i, "search", "a web search"],
  [/\bGmail\b|\s[-–—]\sOutlook$|^Outlook$|Proton Mail|Yahoo Mail|(?:^|\s)Mail$/i, "mail", "email"],
  [/Zoom Meeting|^Zoom(?: Workplace)?$|Google Meet|^Meet\s-\s|\bWebex\b/i, "call", "a video call"],
  [/\bSpotify\b|SoundCloud|Apple Music|\bPandora\b|Amazon Music|\bDeezer\b/i, "music", "a music app"],
];

// Home, list and blank pages: titles with nothing in them to judge.
const BARE =
  /^(?:Home|Subscriptions|History|Watch later|Library|You|Liked videos|Playlists|Trending|Explore|Shorts)(?:\s[-–—]\sYouTube)?$|^YouTube$|^Reddit(?:\s[-–—]\s.*)?$/i;
const GENERIC_DOC = /^(?:Document|Book|Presentation|Untitled(?:\s\w+)?|New \w+|Blank|Notes?|Quick Notes)\s*\d*(?:\s[-–—|]\s.*)?$/i;
export const blank = (s: Surface) =>
  s.kind === "video" || s.kind === "reddit" ? BARE.test(s.page) : (s.kind === "doc" || s.kind === "pdf") && GENERIC_DOC.test(s.page);

const base = (p: string | null) => (p ?? "").split(/[\\/]/).pop()!.toLowerCase();

// What the window is. Never reads anything but the input.
export function surface(input: ActivityInput): Surface {
  const proc = base(input.processName);
  const title = (input.windowTitle ?? "").replace(ZW, "").replace(/^\(\d+\+?\)\s*/, "").replace(/^[\s●•*]+/, "").trim();
  const browser = BROWSERS.has(proc) || BROWSER_SUFFIX.test(title);
  let page = browser ? title.replace(BROWSER_SUFFIX, "").trim() : title.replace(APP_SUFFIX, "").trim();
  if (browser && BROWSER_ONLY.test(page)) page = "";
  const s = (kind: Kind, name: string, more?: Partial<Surface>): Surface => ({ kind, name, page, browser, ...more });

  // Minecraft Education is a classroom tool, whatever exe runs it.
  if (/^Minecraft Education/i.test(page) || proc.startsWith("minecraft.education")) return s("game", "Minecraft Education", { tag: "edu" });
  if (GAMES[proc]) return s("game", GAMES[proc]);
  if (/^javaw?\.exe$/.test(proc) && /^Minecraft(?! Education)/i.test(title)) return s("game", "Minecraft");
  if (proc.endsWith("-win64-shipping.exe")) return s("game", "an Unreal Engine game", { tag: "maybe" });
  const app = APPS[proc];
  if (app?.[0] === "explorer" && /^(?:|Program Manager|Task Switching|Task View|Start|Search)$/i.test(page)) return s("system", "Windows");
  if (app) return s(app[0], app[1]);
  if (!browser && GAME_WINDOW.test(page)) return s("game", page);
  if (!browser && ((proc === "applicationframehost.exe" && !page) || /^(?:Settings|Windows Security|Task Manager)$/i.test(page)))
    return s("system", "Windows");
  // Browsers, store apps (ApplicationFrameHost.exe, titled by the app) and unknown apps: by title.
  for (const [re, kind, name, more] of SITES) if (re.test(page)) return s(kind, name, more);
  return s(browser ? "web" : "app", input.appName || proc || "an app");
}

const result = (label: FocusClassification["label"], confidence: number, reason: string, method: FocusClassification["method"]): FocusClassification => ({
  label,
  confidence,
  reason,
  method,
});
export const abstain = (reason: string): FocusClassification => result("UNCERTAIN", 0, reason, "abstain");

// Gates for windows nothing may be read from: the reason never quotes the title.
export function gate(input: ActivityInput): FocusClassification | null {
  if (input.redacted === "excluded") return abstain("This app is excluded from Focus Sense, so it isn't judged.");
  if (input.redacted === "private") return abstain("A private browsing window; its title isn't read.");
  if (!input.hasWindow) return abstain("No window was in front.");
  if (!input.windowTitle?.trim() && !input.processName?.trim()) return abstain("Nothing about this window could be read.");
  return null;
}

// Rules that hold for any student. Game titles in the session's own context (a game-design course) only lean.
export function rule(s: Surface, c: Ctx): FocusClassification | null {
  if (s.kind === "sonnet") return result("ON_TASK", 0.95, "Sonnet is your study app.", "rule");
  if (s.kind === "system") return abstain("Windows itself was in front (desktop, task switcher or settings).");
  if (s.kind !== "game" && s.kind !== "launcher") return null;
  const what = s.kind === "game" ? `${s.name} is a game` : `${s.name} is a game launcher`;
  // The assignment is this game ("play and analyze Celeste for the playtest report").
  if (s.tag === "edu")
    return named(c, s.name)
      ? result("ON_TASK", 0.8, `${s.name} is named in your session.`, "heuristic")
      : { ...abstain(`${s.name} is a classroom edition; it may be part of the lesson.`), method: "heuristic", lean: "ON_TASK" };
  if (s.kind === "game" && c.games && named(c, s.name))
    return result("ON_TASK", 0.8, `${s.name} is named in your session.`, "heuristic");
  // A launcher's own popups (news, updates, friends list) open by themselves: not a choice to play.
  if (s.kind === "launcher" && /\b(?:news|updat\w*|friends|log ?in|sign ?in)\b/i.test(s.page))
    return { ...abstain(`${cap(what)}, but this looks like one of its own popups.`), method: "heuristic", lean: "DISTRACTING" };
  if (c.games) return { ...abstain(`${cap(what)}, but your session is about games.`), method: "heuristic", lean: "DISTRACTING" };
  if (s.tag === "maybe") return result("DISTRACTING", 0.8, "This looks like a game (an Unreal Engine build).", "heuristic");
  return result("DISTRACTING", s.kind === "game" ? 0.95 : 0.85, `${cap(what)}.`, "rule");
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

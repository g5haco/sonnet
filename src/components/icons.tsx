// Every icon in Sonnet, from Phosphor (regular weight). The names are the ones the app has always used, so
// call sites stay short; each maps to its Phosphor glyph here. Default size 24, like before; a size-* class wins.
import type { Icon, IconProps } from "@phosphor-icons/react";
import {
  ArrowCounterClockwiseIcon as PArrowCounterClockwise,
  ArrowDownIcon as PArrowDown,
  ArrowRightIcon as PArrowRight,
  ArrowSquareOutIcon as PArrowSquareOut,
  ArrowUpIcon as PArrowUp,
  ArrowsClockwiseIcon as PArrowsClockwise,
  BookOpenIcon as PBookOpen,
  BookOpenTextIcon as PBookOpenText,
  BrainIcon as PBrain,
  CalculatorIcon as PCalculator,
  CalendarBlankIcon as PCalendarBlank,
  CalendarCheckIcon as PCalendarCheck,
  CalendarDotsIcon as PCalendarDots,
  CalendarPlusIcon as PCalendarPlus,
  CaretDownIcon as PCaretDown,
  CaretLeftIcon as PCaretLeft,
  CaretRightIcon as PCaretRight,
  ChatCircleIcon as PChatCircle,
  ChatCircleTextIcon as PChatCircleText,
  CheckIcon as PCheck,
  CheckCircleIcon as PCheckCircle,
  CircleHalfIcon as PCircleHalf,
  CircleNotchIcon as PCircleNotch,
  ClockIcon as PClock,
  ClockCounterClockwiseIcon as PClockCounterClockwise,
  CopyIcon as PCopy,
  DeviceMobileIcon as PDeviceMobile,
  ExamIcon as PExam,
  FileArrowUpIcon as PFileArrowUp,
  FileDocIcon as PFileDoc,
  FileMagnifyingGlassIcon as PFileMagnifyingGlass,
  FilePlusIcon as PFilePlus,
  FileTextIcon as PFileText,
  FlowArrowIcon as PFlowArrow,
  FolderOpenIcon as PFolderOpen,
  GearIcon as PGear,
  GlobeIcon as PGlobe,
  GraduationCapIcon as PGraduationCap,
  HourglassIcon as PHourglass,
  HouseIcon as PHouse,
  ImageIcon as PImage,
  InfoIcon as PInfo,
  LifebuoyIcon as PLifebuoy,
  LightbulbIcon as PLightbulb,
  LinkIcon as PLink,
  ListIcon as PList,
  ListChecksIcon as PListChecks,
  LockIcon as PLock,
  MagnifyingGlassIcon as PMagnifyingGlass,
  MedalIcon as PMedal,
  MicrophoneIcon as PMicrophone,
  NoteIcon as PNote,
  NotePencilIcon as PNotePencil,
  PaletteIcon as PPalette,
  PaperPlaneRightIcon as PPaperPlaneRight,
  PaperclipIcon as PPaperclip,
  PauseIcon as PPause,
  PlayIcon as PPlay,
  PlusIcon as PPlus,
  PresentationIcon as PPresentation,
  RssIcon as PRss,
  ShuffleIcon as PShuffle,
  SidebarSimpleIcon as PSidebarSimple,
  SlidersHorizontalIcon as PSlidersHorizontal,
  SparkleIcon as PSparkle,
  SquareIcon as PSquare,
  SquaresFourIcon as PSquaresFour,
  StackIcon as PStack,
  TargetIcon as PTarget,
  TimerIcon as PTimer,
  TrashIcon as PTrash,
  UserIcon as PUser,
  WarningIcon as PWarning,
  XIcon as PX,
  XCircleIcon as PXCircle,
} from "@phosphor-icons/react/dist/ssr";

const w = (I: Icon) => {
  const C = (p: IconProps) => <I size={24} {...p} />;
  C.displayName = I.displayName;
  return C;
};

export type IconType = ReturnType<typeof w>;

export const ArrowDown = w(PArrowDown);
export const ArrowRight = w(PArrowRight);
export const ArrowUp = w(PArrowUp);
export const Award = w(PMedal);
export const BookOpen = w(PBookOpen);
export const BookOpenCheck = w(PExam);
export const BookOpenText = w(PBookOpenText);
export const Brain = w(PBrain);
export const Calculator = w(PCalculator);
export const CalendarCheck = w(PCalendarCheck);
export const CalendarClock = w(PCalendarDots);
export const CalendarDays = w(PCalendarBlank);
export const CalendarPlus = w(PCalendarPlus);
export const CalendarRange = w(PCalendarDots);
export const CalendarSearch = w(PCalendarDots);
export const Check = w(PCheck);
export const CheckIcon = w(PCheck);
export const ChevronDown = w(PCaretDown);
export const ChevronLeft = w(PCaretLeft);
export const ChevronRight = w(PCaretRight);
export const CircleCheck = w(PCheckCircle);
export const CircleCheckIcon = w(PCheckCircle);
export const Clock = w(PClock);
export const Copy = w(PCopy);
export const ExternalLink = w(PArrowSquareOut);
export const FilePlus2 = w(PFilePlus);
export const FileQuestion = w(PFileMagnifyingGlass);
export const FileText = w(PFileText);
export const FileType = w(PFileDoc);
export const FileUp = w(PFileArrowUp);
export const FolderOpen = w(PFolderOpen);
export const Globe = w(PGlobe);
export const GraduationCap = w(PGraduationCap);
export const History = w(PClockCounterClockwise);
export const Hourglass = w(PHourglass);
export const House = w(PHouse);
export const Image = w(PImage);
export const InfoIcon = w(PInfo);
export const Layers = w(PStack);
export const LayoutGrid = w(PSquaresFour);
export const LifeBuoy = w(PLifebuoy);
export const Lightbulb = w(PLightbulb);
export const Link2 = w(PLink);
export const ListChecks = w(PListChecks);
export const Loader2Icon = w(PCircleNotch);
export const Lock = w(PLock);
export const Menu = w(PList);
export const MessageCircle = w(PChatCircle);
export const MessageCircleQuestion = w(PChatCircleText);
export const Mic = w(PMicrophone);
export const OctagonXIcon = w(PXCircle);
export const Palette = w(PPalette);
export const PanelRight = w(PSidebarSimple);
export const Paperclip = w(PPaperclip);
export const Pause = w(PPause);
export const Play = w(PPlay);
export const Plus = w(PPlus);
export const Presentation = w(PPresentation);
export const RefreshCw = w(PArrowsClockwise);
export const RotateCcw = w(PArrowCounterClockwise);
export const Rss = w(PRss);
export const Search = w(PMagnifyingGlass);
export const SendHorizontal = w(PPaperPlaneRight);
export const Settings = w(PGear);
export const Settings2 = w(PSlidersHorizontal);
export const Shuffle = w(PShuffle);
export const Smartphone = w(PDeviceMobile);
export const Sparkles = w(PSparkle);
export const Square = w(PSquare);
export const SquarePen = w(PNotePencil);
export const StickyNote = w(PNote);
export const SunMoon = w(PCircleHalf);
export const Target = w(PTarget);
export const Timer = w(PTimer);
export const Trash2 = w(PTrash);
export const TriangleAlert = w(PWarning);
export const TriangleAlertIcon = w(PWarning);
export const User = w(PUser);
export const Workflow = w(PFlowArrow);
export const X = w(PX);
export const XIcon = w(PX);

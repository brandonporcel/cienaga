export interface ParsedSchedule {
  datetime: string;
  timeText: string;
}

export interface ParsedCinemaNote {
  cinemaName: string;
  cinemaAddress?: string;
  description?: string;
  schedule: ParsedSchedule | null;
  fullTimeText: string;
}

interface CinemaBlock {
  cinemaName: string;
  cinemaAddress?: string;
  scheduleLines: string[];
  descriptionLines: string[];
}

const CINEMA_PATTERN = /^(.+?)\s*\((.+?)\)\s*$/;
const RANGE_PATTERN = /Del\s+(\d{1,2})\s+al\s+(\d{1,2})/i;
const SPECIFIC_DATE_PATTERN = /(\d{1,2})\/(\d{1,2})\s+a\s+las\s+(\d{1,2}):(\d{2})\s*hs/i;
const NAMED_MONTH_PATTERN =
  /(\d{1,2})(?:,?\s*(\d{1,2}))*\s*y\s+(\d{1,2})\s+de\s+(\w+)\s+a\s+las\s+(\d{1,2}):(\d{2})\s*hs/i;
const TIME_PATTERN = /(\d{1,2}):(\d{2})\s*hs/i;
const URL_PATTERN = /https?:\/\/[^\s<>"]+/g;

const MONTH_MAP: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
  sep: 8,
  oct: 9,
  nov: 10,
  dic: 11,
};

function cleanHtml(html: string): string {
  let text = html;
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n");
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>[^<]*<\/a>/gi, "$1");
  text = text.replace(/<[^>]+>/g, "");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&quot;/g, '"');
  return text;
}

function normalizeLines(html: string): string[] {
  const text = cleanHtml(html);
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*-\s+/, "").trim())
    .filter((line) => line.length > 0);
}

function buildBlocks(lines: string[]): CinemaBlock[] {
  const blocks: CinemaBlock[] = [];
  let current: CinemaBlock | null = null;

  for (const line of lines) {
    const match = line.match(CINEMA_PATTERN);
    if (match) {
      if (current) blocks.push(current);
      current = {
        cinemaName: match[1].trim(),
        cinemaAddress: match[2].trim(),
        scheduleLines: [],
        descriptionLines: [],
      };
      continue;
    }

    if (!current) {
      current = {
        cinemaName: "Unknown",
        scheduleLines: [],
        descriptionLines: [],
      };
    }

    if (isScheduleLine(line)) {
      current.scheduleLines.push(line);
    } else {
      current.descriptionLines.push(line);
    }
  }

  if (current) blocks.push(current);
  return blocks;
}

function isScheduleLine(line: string): boolean {
  return (
    RANGE_PATTERN.test(line) ||
    SPECIFIC_DATE_PATTERN.test(line) ||
    NAMED_MONTH_PATTERN.test(line) ||
    TIME_PATTERN.test(line)
  );
}

function extractUrls(lines: string[]): string[] {
  const urls: string[] = [];
  for (const line of lines) {
    const matches = line.match(URL_PATTERN);
    if (matches) urls.push(...matches);
  }
  return urls;
}

function extractTimesFromLine(line: string): string[] {
  const times: string[] = [];
  let m: RegExpExecArray | null;
  const re = /(\d{1,2}):(\d{2})\s*hs/gi;
  while ((m = re.exec(line)) !== null) {
    times.push(`${m[1].padStart(2, "0")}:${m[2]}`);
  }
  return times;
}

function parseScheduleBlock(scheduleLines: string[]): {
  datetime: string;
  timeText: string;
  fullTimeText: string;
} | null {
  if (scheduleLines.length === 0) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const firstRange = scheduleLines.find((l) => RANGE_PATTERN.test(l));
  const firstSpecific = scheduleLines.find((l) => SPECIFIC_DATE_PATTERN.test(l));
  const firstNamedMonth = scheduleLines.find((l) => NAMED_MONTH_PATTERN.test(l));

  if (firstRange) {
    return parseRange(firstRange, scheduleLines, currentYear, currentMonth);
  }
  if (firstSpecific) {
    return parseSpecificDate(firstSpecific, scheduleLines, currentYear);
  }
  if (firstNamedMonth) {
    return parseNamedMonth(firstNamedMonth, scheduleLines, currentYear);
  }

  const allTimes = scheduleLines.flatMap((l) => extractTimesFromLine(l));
  const firstTime = allTimes[0] || "00:00";

  return {
    datetime: formatDatetime(currentYear, currentMonth, 1, firstTime),
    timeText: allTimes.length > 0 ? allTimes.join(" y ") + " hs" : "",
    fullTimeText: scheduleLines.join(" · "),
  };
}

function parseRange(
  rangeLine: string,
  allLines: string[],
  year: number,
  month: number,
): { datetime: string; timeText: string; fullTimeText: string } {
  const m = rangeLine.match(RANGE_PATTERN)!;
  const startDay = parseInt(m[1]);
  const endDay = parseInt(m[2]);

  const allTimes = allLines.flatMap((l) => extractTimesFromLine(l));
  const firstTime = allTimes[0] || "00:00";

  const rangeText = `Del ${startDay} al ${endDay}`;
  const timeText =
    allTimes.length > 0
      ? `${rangeText} · ${allTimes.join(" y ")} hs`
      : rangeText;

  return {
    datetime: formatDatetime(year, month, startDay, firstTime),
    timeText,
    fullTimeText: allLines.join(" · "),
  };
}

function parseSpecificDate(
  dateLine: string,
  allLines: string[],
  year: number,
): { datetime: string; timeText: string; fullTimeText: string } {
  const m = dateLine.match(SPECIFIC_DATE_PATTERN)!;
  const day = parseInt(m[1]);
  const dateMonth = parseInt(m[2]) - 1;
  const time = `${m[3].padStart(2, "0")}:${m[4]}`;

  return {
    datetime: formatDatetime(year, dateMonth, day, time),
    timeText: `${day}/${dateMonth + 1} a las ${time} hs`,
    fullTimeText: allLines.join(" · "),
  };
}

function parseNamedMonth(
  line: string,
  allLines: string[],
  year: number,
): { datetime: string; timeText: string; fullTimeText: string } {
  const m = line.match(NAMED_MONTH_PATTERN)!;
  const day = parseInt(m[1]);
  const monthName = m[4];
  const time = `${m[5].padStart(2, "0")}:${m[6]}`;
  const monthIndex = MONTH_MAP[monthName.toLowerCase()] ?? 0;

  const parts = line.split(/\s+a\s+las\s+/i);
  const dateText = parts[0]?.trim() || line;

  return {
    datetime: formatDatetime(year, monthIndex, day, time),
    timeText: `${dateText} a las ${time} hs`,
    fullTimeText: allLines.join(" · "),
  };
}

function formatDatetime(
  year: number,
  month: number,
  day: number,
  time: string,
): string {
  const [hours, minutes] = time.split(":").map(Number);
  // Argentina = UTC-3, convertir a UTC
  const date = new Date(Date.UTC(year, month, day, hours + 3, minutes, 0));
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function parseListNote(html: string): ParsedCinemaNote[] {
  const lines = normalizeLines(html);

  if (lines.length === 0) {
    return [];
  }

  const blocks = buildBlocks(lines);

  if (blocks.length === 0) {
    return [];
  }

  return blocks.map((block) => {
    const urls = extractUrls(block.descriptionLines);
    const description = [
      ...block.descriptionLines.filter((l) => !URL_PATTERN.test(l)),
      ...urls,
    ]
      .join(" ")
      .trim() || undefined;

    const schedule = parseScheduleBlock(block.scheduleLines);

    return {
      cinemaName: block.cinemaName,
      cinemaAddress: block.cinemaAddress,
      description,
      schedule,
      fullTimeText: schedule?.fullTimeText || block.scheduleLines.join(" · "),
    };
  });
}

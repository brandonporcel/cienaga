export interface ParsedSchedule {
  datetimes: string[];
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

/**
 * Extrae TODAS las fechas específicas de una línea usando matchAll.
 * Para "20/8 a las 21:00 hs · 22/8 a las 16:45 hs · 25/8 a las 15:00 hs"
 * retorna 3 ISO datetimes en vez de solo 1.
 */
function extractAllSpecificDates(line: string, year: number): string[] {
  const dates: string[] = [];
  const matches = line.matchAll(SPECIFIC_DATE_PATTERN);
  for (const m of matches) {
    const day = parseInt(m[1]);
    const dateMonth = parseInt(m[2]) - 1;
    const time = `${m[3].padStart(2, "0")}:${m[4]}`;
    dates.push(formatDatetime(year, dateMonth, day, time));
  }
  return dates;
}

/**
 * Extrae todas las fechas de un rango "Del X al Y".
 * Genera una fecha por cada día del rango, usando la primera hora encontrada.
 */
function extractRangeDates(
  line: string,
  year: number,
  month: number,
): string[] {
  const m = line.match(RANGE_PATTERN);
  if (!m) return [];
  const startDay = parseInt(m[1]);
  const endDay = parseInt(m[2]);
  const times = extractTimesFromLine(line);
  const time = times[0] || "00:00";
  const dates: string[] = [];
  for (let d = startDay; d <= endDay; d++) {
    dates.push(formatDatetime(year, month, d, time));
  }
  return dates;
}

/**
 * Extrae fechas de un patrón con mes nombrado:
 * "20 y 21 de agosto a las 21:00 hs"
 */
function extractNamedMonthDates(line: string, year: number): string[] {
  const m = line.match(NAMED_MONTH_PATTERN);
  if (!m) return [];
  const monthName = m[4];
  const monthIndex = MONTH_MAP[monthName.toLowerCase()] ?? 0;
  const time = `${m[5].padStart(2, "0")}:${m[6]}`;
  // Capturar todos los días mencionados (m[1] = primero, m[2] = segundo opcional, m[3] = después de "y")
  const days: number[] = [parseInt(m[1])];
  if (m[2]) days.push(parseInt(m[2]));
  if (m[3]) days.push(parseInt(m[3]));
  return days.map((d) => formatDatetime(year, monthIndex, d, time));
}

/**
 * Parsea un bloque de horarios y retorna TODOS los datetimes encontrados.
 * Soporta múltiples fechas por línea (separadas con "·"), rangos, y meses nombrados.
 */
function parseScheduleBlock(scheduleLines: string[]): {
  datetimes: string[];
  timeText: string;
  fullTimeText: string;
} | null {
  if (scheduleLines.length === 0) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const allDatetimes: string[] = [];

  for (const line of scheduleLines) {
    // Si es rango, generar una fecha por cada día del rango
    if (RANGE_PATTERN.test(line)) {
      allDatetimes.push(...extractRangeDates(line, currentYear, currentMonth));
      continue;
    }
    // Si tiene mes nombrado ("20 y 21 de agosto a las 21:00 hs")
    if (NAMED_MONTH_PATTERN.test(line)) {
      allDatetimes.push(...extractNamedMonthDates(line, currentYear));
      continue;
    }
    // Fecha específica — puede haber varias en la línea separadas por "·"
    if (SPECIFIC_DATE_PATTERN.test(line)) {
      allDatetimes.push(...extractAllSpecificDates(line, currentYear));
    }
  }

  // Deduplicar y ordenar cronológicamente
  const uniqueDatetimes = [...new Set(allDatetimes)].sort();

  const allTimes = scheduleLines.flatMap((l) => extractTimesFromLine(l));

  return {
    datetimes: uniqueDatetimes,
    timeText: allTimes.length > 0 ? allTimes.join(" y ") + " hs" : "",
    fullTimeText: scheduleLines.join(" · "),
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

/**
 * Servicio para obtener estadísticas de películas desde el endpoint CSI de Letterboxd.
 *
 * Endpoint: https://letterboxd.com/csi/film/{slug}/stats/
 * Devuelve HTML con aria-label="Watched by X members", "Liked by X members", etc.
 *
 * Cloudflare bloquea el CSI desde IPs de datacenter (GitHub Actions), así que
 * el accesso principal va por Firecrawl (que atraviesa el challenge), con
 * fallback a curl para IPs residenciales (útil local). Requiere
 * FIRECRAWL_API_KEY para el primer camino.
 */

import axios from "axios";
import { execFile } from "child_process";
import * as cheerio from "cheerio";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const LETTERBOXD_CSI_BASE = "https://letterboxd.com/csi/film";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export interface FilmStats {
  watches: number;
  likes: number;
  lists: number;
}

/**
 * Obtiene las estadísticas de una película desde el CSI endpoint de Letterboxd.
 * @param slug - Slug de la película en Letterboxd (ej: "the-shining")
 * @returns FilmStats o null si no se pudieron obtener
 */
export async function getFilmStats(slug: string): Promise<FilmStats | null> {
  const url = `${LETTERBOXD_CSI_BASE}/${slug}/stats/`;
  const referer = `https://letterboxd.com/film/${slug}/`;

  // Camino principal: Firecrawl (atraviesa Cloudflare, sirve en el runner).
  const firecrawlHtml = await fetchByFirecrawl(url);
  if (firecrawlHtml) {
    const stats = parseStats(firecrawlHtml);
    if (stats) return stats;
  }

  // Fallback: curl local (IP residencial). No sirve en el runner pero es útil local.
  try {
    const { stdout } = await execFileAsync(
      "curl",
      [
        "-s",
        url,
        "-H",
        `User-Agent: ${USER_AGENT}`,
        "-H",
        `Referer: ${referer}`,
        "--max-time",
        "10",
      ],
      { timeout: 15000 },
    );
    const stats = parseStats(stdout);
    if (stats) return stats;
  } catch {
    // ignora
  }

  return null;
}

/**
 * Pide el HTML del CSI vía Firecrawl. Devuelve null si no hay API key o falla.
 */
async function fetchByFirecrawl(url: string): Promise<string | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await axios.post(
      "https://api.firecrawl.dev/v2/scrape",
      { url, formats: ["html"] },
      { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 45000 },
    );
    const html: string = response.data?.data?.html;
    return html && typeof html === "string" ? html : null;
  } catch {
    return null;
  }
}

/**
 * Parsea el HTML del CSI y extrae watches/likes/lists. Devuelve null si no
 * se pudo parsear el número de "watches".
 */
function parseStats(html: string): FilmStats | null {
  const $ = cheerio.load(html);
  const watches = parseCount(
    $(".production-statistic.-watches").attr("aria-label"),
  );
  const likes = parseCount(
    $(".production-statistic.-likes").attr("aria-label"),
  );
  const lists = parseCount(
    $(".production-statistic.-lists").attr("aria-label"),
  );

  if (watches === null) return null;

  return { watches: watches ?? 0, likes: likes ?? 0, lists: lists ?? 0 };
}

/**
 * Parsea "Watched by 4,856,315 members" → 4856315
 */
function parseCount(ariaLabel: string | undefined): number | null {
  if (!ariaLabel) return null;
  const match = ariaLabel.match(/([\d,\.]+)/);
  if (!match) return null;
  return parseInt(match[1].replace(/[,\.]/g, ""), 10);
}

/**
 * Obtiene stats de múltiples películas con rate limiting.
 * @param films - Array de { slug, title } para logging
 * @param delayMs - Delay entre requests (default 300ms)
 * @returns Map de slug → FilmStats
 */
export async function getBatchFilmStats(
  films: { slug: string; title: string }[],
  delayMs = 300,
): Promise<Map<string, FilmStats>> {
  const stats = new Map<string, FilmStats>();

  for (let i = 0; i < films.length; i++) {
    const film = films[i];
    const filmStats = await getFilmStats(film.slug);

    if (filmStats) {
      stats.set(film.slug, filmStats);
    } else {
      console.warn(`   ⚠️  No stats for: ${film.title} (${film.slug})`);
    }

    // Rate limiting: no último request
    if (i < films.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return stats;
}

const API_KEY = (import.meta as any).env?.VITE_STEAM_API_KEY || (import.meta as any).env?.STEAM_API_KEY;
const isDev = Boolean((import.meta as any).env?.DEV);

function buildUrl(path: string, params: Record<string, string | number | boolean>) {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => qp.set(k, String(v)));
  // In dev we route to the dev proxy so the browser doesn't hit Steam directly (avoids CORS)
  if (isDev) return `/steam-api${path}?${qp.toString()}`;
  return `https://api.steampowered.com${path}?${qp.toString()}`;
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Steam API request failed: ${res.status} ${res.statusText}`);
  return res.json();
}

async function apiGet(path: string, params: Record<string, string | number | boolean>) {
  const p = { ...params };
  if (API_KEY) p.key = API_KEY;
  else if (!isDev) throw new Error('STEAM API key not found. Set VITE_STEAM_API_KEY in your .env');

  const url = buildUrl(path, p);
  return fetchJson(url);
}

export async function getPlayerSummary(steamId: string) {
  const json = await apiGet('/ISteamUser/GetPlayerSummaries/v2/', { steamids: steamId });
  return json?.response?.players?.[0] ?? null;
}

export async function getRecentlyPlayedGames(steamId: string) {
  const json = await apiGet('/IPlayerService/GetRecentlyPlayedGames/v1/', { steamid: steamId });
  // returns { response: { total_count, games: [ { appid, name, playtime_2weeks, playtime_forever, img_icon_url } ] } }
  return json?.response?.games ?? [];
}

export async function getOwnedGames(steamId: string) {
  const json = await apiGet('/IPlayerService/GetOwnedGames/v1/', {
    steamid: steamId,
    include_appinfo: 1,
    include_played_free_games: 1,
  });
  return json?.response?.games ?? [];
}

export async function getGameAchievements(steamId: string, appId: number) {
  const json = await apiGet('/ISteamUserStats/GetPlayerAchievements/v0001/', {
    steamid: steamId,
    appid: appId,
  });
  // Steam returns achievements under `playerstats.achievements` for this endpoint.
  // Example: { playerstats: { steamID, gameName, achievements: [ { apiname, achieved, unlocktime } ] } }
  return json?.playerstats?.achievements ?? [];
}

export async function getGameSchema(appId: number) {
  // Returns the game's schema which includes the full list of achievements available for the game.
  // Example: { game: { gameName, availableGameStats: { achievements: [ { name, defaultvalue, displayName } ] } } }
  try {
    const json = await apiGet('/ISteamUserStats/GetSchemaForGame/v2/', { appid: appId });
    return json?.game?.availableGameStats?.achievements ?? [];
  } catch (err) {
    // Schema may be unavailable for some games; return empty and let callers fall back.
    return [];
  }
}

function getLastTwoWeeksAchievements(achievements: any[]) {
  const now = Date.now();
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
  // Coerce unlocktime and keep only those with a positive timestamp within the window
  return (achievements || [])
    .map((a) => ({ ...a, _unlockAtMs: a && a.unlocktime ? Number(a.unlocktime) * 1000 : 0 }))
    .filter((a) => a._unlockAtMs > 0 && a._unlockAtMs >= twoWeeksAgo);
}

/**
 * Generate a simple report using Steam APIs.
 * Steam exposes recent playtime (2 weeks). Weekly/monthly values are estimated from that.
 */
export async function generateReport(
  steamId: string,
  period: '2weeks' | 'weekly' | 'monthly' = '2weeks',
) {
  const recent = await getRecentlyPlayedGames(steamId);
  const player = await getPlayerSummary(steamId);

  const games = (recent || []).map((g: any) => {
    const minutes = g.playtime_2weeks ?? 0;
    const hours = Math.round(minutes / 60);
    const appid = g.appid;
    const imgHash = g.img_icon_url || g.img_logo_url || null;
    const icon = imgHash ? `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${appid}/${imgHash}.jpg` : null;
    return { name: g.name, hours, appid, imgHash, icon };
  });

  games.sort((a: any, b: any) => b.hours - a.hours);

  const total2WeeksHours = games.reduce((s: number, g: any) => s + g.hours, 0);

  const gamesDetailed = await Promise.all(
    games.map(async (game: any) => {
      const [achievements, schema] = await Promise.all([
        getGameAchievements(steamId, game.appid),
        getGameSchema(game.appid),
      ]);

      // counts: only total possible (from schema if available) and unlocked count
      const unlockedCount = achievements.filter((a: any) => Number(a.achieved) === 1).length;
      const totalPossible = schema.length || achievements.length || 0;
      const lastTwoWeeks = getLastTwoWeeksAchievements(achievements);
      const lastTwoWeeksCount = Array.isArray(lastTwoWeeks) ? lastTwoWeeks.length : 0;

      return {
        ...game,
        achievements: {
          total: totalPossible,
          unlocked: unlockedCount,
          lastTwoWeeks,
          lastTwoWeeksCount,
          raw: achievements,
        },
      };
    })
  );

  // Debug: log a compact summary of achievement metadata for each game to help diagnose
  // missing unlock timestamps or empty payloads. This prints to the browser console.
  try {
    const debugSummary = gamesDetailed.map((g: any) => ({
      appid: g.appid,
      name: g.name,
      total: g.achievements.total,
      unlocked: g.achievements.unlocked,
      lastTwoWeeksCount: g.achievements.lastTwoWeeksCount,
      rawSample: Array.isArray(g.achievements.raw) ? g.achievements.raw.slice(0, 3) : g.achievements.raw,
    }));
    console.debug('steamReportDebug', { steamId, steamName: player?.personaname, games: debugSummary });
  } catch (e) {
    // ignore logging errors
  }

  let totalHours = total2WeeksHours;
  let periodLabel = 'Last 14 days';

  switch (period) {
    case 'weekly':
      totalHours = Math.round(total2WeeksHours / 2);
      periodLabel = 'Estimated last 7 days';
      break;
    case 'monthly':
      totalHours = Math.round(total2WeeksHours * 2);
      periodLabel = 'Estimated last 30 days';
      break;
    case '2weeks':
    default:
      totalHours = total2WeeksHours;
      periodLabel = 'Last 14 days';
  }

  return {
    steamId,
    steamName: player?.personaname ?? null,
    steamAvatar: player?.avatarfull ?? player?.avatarmedium ?? player?.avatar ?? null,
    period,
    periodLabel,
    topGames: games,
    detailedGames: gamesDetailed,
    totalHours,
    rawRecent: recent,
  };
}

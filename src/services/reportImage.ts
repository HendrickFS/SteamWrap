/**
 * Simple client-side report image generator.
 *
 * Usage:
 * import generateReportImage from '../services/reportImage';
 * const dataUrl = await generateReportImage(report);
 * // then set an <img src={dataUrl} /> or download it
 */

type TopGame = {
  name: string; // game name
  hours?: number; // 2 weeks playtime hours
  icon?: string; // icon URL
  completion?: number; // e.g., 0 to 100 for percentage
};

type Report = {
  steamName?: string | null; // display name
  steamId?: string; // steam user ID
  steamAvatar?: string | null; // avatar URL
  totalHours?: number; // total playtime hours
  totalAchievements?: number; // total achievements unlocked
  mostPlayedGame?: string; // most played game's name
  topGames?: Array<TopGame>; // top games
  detailedGames?: any[]; // raw detailed games data
};

// Helper to remove protocol from URL (used by images.weserv.nl proxy)
function stripProtocol(u: string) {
  return u.replace(/^https?:\/\//i, "");
}

// Helper function to load an image without relying on a local proxy.
// Strategy:
// 1) Try normal Image() with crossOrigin='Anonymous' (works when the remote host sends CORS headers).
// 2) Try fetch(url) and create an object URL from the blob (some servers allow fetch even when Image() fails).
// 3) Fallback to a public CORS-friendly image proxy (images.weserv.nl) which adds CORS headers.
// If all attempts fail, return null and caller should draw a placeholder.
async function loadImage(
  url?: string | null
): Promise<HTMLImageElement | null> {
  if (!url) return null;

  const tryImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      // Ask the browser for CORS-enabled loading. If the remote server doesn't allow it this will fail.
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });

  // 1) Direct Image with crossOrigin
  try {
    return await tryImage(url);
  } catch (e) {
    // continue to next tactic
  }

  // 2) Try fetch + blob -> objectURL (works if server allows CORS or same-origin)
  try {
    const resp = await fetch(url, { method: "GET", mode: "cors" });
    if (resp.ok) {
      const blob = await resp.blob();
      const objUrl = URL.createObjectURL(blob);
      try {
        const img = await tryImage(objUrl);
        URL.revokeObjectURL(objUrl);
        return img;
      } catch (e) {
        URL.revokeObjectURL(objUrl);
      }
    }
  } catch (e) {
    // fetch failed (likely CORS); continue to fallback proxy
  }

  // 3) Use a public CORS-friendly proxy as a last resort (no server required on your side).
  //    images.weserv.nl transforms and returns images with permissive CORS headers.
  try {
    const proxied = `https://images.weserv.nl/?url=${encodeURIComponent(
      stripProtocol(url as string)
    )}&w=512&h=512&fit=cover`;
    return await tryImage(proxied);
  } catch (e) {
    // all attempts failed
  }

  return null;
}

// Helper function for rounded rectangles (Necessary for bar ends)
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  // Simple rectangle drawing for a flat bar look
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

// Creates a rounded-rect clipping path (does not fill)
function clipRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.clip();
}

export default async function generateReportImage(
  report: Report,
  options?: { preset?: "social" | "phone"; width?: number; height?: number; gradientColors?: string[] }
): Promise<string> {
  // Set width and compute a dynamic height so all games fit on the image
  const width = options?.width ?? 600;
  const paddingX = 60;
  const contentWidth = width - 2 * paddingX;

  const allGames = report.topGames || [];
  const visibleGames = allGames.slice(0, 5); // limit image to max 5 games
  const gameHeight = 70;

  // Estimate the Y position used before the chart/game list (matches layout below)
  const avatarSize = 90;
  const estimatedYBeforeChart =
    70 /*title*/ +
    50 /*after title*/ +
    avatarSize +
    25 /*avatar spacing*/ +
    25 /*name*/ +
    20 * 3 /*three stat lines*/ +
    50; /*gap before list*/

  // Determine donut radius same as below so we can include its height in canvas sizing
  const maxRadiusBasedOnContent = Math.floor((contentWidth - 120) / 3);
  const estimatedRadius = Math.min(80, Math.max(56, maxRadiusBasedOnContent));
  const chartHeight = estimatedRadius * 2 + 12;

  const footerSpace = 80;
  const estimatedNeededHeight =
    estimatedYBeforeChart +
    chartHeight +
    visibleGames.length * gameHeight +
    footerSpace;

  const height = Math.max(options?.height ?? 750, estimatedNeededHeight);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!; // --- STYLING CONSTANTS ---

  const mainColor = '#FFFFFF';
  const lightColor = 'rgba(255, 255, 255, 0.6)';
  const barFillColor = '#3e90ff'; // Bright blue
  const barBackgroundColor = 'rgba(255, 255, 255, 0.1)';
  const backgroundColor = '#1f2025'; // dark fallback

  // Gradient background (vertical). Accept colors from options.gradientColors (array of 3), otherwise use sensible defaults.
  const bgColors = options?.gradientColors ?? ['#1b0096ff', '#000e3aff', '#000000ff'];
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, bgColors[0]);
  bgGrad.addColorStop(0.5, bgColors[1] ?? bgColors[0]);
  bgGrad.addColorStop(1, bgColors[2] ?? bgColors[1] ?? bgColors[0]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);
  let currentY = 20;
  ctx.fillStyle = mainColor;
  ctx.font = `500 16px 'Segoe UI', Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("14-Days Steam Report", width / 2, currentY); 
  currentY += 20;
  ctx.fillText("Top 5 Games", width / 2, currentY);
  currentY += 40;
  const avatarX = width / 2 - avatarSize / 2;
  const textX = width / 2; // Draw Avatar
  const profileAvatar = await loadImage(report.steamAvatar ?? null);
  if (profileAvatar) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      currentY + avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2
    );
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(profileAvatar, avatarX, currentY, avatarSize, avatarSize);
    ctx.restore();
  } else {
    // Fallback for image load failure
    ctx.fillStyle = barFillColor;
    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      currentY + avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  currentY += avatarSize + 25; // User Name

  ctx.fillStyle = mainColor;
  ctx.font = `600 18px 'Segoe UI', Arial, sans-serif`;
  ctx.fillText(report.steamName || "STEAM USER", textX, currentY);
  currentY += 25; // Stats

  ctx.font = `400 14px 'Segoe UI', Arial, sans-serif`;
  ctx.fillStyle = lightColor; // Most Played Game

  ctx.fillText(
    `Most Played Game: ${report.mostPlayedGame || "N/A"}`,
    textX,
    currentY
  );
  currentY += 20; // Total Playtime
  ctx.fillText(
    `Total Playtime: ${report.totalHours?.toFixed(1) || "0.0"} hrs`,
    textX,
    currentY
  );
  currentY += 20; // Total Achievements
  ctx.fillText(
    `Total Achievements Earned: ${report.totalAchievements || 0}`,
    textX,
    currentY
  );

  currentY += 40; // Space before game list title

  // --- 4. Top Games List ---

  ctx.font = `600 16px 'Segoe UI', Arial, sans-serif`;
  ctx.textAlign = "left";
  ctx.fillStyle = mainColor;
  ctx.fillText("Playtime Breakdown", paddingX, currentY);
  currentY += 30;

  const barHeight = 8;

  // --- CHART: circular (donut) distribution of total playtime by top games ---
  const chartGames = visibleGames; // use the visible (max 5) games for the chart
  const totalReported =
    typeof report.totalHours === "number" && report.totalHours > 0
      ? report.totalHours
      : chartGames.reduce((s, gg) => s + (gg.hours ?? 0), 0);
  if (chartGames.length > 0 && totalReported > 0) {
    const palette = [
      "#3b82f6",
      "#10b981",
      "#f97316",
      "#ef4444",
      "#8b5cf6",
      "#06b6d4",
    ];

    // Layout: place donut chart on the left and legend on the right of the chart
    // We'll center the combined group horizontally and vertically align the legend to the donut
    // Gutter between donut and legend (reduced)
    const gutter = 32;
    // Maximum number of characters the game name can have before being truncated
    // Change this value to control the visible name length (ellipsis will be added if exceeded)
    const LEGEND_NAME_MAX_CHARS = 25;

    // Determine base radius from available content (limit so it fits with legend)
    const maxRadiusBasedOnContent = Math.floor((contentWidth - 120) / 3); // reserve some space for legend
    const radius = Math.min(80, Math.max(56, maxRadiusBasedOnContent));
    const inner = Math.floor(radius * 0.6);

    // Estimate legend width (remaining content after donut + gutter), cap to reasonable max
    const maxLegendWidth = contentWidth - radius * 2 - gutter;
    const legendWidth = Math.min(
      maxLegendWidth,
      Math.floor(contentWidth * 0.45)
    );

    // Compute left column X so the donut+gutter+legend are centered as a group in content area
    const groupWidth = radius * 2 + gutter + legendWidth;
    const leftColX = paddingX + Math.floor((contentWidth - groupWidth) / 2);

    const cx = Math.floor(leftColX + radius);
    const cy = Math.floor(currentY + radius);

    // Draw segments as donut slices
    let start = -Math.PI / 2; // top
    for (let i = 0; i < chartGames.length; i++) {
      const gg = chartGames[i];
      const hrs = Math.max(0, gg.hours ?? 0);
      const pct = Math.min(1, hrs / totalReported);
      const angle = pct * Math.PI * 2;
      const end = start + angle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.arc(cx, cy, inner, end, start, true);
      ctx.closePath();
      ctx.fillStyle = palette[i % palette.length];
      ctx.fill();

      start = end;
    }

    // Center label
    ctx.fillStyle = backgroundColor;
    ctx.beginPath();
    ctx.arc(cx, cy, inner - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = mainColor;
    ctx.font = `600 14px 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`${totalReported.toFixed(1)} hrs`, cx, cy + 6);

    // Legend column (right of donut). We'll vertically center the legend to the donut
    ctx.font = `500 12px 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = "left";
    const legendX = leftColX + radius * 2 + gutter;
    const legendGapY = 20;
    const legendHeight = chartGames.length * legendGapY;
    // Compute starting y so legend is vertically centered alongside donut
    const legendYStart = cy - Math.floor((legendHeight - legendGapY) / 2);

    // Helper: truncate the name by character count and append ellipsis when needed
    // Uses a simple character limit (LEGEND_NAME_MAX_CHARS) rather than pixel measurement.
    const ellipsize = (text: string, maxChars: number) => {
      if (!text) return "";
      if (text.length <= maxChars) return text;
      return text.slice(0, maxChars) + "...";
    };

    // labelMaxWidth (previously used for pixel-based truncation) is no longer needed
    for (let i = 0; i < chartGames.length; i++) {
      const gg = chartGames[i];
      const lx = legendX;
      const ly = legendYStart + i * legendGapY;
      // color box
      ctx.fillStyle = palette[i % palette.length];
      roundRect(ctx, lx, ly - 8, 12, 12, 3);
      // text
      ctx.fillStyle = mainColor;
      // Build suffix (hours + percent) and ellipsize only the game name so time data remains visible
      const hoursPart =
        ((gg.hours ?? 0) >= 1 ? (gg.hours ?? 0).toFixed(1) : "<1") + "h";
      const pctPart = `${Math.round(((gg.hours ?? 0) / totalReported) * 100)}%`;
      const suffix = ` — ${hoursPart} (${pctPart})`;
      const rawName = gg.name || "Unknown";
      const ellName = ellipsize(rawName, LEGEND_NAME_MAX_CHARS);
      const finalLabel = `${ellName}${suffix}`;
      ctx.fillText(finalLabel, lx + 18, ly);
    }

    // Advance past the donut
    currentY = cy + radius + 12;
  }
  currentY += 40; // Space before game list
  ctx.font = `600 16px 'Segoe UI', Arial, sans-serif`;
    ctx.fillStyle = mainColor;
    ctx.fillText("Games Completion Progress", paddingX, currentY);
  currentY += 20;
  // Render visible games (max 5)
  for (let i = 0; i < visibleGames.length; i++) {
    const g = visibleGames[i];
    const y = currentY + i * gameHeight;
    const completionPct = g.completion ?? 0;

    // Icon (left)
    const iconSize = 56;
    const iconX = paddingX;
    const iconY = y + 8;
    const iconImg = await loadImage(g.icon ?? null);
    if (iconImg) {
      // draw rounded icon box and image (use rounded clip)
      ctx.save();
      clipRoundRect(ctx, iconX, iconY, iconSize, iconSize, 8);
      ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize);
      ctx.restore();
    } else {
      ctx.fillStyle = "#172033";
      roundRect(ctx, iconX, iconY, iconSize, iconSize, 8);
    }

    // Name (to the right of icon)
    const nameX = iconX + iconSize + 12;
    ctx.fillStyle = mainColor;
    ctx.font = `500 16px 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(g.name || "UNKNOWN GAME", nameX, y + 24);

    // Completion Percentage (Far right)
    ctx.textAlign = "right";
    const pctText = `${Math.round(completionPct)}%`;
    const pctX = paddingX + contentWidth;
    ctx.fillStyle = mainColor;
    ctx.fillText(pctText, pctX, y + 44);

    // Playtime/Completion Bar (starts after the nameX)
    const barX = nameX;
    const barY = y + 36;
    // Remove reserved space for per-game hours (we no longer render it)
    const barWidth = contentWidth - (iconSize + 12) - 60; // Leaves space for pct

    // Bar Background
    ctx.fillStyle = barBackgroundColor;
    roundRect(ctx, barX, barY, barWidth, barHeight, 4);

    // Bar Fill (playtime/use completion as example fill)
    ctx.fillStyle = barFillColor;
    const fillWidth = Math.max(4, (completionPct / 100) * barWidth);
    roundRect(ctx, barX, barY, fillWidth, barHeight, 4);
  }

  currentY += visibleGames.length * gameHeight; // --- 5. Footer (Steam Logo) ---
  currentY = height - 40;
  ctx.fillStyle = lightColor;
  ctx.font = `400 14px 'Segoe UI', Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("Generated by SteamWrap", width / 2, currentY);

  return canvas.toDataURL("image/png");
}

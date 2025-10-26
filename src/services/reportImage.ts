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
    return u.replace(/^https?:\/\//i, '');
}

// Helper function to load an image without relying on a local proxy.
// Strategy:
// 1) Try normal Image() with crossOrigin='Anonymous' (works when the remote host sends CORS headers).
// 2) Try fetch(url) and create an object URL from the blob (some servers allow fetch even when Image() fails).
// 3) Fallback to a public CORS-friendly image proxy (images.weserv.nl) which adds CORS headers.
// If all attempts fail, return null and caller should draw a placeholder.
async function loadImage(url?: string | null): Promise<HTMLImageElement | null> {
    if (!url) return null;

    const tryImage = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const img = new Image();
            // Ask the browser for CORS-enabled loading. If the remote server doesn't allow it this will fail.
            img.crossOrigin = 'Anonymous';
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
        const resp = await fetch(url, { method: 'GET', mode: 'cors' });
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
        const proxied = `https://images.weserv.nl/?url=${encodeURIComponent(stripProtocol(url as string))}&w=512&h=512&fit=cover`;
        return await tryImage(proxied);
    } catch (e) {
        // all attempts failed
    }

    return null;
}

// Helper function for rounded rectangles (Necessary for bar ends)
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
function clipRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.clip();
}

export default async function generateReportImage(report: Report, options?: { preset?: 'social' | 'phone'; width?: number; height?: number }): Promise<string> {
  // Set dimensions to match the portrait aspect ratio of the image
  const width = options?.width ?? 600;
  const height = options?.height ?? 750;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // --- STYLING CONSTANTS ---
  const mainColor = '#FFFFFF';
  const lightColor = 'rgba(255, 255, 255, 0.6)';
  const barFillColor = '#3e90ff'; // Bright blue
  const barBackgroundColor = 'rgba(255, 255, 255, 0.1)';
  const backgroundColor = '#1f2025'; // Dark background
  const paddingX = 60;
  const contentWidth = width - 2 * paddingX;
  
  // --- 1. Background ---
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
  
  // --- 2. Title ---
  let currentY = 70;
  ctx.fillStyle = mainColor;
  ctx.font = `500 24px 'Segoe UI', Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('14-Days Steam Report', width / 2, currentY);
  
  // --- 3. User Info Block ---
  currentY += 50;
  const avatarSize = 90;
  const avatarX = width / 2 - avatarSize / 2;
  const textX = width / 2;
  
  // Draw Avatar
  const profileAvatar = await loadImage(report.steamAvatar ?? null);
  if (profileAvatar) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, currentY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(profileAvatar, avatarX, currentY, avatarSize, avatarSize);
    ctx.restore();
  } else {
    // Fallback for image load failure
    ctx.fillStyle = barFillColor;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, currentY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  currentY += avatarSize + 25;

  // User Name
  ctx.fillStyle = mainColor;
  ctx.font = `600 18px 'Segoe UI', Arial, sans-serif`;
  ctx.fillText(report.steamName || 'STEAM USER', textX, currentY);
  currentY += 25;

  // Stats
  ctx.font = `400 14px 'Segoe UI', Arial, sans-serif`;
  ctx.fillStyle = lightColor;

  // Most Played Game
  ctx.fillText(`Most Played Game: ${report.mostPlayedGame || 'N/A'}`, textX, currentY);
  currentY += 20;
  // Total Playtime
  ctx.fillText(`Total Playtime: ${report.totalHours?.toFixed(1) || '0.0'} hrs`, textX, currentY);
  currentY += 20;
  // Total Achievements
  ctx.fillText(`Total Achievements Earned: ${report.totalAchievements || 0}`, textX, currentY);

  currentY += 50; // Space before game list title

  // --- 4. Top Games List ---
  
  ctx.font = `600 16px 'Segoe UI', Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillStyle = mainColor;
  ctx.fillText('Most Played Games', paddingX, currentY);
  currentY += 20;
  
  const games = report.topGames || [];
  const gameHeight = 70;
  const barHeight = 8;
  
    for (let i = 0; i < games.length && i < 6; i++) {
        const g = games[i];
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
            ctx.fillStyle = '#172033';
            roundRect(ctx, iconX, iconY, iconSize, iconSize, 8);
        }

        // Name (to the right of icon)
        const nameX = iconX + iconSize + 12;
        ctx.fillStyle = mainColor;
        ctx.font = `500 16px 'Segoe UI', Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(g.name || 'UNKNOWN GAME', nameX, y + 24);

        // Hours Played (Right-aligned text next to the bar)
        ctx.font = `400 14px 'Segoe UI', Arial, sans-serif`;
        ctx.textAlign = 'right';
        const hoursText = `${g.hours?.toFixed(1) || '0.0'} hrs`;
        const hoursX = paddingX + contentWidth - 40; // Positioned before the percentage
        ctx.fillStyle = mainColor;
        ctx.fillText(hoursText, hoursX, y + 44);

        // Completion Percentage (Far right)
        ctx.textAlign = 'right';
        const pctText = `${Math.round(completionPct)}%`;
        const pctX = paddingX + contentWidth;
        ctx.fillStyle = mainColor;
        ctx.fillText(pctText, pctX, y + 44);

        // Playtime/Completion Bar (starts after the nameX)
        const barX = nameX;
        const barY = y + 36;
        const barWidth = contentWidth - (iconSize + 12) - 110; // Leaves space for hours and pct

        // Bar Background
        ctx.fillStyle = barBackgroundColor;
        roundRect(ctx, barX, barY, barWidth, barHeight, 4);

        // Bar Fill (playtime/use completion as example fill)
        ctx.fillStyle = barFillColor;
        const fillWidth = Math.max(4, (completionPct / 100) * barWidth);
        roundRect(ctx, barX, barY, fillWidth, barHeight, 4);
    }

  currentY += games.length * gameHeight;
  
  // --- 5. Footer (Steam Logo) ---
  currentY = height - 40;
  ctx.fillStyle = lightColor;
  ctx.font = `400 14px 'Segoe UI', Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('SteamWrap', width / 2, currentY);

  return canvas.toDataURL('image/png');
}
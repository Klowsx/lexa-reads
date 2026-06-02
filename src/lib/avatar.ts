const PALETTE = [
  '#C4783A', // accent/terracotta
  '#4A96B8', // blue
  '#5B9A6A', // green
  '#B8445A', // rose
  '#8A6CD8', // purple
  '#C49A20', // amber
] as const;

export function getInitials(displayName: string): string {
  return displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function getAvatarColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

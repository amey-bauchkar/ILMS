// Deterministic color per person, based on their name
const PALETTE = ["#e87811", "#3b82f6", "#8b5cf6", "#06b6d4", "#22c55e", "#eab308"];

export function avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return PALETTE[Math.abs(hash) % PALETTE.length];
}
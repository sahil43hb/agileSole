export function workingDayRange(eta?: string | null) {
  const match = (eta || "").match(/(\d+)\s*[–-]\s*(\d+)/);
  return { from: match?.[1] || "2", to: match?.[2] || "5" };
}

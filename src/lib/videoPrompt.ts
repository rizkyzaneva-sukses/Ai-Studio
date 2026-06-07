export const VEO_MAX_DURATION_SECONDS = 10;
export const VEO_DURATION_LABEL = `${VEO_MAX_DURATION_SECONDS}s`;

const DURATION_PATTERNS: Array<[RegExp, string]> = [
  [/\b15s\b/gi, VEO_DURATION_LABEL],
  [/\b20s\b/gi, VEO_DURATION_LABEL],
  [/\b30s\b/gi, VEO_DURATION_LABEL],
  [/\b60s\b/gi, VEO_DURATION_LABEL],
  [/\b15\s*[- ]?(second|seconds|sec)\b/gi, "10-second"],
  [/\b20\s*[- ]?(second|seconds|sec)\b/gi, "10-second"],
  [/\b30\s*[- ]?(second|seconds|sec)\b/gi, "10-second"],
  [/\b60\s*[- ]?(second|seconds|sec)\b/gi, "10-second"],
  [/\b15\s*detik\b/gi, "10 detik"],
  [/\b20\s*detik\b/gi, "10 detik"],
  [/\b30\s*detik\b/gi, "10 detik"],
  [/\b60\s*detik\b/gi, "10 detik"],
];

export function normalizeVideoPrompt(prompt: string): string {
  let normalized = prompt.trim();

  for (const [pattern, replacement] of DURATION_PATTERNS) {
    normalized = normalized.replace(pattern, replacement);
  }

  if (!/\b10s\b|\b10-second\b|\b10 detik\b/i.test(normalized)) {
    normalized = `Create a 10-second vertical video only. Keep the pacing concise and achievable within 10 seconds. ${normalized}`;
  }

  return normalized;
}

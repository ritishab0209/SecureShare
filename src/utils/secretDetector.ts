const SECRET_PATTERNS = {
  API_KEY: /(?:api[_-]?key|apikey)['\"]?\s*(?::|=)\s*['\"]?([a-zA-Z0-9_\-]{20,})['\"]?/i,
  PASSWORD: /(?:password|passwd|pwd)['\"]?\s*(?::|=)\s*['\"]?([^'\"\s]+)['\"]?/i,
  TOKEN: /(?:token|jwt|bearer)['\"]?\s*(?::|=)\s*['\"]?([a-zA-Z0-9_\-\.]+)['\"]?/i,
  SECRET_KEY: /(?:secret[_-]?key|secretkey)['\"]?\s*(?::|=)\s*['\"]?([a-zA-Z0-9_\-]{20,})['\"]?/i,
};

export function detectSecrets(code: string): DetectedSecret[] {
  const secrets: DetectedSecret[] = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    Object.entries(SECRET_PATTERNS).forEach(([type, pattern]) => {
      const match = line.match(pattern);
      if (match) {
        secrets.push({
          type: type as DetectedSecret['type'],
          line: index + 1,
          value: match[1],
        });
      }
    });
  });

  return secrets;
}

export function redactSecrets(code: string, secrets: DetectedSecret[]): string {
  let redactedCode = code;
  secrets.forEach(secret => {
    redactedCode = redactedCode.replace(
      secret.value,
      '[REDACTED]'
    );
  });
  return redactedCode;
}
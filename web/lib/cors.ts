const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:8081",
  "http://127.0.0.1:8081",
];

function getAllowedOrigins(): string[] {
  const configuredOrigins = process.env.CORS_ALLOWED_ORIGINS;

  if (!configuredOrigins) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  return configuredOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * true si la petición puede pasar (mismo origen permitido, sin
 * header Origin -- típico de apps nativas/cURL/Postman--, o wildcard).
 */
export function isOriginAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  const allowedOrigins = getAllowedOrigins();

  if (allowedOrigins.includes("*")) {
    return true;
  }

  return allowedOrigins.includes(origin);
}

/**
 * Headers CORS para adjuntar tanto en la respuesta del preflight
 * (OPTIONS) como en la respuesta real (GET/POST/etc).
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  const allowedOrigins = getAllowedOrigins();
  const wildcard = allowedOrigins.includes("*");

  const allowOriginValue = wildcard
    ? origin || "*"
    : origin && allowedOrigins.includes(origin)
      ? origin
      : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowOriginValue,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
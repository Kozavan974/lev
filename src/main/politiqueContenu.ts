/** Politique de sécurité de contenu. Aucun script, style ou eval distant. */
export const POLITIQUE_PRODUCTION = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-src 'none'"
].join('; ')

/**
 * Exception de développement pour le rechargement de Vite (préambule en ligne et websocket).
 * Elle n'est pas écrite dans la page produite par `npm run build`.
 */
export const POLITIQUE_DEVELOPPEMENT = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self' ws://localhost:* http://localhost:* ws://127.0.0.1:* http://127.0.0.1:*",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-src 'none'"
].join('; ')

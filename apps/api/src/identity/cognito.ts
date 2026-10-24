import { createPublicKey, verify, type JsonWebKey, type KeyObject } from "node:crypto";

export interface HumanPrincipal {
  subject: string;
  issuer: string;
}

export interface CognitoOptions {
  userPoolId: string;
  clientId: string;
  /** Tests supply a fixed clock/fetch; runtime always uses the configured Cognito issuer. */
  now?: () => number;
  fetcher?: typeof fetch;
}

export class AuthenticationError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "AuthenticationError";
  }
}

function object(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new AuthenticationError();
  }
  return value as Record<string, unknown>;
}

function decode(segment: string) {
  if (!/^[A-Za-z0-9_-]+$/u.test(segment)) throw new AuthenticationError();
  const bytes = Buffer.from(segment, "base64url");
  if (bytes.toString("base64url") !== segment) throw new AuthenticationError();
  return bytes;
}

async function boundedJson(response: Response) {
  if (!response.ok || response.body === null) throw new AuthenticationError();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.length;
      if (length > 262_144) throw new AuthenticationError();
      chunks.push(part.value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

/**
 * Narrow RS256 Cognito access-token verifier. No ID tokens, algorithm negotiation,
 * token-provided key URLs or tenant claims. Production activation still requires
 * security review and provider tests; this increment is restricted to local/test.
 */
export function createCognitoAuthenticator(options: CognitoOptions) {
  const match = /^(sa-east-1)_[A-Za-z0-9]+$/u.exec(options.userPoolId);
  if (match === null || !/^[a-z0-9]{3,128}$/u.test(options.clientId)) {
    throw new Error("INVALID_COGNITO_CONFIGURATION");
  }
  const issuer = `https://cognito-idp.${match[1]}.amazonaws.com/${options.userPoolId}`;
  const jwksUrl = `${issuer}/.well-known/jwks.json`;
  const clock = options.now ?? Date.now;
  const fetcher = options.fetcher ?? fetch;
  let keys = new Map<string, KeyObject>();
  let expiresAt = 0;
  let lastFetch = -Infinity;
  let refresh: Promise<void> | undefined;

  async function loadKeys() {
    if (refresh !== undefined) return refresh;
    if (clock() - lastFetch < 30_000) throw new AuthenticationError();
    lastFetch = clock();
    refresh = (async () => {
      const response = await fetcher(jwksUrl, {
        redirect: "error",
        signal: AbortSignal.timeout(3_000),
        headers: { accept: "application/json" },
      });
      const document = object(await boundedJson(response));
      if (!Array.isArray(document.keys) || document.keys.length > 100) {
        throw new AuthenticationError();
      }
      const next = new Map<string, KeyObject>();
      for (const candidate of document.keys) {
        const jwk = object(candidate);
        if (
          jwk.kty !== "RSA" || jwk.alg !== "RS256" || jwk.use !== "sig" ||
          typeof jwk.kid !== "string" || jwk.kid.length < 1 || jwk.kid.length > 128 ||
          typeof jwk.n !== "string" || typeof jwk.e !== "string" ||
          next.has(jwk.kid)
        ) throw new AuthenticationError();
        const key = createPublicKey({ key: jwk as JsonWebKey, format: "jwk" });
        const bits = key.asymmetricKeyDetails?.modulusLength;
        if (key.asymmetricKeyType !== "rsa" || bits === undefined || bits < 2048) {
          throw new AuthenticationError();
        }
        next.set(jwk.kid, key);
      }
      if (next.size === 0) throw new AuthenticationError();
      keys = next;
      expiresAt = clock() + 300_000;
    })();
    try {
      await refresh;
    } finally {
      refresh = undefined;
    }
  }

  return async function authenticate(header: string | undefined): Promise<HumanPrincipal> {
    try {
      if (header === undefined || header.length > 16_384) throw new AuthenticationError();
      const bearer = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/iu.exec(header);
      if (bearer === null) throw new AuthenticationError();
      const parts = bearer[1]!.split(".");
      const jwtHeader = object(JSON.parse(decode(parts[0]!).toString("utf8")));
      const claims = object(JSON.parse(decode(parts[1]!).toString("utf8")));
      if (
        jwtHeader.alg !== "RS256" || typeof jwtHeader.kid !== "string" ||
        jwtHeader.kid.length < 1 || jwtHeader.kid.length > 128 ||
        jwtHeader.crit !== undefined || jwtHeader.jku !== undefined ||
        jwtHeader.x5u !== undefined || jwtHeader.b64 !== undefined ||
        (jwtHeader.typ !== undefined && jwtHeader.typ !== "JWT")
      ) throw new AuthenticationError();
      // Reject wrong issuers/clients before any network request. Claims remain untrusted here.
      if (
        claims.iss !== issuer || claims.client_id !== options.clientId ||
        claims.token_use !== "access"
      ) throw new AuthenticationError();
      if (clock() >= expiresAt || !keys.has(jwtHeader.kid)) await loadKeys();
      const key = keys.get(jwtHeader.kid);
      if (key === undefined || !verify(
        "RSA-SHA256", Buffer.from(`${parts[0]}.${parts[1]}`), key, decode(parts[2]!),
      )) throw new AuthenticationError();
      const now = Math.floor(clock() / 1000);
      if (
        !Number.isSafeInteger(claims.exp) || !Number.isSafeInteger(claims.iat) ||
        (claims.exp as number) <= now || (claims.iat as number) > now + 30 ||
        (claims.exp as number) <= (claims.iat as number) ||
        (claims.nbf !== undefined && (
          !Number.isSafeInteger(claims.nbf) || (claims.nbf as number) > now
        )) ||
        typeof claims.sub !== "string" || claims.sub.length < 1 || claims.sub.length > 255 ||
        /[\u0000-\u001f\u007f]/u.test(claims.sub) ||
        // M2M tokens have no user; service access is not authorized by this API.
        typeof claims.username !== "string" || claims.username.length === 0 ||
        claims.sub === options.clientId
      ) throw new AuthenticationError();
      return { subject: claims.sub, issuer };
    } catch {
      // No raw token, claims, provider errors or key material in outward errors.
      throw new AuthenticationError();
    }
  };
}

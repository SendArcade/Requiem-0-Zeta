import crypto from "node:crypto";

/**
 * Mercari's public search endpoint authenticates with a DPoP proof
 * (RFC 9449) rather than an account token: an ES256 JWT carrying the
 * request method and URI, with the public JWK embedded in the header.
 */
export interface DpopKeyPair {
  publicKey: crypto.KeyObject;
  privateKey: crypto.KeyObject;
}

export function generateDpopKeyPair(): DpopKeyPair {
  return crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
}

function base64url(input: string | object): string {
  const str = typeof input === "string" ? input : JSON.stringify(input);
  return Buffer.from(str).toString("base64url");
}

export function createDpopProof(
  keys: DpopKeyPair,
  htu: string,
  htm: "GET" | "POST"
): string {
  const jwk = keys.publicKey.export({ format: "jwk" });

  const header = {
    typ: "dpop+jwt",
    alg: "ES256",
    jwk: { crv: "P-256", kty: "EC", x: jwk.x, y: jwk.y },
  };

  const payload = {
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID(),
    htu,
    htm,
  };

  const signingInput = `${base64url(header)}.${base64url(payload)}`;

  // ES256 requires the raw r||s pair; Node emits DER unless told otherwise.
  const signature = crypto.sign("sha256", Buffer.from(signingInput), {
    key: keys.privateKey,
    dsaEncoding: "ieee-p1363",
  });

  return `${signingInput}.${signature.toString("base64url")}`;
}

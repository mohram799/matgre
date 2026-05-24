import { SignJWT, jwtVerify } from 'jose';

const SESSION_SECRET = process.env.SESSION_SECRET || 'default_secret_key_needs_to_be_at_least_32_characters_long_for_shamikh_luxury';
const JWT_SECRET = new TextEncoder().encode(SESSION_SECRET);

export interface AdminPayload {
  phone: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT' | 'WAREHOUSE' | 'MARKETING';
}

/**
 * Sign a JWT token using HMAC-SHA256
 */
export async function signJWT(payload: any, expiry: string = '15m') {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(JWT_SECRET);
}

/**
 * Verify a JWT token
 */
export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (err) {
    return null;
  }
}

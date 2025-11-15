import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET: string = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || "7d";

export interface JWTPayload {
  userId: number;
  username: string;
  firstName: string;
}

/**
 * Generate JWT token
 */
export function generateToken(payload: JWTPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as string | number,
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}


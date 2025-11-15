import jwt, { SignOptions } from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("TEST_SECRET is not set");
}

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

export interface JWTPayload {
  userId: number;
  username: string;
  firstName: string;
}

const signOptions: SignOptions = {
  expiresIn: JWT_EXPIRES_IN,
};

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, signOptions);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "string") return null;
    return decoded as JWTPayload;
  } catch {
    return null;
  }
}

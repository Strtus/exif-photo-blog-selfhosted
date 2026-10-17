import { timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;
const DUMMY_HASH =
  '$2b$12$6e1YJF9idvEQbNoGIpimV.SWncee33Gg2OjSRKRgNjZZs/xQREi9e';

const asBuffer = (value: string) => Buffer.from(value, 'utf8');

export const timingSafeStringEqual = (left: string, right: string) => {
  const leftBuffer = asBuffer(left);
  const rightBuffer = asBuffer(right);
  if (leftBuffer.length !== rightBuffer.length) {
    timingSafeEqual(leftBuffer, leftBuffer);
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
};

export const hashAdminPassword = (password: string) =>
  bcrypt.hash(password, BCRYPT_ROUNDS);

export const hasAdminPasswordConfigured = () =>
  Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH);

export const verifyAdminCredentials = async (
  email: string,
  password: string,
) => {
  const expectedEmail = process.env.ADMIN_EMAIL ?? '';
  const passwordHash = process.env.ADMIN_PASSWORD_HASH ?? DUMMY_HASH;
  const emailMatches = expectedEmail.length > 0 &&
    timingSafeStringEqual(email, expectedEmail);
  const passwordMatches = await bcrypt.compare(
    password || ' ',
    passwordHash,
  );

  return emailMatches && passwordMatches && hasAdminPasswordConfigured();
};

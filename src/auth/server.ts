import { isPathProtected } from '@/app/path';
import NextAuth, { User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import {
  clearLoginFailures,
  getClientIpFromHeaders,
  isLoginRateLimited,
  recordLoginFailure,
} from './login-rate-limit';
import { verifyAdminCredentials } from './password';

const credentialValue = (value: unknown) =>
  typeof value === 'string' ? value : '';

export const {
  handlers: { GET, POST },
  signIn,
  signOut,
  auth,
} = NextAuth({
  // Non-Vercel platforms (e.g. EdgeOne) may not be auto-trusted by Auth.js.
  // Enabling trustHost prevents auth route 500s caused by host validation.
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      async authorize(credentials) {
        const email = credentialValue(credentials?.email);
        const password = credentialValue(credentials?.password);
        const ip = await getClientIpFromHeaders();

        if (isLoginRateLimited(ip)) {
          return null;
        }

        const isValid = await verifyAdminCredentials(email, password);
        if (!isValid) {
          recordLoginFailure(ip);
          return null;
        }

        clearLoginFailures(ip);
        const user: User = { email, name: 'Admin User' };
        return user;
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;

      const isUrlProtected = isPathProtected(pathname);
      const isUserLoggedIn = !!auth?.user;
      const isRequestAuthorized = !isUrlProtected || isUserLoggedIn;

      return isRequestAuthorized;
    },
  },
  pages: {
    signIn: '/sign-in',
  },
});

export const runAuthenticatedAdminServerAction = async <T>(
  callback: () => T,
): Promise<T> => {
  const session = await auth();
  if (session?.user) {
    return callback();
  } else {
    throw new Error('Unauthorized server action request');
  }
};

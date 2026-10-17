'use server';

import {
  auth,
  signIn,
  signOut,
} from '@/auth/server';
import type { Session } from 'next-auth';
import { redirect } from 'next/navigation';
import {
  generateAuthSecret,
  KEY_CALLBACK_URL,
  KEY_CREDENTIALS_CALLBACK_ROUTE_ERROR_URL,
  KEY_CREDENTIALS_RATE_LIMITED,
  KEY_CREDENTIALS_SIGN_IN_ERROR,
  KEY_CREDENTIALS_SIGN_IN_ERROR_URL,
  KEY_CREDENTIALS_SUCCESS,
} from '.';
import { getSafeCallbackPath } from './callback-url';
import {
  getClientIpFromHeaders,
  isLoginRateLimited,
} from './login-rate-limit';

export const signInAction = async (
  _prevState: string | undefined,
  formData: FormData,
) => {
  const ip = await getClientIpFromHeaders();
  if (isLoginRateLimited(ip)) {
    return KEY_CREDENTIALS_RATE_LIMITED;
  }

  const callbackUrl = getSafeCallbackPath(
    formData.get(KEY_CALLBACK_URL) as string | null,
  );
  const payload = Object.fromEntries(formData);
  payload[KEY_CALLBACK_URL] = callbackUrl;

  try {
    await signIn('credentials', payload);
  } catch (error) {
    if (
      `${error}`.includes(KEY_CREDENTIALS_SIGN_IN_ERROR) ||
      `${error}`.includes(KEY_CREDENTIALS_SIGN_IN_ERROR_URL) ||
      `${error}`.includes(KEY_CREDENTIALS_CALLBACK_ROUTE_ERROR_URL)
    ) {
      if (isLoginRateLimited(ip)) {
        return KEY_CREDENTIALS_RATE_LIMITED;
      }
      return KEY_CREDENTIALS_SIGN_IN_ERROR;
    } else if (!`${error}`.includes('NEXT_REDIRECT')) {
      console.log('Unknown sign in error:', {
        errorText: `${error}`,
        error,
      });
      throw error;
    }
  }
  if (formData.get(KEY_CALLBACK_URL)) {
    redirect(callbackUrl);
  }
  return KEY_CREDENTIALS_SUCCESS;
};

export const signOutAction = async () =>
  signOut({ redirect: false });

export const getAuthAction = async () => auth();

export const logClientAuthUpdate = async (data: Session | null | undefined) =>
  console.log('Client auth update', data);

export const generateAuthSecretAction = async () => generateAuthSecret();

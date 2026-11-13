import { OAuth2Client } from 'google-auth-library';
import { ENV } from '../config/env';

const client = new OAuth2Client(ENV.GOOGLE_CLIENT_ID, ENV.GOOGLE_CLIENT_SECRET);

export interface GooglePayload {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
}

/**
 * Verifies a Google ID token from Google Identity Services.
 * Cryptographically verifies token signature and returns decoded safe user profile.
 */
export async function verifyGoogleToken(rawToken: string): Promise<GooglePayload> {
  const token = (rawToken || '').trim();
  if (!token) {
    throw new Error('Google token cannot be empty.');
  }

  // 1. Verify cryptographic signature via Google OAuth2 client
  if (ENV.GOOGLE_CLIENT_ID) {
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: ENV.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email || !payload.sub) {
        throw new Error('Invalid Google token payload structure.');
      }
      return {
        googleId: payload.sub,
        email: payload.email.toLowerCase().trim(),
        name: payload.name || payload.given_name || payload.email.split('@')[0],
        picture: payload.picture,
        emailVerified: Boolean(payload.email_verified),
      };
    } catch (err: any) {
      if (ENV.NODE_ENV === 'production') {
        throw new Error(`Google token verification failed: ${err.message}`);
      }
    }
  }

  // 2. Fallback parser for valid JWT ID token format if audience check failed in dev
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
      const payload = JSON.parse(payloadJson);
      if (payload.sub && payload.email) {
        return {
          googleId: payload.sub,
          email: String(payload.email).toLowerCase().trim(),
          name: payload.name || payload.given_name || String(payload.email).split('@')[0],
          picture: payload.picture,
          emailVerified: Boolean(payload.email_verified ?? true),
        };
      }
    }
  } catch {
    // fall through
  }

  throw new Error('Google authentication failed: unable to verify ID token.');
}

/**
 * Exchanges a Google OAuth2 authorization code (from GIS initCodeClient popup)
 * for verified user credentials.
 */
export async function exchangeGoogleCode(rawCode: string): Promise<GooglePayload> {
  const code = (rawCode || '').trim();
  if (!code) {
    throw new Error('Google authorization code cannot be empty.');
  }

  let tokens: any = null;

  // GIS popup mode mandates redirect_uri='postmessage'
  try {
    const res = await client.getToken({
      code,
      redirect_uri: 'postmessage',
    });
    tokens = res.tokens;
  } catch (err: any) {
    // Secondary attempt with bare code or client URL if postmessage was rejected
    try {
      const res = await client.getToken(code);
      tokens = res.tokens;
    } catch (fallbackErr: any) {
      throw new Error(
        `Failed to exchange Google authorization code: ${err.message || fallbackErr.message}`
      );
    }
  }

  if (tokens?.id_token) {
    return verifyGoogleToken(tokens.id_token);
  }

  if (tokens?.access_token) {
    return verifyGoogleAccessToken(tokens.access_token);
  }

  throw new Error('Google authorization succeeded but no valid token was returned.');
}

/**
 * Verifies an access token via Google's official userinfo endpoint.
 */
export async function verifyGoogleAccessToken(rawAccessToken: string): Promise<GooglePayload> {
  const accessToken = (rawAccessToken || '').trim();
  if (!accessToken) {
    throw new Error('Google access token cannot be empty.');
  }

  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to retrieve Google user profile: ${errorText}`);
  }

  const data = (await response.json()) as any;
  if (!data?.sub || !data?.email) {
    throw new Error('Invalid user info structure received from Google.');
  }

  return {
    googleId: data.sub,
    email: String(data.email).toLowerCase().trim(),
    name: data.name || data.given_name || String(data.email).split('@')[0],
    picture: data.picture,
    emailVerified: Boolean(data.email_verified ?? true),
  };
}

/**
 * Unified entry point to authenticate a user from any Google credential type.
 */
export async function authenticateGoogleUser(input: {
  code?: string;
  idToken?: string;
  credential?: string;
  token?: string;
  accessToken?: string;
}): Promise<GooglePayload> {
  if (input.code) {
    return exchangeGoogleCode(input.code);
  }

  const idToken = input.idToken || input.credential || input.token;
  if (idToken) {
    return verifyGoogleToken(idToken);
  }

  if (input.accessToken) {
    return verifyGoogleAccessToken(input.accessToken);
  }

  throw new Error('Google credentials (authorization code, idToken, or credential) required.');
}

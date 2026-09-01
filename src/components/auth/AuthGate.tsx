import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import type { ReactNode } from 'react';

/**
 * Wraps the app in Amplify's <Authenticator>, which supplies sign-up,
 * sign-in, email verification and password-reset screens for free — no
 * custom auth UI to build or maintain.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  return <Authenticator>{() => <>{children}</>}</Authenticator>;
}

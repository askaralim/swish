import * as Sentry from '@sentry/react-native';
import * as Application from 'expo-application';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
const enableInDev = process.env.EXPO_PUBLIC_SENTRY_ENABLE_IN_DEV === '1';

if (dsn && (!__DEV__ || enableInDev)) {
  const release =
    Application.nativeApplicationVersion && Application.applicationId
      ? `${Application.applicationId}@${Application.nativeApplicationVersion}`
      : undefined;

  Sentry.init({
    dsn,
    release,
    dist: Application.nativeBuildVersion ?? undefined,
    environment: __DEV__ ? 'development' : 'production',
    debug: __DEV__ && process.env.EXPO_PUBLIC_SENTRY_DEBUG === '1',
    // No performance / distributed tracing until you opt in (set > 0).
    tracesSampleRate: 0,
    enableAutoSessionTracking: true,
  });
}

export { Sentry };

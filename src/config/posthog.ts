import PostHog from 'posthog-react-native'
import Constants from 'expo-constants'
import * as Application from 'expo-application'

const apiKey = Constants.expoConfig?.extra?.posthogProjectToken as string | undefined
const host = Constants.expoConfig?.extra?.posthogHost as string | undefined
const isPostHogConfigured = !!apiKey && apiKey !== 'phc_your_project_token_here'

if (__DEV__) {
  console.log('PostHog config:', {
    apiKey: apiKey ? 'SET' : 'NOT SET',
    host: host ? 'SET' : 'NOT SET',
    isConfigured: isPostHogConfigured,
  })
}

if (!isPostHogConfigured) {
  console.warn(
    'PostHog project token not configured. Analytics will be disabled. ' +
      'Set POSTHOG_PROJECT_TOKEN in your .env file to enable analytics.'
  )
}

export const posthog = new PostHog(apiKey || 'placeholder_key', {
  host,
  disabled: !isPostHogConfigured,
  captureAppLifecycleEvents: true,
  flushAt: 20,
  flushInterval: 10000,
  maxBatchSize: 100,
  maxQueueSize: 1000,
  preloadFeatureFlags: true,
  sendFeatureFlagEvent: true,
  featureFlagsRequestTimeoutMs: 10000,
  requestTimeout: 10000,
  fetchRetryCount: 3,
  fetchRetryDelay: 3000,
})

/** Super properties on every event; uses PostHog’s $app_* names for breakdowns in insights. */
if (isPostHogConfigured) {
  posthog.debug(__DEV__)

  const $app_version =
    Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? undefined
  const $app_build =
    Application.nativeBuildVersion != null ? String(Application.nativeBuildVersion) : undefined
  const $app_namespace = Application.applicationId ?? undefined

  void posthog.register({
    ...($app_version && { $app_version }),
    ...($app_build && { $app_build }),
    ...($app_namespace && { $app_namespace }),
  })
}

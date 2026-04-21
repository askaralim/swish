export default {
  expo: {
    name: '唰数据',
    slug: 'swish',
    version: '1.1.1',
    orientation: 'portrait',
    icon: './assets/images/icon-swish-not-rounded.png',
    scheme: 'swish',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.taklip.swish',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/android-icon-foreground.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      package: 'com.taklip.swish',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-media-library',
        {
          savePhotosPermission:
            'Swish saves your player performance card image to your photo library.',
          photosPermission:
            'Allow Swish to save performance card images to your photos.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/images/icon-swish-not-rounded.png',
          color: '#1d9bf0',
        },
      ],
      '@sentry/react-native',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: 'b3670700-fd36-4a2f-8156-659bba5077ae',
      },
      posthogProjectToken: process.env.POSTHOG_PROJECT_TOKEN,
      posthogHost: process.env.POSTHOG_HOST,
    },
    owner: 'askar.alim',
  },
}

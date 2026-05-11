import type { Router } from 'expo-router';

type ReplaceHref = Parameters<Router['replace']>[0];

export function goBackOrReplace(router: Router, fallback: ReplaceHref) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
}

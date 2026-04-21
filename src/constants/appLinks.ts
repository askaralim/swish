/**
 * App Store deep link for QR codes and copy on share cards.
 * Set EXPO_PUBLIC_IOS_APP_STORE_ID in EAS / .env (numeric ID from App Store Connect).
 */
export function getIosAppStoreUrl(): string | null {
  const id = process.env.EXPO_PUBLIC_IOS_APP_STORE_ID?.trim() || '6758647267';
  if (id && /^\d+$/.test(id)) {
    return `https://apps.apple.com/cn/app/id6758647267`;
  }
  return null;
}

/** URL encoded into QR when App Store ID is missing (site can redirect to store). */
export function getQrDownloadUrl(): string {
  return getIosAppStoreUrl() ?? 'https://swishinsight.com';
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_OPT_IN_KEY = 'swish_push_opt_in';

export async function getPushOptIn(): Promise<boolean> {
  const v = await AsyncStorage.getItem(PUSH_OPT_IN_KEY);
  return v === 'true';
}

export async function setPushOptIn(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(PUSH_OPT_IN_KEY, enabled ? 'true' : 'false');
}

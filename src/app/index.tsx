import { Redirect } from 'expo-router';
import { store } from '@/state';

export default function Index() {
  const role = store.useSelect((s) => s.role);
  if (!role) return <Redirect href="/welcome" />;
  return <Redirect href={role === 'portail' ? '/portail' : '/pilotage'} />;
}

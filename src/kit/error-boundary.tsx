import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { kane } from '@/theme';
import { reportCrash } from './crash';

type Props = { children: React.ReactNode; title: string; allowBack?: boolean };
type State = { error: Error | null };

/** Repli français : pas d’écran blanc, pas de « Loading » infini. */
export class ScreenBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    reportCrash(error, info.componentStack ?? undefined);
  }

  retry = (): void => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    return <FallbackView title={this.props.title} onRetry={this.retry} allowBack={this.props.allowBack} />;
  }
}

export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return <ScreenBoundary title="KaneOne Suite">{children}</ScreenBoundary>;
}

function FallbackView({ title, onRetry, allowBack }: { title: string; onRetry: () => void; allowBack?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: kane.bg, padding: 24, justifyContent: 'center', gap: 14 }}>
      <View style={{ width: '100%', maxWidth: 520, alignSelf: 'center', gap: 14 }}>
        <Text accessibilityRole="header" style={{ color: kane.text, fontSize: 22, fontWeight: '800' }}>
          {title}
        </Text>
        <Text style={{ color: kane.text, fontSize: 15, lineHeight: 21 }}>
          Un incident a interrompu l’affichage. Vos données locales sont conservées. Aucune donnée n’a été envoyée. Vous pouvez réessayer.
        </Text>
        <Text style={{ color: kane.textMuted, fontSize: 13, lineHeight: 18 }}>
          Le journal distant (Sentry) reste désactivé tant que EXPO_PUBLIC_SENTRY_DSN n’est pas renseigné.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Réessayer"
          onPress={onRetry}
          style={({ pressed }) => ({
            minHeight: 48,
            borderRadius: 12,
            backgroundColor: kane.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: kane.primaryText, fontWeight: '700', fontSize: 15 }}>Réessayer</Text>
        </Pressable>
        {allowBack ? <BackLink /> : null}
      </View>
    </View>
  );
}

function BackLink() {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Retour"
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      style={({ pressed }) => ({
        minHeight: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: kane.border,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ color: kane.text, fontWeight: '700', fontSize: 15 }}>Retour</Text>
    </Pressable>
  );
}

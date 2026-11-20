import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Banner, Button, useToast } from '@/kit/ui';
import { eraseNotice } from '@/kit/preservation-copy';
import { store } from '@/state';

/** Annulation et effacement sont deux boutons distincts. Aucune phrase à saisir. */
export function LocalErase() {
  const router = useRouter();
  const toast = useToast();
  const armed = store.useDestructiveArmed() === 'reset';
  if (!armed) {
    return (
      <Button
        title="Effacer les données de cet appareil"
        icon="trash-outline"
        kind="danger"
        onPress={() => {
          if (!store.armDestructive('reset')) toast('Effacement indisponible tant que les données locales ne sont pas chargées.', 'error');
        }}
      />
    );
  }
  const copy = eraseNotice();
  return (
    <View style={{ gap: 8 }}>
      <Banner kind="warning" title={copy.title} text={copy.text} />
      <Button title="Annuler" kind="secondary" onPress={() => store.disarmDestructive()} />
      <Button
        title="Effacer définitivement"
        kind="danger"
        onPress={() => {
          store.commitDestructive().then((ok) => {
            if (!ok) {
              toast('Effacement refusé.', 'error');
              return;
            }
            toast('Données locales effacées de cet appareil.', 'info');
            router.replace('/welcome');
          });
        }}
      />
    </View>
  );
}

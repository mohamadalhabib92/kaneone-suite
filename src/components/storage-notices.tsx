import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banner, Button, useToast } from '@/kit/ui';
import { store } from '@/state';

/** Bandeaux liés au stockage local : modification hors ligne abandonnée, ou blob illisible. */
export function StorageNotices() {
  const abandoned = store.useOfflineEditAbandoned();
  const backup = store.useCorruptBackupKey();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [ack, setAck] = useState(false);
  if (!abandoned && backup === undefined) return null;
  return (
    <View style={{ width: '100%', maxWidth: 820, alignSelf: 'center', paddingHorizontal: 16, paddingTop: insets.top + 8, gap: 8 }}>
      {abandoned ? (
        <Banner
          kind="warning"
          title="Non enregistré"
          text="Une modification faite hors ligne a été abandonnée. Les données déjà enregistrées sont conservées."
        />
      ) : null}
      {backup !== undefined ? (
        <Banner
          kind="danger"
          title="Données illisibles"
          text={
            backup
              ? `Une copie conforme a été conservée sous ${backup}. L’original n’a pas été modifié.`
              : 'La copie de secours a échoué. L’original n’a pas été modifié.'
          }
          action={
            backup ? (
              ack ? (
                <Button
                  small
                  kind="danger"
                  title="Repartir de zéro"
                  onPress={() => {
                    store.startFresh().then((ok) => {
                      if (!ok) toast('Réinitialisation refusée : la copie de secours ne correspond pas à l’original.', 'error');
                    });
                  }}
                />
              ) : (
                <Button small kind="secondary" title="J’ai compris" onPress={() => setAck(true)} />
              )
            ) : null
          }
        />
      ) : null}
    </View>
  );
}

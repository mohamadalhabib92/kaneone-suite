import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banner, Button, useToast } from '@/kit/ui';
import { exportText } from '@/kit/files';
import { futureSchemaNotice, quarantineNotice, unsavedNotice } from '@/kit/preservation-copy';
import { store } from '@/state';

/** Bandeaux liés au stockage local. Le document illisible n’est jamais affiché. */
export function StorageNotices() {
  const abandoned = store.useOfflineEditAbandoned();
  const backup = store.useCorruptBackupKey();
  const hold = store.useSchemaHold();
  const unsaved = store.useUnsaved();
  const writing = store.useWriting();
  const armed = store.useDestructiveArmed();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [exporting, setExporting] = useState(false);
  if (!abandoned && backup === undefined && !unsaved && !hold) return null;
  const quarantine = hold === 'future' ? futureSchemaNotice(!!backup) : hold === 'unreadable' ? quarantineNotice(!!backup) : null;
  const pending = unsaved ? unsavedNotice(writing) : null;
  return (
    <View style={{ width: '100%', maxWidth: 820, alignSelf: 'center', paddingHorizontal: 16, paddingTop: insets.top + 8, gap: 8 }}>
      {abandoned ? (
        <Banner
          kind="warning"
          title="Non enregistré"
          text="Une modification faite hors ligne a été abandonnée. Les données déjà enregistrées sont conservées."
        />
      ) : null}
      {pending ? <Banner kind="warning" title={pending.title} text={pending.text} action={<Button small kind="secondary" title="Réessayer l’enregistrement" disabled={writing} onPress={() => store.retrySave()} />} /> : null}
      {quarantine ? (
        <Banner
          kind="warning"
          title={quarantine.title}
          text={quarantine.text}
          action={
            <View style={{ gap: 8 }}>
              {backup ? (
                <Button
                  small
                  kind="secondary"
                  title="Exporter la copie"
                  disabled={exporting}
                  onPress={() => {
                    if (exporting) return;
                    setExporting(true);
                    store
                      .readQuarantine()
                      .then(async (raw) => {
                        if (raw == null) {
                          toast('Export interrompu : la copie n’est pas confirmée.', 'error');
                          return;
                        }
                        await exportText('kaneone-quarantaine.txt', raw, 'text/plain');
                        toast('Export lancé. Le contenu n’est pas affiché ici.', 'info');
                      })
                      .catch(() => toast('Export non abouti.', 'error'))
                      .finally(() => setExporting(false));
                  }}
                />
              ) : null}
              {hold === 'future' ? (
                armed === 'reset' ? (
                  <View style={{ gap: 8 }}>
                    <Button small kind="secondary" title="Annuler" onPress={() => store.disarmDestructive()} />
                    <Button
                      small
                      kind="danger"
                      title="Confirmer l’effacement"
                      onPress={() => {
                        store.commitDestructive().then((ok) => {
                          if (!ok) toast('Effacement refusé.', 'error');
                        });
                      }}
                    />
                  </View>
                ) : (
                  <Button
                    small
                    kind="danger"
                    title="Effacer ce document"
                    onPress={() => {
                      if (!store.armDestructive('reset')) toast('Effacement indisponible.', 'error');
                    }}
                  />
                )
              ) : armed === 'replace-unreadable' ? (
                <View style={{ gap: 8 }}>
                  <Button small kind="secondary" title="Annuler" onPress={() => store.disarmDestructive()} />
                  <Button
                    small
                    kind="danger"
                    title="Confirmer l’effacement"
                    onPress={() => {
                      store.commitDestructive().then((ok) => {
                        if (!ok) toast('Effacement refusé : la copie ne correspond pas à l’original.', 'error');
                      });
                    }}
                  />
                </View>
              ) : backup ? (
                <Button
                  small
                  kind="danger"
                  title="Effacer l’original illisible"
                  onPress={() => {
                    if (!store.armDestructive('replace-unreadable')) toast('Effacement indisponible.', 'error');
                  }}
                />
              ) : null}
            </View>
          }
        />
      ) : null}
    </View>
  );
}

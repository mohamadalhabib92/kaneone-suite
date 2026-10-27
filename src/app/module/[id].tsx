import React from 'react';
import { View, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme, alpha } from '@/kit/theme';
import { Badge, EmptyState, Card, Progress, Row, Screen, T, Ionicons } from '@/kit/ui';
import { DOSSIER_MODULES, REQUIREMENTS } from '@/data/demo';
import { can, roleLabel, setReq, store, type ReqStatus } from '@/state';
import { BackHeader, DemoNotice, NeedPerm } from '@/components/common';
import { modStats } from '../(tabs)/dossier';

const NEXT: Record<ReqStatus, ReqStatus> = { ouvert: 'en cours', 'en cours': 'validé', validé: 'ouvert' };

export default function ModuleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const s = store.use();
  const m = DOSSIER_MODULES.find((x) => x.id === id);
  if (!m) {
    return (
      <Screen header={<BackHeader title="Module" />}>
        <EmptyState icon="alert-circle" title="Module introuvable" />
      </Screen>
    );
  }
  const edit = can(s.role, 'dossier.edit');
  const st = modStats(s.reqStatus, m.id);
  const color = (x: ReqStatus) => (x === 'validé' ? t.success : x === 'en cours' ? t.warning : t.textMuted);
  return (
    <Screen header={<BackHeader title={m.title} subtitle={`Responsable : ${roleLabel(m.owner as never)} · ${st.validated}/${st.total} validées`} />}>
      <DemoNotice />
      <NeedPerm perm="dossier.edit" what="modifier le statut des exigences" />
      <Progress value={st.validated / st.total} color={t.success} />
      {edit ? (
        <T v="small" muted>
          Touchez une exigence pour changer son statut : ouvert → en cours → validé.
        </T>
      ) : null}
      <Card style={{ paddingVertical: 4 }}>
        {REQUIREMENTS.filter((r) => r.moduleId === m.id).map((r) => {
          const cur = s.reqStatus[r.id] ?? 'ouvert';
          return (
            <Pressable
              key={r.id}
              disabled={!edit}
              onPress={() => setReq(r.id, NEXT[cur])}
              accessibilityRole="button"
              accessibilityLabel={`${r.title}, statut ${cur}`}
              style={({ pressed }) => ({ minHeight: 48, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: t.border, backgroundColor: pressed ? alpha(t.primary, 0.08) : 'transparent' })}
            >
              <Ionicons name={cur === 'validé' ? 'checkmark-circle' : cur === 'en cours' ? 'time' : 'ellipse-outline'} size={22} color={color(cur)} />
              <View style={{ flex: 1 }}>
                <T v="small" style={{ fontWeight: '600' }}>
                  {r.title}
                </T>
                <T v="caption" muted>
                  {r.id}
                </T>
              </View>
              <Badge label={cur} color={color(cur)} />
            </Pressable>
          );
        })}
      </Card>
    </Screen>
  );
}

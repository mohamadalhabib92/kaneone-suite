import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/kit/theme';
import { Banner, Card, Progress, Row, Screen, T } from '@/kit/ui';
import { BackHeader, NeedPerm } from '@/components/common';
import { can, store } from '@/state';
import { flattenOwnership, ownershipTree, type OwnNode } from '@/lib/ownership';

const KIND: Record<OwnNode['kind'], string> = {
  groupe: 'Groupe',
  pays: 'Pays',
  spv: 'Entité',
  actif: 'Actif',
};

function pct(n: number): string {
  return Number.isInteger(n) ? `${n} %` : `${n.toFixed(1)} %`;
}

function NodeBlock({ node, depth }: { node: OwnNode; depth: number }) {
  const t = useTheme();
  const router = useRouter();
  if (node.kind === 'pays') {
    return (
      <View style={{ gap: 8 }} accessibilityRole="summary" accessibilityLabel={node.name}>
        <T v="caption" muted>
          {node.name}
        </T>
        {node.children.map((child) => (
          <NodeBlock key={child.id} node={child} depth={depth + 1} />
        ))}
      </View>
    );
  }
  const stake =
    node.direct == null
      ? `Transparence ${pct(node.lookThrough)}`
      : `Détention directe ${pct(node.direct)}, transparence ${pct(node.lookThrough)}`;
  const body = (
    <View style={{ gap: 6, paddingLeft: depth * 12 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <T style={{ fontWeight: node.kind === 'groupe' ? '800' : '700' }}>{node.name}</T>
          <T v="caption" muted>
            {KIND[node.kind]}
            {node.direct == null ? '' : ` · directe ${pct(node.direct)}`}
          </T>
        </View>
        <T v="small" tabular style={{ fontWeight: '800' }}>
          {pct(node.lookThrough)}
        </T>
      </Row>
      <Progress value={node.lookThrough / 100} />
    </View>
  );
  return (
    <View style={{ gap: 8 }}>
      {node.href ? (
        <Card a11y={`${node.name}, ${stake}, exemple`} onPress={() => router.push(node.href!)}>
          {body}
        </Card>
      ) : (
        <Card>{body}</Card>
      )}
      {node.children.map((child) => (
        <NodeBlock key={child.id} node={child} depth={depth + (node.kind === 'groupe' ? 0 : 1)} />
      ))}
    </View>
  );
}

export default function OwnershipScreen() {
  const t = useTheme();
  const role = store.useSelect((s) => s.role);
  const tree = ownershipTree();
  const partial = flattenOwnership(tree).filter((n) => n.kind === 'spv' && n.lookThrough < 100);
  if (!can(role, 'internal')) {
    return (
      <Screen header={<BackHeader title="Détention" />}>
        <NeedPerm perm="internal" what="consulter l’arbre de détention" />
      </Screen>
    );
  }
  return (
    <Screen header={<BackHeader title="Détention" subtitle="Arbre du groupe et pourcentages en transparence" />}>
      <Banner
        kind="info"
        title="Exemple"
        text="Pourcentages calculés sur les entités déjà présentes dans l’application. Chaque actif est porté à 100 % par sa société. Ce n’est pas un registre de titres."
      />
      <Card>
        <T v="small" muted>
          Participations partielles
        </T>
        <T v="h2" tabular color={t.primary}>
          {partial.length}
        </T>
        <T v="caption" muted>
          sociétés dont la transparence est inférieure à 100 %
        </T>
      </Card>
      <NodeBlock node={tree} depth={0} />
    </Screen>
  );
}

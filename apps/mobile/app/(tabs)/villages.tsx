import { useEffect, useState } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../components/primitives/Screen';
import { Text } from '../../components/primitives/Text';
import { VillageCard } from '../../components/feature/VillageCard';
import { useT } from '../../lib/i18n';
import { useAuth } from '../../lib/auth/useAuth';
import { getUserMemberships } from '@cultuvilla/shared/services/villageMemberService';
import { getMunicipality } from '@cultuvilla/shared/services/municipalityService';
import type { MunicipalityData } from '@cultuvilla/shared/models/municipality/MunicipalityDataModel';

type Village = MunicipalityData & { id: string };

export default function VillagesScreen() {
  const { t } = useT();
  const { user } = useAuth();
  const [villages, setVillages] = useState<Village[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setVillages([]);
      return;
    }
    async function load() {
      try {
        setError(null);
        const memberships = await getUserMemberships(user!.uid);
        const results = await Promise.all(
          memberships.map((m) => getMunicipality(m.municipalityId)),
        );
        setVillages(results.filter((v): v is Village => v !== null));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'unknown');
      }
    }
    void load();
  }, [user]);

  if (villages === null && !error) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <Text tone="danger">{error}</Text>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlatList
        contentContainerClassName="p-4 gap-4"
        data={villages ?? []}
        keyExtractor={(v) => v.id}
        ListEmptyComponent={<Text tone="muted">{t('villages.empty')}</Text>}
        renderItem={({ item }) => (
          <VillageCard
            village={{ id: item.id, name: item.name }}
            onPress={(id) => router.push(`/village/${id}`)}
          />
        )}
      />
    </Screen>
  );
}

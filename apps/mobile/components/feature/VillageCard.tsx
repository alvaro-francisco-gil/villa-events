import { Pressable } from '../primitives/Pressable';
import { Card } from '../primitives/Card';
import { VStack } from '../primitives/VStack';
import { Text } from '../primitives/Text';

export type VillageLike = { id: string; name: string };

export type VillageCardProps = {
  village: VillageLike;
  onPress: (id: string) => void;
  testID?: string;
};

export function VillageCard({ village, onPress, testID }: VillageCardProps) {
  return (
    <Pressable onPress={() => onPress(village.id)} testID={testID}>
      <Card>
        <VStack gap={2}>
          <Text variant="h3">{village.name}</Text>
        </VStack>
      </Card>
    </Pressable>
  );
}

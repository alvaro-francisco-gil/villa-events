import { Pressable } from '../primitives/Pressable';
import { Card } from '../primitives/Card';
import { VStack } from '../primitives/VStack';
import { HStack } from '../primitives/HStack';
import { Text } from '../primitives/Text';
import { formatDate } from '@cultuvilla/shared/utils';

/**
 * Minimal event shape consumed by this card.
 * Callers using real EventData should map:
 *   startDate  → startDate  (already a Date from mapEventDoc)
 *   organizationName → organizationName
 */
export type EventLike = {
  id: string;
  title: string;
  startDate: Date;
  organizationName: string;
};

export type EventCardProps = {
  event: EventLike;
  onPress: (id: string) => void;
  testID?: string;
};

export function EventCard({ event, onPress, testID }: EventCardProps) {
  return (
    <Pressable onPress={() => onPress(event.id)} testID={testID}>
      <Card>
        <VStack gap={2}>
          <Text variant="h3">{event.title}</Text>
          <HStack gap={2} justify="between">
            <Text tone="muted">{event.organizationName}</Text>
            <Text tone="muted">{formatDate(event.startDate, 'short')}</Text>
          </HStack>
        </VStack>
      </Card>
    </Pressable>
  );
}

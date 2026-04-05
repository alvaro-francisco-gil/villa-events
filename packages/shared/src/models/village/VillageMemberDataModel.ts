export type VillageMemberRole = 'admin' | 'user';

export interface VillageMemberData {
  role: VillageMemberRole;
  joinedAt: Date;
}

export interface VillageMemberDataInput {
  role?: VillageMemberRole;
  joinedAt?: Date;
}

export function buildVillageMemberData(input: VillageMemberDataInput = {}): VillageMemberData {
  return {
    role: input.role ?? 'user',
    joinedAt: input.joinedAt ?? new Date(),
  };
}

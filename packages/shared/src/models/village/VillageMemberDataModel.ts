import type { ProfileAnswers } from './CensoTypes';

export type VillageMemberRole = 'admin' | 'user';

export interface VillageMemberData {
  role: VillageMemberRole;
  joinedAt: Date;
  profileAnswers: ProfileAnswers;
  profileCompletedAt: Date | null;
}

export interface VillageMemberDataInput {
  role?: VillageMemberRole;
  joinedAt?: Date;
  profileAnswers?: ProfileAnswers;
  profileCompletedAt?: Date | null;
}

export function buildVillageMemberData(input: VillageMemberDataInput = {}): VillageMemberData {
  return {
    role: input.role ?? 'user',
    joinedAt: input.joinedAt ?? new Date(),
    profileAnswers: input.profileAnswers ?? {},
    profileCompletedAt: input.profileCompletedAt ?? null,
  };
}

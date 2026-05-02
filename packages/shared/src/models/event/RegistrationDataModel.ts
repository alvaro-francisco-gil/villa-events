// packages/shared/src/models/event/RegistrationDataModel.ts
export type RegistrationStatus = 'confirmed' | 'waitlisted'

export interface RegistrationData {
  userId: string        // who owns this registration (for permissions/queries)
  personId: string      // the person being registered — always required
  name: string          // denormalized display name
  status: RegistrationStatus
  position: number
  registeredAt: Date
}

export interface RegistrationDataInput {
  userId: string
  personId: string
  name: string
  status: RegistrationStatus
  position: number
  registeredAt?: Date
}

export function buildRegistrationData(input: RegistrationDataInput): RegistrationData {
  return { ...input, registeredAt: input.registeredAt ?? new Date() }
}

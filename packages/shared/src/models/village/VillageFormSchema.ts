import { z } from 'zod';
import { COMUNIDADES_AUTONOMAS, PROVINCIAS_BY_COMUNIDAD, type ComunidadAutonoma } from './SpainGeography';

export const VillageLocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  displayName: z.string(),
});

const trimmedRequired = (msg: string) =>
  z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, msg);

export const VillageFormSchema = z
  .object({
    name: trimmedRequired('El nombre es obligatorio'),
    description: trimmedRequired('La descripción es obligatoria'),
    country: z.string().min(1, 'Selecciona un país'),
    comunidadAutonoma: z.enum([...COMUNIDADES_AUTONOMAS] as [ComunidadAutonoma, ...ComunidadAutonoma[]], {
      message: 'Selecciona una comunidad autónoma',
    }),
    provincia: z.string().min(1, 'Selecciona una provincia'),
    location: VillageLocationSchema.nullable().refine((v) => v !== null, {
      message: 'Selecciona la ubicación',
    }),
    barrios: z.array(z.string()).default([]),
    images: z.array(z.string()).default([]),
    adminUserId: z.string().min(1, 'Selecciona el administrador'),
  })
  .superRefine((data, ctx) => {
    const validProvincias = PROVINCIAS_BY_COMUNIDAD[data.comunidadAutonoma];
    if (validProvincias && !validProvincias.includes(data.provincia)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['provincia'],
        message: 'La provincia no pertenece a la comunidad autónoma',
      });
    }
  });

export type VillageFormInput = z.input<typeof VillageFormSchema>;
export type VillageFormValues = z.output<typeof VillageFormSchema>;

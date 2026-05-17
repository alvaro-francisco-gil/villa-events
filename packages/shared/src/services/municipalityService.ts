import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { MunicipalityData, MunicipalityDataInput, BarrioData, BarrioDataInput, CemeteryData, CemeteryDataInput } from '../models/municipality'

function municipalitiesCol() {
  return collection(db, 'municipalities')
}
function barriosCol(municipalityId: string) {
  return collection(db, 'municipalities', municipalityId, 'barrios')
}
function cemeteriesCol(municipalityId: string) {
  return collection(db, 'municipalities', municipalityId, 'cemeteries')
}

export async function getMunicipality(id: string): Promise<(MunicipalityData & { id: string }) | null> {
  const snap = await getDoc(doc(municipalitiesCol(), id))
  if (!snap.exists()) return null
  const d = snap.data() as Record<string, unknown>
  return {
    id: snap.id,
    name: d.name as string,
    province: d.province as string,
    comunidadAutonoma: d.comunidadAutonoma as string,
    codigoINE: d.codigoINE as string,
    createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(),
  }
}

export async function getMunicipalities(): Promise<(MunicipalityData & { id: string })[]> {
  const q = query(municipalitiesCol(), orderBy('name', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data() as Record<string, unknown>
    return {
      id: d.id,
      name: data.name as string,
      province: data.province as string,
      comunidadAutonoma: data.comunidadAutonoma as string,
      codigoINE: data.codigoINE as string,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    }
  })
}

export async function createMunicipality(input: MunicipalityDataInput): Promise<string> {
  const ref = await addDoc(municipalitiesCol(), { ...input, createdAt: serverTimestamp() })
  return ref.id
}

export async function getBarrios(municipalityId: string): Promise<(BarrioData & { id: string })[]> {
  const q = query(barriosCol(municipalityId), orderBy('name', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data() as Record<string, unknown>
    return {
      id: d.id,
      name: data.name as string,
      municipalityId,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    }
  })
}

export async function createBarrio(municipalityId: string, input: BarrioDataInput): Promise<string> {
  const ref = await addDoc(barriosCol(municipalityId), {
    name: input.name,
    municipalityId,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getCemeteries(municipalityId: string): Promise<(CemeteryData & { id: string })[]> {
  const q = query(cemeteriesCol(municipalityId), orderBy('name', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data() as Record<string, unknown>
    return {
      id: d.id,
      name: data.name as string,
      description: (data.description as string | null) ?? null,
      municipalityId,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    }
  })
}

export async function createCemetery(municipalityId: string, input: CemeteryDataInput): Promise<string> {
  const ref = await addDoc(cemeteriesCol(municipalityId), {
    name: input.name,
    description: input.description ?? null,
    municipalityId,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateMunicipality(id: string, data: Partial<Omit<MunicipalityData, 'createdAt'>>): Promise<void> {
  await updateDoc(doc(municipalitiesCol(), id), data as any)
}

export async function deleteMunicipality(id: string): Promise<void> {
  await deleteDoc(doc(municipalitiesCol(), id))
}

export async function updateBarrio(municipalityId: string, barrioId: string, data: Partial<Omit<BarrioData, 'createdAt'>>): Promise<void> {
  await updateDoc(doc(barriosCol(municipalityId), barrioId), data as any)
}

export async function deleteBarrio(municipalityId: string, barrioId: string): Promise<void> {
  await deleteDoc(doc(barriosCol(municipalityId), barrioId))
}

export async function updateCemetery(municipalityId: string, cemeteryId: string, data: Partial<Omit<CemeteryData, 'createdAt'>>): Promise<void> {
  await updateDoc(doc(cemeteriesCol(municipalityId), cemeteryId), data as any)
}

export async function deleteCemetery(municipalityId: string, cemeteryId: string): Promise<void> {
  await deleteDoc(doc(cemeteriesCol(municipalityId), cemeteryId))
}

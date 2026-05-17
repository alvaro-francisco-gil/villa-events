'use client'

import { useRef, useState } from 'react'
import { Camera, Trash2, User } from 'lucide-react'
import type { PersonData, PartialDate, MunicipalityLink, BurialPlace } from '@cultuvilla/shared/models/person'
import { useMunicipalities } from '@/hooks/useMunicipalities'
import { useBarrios } from '@/hooks/useBarrios'
import { useCemeteries } from '@/hooks/useCemeteries'
import { useOccupations } from '@/hooks/useOccupations'

type Sex = 'male' | 'female' | 'other'

interface PersonFormProps {
  initial?: Partial<Pick<PersonData,
    'givenName' | 'middleNames' | 'firstSurname' | 'secondSurname' |
    'nickname' | 'sex' | 'birthday' | 'deathDate' | 'biography' | 'photoURL' |
    'birthPlace' | 'municipalityLinks' | 'burialPlace' | 'occupationIds' | 'pendingOccupations'
  >>
  onSubmit: (data: {
    givenName: string
    middleNames: string[]
    firstSurname: string | null
    secondSurname: string | null
    nickname: string | null
    sex: Sex | null
    birthday: PartialDate | null
    deathDate: PartialDate | null
    biography: string | null
    photoFile: File | null
    birthPlace: MunicipalityLink | null
    municipalityLinks: MunicipalityLink[]
    burialPlace: BurialPlace | null
    occupationIds: string[]
    pendingOccupations: string[]
  }) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

function pdToInputs(pd: PartialDate | null | undefined) {
  return {
    year: pd?.year != null ? String(pd.year) : '',
    month: pd?.month != null ? String(pd.month) : '',
    day: pd?.day != null ? String(pd.day) : '',
  }
}

function inputsToPd(year: string, month: string, day: string): PartialDate | null {
  if (!year && !month && !day) return null
  return {
    year: year ? parseInt(year, 10) : null,
    month: month ? parseInt(month, 10) : null,
    day: day ? parseInt(day, 10) : null,
  }
}

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Hombre' },
  { value: 'female', label: 'Mujer' },
  { value: 'other', label: 'Otro' },
]

// Sub-component for a single municipality-link row (needs its own hook call for barrios)
interface MunicipalityLinkRowProps {
  row: MunicipalityLink
  index: number
  municipalities: { id: string; name: string }[]
  onChange: (index: number, row: MunicipalityLink) => void
  onRemove: (index: number) => void
  selectCls: string
}

function MunicipalityLinkRow({ row, index, municipalities, onChange, onRemove, selectCls }: MunicipalityLinkRowProps) {
  const { barrios } = useBarrios(row.municipalityId || null)

  const handleMunicipalityChange = (municipalityId: string) => {
    onChange(index, { municipalityId, barrioId: null })
  }

  const handleBarrioChange = (barrioId: string) => {
    onChange(index, { ...row, barrioId: barrioId || null })
  }

  return (
    <div className="flex gap-2 items-center">
      <select
        value={row.municipalityId}
        onChange={e => handleMunicipalityChange(e.target.value)}
        className={selectCls + ' flex-1'}
      >
        <option value="">Sin especificar</option>
        {municipalities.map(m => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
      {row.municipalityId && (
        <select
          value={row.barrioId ?? ''}
          onChange={e => handleBarrioChange(e.target.value)}
          className={selectCls + ' flex-1'}
        >
          <option value="">Sin barrio</option>
          {barrios.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      )}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="p-1.5 text-gray-400 hover:text-red-500 transition flex-shrink-0"
        aria-label="Eliminar vinculación"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

// Sub-component for birth-place barrio picker (cascading)
interface BirthPlaceBarrioProps {
  municipalityId: string
  barrioId: string
  onBarrioChange: (barrioId: string) => void
  selectCls: string
}

function BirthPlaceBarrioPicker({ municipalityId, barrioId, onBarrioChange, selectCls }: BirthPlaceBarrioProps) {
  const { barrios } = useBarrios(municipalityId || null)
  return (
    <select
      value={barrioId}
      onChange={e => onBarrioChange(e.target.value)}
      className={selectCls}
    >
      <option value="">Sin barrio</option>
      {barrios.map(b => (
        <option key={b.id} value={b.id}>{b.name}</option>
      ))}
    </select>
  )
}

// Sub-component for burial-place cemetery picker (cascading)
interface BurialCemeteryPickerProps {
  municipalityId: string
  cemeteryId: string
  onCemeteryChange: (cemeteryId: string) => void
  selectCls: string
}

function BurialCemeteryPicker({ municipalityId, cemeteryId, onCemeteryChange, selectCls }: BurialCemeteryPickerProps) {
  const { cemeteries } = useCemeteries(municipalityId || null)
  return (
    <select
      value={cemeteryId}
      onChange={e => onCemeteryChange(e.target.value)}
      className={selectCls}
    >
      <option value="">Sin especificar</option>
      {cemeteries.map(c => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  )
}

export function PersonForm({ initial, onSubmit, onCancel, submitLabel = 'Guardar' }: PersonFormProps) {
  const [givenName, setGivenName] = useState(initial?.givenName ?? '')
  const [middleNames, setMiddleNames] = useState((initial?.middleNames ?? []).join(', '))
  const [firstSurname, setFirstSurname] = useState(initial?.firstSurname ?? '')
  const [secondSurname, setSecondSurname] = useState(initial?.secondSurname ?? '')
  const [nickname, setNickname] = useState(initial?.nickname ?? '')
  const [sex, setSex] = useState<Sex | ''>(initial?.sex ?? '')

  const bInit = pdToInputs(initial?.birthday)
  const [birthYear, setBirthYear] = useState(bInit.year)
  const [birthMonth, setBirthMonth] = useState(bInit.month)
  const [birthDay, setBirthDay] = useState(bInit.day)

  const dInit = pdToInputs(initial?.deathDate)
  const [deathYear, setDeathYear] = useState(dInit.year)
  const [deathMonth, setDeathMonth] = useState(dInit.month)
  const [deathDay, setDeathDay] = useState(dInit.day)

  const [biography, setBiography] = useState(initial?.biography ?? '')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial?.photoURL ?? null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Birth place
  const [birthMunicipalityId, setBirthMunicipalityId] = useState(initial?.birthPlace?.municipalityId ?? '')
  const [birthBarrioId, setBirthBarrioId] = useState(initial?.birthPlace?.barrioId ?? '')

  // Municipality links
  const [municipalityLinks, setMunicipalityLinks] = useState<MunicipalityLink[]>(
    initial?.municipalityLinks ?? []
  )

  // Burial place
  const [burialMunicipalityId, setBurialMunicipalityId] = useState(initial?.burialPlace?.municipalityId ?? '')
  const [burialCemeteryId, setBurialCemeteryId] = useState(initial?.burialPlace?.cemeteryId ?? '')

  // Occupations
  const [occupationIds, setOccupationIds] = useState<Set<string>>(
    new Set(initial?.occupationIds ?? [])
  )
  const [pendingOccupations, setPendingOccupations] = useState<string[]>(
    initial?.pendingOccupations ?? []
  )
  const [occupationInput, setOccupationInput] = useState('')

  // Hooks
  const { municipalities } = useMunicipalities()
  const { occupations } = useOccupations()

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('El archivo no es una imagen'); return }
    if (file.size > 5 * 1024 * 1024) { setError('La imagen supera 5 MB'); return }
    setError('')
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  // Municipality links handlers
  const handleLinkChange = (index: number, row: MunicipalityLink) => {
    setMunicipalityLinks(prev => prev.map((r, i) => i === index ? row : r))
  }
  const handleLinkRemove = (index: number) => {
    setMunicipalityLinks(prev => prev.filter((_, i) => i !== index))
  }
  const handleAddLink = () => {
    setMunicipalityLinks(prev => [...prev, { municipalityId: '', barrioId: null }])
  }

  // Occupation toggle
  const toggleOccupation = (id: string) => {
    setOccupationIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Propose occupation
  const handleProposeOccupation = () => {
    const trimmed = occupationInput.trim()
    if (!trimmed) return
    const lower = trimmed.toLowerCase()
    const alreadyApproved = occupations.some(o => o.name.toLowerCase() === lower)
    const alreadyPending = pendingOccupations.some(p => p.toLowerCase() === lower)
    if (alreadyApproved || alreadyPending) return
    setPendingOccupations(prev => [...prev, trimmed])
    setOccupationInput('')
  }

  const handleRemovePending = (name: string) => {
    setPendingOccupations(prev => prev.filter(p => p !== name))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!givenName.trim()) { setError('El nombre es obligatorio'); return }
    setError('')
    setSubmitting(true)
    try {
      // Compute birthPlace
      const birthPlace: MunicipalityLink | null = birthMunicipalityId
        ? { municipalityId: birthMunicipalityId, barrioId: birthBarrioId || null }
        : null

      // Compute burialPlace — only set when both municipalityId and cemeteryId are present
      const burialPlace: BurialPlace | null =
        burialMunicipalityId && burialCemeteryId
          ? { municipalityId: burialMunicipalityId, cemeteryId: burialCemeteryId }
          : null

      // Filter out empty municipality-link rows
      const filteredLinks = municipalityLinks.filter(l => l.municipalityId !== '')

      await onSubmit({
        givenName: givenName.trim(),
        middleNames: middleNames.split(',').map(s => s.trim()).filter(Boolean),
        firstSurname: firstSurname.trim() || null,
        secondSurname: secondSurname.trim() || null,
        nickname: nickname.trim() || null,
        sex: (sex as Sex) || null,
        birthday: inputsToPd(birthYear, birthMonth, birthDay),
        deathDate: inputsToPd(deathYear, deathMonth, deathDay),
        biography: biography.trim() || null,
        photoFile,
        birthPlace,
        municipalityLinks: filteredLinks,
        burialPlace,
        occupationIds: Array.from(occupationIds),
        pendingOccupations,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const numCls = 'border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const selectCls = 'w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Photo */}
      <div className="flex justify-center mb-1">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {photoPreview
            ? <img src={photoPreview} alt="Foto" className="w-full h-full object-cover" />
            : <User size={32} className="text-gray-400" />}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            <Camera size={20} className="text-white" />
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
      </div>

      {/* Name */}
      <div className="grid grid-cols-2 gap-2">
        <input type="text" placeholder="Nombre *" value={givenName} onChange={e => setGivenName(e.target.value)} required className={inputCls} />
        <input type="text" placeholder="Segundos nombres (sep. comas)" value={middleNames} onChange={e => setMiddleNames(e.target.value)} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="text" placeholder="Primer apellido" value={firstSurname} onChange={e => setFirstSurname(e.target.value)} className={inputCls} />
        <input type="text" placeholder="Segundo apellido" value={secondSurname} onChange={e => setSecondSurname(e.target.value)} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="text" placeholder="Mote (apodo)" value={nickname} onChange={e => setNickname(e.target.value)} className={inputCls} />
        <select value={sex} onChange={e => setSex(e.target.value as Sex | '')} className={inputCls}>
          <option value="">Sexo (opcional)</option>
          {SEX_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Birthday */}
      <div>
        <label className="block text-xs text-gray-500 mb-1 ml-1">Fecha de nacimiento (año, mes y día son opcionales)</label>
        <div className="grid grid-cols-3 gap-2">
          <input type="number" placeholder="Año" value={birthYear} onChange={e => setBirthYear(e.target.value)} className={numCls} />
          <input type="number" placeholder="Mes" min={1} max={12} value={birthMonth} onChange={e => setBirthMonth(e.target.value)} className={numCls} />
          <input type="number" placeholder="Día" min={1} max={31} value={birthDay} onChange={e => setBirthDay(e.target.value)} className={numCls} />
        </div>
      </div>

      {/* Death date */}
      <div>
        <label className="block text-xs text-gray-500 mb-1 ml-1">Fecha de defunción (opcional)</label>
        <div className="grid grid-cols-3 gap-2">
          <input type="number" placeholder="Año" value={deathYear} onChange={e => setDeathYear(e.target.value)} className={numCls} />
          <input type="number" placeholder="Mes" min={1} max={12} value={deathMonth} onChange={e => setDeathMonth(e.target.value)} className={numCls} />
          <input type="number" placeholder="Día" min={1} max={31} value={deathDay} onChange={e => setDeathDay(e.target.value)} className={numCls} />
        </div>
      </div>

      {/* Birth place */}
      <div>
        <label className="block text-xs text-gray-500 mb-1 ml-1">Lugar de nacimiento</label>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={birthMunicipalityId}
            onChange={e => {
              setBirthMunicipalityId(e.target.value)
              setBirthBarrioId('')
            }}
            className={selectCls}
          >
            <option value="">Sin especificar</option>
            {municipalities.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          {birthMunicipalityId && (
            <BirthPlaceBarrioPicker
              municipalityId={birthMunicipalityId}
              barrioId={birthBarrioId}
              onBarrioChange={setBirthBarrioId}
              selectCls={selectCls}
            />
          )}
        </div>
      </div>

      {/* Municipality links */}
      <div>
        <label className="block text-xs text-gray-500 mb-1 ml-1">Vinculaciones a ayuntamientos</label>
        <div className="space-y-2">
          {municipalityLinks.map((row, i) => (
            <MunicipalityLinkRow
              key={i}
              row={row}
              index={i}
              municipalities={municipalities}
              onChange={handleLinkChange}
              onRemove={handleLinkRemove}
              selectCls={selectCls}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={handleAddLink}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition"
        >
          + Añadir vinculación
        </button>
      </div>

      {/* Burial place */}
      <div>
        <label className="block text-xs text-gray-500 mb-1 ml-1">Lugar de enterramiento (opcional)</label>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={burialMunicipalityId}
            onChange={e => {
              setBurialMunicipalityId(e.target.value)
              setBurialCemeteryId('')
            }}
            className={selectCls}
          >
            <option value="">Sin especificar</option>
            {municipalities.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          {burialMunicipalityId && (
            <BurialCemeteryPicker
              municipalityId={burialMunicipalityId}
              cemeteryId={burialCemeteryId}
              onCemeteryChange={setBurialCemeteryId}
              selectCls={selectCls}
            />
          )}
        </div>
      </div>

      {/* Occupations */}
      <div>
        <label className="block text-xs text-gray-500 mb-1 ml-1">Ocupaciones</label>
        {occupations.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {occupations.map(o => {
              const selected = occupationIds.has(o.id)
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggleOccupation(o.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
                    selected
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {o.name}
                </button>
              )
            })}
          </div>
        )}
        {pendingOccupations.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {pendingOccupations.map(name => (
              <span
                key={name}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600 border border-gray-200"
              >
                {name} <span className="text-xs text-gray-400">(pendiente)</span>
                <button
                  type="button"
                  onClick={() => handleRemovePending(name)}
                  className="ml-0.5 text-gray-400 hover:text-red-500 transition leading-none"
                  aria-label={`Eliminar propuesta ${name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Proponer nueva ocupación"
            value={occupationInput}
            onChange={e => setOccupationInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleProposeOccupation() } }}
            className={inputCls}
          />
          <button
            type="button"
            onClick={handleProposeOccupation}
            disabled={!occupationInput.trim()}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40 whitespace-nowrap"
          >
            + Proponer
          </button>
        </div>
      </div>

      <textarea
        placeholder="Biografía (opcional)" value={biography}
        onChange={e => setBiography(e.target.value)} rows={3}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition">
          Cancelar
        </button>
        <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
          {submitting ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

'use client'

import { useRef, useState } from 'react'
import { Camera, User } from 'lucide-react'
import type { PersonData, PartialDate } from '@cultuvilla/shared/models/person'

type Sex = 'male' | 'female' | 'other'

interface PersonFormProps {
  initial?: Partial<Pick<PersonData,
    'givenName' | 'middleNames' | 'firstSurname' | 'secondSurname' |
    'nickname' | 'sex' | 'birthday' | 'deathDate' | 'biography' | 'photoURL'
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('El archivo no es una imagen'); return }
    if (file.size > 5 * 1024 * 1024) { setError('La imagen supera 5 MB'); return }
    setError('')
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!givenName.trim()) { setError('El nombre es obligatorio'); return }
    setError('')
    setSubmitting(true)
    try {
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
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const numCls = 'border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

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

---
name: i18n-add-string
description: Use whenever adding or changing a user-facing string in the Next.js web app. Encodes the next-intl conventions, the message-catalogue layout, the namespace-by-feature rule, and the "hardcoded Spanish allowed only in dev-only admin surfaces" carve-out from AGENTS.md.
---

# Add a user-facing string

Cultuvilla's web app uses `next-intl` v4. The default locale is `es`. All user-facing strings live in `apps/web/i18n/messages/<locale>.json` and are rendered via `useTranslations()`.

## When this applies

- Adding a new label, button text, error message, placeholder, or notification copy in a component the end-user sees.
- Replacing an English string left in source code with the localised version.

Carve-out: hardcoded Spanish is **allowed** in dev-only surfaces — admin panels, debug pages, internal tools where i18n is not a current priority. If in doubt, ask "would a non-admin user see this?" — yes → i18n; no → fine as-is.

## Procedure

### 1. Pick a namespace

Namespaces group strings by **feature area**, not by component. `events`, `personas`, `villageOnboarding`, `auth`, `feed`. A component re-using strings from multiple namespaces is normal — `useTranslations('events')` and `useTranslations('common')` in the same file is fine.

Open [`apps/web/i18n/messages/es.json`](../../../apps/web/i18n/messages/es.json) (the default locale). Look for an existing namespace that fits. If none does, add a new top-level key.

### 2. Add the key

Choose a stable, descriptive key. Avoid copy-as-key (`"Save"` as the key) because copy changes more often than meaning.

```json
{
  "events": {
    "createButton": "Crear evento",
    "fullNotice": "Este evento está completo. Puedes apuntarte a la lista de espera.",
    "registrationConfirmed": "Te has apuntado correctamente."
  }
}
```

If the string is parameterised, use next-intl ICU syntax:

```json
{
  "events": {
    "attendeeCount": "{count, plural, =0 {Sin asistentes} one {1 asistente} other {# asistentes}}"
  }
}
```

### 3. Render the string

In the component:

```tsx
import { useTranslations } from 'next-intl';

export function CreateEventButton() {
  const t = useTranslations('events');
  return <button>{t('createButton')}</button>;
}
```

For parameterised strings:

```tsx
const t = useTranslations('events');
<p>{t('attendeeCount', { count: registrations.length })}</p>
```

For server components, use `getTranslations` from `next-intl/server`:

```tsx
import { getTranslations } from 'next-intl/server';

export default async function EventPage() {
  const t = await getTranslations('events');
  return <h1>{t('title')}</h1>;
}
```

### 4. Decide on other locales

Cultuvilla's MVP ships in Spanish only. If a non-`es` locale file exists in `apps/web/i18n/messages/` and is wired up, add the key to that file too with `TODO: translate` as the value — it's better than a missing-key runtime error. Otherwise leave the other-locale work for a future translation pass.

## What NOT to do

- **Don't hardcode Spanish in a user-facing component.** It bypasses the catalogue and makes future translation a grep-and-replace nightmare.
- **Don't use the English copy as the key.** When the Spanish text changes, the key changes too, and every translation breaks.
- **Don't `as any` your way around a missing-namespace type error.** Add the key to the catalogue.
- **Don't add the same string under two namespaces.** Pick one and reuse.
- **Don't use string concatenation in a translated message.** `${t('hello')} ${name}` works but breaks word order in languages with different grammar — use ICU placeholders instead.

## When the string is dev-only

Admin pages, debug panels, internal-only routes — hardcoded Spanish (or English, whatever's easiest to read while building) is fine. If the page is gated behind `isAppAdmin`, that's the signal: not user-facing.

If the dev-only flag may change (e.g. an admin tool that later becomes user-facing), still namespace it and use `useTranslations()` — it's cheaper than retrofitting later.

## When this skill applies

- The user asks to "add a button labelled X" / "show an error when Y" / "rename Z in the UI".
- A grep finds Spanish strings outside `apps/web/i18n/messages/` in user-facing source.
- A new component is shipping with a hardcoded string.

## Companion skills

- None — this is self-contained.

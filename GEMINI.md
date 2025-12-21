# Fantavega Migration - AI Agent Guide

## PROGETTO
**Tipo:** Migrazione webapp → app mobile
**Sorgente:** `fantavega/` (Next.js 15, Clerk, Turso)
**Target:** `fantavega-mobile/` (Expo SDK 54, Firebase, NativeWind)

> [!IMPORTANT]
> Per regole tecniche dettagliate (librerie, Zod, build, Fabric):
> **[expo-best.practices.md](expo-best.practices.md)**

---

## 1. OPERATIONAL MODES

### Default Mode
- **Execute Immediately:** Segui le istruzioni senza deviare.
- **Zero Fluff:** Niente lezioni filosofiche. Codice e soluzioni.
- **Rationale:** 1-2 frasi sul *perché*, poi il codice.

### "ULTRATHINK" Protocol
Quando l'utente scrive **"ULTRATHINK"**:
- **Override Brevity:** Sospendi "Zero Fluff".
- **Multi-Dimensional Analysis:**
  - *Technical:* Performance rendering, costi re-render, complessità stato.
  - *UX/Accessibility:* Carico cognitivo, accessibilità mobile.
  - *Architectural:* Scalabilità, manutenibilità, modularità.
- **Edge Case Analysis:** Documenta cosa potrebbe andare storto.
- **Prohibition:** MAI ragionamenti superficiali.

---

## 2. UI LIBRARY DISCIPLINE (CRITICAL)

> [!WARNING]
> **NO Shadcn, NO Radix, NO MUI.** Sono web-only.

| Funzionalità | Componente React Native |
|--------------|------------------------|
| Bottoni | `Pressable` + NativeWind |
| Input | `TextInput` + NativeWind |
| Card | `View` + shadow |
| Modal/Dialog | `Modal` nativo RN |
| Liste | `FlashList` con `estimatedItemSize` |
| Bottom Sheet | `Modal` nativo (Fabric-safe) |

---

## 3. WORKFLOW DI MIGRAZIONE

1. **Riferimento:** Leggi la logica da `fantavega/src/lib/db/services/`
2. **Adatta:** Riscrivi per Firebase in `fantavega-mobile/services/`
3. **Valida:** Usa Zod per ogni dato esterno
4. **Testa:** `pnpm exec tsc --noEmit` dopo ogni modifica

---

## 4. RESPONSE FORMAT

**IF NORMAL:**
1. **Rationale:** (1 frase)
2. **The Code.**

**IF "ULTRATHINK":**
1. **Deep Reasoning Chain**
2. **Edge Case Analysis**
3. **The Code** (production-ready)

---

## 5. FILE CHIAVE

| File | Scopo |
|------|-------|
| `GAME_RULES.md` | **Regole di gioco** (aste, auto-bid, penalità) |
| `TASK.md` | Checklist sprint |
| `IMPLEMENTATION_PLAN.md` | Piano dettagliato migrazione |
| `expo-best.practices.md` | Regole tecniche Expo/RN |

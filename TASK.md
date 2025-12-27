# Fantavega → Expo Migration

> **Obiettivo:** Trasformare la webapp Next.js in un'app mobile nativa (Android/iOS) mantenendo tutte le regole di gioco.
>
> 📖 **Regole di gioco:** [GAME_RULES.md](GAME_RULES.md)

---

## 🎯 Current Sprint: Fase 7 - Features Mobile + Auto-Bid UI

### Fase 7a: Auto-Bid UI (CRITICO)
- [x] **7a.1** Auto-Bid toggle + input max in `BidBottomSheet.tsx`
- [x] **7a.2** Indicatore "Auto-Bid Attivo" nella pagina asta
- [x] **7a.3** Mostrare auto-bid attivi nella lista aste

### Fase 7b: Features Mobile
- [x] **7.1** Push notifications - offerta superata ✅
  - ⏳ Notifica "asta in scadenza" richiede FCM server-side (deferred)
- [x] **7.2** Haptic feedback (offerta piazzata, errore)
- [x] **7.3** Keep awake durante aste attive

### Fase 8: Sistema Penalità + Budget Completo
- [x] **8.1** `penalty.service.ts` con lazy evaluation ✅
  - Verifica compliance su login/accesso asta
  - Timer 1 ora grazia + penalità 5 crediti/ora
  - Max 25 crediti per ciclo
- [x] **8.2** `budget.service.ts` per transazioni ✅
- [x] **8.3** Gestione `locked_credits` completa ✅
  - Blocco crediti su auto-bid
  - Sblocco su superamento/fine asta
- [x] **8.4** UI indicatori penalità nei ManagerColumn
- [x] **8.5** Trigger compliance nelle pagine ✅
  - `useComplianceCheck` hook in `hooks/useCompliance.ts`
  - Trigger automatico su: `auction/[id].tsx`, `roster.tsx`, `managers.tsx`
- [x] **8.6** Componente `ComplianceTimer` UI ✅
  - Timer countdown nella pagina rosa
  - Mostra tempo rimanente prima della penalità
  - Fix: schema Zod con `.nullish()` per Firebase
  - Fix: default `activeAuctionRoles` a "ALL" in fasi attive


---

## ✅ Fasi Completate

### Fase 6: Firebase Auth ✅
- [x] **6.1** Setup Firebase Auth in Firebase Console
- [x] **6.2** `AuthContext.tsx` con DEV_MODE bypass per test rapidi
- [x] **6.3** Sign In / Sign Up screens (`app/(auth)/`)
- [x] **6.4** `AuthGuard.tsx` per protezione route
- [x] **6.5** Rimuovere `MockUserSelector` e `MOCK_USER_ID`
- [x] **6.6** Sostituire mock user in tutti i servizi
- [x] **6.7** Configurazione Google Sign-In (`google-services.json`)
- [x] **6.8** EAS Build con Google Sign-In nativo

> **Implementazione:**
> - `contexts/AuthContext.tsx` - Provider con Email/Password, Google, Apple Sign-In
> - `components/AuthGuard.tsx` - Protezione route
> - `app/(auth)/login.tsx` e `signup.tsx` - UI complete
> - DEV_MODE bypass controllato da `__DEV__`

### Sprint 1-3: Core Auction Flow ✅
- [x] Bottone "Vai all'Asta" in `league/[id].tsx`
- [x] Dropdown "Cambia Stato Lega" in `settings.tsx`
- [x] Servizio `updateLeagueStatus()` per Firebase
- [x] Bottone "Chiama Asta" (`CallPlayerModal.tsx`)
- [x] Servizi `createAuction` + `placeBid` integrati
- [x] **Auto-Bid System** con logica eBay (MVP)

### Fase 1-5: Infrastruttura ✅
- [x] Progetto Expo + Firebase + NativeWind
- [x] FlashList, TanStack Query, Zustand
- [x] Lista giocatori + ricerca
- [x] Sistema aste real-time (Firebase Realtime DB)
- [x] Home multi-lega + crea/join lega
- [x] Settings lega (admin)
- [x] Development Build Android
- [x] `roster.service.ts` per assegnazioni

---

## 📋 Backlog Futuro

### Bug Fix Recenti ✅
- [x] **Auto-bid visibile nel tab Rosa** - Badge "🤖 Max: X" negli slot in asta
- [x] **Fix calcolo budget** - Hook `useBudget` ora legge da Firestore (non RTDB)
- [x] **Fix detrazione budget su vincita asta** - `assignAuctionWinnerToRoster` ora aggiorna `currentBudget`, `spentCredits` e `lockedCredits`
- [x] **Fix locked credits per TUTTE le offerte** - Ora anche le offerte manuali bloccano i crediti, non solo gli auto-bid
- [x] **Penalità nei crediti spesi** - Le penalità ora incrementano anche `spentCredits`
- [x] **Indicatore penalità nel tab Rosa** - Mostra quante penalità (in crediti) hai subito
- [x] **Blocco auto-rilancio** - Impedito rilanciare su se stessi con messaggio "Sei già il miglior offerente!"
- [x] **Fix spentCredits dinamico** - Calcolato come `initialBudget - currentBudget` per includere tutto (acquisti + penalità)
- [x] **Validazione budget admin** - Budget modificabile solo in "Iscrizioni aperte" e può solo essere aumentato, mai diminuito
- [x] **Dropdown stato lega** - Admin può selezionare lo stato da un menu a tendina con icone e descrizioni
- [x] **Tracciamento originalBudget** - Salvato al momento dell'iscrizione per calcolo corretto spentCredits

### Tech Debt
- [/] Foto giocatori (PlayerAvatar ✅, upload pending)
- [ ] Deep Links per inviti lega
- [ ] Quick-bid UI migliorata

### Funzionalità Mobile-First
- [ ] Offline indicator
- [x] Pull-to-refresh ✅
- [ ] Gesture navigation

---

## 🛠️ Comandi

```bash
# Dev server (WSL)
EXPO_TUNNEL_SUBDOMAIN=fantavega pnpm exec expo start --tunnel

# Type check
pnpm exec tsc --noEmit

# Nuovo build (dopo librerie native)
eas build --profile development --platform android
```

---

## 📁 Struttura Progetto

| Directory | Contenuto |
|-----------|-----------|
| `fantavega/` | Webapp Next.js (SORGENTE) |
| `fantavega-mobile/` | App Expo (TARGET) |
| `GAME_RULES.md` | Regole di gioco |
| `IMPLEMENTATION_PLAN.md` | Piano dettagliato migrazione |
| `expo-best.practices.md` | Best practices tecniche Expo |

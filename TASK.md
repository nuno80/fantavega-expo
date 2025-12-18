# Fantavega → Expo Migration

## Current Task
- [ ] Fase 3: Home Multi-Lega + Crea Lega

## Checklist Migrazione

### Fase 1: Setup Infrastruttura ✅
- [x] Inizializzare progetto Expo con Router (pnpm)
- [x] Configurare Firebase (progetto + SDK)
- [x] Setup NativeWind per styling
- [x] Configurare EAS Build
- [x] Installare best practices libs (FlashList, expo-image, Zustand, TanStack Query, Zod, react-hook-form)

### Fase 2: Core Features ✅
- [x] Lista giocatori (FlatList + TanStack Query)
- [x] Player Card component
- [x] Ricerca giocatori
- [x] Dashboard lega
- [x] Sistema aste real-time (MVP)

### Fase 2.5: Sistema Aste Real-Time (MVP) ✅
- [x] `services/auction.service.ts` - operazioni Firebase
- [x] `services/bid.service.ts` - logica offerte (NO auto-bid)
- [x] `hooks/useAuction.ts` - listener singola asta
- [x] `hooks/useAuctionTimer.ts` - timer sincronizzato
- [x] `hooks/useLeagueAuctions.ts` - lista aste attive
- [x] `components/auction/AuctionCard.tsx`
- [x] `components/auction/BiddingInterface.tsx`
- [x] `components/auction/AuctionTimer.tsx`
- [x] Refactor `app/(tabs)/auctions.tsx`
- [x] `app/auction/[id].tsx` - dettaglio asta

---

### Fase 3: Home Multi-Lega + Crea Lega
- [x] **Mock User Selector** (per testing senza auth)
    - [x] Zustand store con `currentUserId` + lista utenti mock
    - [x] UI selector nel tab Profilo
- [ ] **Home Dashboard**
    - [x] `app/(tabs)/index.tsx`: Lista leghe utente + "Crea Lega"
    - [x] `components/leagues/LeagueCard.tsx` (già esistente)
- [x] **Creazione Lega**
    - [x] `app/league/create.tsx`: Form (nome, budget, slots, logo)
    - [x] `services/league.service.ts`: createLeague() (già esistente)
- [x] **Gestione Contesto Lega**
    - [x] Zustand store per lega selezionata (`stores/leagueStore.ts`)
    - [ ] Test navigazione da Home → Dashboard Lega

### Fase 4: Settings Lega (Admin Creator) ✅
- [x] `app/league/[id]/settings.tsx`
- [x] Modifica impostazioni lega
- [ ] Caricamento logo personalizzato (futuro)
- [x] Codice invito generato (persistenza futura)
- [x] Gestione utenti (lista, rimuovi)

### Fase 5: Auto-Bid System
- [ ] Logica auto-bid (eBay-style)
- [ ] UI per impostare max bid
- [ ] Notifiche quando superato

### Fase 6: Features Mobile
- [ ] Push notifications (expo-notifications)
- [ ] Haptic feedback (expo-haptics)
- [ ] Keep awake durante aste (expo-keep-awake)

### Fase 7: Firebase Auth (ULTIMO)
- [ ] `contexts/AuthContext.tsx`
- [ ] `hooks/useAuth.ts`
- [ ] Schermate Sign In / Sign Up
- [ ] Protezione route
- [ ] Rimuovere mock user selector
- [ ] **Ripristinare regole sicurezza Firestore** (`request.auth != null`)

### Fase 8: Deploy
- [ ] EAS Build configurazione
- [ ] EAS Update per OTA
- [ ] Testing su dispositivi reali

---

## 📝 Tech Debt / Miglioramenti Futuri
- [ ] **Migrare FlatList → FlashList** (quando bug TypeScript v2.0 risolto)
- [ ] **Aggiungere foto giocatori** (URL da Next.js deployato su Vercel)
- [ ] **Deep Links per inviti** (`fantavega://join/CODE` + Universal Links per produzione)

---

## 🛠️ Comandi Utili

```bash
# Dev server (usa --tunnel per testare su telefono Android/iOS)
pnpm exec expo start --tunnel

# TypeScript check
pnpm exec tsc --noEmit
```

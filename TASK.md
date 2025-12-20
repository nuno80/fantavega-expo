# Fantavega → Expo Migration

## 🎯 Current Task: Sprint 3 - Auto-Bid System

### Sprint 1: Collegamento Flusso Base ✅
- [x] **1.1** Bottone "Vai all'Asta" in `league/[id].tsx`
- [x] **1.2** Dropdown "Cambia Stato Lega" in `settings.tsx`
- [x] **1.3** Servizio `updateLeagueStatus()` per Firebase

### Sprint 2: Avvio Asta (Call Player) ✅
- [x] **2.1** Bottone "Chiama Asta" su giocatore (`CallPlayerModal.tsx`)
- [x] **2.2** Servizio `createAuction` + `placeBid` integrato
- [x] **2.3** Redirect a `auction/[id].tsx` dopo creazione

### Sprint 3: Auto-Bid System ✅
- [x] **3.1** Toggle auto-bid in `BidBottomSheet` con input max amount
- [x] **3.2** Servizio Firebase: salva auto-bids in `autoBids/{leagueId}/{auctionId}/{userId}`
- [x] **3.3** Logica base eBay integrata (MVP)

---

## ✅ Fasi Completate

### Fase 1-5: Setup + Core Features ✅
- [x] Progetto Expo + Firebase + NativeWind
- [x] FlashList, TanStack Query, Zustand
- [x] Lista giocatori + ricerca
- [x] Sistema aste real-time (MVP)
- [x] Home multi-lega + crea/join lega
- [x] Settings lega (admin)
- [x] Development Build Android

---

## 📋 Backlog

### Fase 6: Features Mobile
- [ ] Push notifications
- [ ] Haptic feedback
- [ ] Keep awake durante aste

### Fase 7: Firebase Auth
- [ ] Rimuovere mock user
- [ ] Sign In / Sign Up
- [ ] Protezione route

### Tech Debt
- [x] FlashList migration
- [ ] Foto giocatori
- [ ] Deep Links inviti

---

## 🛠️ Comandi

```bash
pnpm exec expo start --tunnel    # Dev con tunnel
pnpm exec tsc --noEmit           # Type check
```

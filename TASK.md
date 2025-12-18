# Fantavega → Expo Migration

## Current Task
- [x] Creare piano di implementazione dettagliato

## Checklist Migrazione

### Fase 1: Setup Infrastruttura
- [x] Inizializzare progetto Expo con Router (pnpm)
- [x] Configurare Firebase (progetto + SDK)
- [x] Setup NativeWind per styling
- [x] Configurare EAS Build
- [x] Installare best practices libs (FlashList, expo-image, Zustand, TanStack Query, Zod, react-hook-form)

### Fase 2: Core Features (prima di Auth)
- [x] Lista giocatori (FlatList + TanStack Query)
- [x] Player Card component
- [x] Ricerca giocatori
- [x] Dashboard lega
- [ ] Sistema aste real-time

### Fase 3: Autenticazione (dopo core)
- [ ] Implementare Firebase Auth
- [ ] Creare flusso login/signup
- [ ] Protezione route autenticate
- [ ] Gestione ruoli (admin/manager)

### Fase 3: Database e Modelli
- [ ] Definire schema Firestore (dati strutturati)
- [ ] Definire schema Realtime DB (aste live)
- [ ] Migrare logica servizi
- [ ] Script migrazione dati

### Fase 4: Core Aste
- [ ] Sistema aste real-time
- [ ] Offerte (manual/quick/auto-bid)
- [ ] Timer con sync
- [ ] Gestione budget e crediti

### Fase 5: UI Components
- [ ] Componenti base (Button, Input, Card)
- [ ] Interfaccia asta
- [ ] Dashboard manager
- [ ] Pannello admin

### Fase 6: Features Mobile
- [ ] Push notifications
- [ ] Haptic feedback
- [ ] Keep awake durante aste
- [ ] Offline support (opzionale)

### Fase 7: Deploy
- [ ] EAS Build configurazione
- [ ] EAS Update per OTA
- [ ] Testing su dispositivi
- [ ] **Ripristinare regole sicurezza Firestore** (`request.auth != null`)

---

## 📝 Tech Debt / Miglioramenti Futuri
- [ ] **Migrare FlatList → FlashList** (quando bug TypeScript v2.0 risolto)
- [ ] **Aggiungere foto giocatori** (URL da Next.js deployato su Vercel)

---

## 🛠️ Comandi Utili

```bash
# Dev server (usa --tunnel per testare su telefono Android/iOS)
pnpm exec expo start --tunnel

# TypeScript check
pnpm exec tsc --noEmit
```

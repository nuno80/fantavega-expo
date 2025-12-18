# Fantavega → Expo Migration Plan

Piano dettagliato per migrare Fantavega da Next.js 15 a Expo con Firebase.

---

## Obiettivo

Trasformare l'applicazione web Fantavega in un'app mobile nativa mantenendo tutte le funzionalità:
- Aste real-time con offerte manuali, quick-bid e auto-bid
- Gestione budget con crediti bloccati
- Sistema penalità lazy evaluation
- Notifiche push
- Pannello admin (mobile-only)

---

## Decisioni Confermate

| Decisione | Scelta |
|-----------|--------|
| **Firebase Plan** | Spark (free tier) |
| **Target Platforms** | Android + iOS |
| **Migrazione Utenti** | Fresh start (no Clerk) |
| **Admin Panel** | Mobile-only |
| **Offline Mode** | Non richiesto |

---

## Stack Tecnologico

| Componente | Da (Next.js) | A (Expo) |
|------------|--------------|----------|
| **Framework** | Next.js 15 + React 19 | Expo SDK 52 + React Native |
| **Navigazione** | App Router | Expo Router v4 |
| **Auth** | Clerk | Firebase Auth |
| **Database** | Turso (LibSQL) | Firebase Realtime DB + Firestore |
| **Real-time** | Socket.IO | Firebase Realtime DB listeners |
| **Styling** | Tailwind CSS | NativeWind v4 |
| **Notifiche** | - | Expo Notifications |
| **Build** | Vercel | EAS Build + EAS Update |

---

## Struttura Progetto Target

```
fantavega-expo/
├── app/                          # Expo Router (file-based)
│   ├── (auth)/                   # Route group autenticazione
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/                   # Tab navigation principale
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Home/Dashboard
│   │   ├── auctions.tsx          # Aste attive
│   │   └── players.tsx           # Ricerca giocatori
│   ├── auction/[id].tsx          # Dettaglio asta
│   ├── league/[id]/
│   │   ├── index.tsx
│   │   ├── managers.tsx
│   │   └── roster.tsx
│   ├── admin/                    # Pannello admin
│   │   ├── _layout.tsx
│   │   ├── leagues.tsx
│   │   └── players.tsx
│   ├── _layout.tsx               # Root layout
│   └── +not-found.tsx
├── components/
│   ├── ui/                       # Componenti base
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── auction/
│   │   ├── AuctionCard.tsx
│   │   ├── BiddingInterface.tsx
│   │   ├── Timer.tsx
│   │   └── ManagerColumn.tsx
│   └── players/
│       ├── PlayerCard.tsx
│       └── PlayerFilters.tsx
├── services/                     # Business logic (pura)
│   ├── auction.service.ts
│   ├── bid.service.ts
│   ├── budget.service.ts
│   ├── penalty.service.ts
│   └── player.service.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useAuction.ts
│   ├── useRealtimeAuction.ts
│   └── useBudget.ts
├── contexts/
│   ├── AuthContext.tsx
│   └── LeagueContext.tsx
├── lib/
│   ├── firebase.ts               # SDK config
│   ├── firestore.ts              # Firestore helpers
│   └── realtime.ts               # Realtime DB helpers
├── constants/
│   └── theme.ts
├── types/
│   └── index.ts
├── app.json
├── eas.json
├── tailwind.config.js
└── package.json
```

---

## Schema Firebase

### Firestore (Dati Strutturati)

```typescript
// Collection: users
interface User {
  id: string;                     // Firebase UID
  email: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: 'admin' | 'manager';
  status: 'pending_approval' | 'active' | 'suspended';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Collection: players
interface Player {
  id: number;
  role: 'P' | 'D' | 'C' | 'A';
  roleMantra: string | null;
  name: string;
  team: string;
  currentQuotation: number;
  initialQuotation: number;
  fvm: number | null;
  photoUrl: string | null;
  isStarter: boolean;
  isFavorite: boolean;
  integrityValue: number;
  hasFmv: boolean;
}

// Collection: leagues
interface AuctionLeague {
  id: string;
  name: string;
  leagueType: 'classic' | 'mantra';
  initialBudgetPerManager: number;
  status: 'participants_joining' | 'draft_active' | 'repair_active' | 'market_closed' | 'completed';
  activeAuctionRoles: string | null;
  slotsP: number;
  slotsD: number;
  slotsC: number;
  slotsA: number;
  minBid: number;
  timerDurationMinutes: number;
  adminCreatorId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Subcollection: leagues/{leagueId}/participants
interface LeagueParticipant {
  userId: string;
  currentBudget: number;
  lockedCredits: number;
  managerTeamName: string | null;
  playersP: number;
  playersD: number;
  playersC: number;
  playersA: number;
  joinedAt: Timestamp;
}

// Subcollection: leagues/{leagueId}/assignments
interface PlayerAssignment {
  playerId: number;
  userId: string;
  purchasePrice: number;
  assignedAt: Timestamp;
}
```

### Realtime Database (Aste Live)

```typescript
// Path: /auctions/{leagueId}/{auctionId}
interface LiveAuction {
  playerId: number;
  playerName: string;
  playerRole: string;
  playerTeam: string;
  playerPhotoUrl: string | null;
  startTime: number;
  scheduledEndTime: number;
  currentBid: number;
  currentBidderId: string | null;
  currentBidderName: string | null;
  status: 'active' | 'closing' | 'sold' | 'not_sold' | 'cancelled';
  userStates: { [userId: string]: 'active' | 'abandoned' };
}

// Path: /auctions/{leagueId}/{auctionId}/bids/{bidId}
interface LiveBid {
  userId: string;
  username: string;
  amount: number;
  bidTime: number;
  bidType: 'manual' | 'auto' | 'quick';
}

// Path: /autoBids/{leagueId}/{auctionId}/{odUserId}
interface AutoBid {
  maxAmount: number;
  isActive: boolean;
  createdAt: number;
}

// Path: /userPresence/{userId}
interface UserPresence {
  online: boolean;
  lastSeen: number;
  currentLeagueId: string | null;
}
```

---

## Fasi di Implementazione

### Fase 1: Setup Infrastruttura (2-3 giorni)

#### 1.1 Inizializzazione Progetto Expo

```bash
npx create-expo-app@latest fantavega-mobile --template tabs
cd fantavega-mobile
npx expo install expo-router
```

#### 1.2 Configurazione Firebase

```bash
npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/database
```

**File da creare:**
| File | Descrizione |
|------|-------------|
| `lib/firebase.ts` | Inizializzazione Firebase SDK |
| `lib/firestore.ts` | Helper Firestore (CRUD) |
| `lib/realtime.ts` | Helper Realtime DB (listeners) |
| `firebase.json` | Config progetto |

#### 1.3 Setup NativeWind

```bash
npx expo install nativewind tailwindcss
```

**File da creare:**
| File | Descrizione |
|------|-------------|
| `tailwind.config.js` | Config Tailwind |
| `global.css` | Stili globali |
| `babel.config.js` | Plugin NativeWind |

---

### Fase 2: Autenticazione (2-3 giorni)

#### 2.1 Firebase Auth Setup

**Mappatura Clerk → Firebase Auth:**

| Clerk | Firebase |
|-------|----------|
| `userId` | `user.uid` |
| `publicMetadata.role` | Custom Claims o Firestore |
| `clerkClient` | `firebase-admin` (backend) |

**File da creare:**
| File | Descrizione |
|------|-------------|
| `contexts/AuthContext.tsx` | Context Firebase Auth |
| `hooks/useAuth.ts` | Hook autenticazione |
| `app/(auth)/sign-in.tsx` | Schermata login |
| `app/(auth)/sign-up.tsx` | Schermata registrazione |
| `app/(auth)/_layout.tsx` | Layout auth stack |

#### 2.2 Protezione Route

**File da creare:**
| File | Descrizione |
|------|-------------|
| `components/AuthGuard.tsx` | Guard per route protette |
| `components/RoleGuard.tsx` | Guard per ruoli (admin/manager) |

---

### Fase 3: Database e Modelli (3-4 giorni)

#### 3.1 Migrazione Schema

**Mappatura tabelle SQLite → Firestore:**

| SQLite Table | Firestore Collection | Note |
|--------------|---------------------|------|
| `users` | `users` | 1:1 |
| `players` | `players` | 1:1 |
| `auction_leagues` | `leagues` | 1:1 |
| `league_participants` | `leagues/{id}/participants` | Subcollection |
| `player_assignments` | `leagues/{id}/assignments` | Subcollection |
| `budget_transactions` | `leagues/{id}/transactions` | Subcollection |
| `auctions` | Realtime DB | Live data |
| `bids` | Realtime DB | Live data |
| `auto_bids` | Realtime DB | Live data |

#### 3.2 Migrazione Servizi

**File da creare (da migrare da Next.js):**

| Next.js Service | Expo Service | Modifiche Principali |
|-----------------|--------------|---------------------|
| `bid.service.ts` | `services/bid.service.ts` | SQLite → Firestore/RTDB |
| `auction-league.service.ts` | `services/league.service.ts` | Clerk → Firebase Auth |
| `penalty.service.ts` | `services/penalty.service.ts` | Logic pura (invariata) |
| `player.service.ts` | `services/player.service.ts` | Minime modifiche |
| `budget.service.ts` | `services/budget.service.ts` | Transazioni Firestore |

> [!IMPORTANT]
> La logica di business dei servizi può essere in gran parte riutilizzata. Solo l'accesso al database cambia.

---

### Fase 4: Core Aste (5-7 giorni)

#### 4.1 Real-time Auction System

**Componenti chiave:**

| Componente | Responsabilità |
|------------|---------------|
| `hooks/useRealtimeAuction.ts` | Listener Realtime DB per stato asta |
| `hooks/useAuctionTimer.ts` | Timer sincronizzato con server |
| `services/bid.service.ts` | Logica offerte (manual/quick/auto) |

**Flusso offerta:**
```
1. User tappa "Offri"
2. bid.service.ts valida (budget, slot, etc.)
3. Scrittura atomica su Realtime DB
4. Listener aggiorna tutti i client
5. Auto-bid check (eBay logic)
6. Timer reset se necessario
```

#### 4.2 Mappatura Funzioni Core

| Next.js Function | Expo Equivalent |
|------------------|-----------------|
| `placeInitialBidAndCreateAuction()` | → Firebase transaction |
| `placeBidOnExistingAuction()` | → Firebase transaction |
| `simulateAutoBidBattle()` | → Logica pura (invariata) |
| `checkSlotsAndBudgetOrThrow()` | → Firestore query + validation |

---

### Fase 5: UI Components (5-7 giorni)

#### 5.1 Componenti Base

**Mappatura Shadcn → React Native:**

| Shadcn | React Native Equivalent |
|--------|------------------------|
| `Button` | `Pressable` + stili |
| `Input` | `TextInput` + stili |
| `Card` | `View` + shadow + stili |
| `Dialog` | React Native Modal |
| `Tabs` | `@react-navigation/material-top-tabs` |
| `Select` | `@gorhom/bottom-sheet` + `FlatList` |
| `ScrollArea` | `ScrollView` / `FlatList` |

#### 5.2 Componenti Auction (priorità)

| Componente | Descrizione |
|------------|-------------|
| `AuctionCard.tsx` | Card giocatore in asta |
| `BiddingInterface.tsx` | Bottoni offerta + input |
| `Timer.tsx` | Countdown sincronizzato |
| `ManagerColumn.tsx` | Colonna manager con rosa |
| `AutoBidModal.tsx` | Impostazione auto-bid |

---

### Fase 6: Features Mobile (2-3 giorni)

#### 6.1 Push Notifications

```bash
npx expo install expo-notifications expo-device
```

**Trigger notifiche:**
- Offerta superata
- Asta in scadenza (5 min)
- Giocatore assegnato
- Penalità applicata

#### 6.2 Haptic Feedback

```bash
npx expo install expo-haptics
```

**Trigger haptics:**
- Offerta piazzata con successo ✓
- Errore offerta ✗
- Timer warning

#### 6.3 Keep Awake

```bash
npx expo install expo-keep-awake
```

Attivo solo durante visualizzazione asta attiva.

---

### Fase 7: Deploy (1-2 giorni)

#### 7.1 EAS Build Config

```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

#### 7.2 Comandi Deploy

```bash
eas build --platform all          # Build cloud
eas update --auto                 # OTA update
```

---

## Piano di Verifica

### Test Manuali per Fase

#### Fase 1: Setup ✓
1. `npx expo start` → App si avvia senza errori
2. Hot reload funziona
3. NativeWind styles applicati correttamente

#### Fase 2: Auth ✓
1. Registrazione nuovo utente → Appare in Firebase Console
2. Login esistente → Redirect a dashboard
3. Logout → Redirect a login
4. Route protette inaccessibili senza login

#### Fase 3: Database ✓
1. Lista giocatori carica da Firestore
2. Lista leghe visibile per admin
3. Partecipanti lega corretti

#### Fase 4: Aste ✓
1. Creare asta → Appare in Realtime DB
2. Piazzare offerta → Update real-time su tutti i client
3. Auto-bid si attiva quando superato
4. Timer reset su nuova offerta
5. Asta chiude correttamente

#### Fase 5: UI ✓
1. Navigazione tabs fluida
2. Dark/Light mode
3. Responsive su vari device

#### Fase 6: Mobile Features ✓
1. Push notification ricevuta quando offerta superata
2. Vibrazione su offerta piazzata
3. Schermo resta acceso durante asta

---

## Rischi e Mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Costi Firebase | Media | Alto | Monitora usage, ottimizza query |
| Complessità auto-bid | Bassa | Media | Logica già testata, riuso codice |
| UX mobile diversa | Media | Media | Design review con utenti |
| Offline support | Media | Bassa | Firestore persistence built-in |

---

## Timeline Stimata

| Fase | Durata | Totale Cumulativo |
|------|--------|-------------------|
| 1. Setup | 2-3 giorni | 3 giorni |
| 2. Auth | 2-3 giorni | 6 giorni |
| 3. Database | 3-4 giorni | 10 giorni |
| 4. Core Aste | 5-7 giorni | 17 giorni |
| 5. UI | 5-7 giorni | 24 giorni |
| 6. Mobile Features | 2-3 giorni | 27 giorni |
| 7. Deploy | 1-2 giorni | **~30 giorni** |

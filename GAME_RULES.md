# Fantavega - Regole di Gioco

Questo documento sintetizza le regole di business dell'app Fantavega. È il riferimento principale per garantire coerenza durante la migrazione.

---

## 1. OBIETTIVO DEL GIOCO

Fantavega è un sistema di asta per fantacalcio. I manager competono per acquistare giocatori usando un budget limitato, con l'obiettivo di costruire una rosa completa. A differenza di altri giochi, Fantavega ha un sistema di aste multiple che permette ad ogni manager di puntare più giocatori contemporaneamente. L'asseganzione dei calciatori non è immediata ma avviene quando il timer scade.

---

## 2. STRUTTURA LEGA

| Parametro | Default | Configurabile |
|-----------|---------|---------------|
| Budget iniziale per manager | 500 crediti | ✅ Sì |
| Slot Portieri (P) | 3 | ✅ Sì |
| Slot Difensori (D) | 8 | ✅ Sì |
| Slot Centrocampisti (C) | 8 | ✅ Sì |
| Slot Attaccanti (A) | 6 | ✅ Sì |
| Timer offerta | N minuti | ✅ Sì |

---

## 3. SISTEMA ASTE

### 3.1 Flusso Base
1. Admin/Manager "chiama" un giocatore → si crea un'asta
2. I manager fanno offerte (manuali, quick-bid, auto-bid)
3. Ogni offerta resetta il timer
4. Quando il timer scade, il miglior offerente vince

### 3.2 Tipi di Offerta

| Tipo | Descrizione |
|------|-------------|
| **Manuale** | Offerta singola con importo specifico |
| **Quick-Bid** | +1 credito sull'offerta corrente |
| **Auto-Bid** | Importo massimo (logica eBay) |

### 3.3 Logica Auto-Bid (eBay)

> **Regola fondamentale:** L'auto-bid più alto vince, ma paga solo 1 credito più del secondo migliore.

**Esempio:**
- User A: auto-bid 50
- User B: auto-bid 45
- User C: offerta manuale 30

**Risultato:** User A vince con 46 crediti (45 + 1).

**Priorità in caso di parità:** Vince chi ha impostato l'auto-bid prima.

---

## 4. GESTIONE CREDITI

### 4.1 Tipi di Crediti

| Tipo | Descrizione |
|------|-------------|
| `current_budget` | Crediti reali spendibili |
| `locked_credits` | Crediti bloccati per auto-bid attivi |
| **Disponibili** | `current_budget - locked_credits` |

### 4.2 Principio Fondamentale

> **L'auto-bid è una promessa di spesa.** Se imposti un auto-bid di 100, il sistema blocca immediatamente 100 crediti.

`locked_credits` = SOMMA di tutti i `max_amount` degli auto-bid attivi.

### 4.3 Eventi che Modificano i Crediti

| Evento | Effetto su `locked_credits` | Effetto su `current_budget` |
|--------|-----------------------------|-----------------------------|
| Imposta auto-bid | +max_amount | Nessuno |
| Modifica auto-bid | ±differenza | Nessuno |
| Superato in asta | -max_amount (sbloccato) | Nessuno |
| Vince asta | -max_amount (sbloccato) | -prezzo_finale |
| Penalità applicata | Nessuno | -5 crediti |

---

## 5. SISTEMA PENALITÀ

### 5.1 Requisito di Compliance

Un manager è **compliant** se ha almeno **N-1 giocatori per ruolo** (dove N = slot configurati).

**Esempio:** Se `slotsP = 3`, il manager deve avere almeno 2 portieri.

### 5.2 Trigger di Verifica (Lazy Evaluation)

La compliance viene verificata quando:
1. ⚡ Login dell'utente
2. ⚡ Accesso alla pagina asta
3. ⚡ Viene superato in un'offerta
4. ⚡ Perde un'asta

### 5.3 Timer e Penalità

| Fase | Tempo | Azione |
|------|-------|--------|
| Grazia | 1 ora | Nessuna penalità |
| 1ª penalità | +1 ora | -5 crediti |
| 2ª penalità | +1 ora | -5 crediti |
| ... | ... | ... |
| 5ª penalità (max) | +1 ora | -5 crediti (totale: 25) |

### 5.4 Reset del Ciclo

Quando il manager torna compliant, il contatore penalità si azzera.

---

## 6. STATI DELLA LEGA

| Stato | Descrizione |
|-------|-------------|
| `participants_joining` | I manager possono unirsi |
| `draft_active` | Asta principale in corso |
| `repair_active` | Asta di riparazione |
| `market_closed` | Mercato chiuso |
| `completed` | Stagione terminata |

---

## 7. RUOLI UTENTE

| Ruolo | Permessi |
|-------|----------|
| `admin` | Gestisce lega, chiama giocatori, modifica budget |
| `manager` | Partecipa alle aste, gestisce propria rosa |

---

## 8. REAL-TIME

Tutti gli eventi dell'asta sono trasmessi in tempo reale:
- Nuova offerta → aggiornamento UI per tutti i manager
- Timer scaduto → assegnazione automatica
- Penalità applicata → notifica al manager interessato

---

## Riferimenti Dettagliati

Per approfondimenti tecnici, consulta:
- `fantavega/guide/progetto-attuale/gestione-crediti.md`
- `fantavega/guide/progetto-attuale/auto-bid.md`
- `fantavega/guide/progetto-attuale/timer.md`

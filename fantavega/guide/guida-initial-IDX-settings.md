# Guida Setup Nuovo Progetto in Ambiente Linux

## 1. Crea un progetto IDX python
Paython è la base di partenza ideale per ogni progetto.

a.Cancella i seguenti file:
- .gitignore;
- main.py;
- cartella 'src';
- al file devserver.sh, cancella SOLO la linea 'python -m flask --app main run -p $PORT --debug'. Puoi anche aggiungere più comandi complessi, per esempio:
```bash
#!/bin/sh
source .venv/bin/activate
cd drive-tutorial
npm run dev    # avvia il server di sviluppo Next.js
```
b. Modifica il file requirements.txt con quello che sereve (es. cnx flask).

## 2. sostituisci il file dev.nix con il seguente codice

```JSON

# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [ pkgs.python3 pkgs.pnpm pkgs.sudo pkgs.bun];
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [ "ms-python.python" ];
    workspace = {
      # Runs when a workspace is first created with this `dev.nix` file
      onCreate = {
        install =
          "python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt";
        # Open editors for the following files by default, if they exist:
        default.openFiles = [ "README.md" ];
      }; # To run something each time the workspace is (re)started, use the `onStart` hook
    };
    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        web = {
          command = [ "./devserver.sh" ];
          env = { PORT = "$PORT"; };
          manager = "web";
        };
      };
    };
  };
}

```

## 3. Creazione App Next.js con T3 Stack
Creiamo una nuova applicazione utilizzando il template T3:
```bash
pnpm create t3-app@latest
```
Durante il processo di setup, dovrai:
- Inserire il nome del progetto
- Selezionare i pacchetti da includere
- Scegliere il tipo di stile (Tailwind/CSS)

È appropriato avere due file .env distinti poiché servono due scopi diversi:
L'API KEY di Aider va nella directory principale dove hai installato Aider (es. /drivetutorial/.env)

Le variabili d'ambiente di Next.js vanno nella directory del progetto Next.js (es. /drivetutorial/drive-tutorial/.env)

È una pratica accettabile avere file .env separati quando:
Servono a progetti/tool diversi
Sono in directory diverse
Hanno scopi diversi

Ricorda di aggiungere entrambi i file .env ai rispettivi .gitignore per evitare di committare informazioni sensibili.

Per avviare il server:
```bash
pnpm run dev
```

## 4. Creazione Repository GitHub
1. Accedi al tuo account GitHub
2. Clicca su "New repository"
3. Inserisci lo stesso nome utilizzato per l'app T3
4. NON aggiungere README, .gitignore o license (verranno creati dal template)
5. Clicca "Create repository"

## 5. Connessione del Progetto a GitHub

Prima, vai nella directory dell'app Next.js.

```bash
cd nome-app
```
Verifica che sei nella directory corretta (dovrebbe mostrare il percorso che termina con /drive-tutorial):

```bash
pwd
```
Se c'è già una cartella .git, rimuovila per sicurezza:

```bash
rm -rf .git
```
# file di configurazione per GitHub Actions 'ci.yaml'. 
Crea una cartella ".github/workflow" all'interno della cartella principale del progetto (ex. drive-tutorial) e crea al suo interno un file 'ci.yaml'.
Questo workflow serve a:
Verificare automaticamente la qualità del codice ad ogni push
Assicurare che il codice compili correttamente
Controllare errori di sintassi e stile
Garantire che tutti i file di configurazione necessari siano presenti:

```bash

name: CI

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Install Dependencies
        run: npm install -g pnpm && pnpm install

      - name: Copy .env.example files
        shell: bash
        run: find . -type f -name ".env.example" -exec sh -c 'cp "$1" "${1%.*}"' _ {} \;

      - name: Typecheck
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

```

Inizializza il nuovo repository e aggiungi i file:
```bash

git init
git add .
git commit -m "Initial commit"

#Collega il repository remoto e fai il push:

git remote add origin https://github.com/nuno80/drive-tutorial.git
git branch -M main
git push -u origin main

```
Ora la tua app Next.js sarà nel repository GitHub come progetto standalone.
Quando esegui i comandi git dalla cartella nome-appl, solo i file all'interno di quella cartella verranno tracciati e pushati su GitHub.
In pratica:

✅ Tutto ciò che è dentro /nom-app → andrà su GitHub
❌ Tutto ciò che è fuori da /nom-app → NON andrà su GitHub

Questo perché il repository Git è inizializzato dentro la cartella nom-app e git traccerà solo i file a partire da quella directory in giù.
Se in futuro vorrai includere anche gli altri file, dovrai:

O spostarli dentro drive-tutorial
O creare un repository Git separato nella directory principale

## 6. Installazione Aider
# Installa Aider nella cartella dell'App utilizzando pip:
```bash
python -m pip install aider-install 
aider-install
python -m pip install -U aider-chat
aider --list-models gemini/
```
riavvia il terminal a fine istallazione.

# crea un file .env (solo per aider)
GEMINI_API_KEY=xxxxxxxxx

# Configura Aider
Crea un file `.aider.conf.yml` nella root del progetto:
```yaml

##########
# options:

## show this help message and exit
#help: xxx

#############
Main model: gemini/gemini-2.0-flash-exp

## Specify the model to use for the main chat
model: gemini/gemini-2.0-flash-exp

```
# Avvia aider dopo aver settato git (altrimenti imposta dei git init indesiderati)


## Note Importanti
- Assicurati di avere Python e pip installati nel sistema
- Verifica che git sia configurato correttamente con le tue credenziali
- Ricorda di aggiungere il file `.env` al `.gitignore`
- Non committare mai le chiavi API o altri dati sensibili

## Verifica Installazione
Per verificare che tutto sia installato correttamente:
```bash
pnpm --version
aider --version
git --version
```

# Git: guida ai Comandi Principali

## Visualizzare i Commit
```bash
git log                    # Mostra la storia dei commit dettagliata
git log --oneline         # Mostra una versione compatta dei commit
git show [commit-hash]    # Mostra i dettagli di un commit specifico
```

## Quando Fare un Commit
È buona pratica fare un commit quando:
- Hai completato una feature
- Hai fatto una modifica significativa
- Hai risolto un bug
- Hai raggiunto un punto stabile del codice

## Come Fare un Nuovo Commit
```bash
git add .                               # Aggiunge tutte le modifiche
git add nomefile                        # Aggiunge un file specifico
git commit -m "descrizione del commit"  # Crea il commit
git push                               # Invia i commit al repository remoto
```

## Tornare a un Commit Precedente
```bash
# Per vedere i file senza modificare il branch
git checkout [commit-hash]

# Per tornare indietro e creare un nuovo branch
git checkout -b nuovo-branch [commit-hash]

# Per riportare tutto il branch a un commit precedente (ATTENZIONE: operazione distruttiva)
git reset --hard [commit-hash]
```

## Best Practices per i Commit
1. Fai commit piccoli e frequenti
2. Usa messaggi descrittivi (es: "Aggiunta validazione form login")
3. Ogni commit dovrebbe rappresentare una modifica logica completa
4. Prima di ogni commit, verifica le modifiche con `git status`

## Branch in Git
Un branch è una linea di sviluppo indipendente che si dirama dal codice principale.

### Comandi Principali per i Branch
```bash
# Vedere tutti i branch
git branch

# Creare un nuovo branch
git branch nome-branch

# Passare a un branch
git checkout nome-branch
# oppure (versione più moderna)
git switch nome-branch

# Creare e passare a un nuovo branch in un comando
git checkout -b nome-branch

# Unire un branch al branch principale
git checkout main
git merge nome-branch

# Eliminare un branch
git branch -d nome-branch
```

### Esempio di Struttura Branch per Next.js
```bash
main
├── develop
│   ├── feature/auth
│   │   ├── feature/login
│   │   ├── feature/signup
│   │   └── feature/password-reset
│   ├── feature/dashboard
│   │   ├── feature/user-stats
│   │   └── feature/data-visualization
│   └── feature/api-integration
├── bugfix/performance
└── release/v1.0.0
```

### Spiegazione dei Branch
1. `main`
   - Branch principale di produzione
   - Contiene solo codice stabile e testato

2. `develop`
   - Branch di sviluppo principale
   - Qui confluiscono tutte le nuove feature

3. `feature/*`
   - Branch per nuove funzionalità
   - Esempi:
     - `feature/auth` per il sistema di autenticazione
     - `feature/dashboard` per il pannello di controllo
     - `feature/api-integration` per integrazioni API

4. `bugfix/*`
   - Branch per correzioni di bug
   - Es: `bugfix/performance` per problemi di performance

5. `release/*`
   - Branch per preparare nuove release
   - Es: `release/v1.0.0` per la versione 1.0.0

### Workflow Tipico
1. Crea branch da `develop`: `git checkout -b feature/login develop`
2. Sviluppa la feature
3. Merge in `develop`: `git checkout develop && git merge feature/login`
4. Test in `develop`
5. Merge in `main` per il rilascio

### Best Practices per i Branch
- Usa nomi descrittivi (es: "feature/login", "bugfix/header")
- Mantieni i branch aggiornati con il main
- Elimina i branch dopo averli uniti al main
- Testa sempre prima di fare il merge
- Un branch = una funzionalità/fix
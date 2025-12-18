# Guida ai principali passaggi per creare una nuova App nextjs

## Creazione UI 
## 1. Per la creazione dell'UI v0 è ottimo
Esempio di prompt V0:
    Make a XXX. Use mock data. Folder should be open-able and files should be direct links to the file. Make sure to include:
    - a mock "update" button;
    - dark mode by default;
    - if existing, folder view should be a "list";
    - do not make a side bar;
    - include well visible bredcrumbs on top for navigation.

## 2. Copia il codice creato
Per copiare il Codice fai clic sul piccolo pulsante download e copia il codice base, si ottiene un comando Shaden da incollare in linux.
Chiederà se voglio che queste modifiche vengano sovrascritte e le impostazioni da usare (newyork; neutral; yes) useremo un colore neutro e useremo le variabili CSS.

## NOTA: 
Spesso V0 crea una cartella APP fuori dalla cartella SCR. Nel caso cancellala! 

## 3. pnpm run dev 
Per far partire il server locale e vedere se il tutto funziona.
Usa aider per correggere gli errori.

## 4. crea una lista di funzionalità da implementare

- [ ] set up data base and data model;
- [ ] smove folder open state to URL;
- [ ] add Auth;
- [ ] set up data base;
- [ ] add file uploading;

## 5. set up data base and data model
Questo passaggio dipende dal DB che si intende usare.
Questo tutorial usa singlestore pertanto vai a: 

https://portal.singlestore.com/

https://www.youtube.com/watch?v=c-hKSbzooAg&list=PLxpw8uIkhTMYYLeqXPVe0esHlYXMN8dpc&index=1 



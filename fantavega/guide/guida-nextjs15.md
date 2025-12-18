# Next.js 15: Guida Completa (App Router)

Questa guida fornisce una panoramica completa e pratica di Next.js 15, con particolare attenzione all'App Router, ai Server Components, alle Server Actions e all'integrazione di Clerk per l'autenticazione. È progettata per essere utilizzata come riferimento e come input per un LLM.

## Creazione di un Progetto Next.js 15

Utilizza `create-next-app` per inizializzare un nuovo progetto:

```bash
bun create next-app
```

**Opzioni Consigliate (per la guida):**

*   TypeScript: **Yes**
*   ESLint: **Yes**
*   Tailwind CSS: **Yes**
*   `src/` directory: **Yes**
*   App Router: **Yes**
*   Import alias: (Scegli l'alias di default o personalizzalo)

```bash
cd my-nextjs-app
bun run dev
```

Questo avvia il server di sviluppo (di solito su `http://localhost:3000`).

## Struttura del Progetto (App Router)

```
my-nextjs-app/
├── .next/            # Generato da Next.js (non modificare)
├── node_modules/     # Dipendenze del progetto
├── public/           # File statici (immagini, ecc.)
├── src/
│   └── app/          # App Router (qui risiede la maggior parte del codice)
│       ├── page.tsx  # Componente principale della route "/"
│       ├── layout.tsx # Layout radice (obbligatorio)
│       ├── globals.css # Fogli di stile globali.
│       └── (altre cartelle e file per le route)
├── components/       # Componenti React riutilizzabili
├── .env.local        # Variabili d'ambiente (NON committare)
├── package.json      # Dipendenze e script
├── tsconfig.json     # Configurazione di TypeScript
└── (altri file di configurazione)
```

## React Server Components (RSC) e Client Components

Next.js 15 utilizza l'architettura dei **React Server Components (RSC)**.  I componenti sono suddivisi in:

*   **Server Components:**
    *   Eseguiti *esclusivamente* sul server.
    *   *Default* nell'App Router (non è necessario alcun marcatore speciale).
    *   Ideali per:
        *   Data fetching (accesso a database, API, ecc.).
        *   Logica di business lato server.
        *   Accesso a risorse backend (file system, ecc.).
        *   Mantenere dati sensibili (API keys) sul server.
    *   *Non* possono usare:
        *   State (`useState`, `useReducer`).
        *   Effetti (`useEffect`, `useLayoutEffect`).
        *   Event handlers (`onClick`, ecc.).
        *   API del browser (`window`, `localStorage`, ecc.).
    *   Migliorano le performance:
        *   Riducono il JavaScript inviato al client.
        *   Migliorano la SEO.

*   **Client Components:**
    *   Eseguiti nel browser (ma possono essere pre-renderizzati sul server).
    *   Richiedono la direttiva `"use client";` all'inizio del file.
    *   Usati per:
        *   Interattività (gestione eventi, state, effetti).
        *   Accesso alle API del browser.
    *   Dovrebbero essere usati *solo quando necessario*.  L'ideale è che siano componenti "foglia" (terminali) nell'albero dei componenti.

**Esempio (Server Component - `components/Greet.tsx`):**

```tsx
// components/Greet.tsx  (Server Component - Nessun "use client")

function Greet() {
  // Questo codice viene eseguito SOLO sul server
  console.log("Greet component (server)");
  return <div>Hello from the Server!</div>;
}

export default Greet;
```

**Esempio (Client Component - `components/Counter.tsx`):**

```tsx
// components/Counter.tsx (Client Component)

"use client"; // Direttiva OBBLIGATORIA

import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  // Questo codice viene eseguito nel browser
  console.log("Counter component (client)");

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

export default Counter;
```

**Regola Generale:** Inizia con Server Components e usa Client Components solo quando hai bisogno di interattività o di accedere alle API del browser.

## Routing (App Router)

L'App Router di Next.js utilizza una struttura di cartelle per definire le route:

*   **`app/`:** La cartella radice dell'App Router.
*   **`page.tsx` (o `page.js`):** Definisce il componente React per una specifica route.
*   **Cartelle:** Ogni cartella all'interno di `app` rappresenta un segmento dell'URL.

**Esempi:**

| Route          | File                                     |
| -------------- | ---------------------------------------- |
| `/`            | `app/page.tsx`                           |
| `/about`       | `app/about/page.tsx`                     |
| `/blog/post-1` | `app/blog/post-1/page.tsx`              |

**Route Dinamiche:**

Usa le parentesi quadre `[]` per creare segmenti dinamici:

*   `/products/[id]` -> `app/products/[id]/page.tsx`

```tsx
// app/products/[id]/page.tsx (Server Component)

async function ProductDetails({ params }: { params: { id: string } }) {
  const productId = params.id; // Ottiene l'ID dalla route
  // ... fetch data for product with productId ...
  return <div>Product ID: {productId}</div>;
}

export default ProductDetails;

```

**Route Groups:**

Raggruppano logicamente le route senza influenzare l'URL.  Usa le parentesi tonde `()`:

*   `/login` -> `app/(auth)/login/page.tsx`
*   `/register` -> `app/(auth)/register/page.tsx`

## Layouts

I Layouts definiscono l'UI condivisa tra più pagine (header, footer, ecc.).

*   **`app/layout.tsx` (Layout Radice):** Obbligatorio.  Si applica a *tutte* le route. Definisce la struttura di base della pagina (`<html>`, `<body>`).

```tsx
// app/layout.tsx

import Navigation from './components/Navigation';
import Footer from './components/Footer';
import { ClerkProvider } from '@clerk/nextjs'; // Importa ClerkProvider (se usi Clerk)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
        <html lang="en">
          <body>
            <Navigation />
            <main>{children}</main>
            <Footer />
          </body>
        </html>
    </ClerkProvider>

  );
}
```

*   **Layout Annidati:** Crea layout specifici per sezioni dell'applicazione (es. `app/products/layout.tsx`).

```tsx
// app/products/layout.tsx
import Sidebar from './components/Sidebar';

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="products-layout">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

## Navigazione (next/link)

Usa il componente `<Link>` di `next/link` per la navigazione *client-side* (senza ricaricare la pagina):

```tsx
// components/Navigation.tsx (Client Component)

"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Per evidenziare il link attivo

function Navigation() {
  const pathname = usePathname();

  const linkClass = (href: string) => {
    return pathname === href ? "active-link" : "normal-link";
  };

  return (
    <nav>
      <Link href="/" className={linkClass("/")}>Home</Link>
      <Link href="/about" className={linkClass("/about")}>About</Link>
      {/* ... altri link ... */}
    </nav>
  );
}
export default Navigation
```

*   **`usePathname`:** Hook di `next/navigation` per ottenere il percorso corrente (utile per evidenziare il link attivo).
*   **`"use client";`:** Obbligatorio perché `Navigation` usa un hook (`usePathname`) e gestisce la navigazione.
* **Prefetching automatico:** Next.js precarica automaticamente le pagine collegate tramite `<Link>` quando appaiono nel viewport, rendendo la navigazione istantanea.

## Route Handlers (API Endpoints)

I Route Handlers permettono di creare endpoint API *all'interno* dell'App Router.

*   **File `route.ts` (o `route.js`):**  All'interno di una cartella, definisce le funzioni che gestiscono le richieste HTTP (GET, POST, PUT, DELETE, ecc.).  Il nome del file *deve* essere `route.ts` (case-sensitive).

**Esempio: `app/api/users/route.ts`**

```ts
// app/api/users/route.ts (Route Handler)
import { NextResponse } from 'next/server';
import { z } from 'zod'; // Importa Zod (consigliato per la validazione)

// Dati di esempio (in un'applicazione reale, useresti un database)
const users = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Doe" },
];

// Schema Zod per la validazione dei dati in POST
const createUserSchema = z.object({
  name: z.string().min(3),
});

// GET /api/users - Restituisce tutti gli utenti
export async function GET() {
  return NextResponse.json(users);
}

// POST /api/users - Crea un nuovo utente
export async function POST(request: Request) {
  try {
    const rawData = await request.json();
    const validatedData = createUserSchema.parse(rawData); // Validazione con Zod

    const newUser = {
      id: users.length + 1,
      name: validatedData.name,
    };
    users.push(newUser);

    return NextResponse.json(newUser, { status: 201 }); // 201 Created

  } catch (error) {
      if (error instanceof z.ZodError) {
          return NextResponse.json({ message: "Validation Error", errors: error.errors }, { status: 400 })
      }
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
```

**Esempio: `app/api/users/[id]/route.ts` (Route Dinamica)**

```ts
// app/api/users/[id]/route.ts

import { NextResponse } from 'next/server';

// ... (stessi dati di esempio di sopra) ...

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const userId = parseInt(params.id);
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 }); // 404 Not Found
  }

  return NextResponse.json(user);
}
```

*   **`NextResponse`:** Helper di Next.js per creare risposte API (JSON, redirect, ecc.).
*   **`Request`:** Oggetto standard che rappresenta la richiesta HTTP.
*   **Validazione (Zod):** *Fondamentale*. Usa una libreria come Zod per validare i dati in ingresso.
*   **Gestione Errori (`try...catch`):**  Gestisci *sempre* gli errori e restituisci codici di stato HTTP appropriati (400 Bad Request, 404 Not Found, 500 Internal Server Error, ecc.).

## Data Fetching

Next.js 15 offre diverse strategie per il data fetching:

### 1. Server Components (Consigliato)

*   Data fetching *direttamente* all'interno del componente, usando `async/await`.
*   Il codice viene eseguito *solo* sul server.
*   Ideale per la maggior parte dei casi d'uso.

```tsx
// app/products/page.tsx (Server Component)

async function getProducts() {
  const res = await fetch('https://api.example.com/products'); // Fetch API estesa da Next.js
  if (!res.ok) {
    throw new Error('Failed to fetch products'); // Gestione errori
  }
  return res.json();
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <ul>
      {products.map((product: any) => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  );
}
```
*   **Caching Automatico (fetch):**  Next.js estende la `fetch` API per fornire il caching automatico delle richieste. Le richieste GET vengono memorizzate in cache per impostazione predefinita.  Puoi controllare il comportamento del caching con le opzioni `cache` e `next.revalidate`/`next.tags`.

    ```ts
      // Esempi di caching con fetch

      // Cache per sempre (default per GET)
      const res1 = await fetch('https://...');

      // Nessun caching
      const res2 = await fetch('https://...', { cache: 'no-store' });

      // Revalidate ogni 60 secondi
      const res3 = await fetch('https://...', { next: { revalidate: 60 } });

      // Revalidate on demand (usando tags)
      const res4 = await fetch('https://...', { next: { tags: ['products'] } });

      // Per invalidare la cache con revalidateTag:
      // import { revalidateTag } from 'next/cache';
      // revalidateTag('products'); // Invalida tutte le richieste con tag 'products'

      //Per invalidare la cache con revalidatePath:
      // import { revalidatePath } from 'next/cache';
      // revalidatePath('/products')
    ```

### 2. Client Components

*   Usa `useEffect` e `useState` (come in una normale applicazione React).
*   Il data fetching avviene nel browser.
*   Usalo *solo* quando necessario (interattività, API del browser).

```tsx
// app/client-data/page.tsx (Client Component)

"use client";

import { useState, useEffect } from 'react';

function ClientDataPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('https://api.example.com/data');
          if (!res.ok) {
              throw new Error('Failed to fetch');
          }
        const jsonData = await res.json();
        setData(jsonData);
      } catch (err:any) {
          setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
      return <div>Error: {error}</div>
  }

  return <div>{/* ... render data ... */}</div>;
}

export default ClientDataPage;

```

### Gestione di Loading e Errori (Server Components)

Usa i file speciali `loading.tsx` e `error.tsx` per gestire automaticamente gli stati di caricamento ed errore nei Server Components:

```tsx
// app/products/loading.tsx (Client Component)

"use client";

export default function Loading() {
  return <div>Loading products...</div>;
}
```

```tsx
// app/products/error.tsx (Client Component)

"use client";

import { useEffect } from 'react';

type ErrorProps = {
    error: Error;
    reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Server Actions

Le Server Actions permettono di eseguire codice *esclusivamente* sul server, in risposta a interazioni dell'utente (es. sottomissione di form).

*   **`"use server";`:** Direttiva *obbligatoria* all'inizio di una funzione (o di un file) per trasformarla in una Server Action.
*   **Chiamata Diretta da Client Components:**  Puoi chiamare le Server Actions *direttamente* dai Client Components (senza creare Route Handlers API).
*   **Gestione Form:** Ideali per la gestione dei form (validazione, sottomissione, ecc.).
* **Progressive Enhancement**: Funzionano anche se Javascript è disabilitato.

**Esempio: `app/add-product/page.tsx`**

```tsx
// app/add-product/page.tsx
import { revalidatePath } from 'next/cache';
import { z } from 'zod';


// Server Action
async function addProduct(formData: FormData) {
  "use server";

  const schema = z.object({
    name: z.string().min(3),
    price: z.coerce.number().positive(), // Coerce to number and check if positive
  });

    const rawData = Object.fromEntries(formData);
    
  try {
       const validatedData = schema.parse(rawData);

      // ... invia i dati al database o a un'API ...
       const response = await fetch('YOUR_API_ENDPOINT', {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
           },
           body: JSON.stringify(validatedData),
       });

        if (!response.ok) {
            throw new Error('Failed to add product');
        }

    revalidatePath('/products'); // Invalida la cache dopo l'aggiunta

  } catch (error) {
      if (error instanceof z.ZodError) {
          throw new Error(`Validation Error: ${error.errors.map(e => e.message).join(', ')}`);
      }
    throw error; // Rilancia altri errori
  }
}


export default function AddProductPage() {
  return (
    <form action={addProduct}> {/* Collega il form alla Server Action */}
      <input type="text" name="name" placeholder="Product Name" required />
      <input type="number" name="price" placeholder="Price" required />
      <button type="submit">Add Product</button>
    </form>
  );
}
```

*   **`action={addProduct}`:**  L'attributo `action` del form è impostato *direttamente* sulla Server Action.
* **Validazione (Zod):**  Usa Zod (o una libreria simile) per validare i dati del form *prima* di inviarli al server.
* **`revalidatePath`:** Invalida la cache per la route `/products` dopo aver aggiunto un prodotto.

## Autenticazione (con Clerk)

Clerk è un servizio di autenticazione e gestione utenti che semplifica l'integrazione dell'autenticazione in Next.js.

**Passaggi:**

1.  **Account Clerk:** Crea un account su [clerk.com](https://clerk.com/).
2.  **Nuova Applicazione:** Crea una nuova applicazione Clerk.
3.  **Installazione:**

    ```bash
    npm install @clerk/nextjs
    ```

4.  **`.env.local`:**

    ```
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
    CLERK_SECRET_KEY=sk_test_...
    ```

5.  **`middleware.ts`:**

    ```ts
    // src/middleware.ts
    import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

    const protectedRoutes = ["/dashboard", "/profile"]; // Esempio
    const isProtectedRoute = createRouteMatcher(protectedRoutes);

    export default clerkMiddleware((auth, req) => {
      if (isProtectedRoute(req)) {
        auth.protect(); // Redirige a /sign-in se non autenticato
      }
    });

    export const config = {
      matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
    };
    ```

6.  **`ClerkProvider` (`app/layout.tsx`):**

    ```tsx
    // app/layout.tsx
    import { ClerkProvider } from '@clerk/nextjs';

    export default function RootLayout({ children }: { children: React.ReactNode }) {
      return (
        <ClerkProvider>
          <html lang="en">
            <body>{children}</body>
          </html>
        </ClerkProvider>
      );
    }
    ```

7.  **Componenti Clerk (UI):**

    ```tsx
    // components/AuthButtons.tsx (Client Component)
    "use client";

    import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs';

    export default function AuthButtons() {
      return (
        <>
          <SignedOut>
            <SignInButton mode="modal" />
            <SignUpButton mode="modal" />
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </>
      );
    }

    ```

8.  **Accesso ai Dati Utente:**

    *   **Server Components/Route Handlers:** `auth()` e `currentUser()` (da `@clerk/nextjs/server`).

        ```ts
        // app/my-page/page.tsx (Server Component)
        import { auth, currentUser } from '@clerk/nextjs/server';

        export default async function MyPage() {
          const { userId } = await auth();
          const user = await currentUser();

          if (!userId) {
            return <div>Not authenticated</div>;
          }

          return <div>User ID: {userId}, Name: {user?.firstName}</div>;
        }

        ```

    *   **Client Components:** `useUser()` e `useAuth()` (da `@clerk/nextjs`).

        ```tsx
        // components/UserProfile.tsx (Client Component)

        "use client";

        import { useUser, useAuth } from "@clerk/nextjs";

        export default function UserProfile() {
          const { isLoaded, isSignedIn, user } = useUser();
        	const { isLoaded:isAuthLoaded, userId } = useAuth();


        	if (!isAuthLoaded || !userId ) {
        		return null;
        	}

          if (!isSignedIn) {
            return <div>Not signed in</div>;
          }

          return (
            <div>
              <p>User ID: {userId}</p>
              <p>Name: {user.firstName} {user.lastName}</p>
              {/* ... altre informazioni sull'utente ... */}
            </div>
          );
        }

        ```
**Clerk semplifica notevolmente l'implementazione di autenticazione, registrazione, gestione utenti e protezione delle route.**


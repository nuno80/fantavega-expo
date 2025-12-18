# Dockerfile (per Node 20, assumendo lockfile per Node 20)
FROM node:20-slim AS builder
WORKDIR /app
RUN corepack enable
RUN corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./ 
RUN pnpm install --frozen-lockfile # Usa frozen-lockfile
COPY . .
RUN pnpm run build


# ---- Fase 2: Runtime per Sviluppo ----
# Questa fase prende gli artefatti dalla fase builder e configura l'ambiente di runtime.
FROM node:20-slim

WORKDIR /app

# Imposta l'ambiente a 'development' per il server di sviluppo Next.js
ENV NODE_ENV development
ENV CI=true 

RUN corepack enable
RUN corepack prepare pnpm@latest --activate

# Copia package.json e il lockfile generato/usato dal builder
COPY package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./ 

# Copia le node_modules complete e correttamente compilate dalla fase builder
COPY --from=builder /app/node_modules ./node_modules

# Copia l'applicazione buildata (.next) e i sorgenti (src, public, config)
# necessari per 'pnpm run dev' e hot-reloading.
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src 
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs
COPY --from=builder /app/tailwind.config.ts ./tailwind.config.ts
# Aggiungi altri file di configurazione root se necessario

# Non serve libc6-compat con immagini basate su Debian/glibc

# Espone la porta
EXPOSE 3000

# Comando per avviare l'applicazione in modalità sviluppo
CMD ["pnpm", "run", "dev"]
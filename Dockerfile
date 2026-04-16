# ── Stage 1: deps ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN echo "node-linker=hoisted" >> .npmrc && \
    pnpm install --frozen-lockfile

# ── Stage 2: builder ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

RUN npm install -g pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy

RUN pnpm next build

# Copy generated Prisma client into standalone output
RUN cp -r node_modules/.prisma .next/standalone/node_modules/ && \
    cp -r node_modules/@prisma .next/standalone/node_modules/

# ── Stage 3: migrator (has full node_modules for prisma db push) ───────────────
FROM node:22-alpine AS migrator
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma/

CMD ["node", "node_modules/prisma/build/index.js", "db", "push", \
     "--schema=./prisma/schema.prisma", "--skip-generate"]

# ── Stage 4: runner ────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

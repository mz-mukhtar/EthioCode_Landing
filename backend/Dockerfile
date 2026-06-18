# ── Stage 1: deps ──────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# ── Stage 2: production image ──────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nodeuser

# Copy only production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Own files by non-root user
RUN chown -R nodeuser:nodejs /app

USER nodeuser

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "index.js"]

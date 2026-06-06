FROM oven/bun:1 AS builder

WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# ---- runtime ----
FROM oven/bun:1-slim

# 7-Zip for zip/rar extraction with passwords
RUN apt-get update && apt-get install -y --no-install-recommends p7zip-full && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# /app/data -> host mount for settings.json
# /tmp/jellybridge -> ephemeral temp download space
RUN mkdir -p /app/data /tmp/jellybridge

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321

CMD ["bun", "./dist/server/entry.mjs"]

# FileMorph processing worker.
# Builds the monorepo workspace and runs the BullMQ consumer as a non-root user.
FROM node:20-slim AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS build
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/processing/package.json packages/processing/
COPY apps/worker/package.json apps/worker/
RUN npm install --workspace @filemorph/worker --include-workspace-root --omit=dev --no-audit --no-fund || npm install --no-audit --no-fund
COPY packages/shared packages/shared
COPY packages/processing packages/processing
COPY apps/worker apps/worker

FROM base AS runtime
COPY --from=build /app /app
RUN useradd --create-home --uid 1000 workeruser \
    && mkdir -p /app/data && chown -R workeruser:workeruser /app
USER workeruser
WORKDIR /app/apps/worker
EXPOSE 8080
HEALTHCHECK --interval=60s --timeout=10s --retries=3 CMD node -e "fetch('http://localhost:8080')" || exit 1
CMD ["npm", "run", "start"]

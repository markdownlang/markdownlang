FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.8.0 --activate

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/repl/package.json apps/repl/
COPY packages/core/package.json packages/core/
COPY packages/examples/package.json packages/examples/
RUN pnpm install --frozen-lockfile

# Build
FROM base AS build
WORKDIR /app
COPY --from=deps /app/ ./
COPY . .
RUN pnpm --filter @markdownlang/repl build

# Serve with nginx
FROM nginx:alpine
COPY --from=build /app/apps/repl/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

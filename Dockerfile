FROM node:18-alpine AS build
WORKDIR /app

# Prisma generation needs a DATABASE_URL value, but it does not need a real database
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:18-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/generated ./generated
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

EXPOSE 5000
CMD ["node", "dist/index.js"]


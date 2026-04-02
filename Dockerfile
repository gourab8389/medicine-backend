FROM node:18-alpine AS build
WORKDIR /app

# install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# build
COPY . .
RUN npm run build

FROM node:18-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

# copy production artifacts
COPY --from=build /app/package.json ./
COPY --from=build /app/dist ./dist

# install only production deps
RUN npm install --production

EXPOSE 5000
CMD ["node", "dist/index.js"]


# Multi-stage Dockerfile for deploying the MetaDress app on a VPS / own server
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY bun.lock ./
COPY . ./
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm ci
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY package.json package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.output ./.output
ENV NODE_ENV=production
EXPOSE 4174
CMD ["npm", "run", "preview:prod"]

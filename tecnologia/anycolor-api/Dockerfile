# Imagen de la API AnyColor (multi-etapa: compila y luego copia solo lo necesario)
FROM node:22-alpine AS compilacion
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=compilacion /app/node_modules ./node_modules
COPY --from=compilacion /app/dist ./dist
COPY package.json ./
COPY db ./db
COPY scripts ./scripts
EXPOSE 3001
USER node
CMD ["node", "dist/main.js"]

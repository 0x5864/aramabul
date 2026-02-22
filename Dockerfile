FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV API_HOST=0.0.0.0
ENV PORT=8080
ENV API_PORT=8080

EXPOSE 8080

CMD ["node", "backend/server.js"]

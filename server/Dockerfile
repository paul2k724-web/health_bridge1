FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npm run build 2>/dev/null || true

EXPOSE 5000

USER node

CMD ["node", "src/server.js"]

FROM node:20-alpine AS deps
WORKDIR /workspace

COPY package*.json ./
RUN npm install --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /workspace/node_modules ./node_modules

COPY src ./src
COPY data ./data
COPY package*.json ./

EXPOSE 4021
CMD ["npm", "start"]

# ---- Stage 1: Build ----
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install 
COPY . .
RUN npm run build

# ---- Stage 2: Run ----
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=builder /app/dist ./dist
EXPOSE 5001
ENV NODE_ENV=production
# Start app
CMD ["node", "dist/server.js"]

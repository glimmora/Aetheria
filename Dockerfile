FROM node:20-slim

WORKDIR /app

# Copy package files and install
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci --omit=dev

# Copy source
COPY shared/ ./shared/
COPY client/ ./client/
COPY server/ ./server/

# Build the client
RUN npm run build -w client

# Expose the server port
EXPOSE 12400

# Set production env
ENV NODE_ENV=production
ENV PORT=12400

CMD ["node", "server/index.js"]

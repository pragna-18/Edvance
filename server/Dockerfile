FROM node:20-alpine

WORKDIR /app

# Install build essentials for Prisma, Puppeteer, and Python ML dependencies
RUN apk add --no-cache \
    python3 py3-pip make g++ openssl \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-dejavu \
    py3-numpy \
    py3-pandas \
    py3-scikit-learn \
    py3-matplotlib \
    py3-seaborn

# Install Python packages via pip that aren't available in Alpine
RUN pip install --no-cache-dir --break-system-packages joblib python-dotenv nltk

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install --omit=dev

# Copy Prisma schema and migrations
COPY prisma ./prisma

# Copy application files (for migrations)
COPY . .

# Generate Prisma Client
RUN npm run prisma:generate || true

# Expose port
EXPOSE 5000

# Set NODE_ENV
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Start server only (migrations should be run separately or via db init)
CMD ["npm", "start"]







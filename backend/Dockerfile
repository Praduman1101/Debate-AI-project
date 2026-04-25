FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy application source
COPY . .

# Create non-root user
RUN addgroup -S debateai && adduser -S debateai -G debateai
RUN chown -R debateai:debateai /app
USER debateai

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

# Start with dumb-init for proper PID 1 signal forwarding
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

FROM node:20-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV DIRECT_URL=postgresql://dummy:dummy@localhost:5432/dummy
RUN pnpm exec prisma generate
RUN pnpm run build
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]

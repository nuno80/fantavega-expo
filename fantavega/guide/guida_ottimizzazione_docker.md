````markdown
# How to Reduce Next.js Docker Image Size

If you are using Docker to deploy your Next.js application, decreasing the image size is crucial. A smaller image size leads to faster push and pull times, resulting in quicker deployments.

This guide will show you how to reduce your Docker image size significantly, for example, from a potential 1.96 GB مشروع to just around 150 MB for a production build.

## The Baseline (Example of a Basic Dockerfile)

Let's start with a basic Next.js project created using `npx create-next-app@latest`.
A simple, unoptimized Dockerfile might look like this:

```dockerfile
FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm ci # Or pnpm install --frozen-lockfile

COPY . .

RUN npm run build # Or pnpm run build

EXPOSE 3000
CMD ["npm", "start"] # Or pnpm start
```
````

Upon checking the Docker image size for such a setup, it can be quite large (e.g., 1.96 GB). Leaving an application like this would severely impact pipeline performance and deployment times.

Let's see how we can reduce the image size.

## Step 1: Use a Smaller Base Image

We are currently using `node:20` as our base image. However, it contains many tools and libraries that are unnecessary for running a production Next.js application. We can switch to a smaller base image, `node:20-alpine`, which is based on Alpine Linux, a minimal Docker image.

```dockerfile
FROM node:20-alpine # Changed base image

WORKDIR /app

COPY package*.json yarn.lock* pnpm-lock.yaml* ./
# Use the appropriate install command for your package manager
RUN npm ci
# RUN yarn install --frozen-lockfile
# RUN pnpm install --frozen-lockfile

COPY . .

RUN npm run build # Or pnpm run build

EXPOSE 3000
CMD ["npm", "start"] # Or pnpm start
```

This single change can reduce the image size significantly (e.g., by nearly half, down to around 999 MB in the example). But we're not done yet.

## Step 2: Multi-Stage Builds

We can further reduce the image size by utilizing **multi-stage builds**. This approach involves using multiple `FROM` statements in your Dockerfile. Each `FROM` instruction can use a different base, and each of them begins a new stage of the build. You can selectively copy artifacts from one stage to another, leaving behind everything you don't want in the final image.

The goal is to create a final "runner" image that contains only the necessary files to run the application, excluding development dependencies, source code (if using a compiled output), and build tools.

```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
# Install production dependencies only if building a production image
# For a builder stage that needs devDependencies for the build, install all.
RUN npm ci
# RUN pnpm install --frozen-lockfile

# Stage 2: Build the application
FROM node:20-alpine AS builder

WORKDIR /app
COPY . .
# Copy dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build # Or pnpm run build

# Stage 3: Production runner image
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV production

# Copy necessary files from the 'builder' stage
COPY --from=builder /app/next.config.mjs ./ # Or .js
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/package.json ./ # May be needed if 'next start' reads it

EXPOSE 3000
CMD ["node_modules/.bin/next", "start"] # More direct way to run Next.js
# Or, if using pnpm: CMD ["pnpm", "start"]
```

With this configuration, we can manage to reduce the image size further (e.g., to around 703 MB in the example).

## Step 3: Next.js Output Configuration (`standalone`)

Now, let's achieve a more significant reduction. Our goal is to bring the image size down drastically (e.g., to just 150 MB).

By adding `output: 'standalone'` to your `next.config.js` (or `next.config.mjs`), Next.js will generate a standalone build.

**`next.config.mjs` (or `.js`)**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // other configurations...
};

export default nextConfig;
```

During the build process (`npm run build` or `pnpm run build`), Next.js uses `@vercel/nft` (Node File Trace) to statically analyze `import`, `require`, and `fs` usage. This determines all the necessary files that a page or the application might load. The result is a `standalone` folder (usually inside `.next/standalone`) which contains your application code والمكتبات `node_modules` necessarie. To run your application, only this `standalone` folder is required.

To utilize the standalone build, we need to update our `Dockerfile`:

```dockerfile
# Stage 1: Install dependencies (can be optimized further if only prod deps are needed for standalone)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci
# RUN pnpm install --frozen-lockfile # Install all deps if build needs them

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
# Ensure your next.config.js or .mjs has output: 'standalone'
RUN npm run build # Or pnpm run build

# Stage 3: Production runner image with standalone output
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# ENV PORT 3000 # Next.js standalone server usually runs on port 3000 by default

# Copy the standalone build output from the 'builder' stage
COPY --from=builder /app/.next/standalone ./

# The standalone output includes a minimal server.js.
# It also copies a minimal version of node_modules inside .next/standalone/node_modules.
# You typically don't need to copy the main node_modules folder anymore.

# Copy public and static assets if they are NOT served by a CDN
# If you serve these from a CDN, you can omit these COPY instructions.
# The standalone build does NOT automatically include these if they are not traced.
# If you need them served by the Next.js server itself:
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
# Note: The server.js in standalone might need to be configured to serve these,
# or you might need a custom server if Next.js's default standalone server doesn't.
# For many simple cases, Next.js handles this.

EXPOSE 3000

# The command to run the standalone server
# It will look for a server.js file in the current directory (which is .next/standalone copied to /app)
CMD ["node", "server.js"]
```

**Important Notes for `output: 'standalone'`:**

- With this approach, you might not be able to directly access the original `.next/static` and `./public` folders from the Next.js server unless you explicitly copy them and ensure your server setup (or the default `server.js` in standalone) can serve them.
- **Best Practice:** For static assets (`public` folder content and build-time static assets from `.next/static`), it's highly recommended to upload them to a CDN (Content Delivery Network) and serve them from there. This offloads traffic from your application server and improves performance.
- If using a CDN is not possible, you'll need to ensure the `COPY` instructions for `public` and `.next/static` are included and that your server can serve them.

## Step 4: Add `.dockerignore`

Don't forget to add a `.dockerignore` file in the root of your project. This file specifies a list of files and directories that should be excluded from the Docker build context.

Excluding unnecessary files (like `.git`, `node_modules` from your host, local environment files, etc.) from the Docker context can significantly reduce the time it takes to send the context to the Docker daemon and thus speed up the `COPY . .` steps.

**`.dockerignore` (example)**

```
.git
.gitignore
node_modules
.next
.env*.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
# Add any other files or directories not needed for the build
```

## Conclusion

By following these steps—using a smaller base image, implementing multi-stage builds, leveraging Next.js's `standalone` output mode, and using a `.dockerignore` file—you can successfully and dramatically reduce your Next.js Docker image size. This leads to faster deployments, reduced storage costs, and improved CI/CD pipeline performance.

Remember to adapt these examples to your specific package manager (`npm`, `yarn`, or `pnpm`) and project structure.

```

```

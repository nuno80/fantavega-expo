## Implementing Role-Based Authentication in Next.js with NextAuth.js and Drizzle ORM

This guide details how to implement role-based authentication (RBAC) in a Next.js project using NextAuth.js for authentication and Drizzle ORM for database interactions.

### 1. Overview

Role-based authentication (RBAC) is a method of controlling access to different parts of an application based on the roles assigned to users. It is a useful way to improve the security of the application.

### 2. Project Setup

#### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn
*   A PostgreSQL database

#### Dependencies

Install the necessary packages using npm or yarn:
```
bash
npm install next next-auth drizzle-orm pg drizzle-kit @auth/drizzle-adapter react react-dom
```
*   `next`: The Next.js framework.
*   `next-auth`: For authentication.
*   `drizzle-orm`: The Drizzle ORM library.
*   `pg`: The PostgreSQL driver for Node.js.
*   `drizzle-kit`: Drizzle's CLI tool for schema management.
*   `@auth/drizzle-adapter`: The Drizzle adapter for NextAuth.js.
* `react` and `react-dom` the react libraries.

#### Environment Variables

Create a `.env` file in the root of your project and add the following environment variables:
```
DATABASE_URL="postgresql://user:password@host:port/database"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
NEXTAUTH_SECRET="your_nextauth_secret"
```
### 3. Database Schema

We'll use Drizzle ORM to define our database schema.

#### `src/db/schema/accounts.ts`
```
typescript
import { integer, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

import users from "./users";

const accounts = pgTable(
  "account",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
    role: text("role"), // New role column
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export default accounts;
```
Here we are defining the `accounts` table.
This schema defines a `role` field of type `text`. It's where we'll store the role for each user.

#### `src/db/schema/users.ts`
```
typescript
import { pgTable, text, uuid } from "drizzle-orm/pg-core";

const users = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: text("emailVerified"),
  image: text("image"),
});

export default users;
```
This is the schema for the `users` table.

#### `src/db/index.ts`
```
typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "@/env/server";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export default db;
```
This file creates the connection to the database.

#### Run the migrations

Run the migrations using drizzle kit to create the database:
```
bash
npx drizzle-kit push:pg
```
### 4. `src/types/next-auth.d.ts`
```
typescript
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
    } & DefaultSession["user"];
  }
}
```
*   **`Session` Interface:** We modify the `Session` interface from NextAuth.js.
    *   We add a `user` property with `id: string`.
    *   We add `role?: string;` inside the `user` property, making `role` an optional string.
*   **Why `role` Is Optional:**
    *   We make `role` optional because NextAuth.js's internal `Adapter` types (which handle database interactions) don't natively know about our `role` field.
    *   By making it optional, we avoid type errors, and we'll add the `role` later in the session callback.
    * We are using the `& DefaultSession["user"]` to maintain the other fields from the default session.

### 5. `src/config/auth.ts`
```
typescript
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { eq } from "drizzle-orm";

import db from "@/db";
import { env } from "@/env/server";
import { accounts } from "@/db/schema";

const options: NextAuthOptions = {
  pages: {
    signIn: "/",
  },
  adapter: DrizzleAdapter(db) as ReturnType<typeof DrizzleAdapter>,
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      if(user.role) {
         session.user.role = user.role;
      }
      return session;
    },
  },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      profile: async (profile) => {
        const account = await db.query.accounts.findFirst({
          where: (accounts, { eq }) => eq(accounts.providerAccountId, profile.sub)
        })
        return {
          id: profile.sub,
          role: account?.role ?? "user",
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      }
    }),
  ],
};

export default options;
```
*   **`adapter`:**
    *   `adapter: DrizzleAdapter(db) as ReturnType<typeof DrizzleAdapter>`:
        *   We use the `DrizzleAdapter` to handle database operations for NextAuth.js.
        *   `as ReturnType<typeof DrizzleAdapter>` casts the `DrizzleAdapter(db)` to its proper return type to avoid type errors.
*   **`session` Callback:**
    *   `session.user.id = user.id;`: We set the `id` in the session.
    * `if(user.role) { session.user.role = user.role; }`: We set the role in the session, only if it was defined.
* **`profile` callback**
   *  We use the `profile` callback to get the user information from the database.
   * We get the account using the `providerAccountId`.
   * We get the role from the database. If the role is not in the database, we set it to `user`.
*   **Google Provider:**
    *   Configures the Google authentication provider with your client ID and secret.

### 6. Adding New Roles in the Future

To add new roles in the future, you would need to modify the following files:

1.  **`src/db/schema/accounts.ts`**: if you need to define new fields.
2.  **`src/config/auth.ts`**: if you need to have some special role assignation.
3. **Where you are using the role:** You need to modify the application logic to add the code for the new roles.

### 7. Using the Roles

Now that you have role-based authentication set up, you can use the `role` property in your components and API routes to control access.

#### Client-Side Example
```
typescript
import { useSession } from "next-auth/react";

const MyComponent = () => {
  const { data: session } = useSession();

  if (!session) {
    return <div>Loading...</div>;
  }

  if (session.user.role === "admin") {
    return <div>Admin Content</div>;
  } else if (session.user.role === "moderator") {
    return <div>Moderator Content</div>;
  } else {
    return <div>User Content</div>;
  }
};

export default MyComponent;
```
#### Server-Side Example
```
typescript
import { auth } from "@/auth";

export async function GET(request: Request) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return new Response("Unauthorized", { status: 401 });
  }

  // ... admin-only logic ...
  return Response.json({ message: "Admin route!" });
}
```
This guide provides a solid foundation for implementing role-based authentication in your Next.js project using NextAuth.js and Drizzle ORM. Remember to adapt these examples to your specific application's requirements.
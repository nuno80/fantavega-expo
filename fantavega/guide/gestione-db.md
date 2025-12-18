# Understanding the Database Code in `/home/user/next-start/src/db`

This document provides a comprehensive explanation of how the database-related code within the `/home/user/next-start/src/db` directory functions. It details the purpose of each file, the underlying mechanisms, and how the various parts interact to manage the database.
    
## File Structure

Based on common patterns and the use of Drizzle ORM, here's the structure within `src/db`:
*
*   `src/db/index.ts`: Database connection and client setup. Set and forget!

Per ogni tabella del DB viene creato un file .ts nella cartella 'schema' con il nome della tabella.
La creazione delle tabelle avviene usando l'esempio https://authjs.dev/getting-started/adapters/drizzle?framework=next-js 

*   `src/db/schema/accounts.ts`: Definition for the `account` table.
*   `src/db/schema/guestbook-entries.ts`: Definition for the `guestbook_entries` table.
*   `src/db/schema/sessions.ts`: Definition for the `session` table.
*   `src/db/schema/users.ts`: Definition for the `user` table.

Ogni nuova tabella va inserita nel file `src/db/schema/index.ts`

*   `src/db/schema/index.ts`: Central export point for all your database tables.
*   Per applicare le modifiche alle tabelle va eseguita una migrazione:
*   
```
bash
npm run db:migrate
```
 
**Evolution of the Database:** Database migrations are version-controlled scripts that define changes to the database schema. NON modificano i dati del DB, ma settano la sua struttura.
* La directory migration non va modificata. Serve a tenere traccia delle varie migrazioni del database. 
*   `src/db/migrations`: Directory containing migration files. Non va modificata!
*   `src/db/migrations/_journal.json`: This file is used to keep track of the state of the migrations, specifying which ones have already been applied and which have not.


## npm drizzle-kit push
Instead of using npm run db:migrate, you can also use npm drizzle-kit push:

* Development and Prototyping: It's primarily intended for use during development and prototyping, where you're frequently changing your schema and want to quickly update your database without the overhead of creating migration files.
* Small Projects: For very small or personal projects where you might not need a detailed history of schema changes.
When you're sure: If you are sure about the state of the schema.
* Why npx drizzle-kit push is generally NOT recommended for production:

* Lack of Version Control: It bypasses the migration file system. This means you don't have a history of schema changes. If something goes wrong, it's harder to roll back.
* Data Loss Risk: Because it directly modifies the database, there's a higher risk of accidental data loss if you're not careful. For example, if you remove a column in your schema and then run npx drizzle-kit push, that column (and its data) will be immediately deleted from the database.
* No rollbacks: since no migration files are created, it is not possible to roll back.

## drizzle-studio
* drizzle permette di visualizzare le tabelle create e il contenuto del db:

```
bash
pnpm drizzle-kit studio
```


## How It All Works Together

*   **Defining Schema:** You use `src/db/schema/*.ts` to define the structure of your database in code.
*   **Creating Migrations:** When you change the schema, you generate a new migration file (or write one manually).

*   **Applying Migrations:** You run a migration command to apply pending migrations to your database, updating the tables, columns, etc.
It modifies the database schema (structure)
It generally does NOT modify the database content (data).

* Schema Modification: The primary purpose of npm run db:migrate is to update the schema (the structure) of your database. This includes actions like:
Creating new tables.
Adding, removing, or renaming columns.
Changing data types of columns.
Setting up indexes, constraints, and relationships between tables.
Data Preservation: When db:migrate applies migrations, it is designed to preserve existing data as much as possible.

* For example, if you add a new column to a table, existing rows will get a NULL value in that new column (or a default value if you specify one).
If you change a column's data type, Drizzle will try to cast existing data to the new type. If it can't, you'll get an error, and you might need to create a custom migration that handles the data type change.
If you remove a column, data in that column will be deleted.

## How to Interact with the Code

*   **Modifying Schema:** To add, change, or remove a table or column, you'd modify the `schema.ts` file.
*   **Creating Migrations:** You'd run a command (provided by Drizzle or another tool) to generate a new migration based on your schema changes.
*   **Applying Migrations:** You'd run a command to apply pending migrations to the database.
*   **Querying:** In your application code, you'd import the database client and your schema to query the database using Drizzle.


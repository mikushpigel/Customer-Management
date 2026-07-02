# Customer Management

A small web app for tracking customers and pulling their most recent Fathom
call (date + summary) from Notion via the Notion API.

Table columns: **Company Name**, **Contact Person**, **Email**, **Phone
Number**, **Last Call (Fathom)**, **Call Summary**.

## Stack

- Next.js 14 (App Router) + TypeScript
- Customers are stored in `data/customers.json` (no external database needed)
- `@notionhq/client` for talking to the Notion API

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the Notion values, see below
npm run dev
```

Open http://localhost:3000. You can add customers immediately — the Notion
env vars are only needed when you click "Sync from Notion".

## Notion setup

Your Zapier automation writes each Fathom call into a Notion database as a
new row/page. To let this app read that database:

### 1. Create a Notion integration and get an API key

1. Go to https://www.notion.so/my-integrations and click **New integration**.
2. Give it a name (e.g. "Customer Management"), pick the workspace, and
   create it.
3. Copy the **Internal Integration Secret** — this is your `NOTION_API_KEY`.

### 2. Share the calls database with the integration

1. Open the Notion database that Zapier writes Fathom calls into.
2. Click **···** (top right) → **Connections** → add the integration you
   just created. Without this step the API will return 404s for that
   database, even with a valid key.

### 3. Get the database ID

Open the database as a full page in your browser. The URL looks like:

```
https://www.notion.so/myworkspace/1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d?v=...
```

The 32-character chunk right after the workspace name (before `?v=`) is the
`NOTION_DATABASE_ID`.

### 4. Match the property names

By default the app looks for these column names in your database:

| Purpose            | Env var              | Default value |
| ------------------- | --------------------- | -------------- |
| Company name        | `NOTION_PROP_COMPANY` | `Company`      |
| Call date            | `NOTION_PROP_DATE`    | `Call Date`    |
| Call summary         | `NOTION_PROP_SUMMARY` | `Summary`      |
| Contact email (opt.) | `NOTION_PROP_EMAIL`   | *(unused)*     |

Open the Notion database and check the actual column headers Zapier is
writing to. If they don't match the defaults, set the corresponding env var
in `.env.local` to the exact column name (case-sensitive).

The app doesn't require an exact property *type* — it reads title, text,
select, status, date, email, and similar Notion property types
automatically, since Zapier-created databases can vary.

### 5. Fill in `.env.local`

```bash
NOTION_API_KEY=secret_xxx...
NOTION_DATABASE_ID=1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d
NOTION_PROP_COMPANY=Company
NOTION_PROP_DATE=Call Date
NOTION_PROP_SUMMARY=Summary
```

Restart `npm run dev` after changing env vars.

## How syncing works

Clicking **Sync from Notion** on a customer row:

1. Queries the configured Notion database (paginating through all rows).
2. Finds rows whose company-name property contains (or is contained in) the
   customer's company name.
3. Picks the most recent match by the configured date property (falling
   back to the page's last-edited time if no date is found).
4. Saves that call's date + summary onto the customer, with a link back to
   the Notion page.

**Sync All From Notion** (top right) does this for every customer in one
pass.

If matching by company name isn't reliable enough once you see your real
data (e.g. naming is inconsistent), set `NOTION_PROP_EMAIL` to match on
email instead — update your Zapier automation to include the contact's
email in that Notion property.

## Deploying to Railway

1. Create a new Railway project from this GitHub repo (Railway auto-detects
   Next.js via Nixpacks and uses the `railway.json` in this repo for the
   build/start commands).
2. In the Railway service's **Variables** tab, set the same variables as
   `.env.example`: `NOTION_API_KEY`, `NOTION_DATABASE_ID`,
   `NOTION_PROP_COMPANY`, `NOTION_PROP_DATE`, `NOTION_PROP_SUMMARY`, and
   `NOTION_PROP_EMAIL` if you use it.
3. **Attach a volume** mounted at `/app/data` (Railway service → **Volumes**
   tab → New Volume). Customers are stored in `data/customers.json` on disk;
   without a volume that file lives on the container's ephemeral filesystem
   and is wiped on every redeploy.
4. Deploy. Railway provides `PORT` automatically, which `next start` reads.

## Project structure

```
app/
  page.tsx                        Main UI (table + add-customer form)
  api/customers/route.ts          List/create customers
  api/customers/[id]/route.ts     Update/delete a customer
  api/customers/[id]/sync-notion  Sync one customer from Notion
  api/customers/sync-all          Sync all customers from Notion
lib/
  db.ts       JSON-file storage for customers
  notion.ts   Notion API querying + property extraction/matching
  types.ts    Shared types
components/
  AddCustomerForm.tsx
  CustomerTable.tsx
data/
  customers.json   Created automatically on first run (gitignored)
```

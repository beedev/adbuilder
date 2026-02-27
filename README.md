# Meijer Weekly Ad Builder

A drag-and-drop weekly ad design tool built for Meijer. Design, layout, and publish weekly ad pages using a canvas-based editor with product blocks, price rendering, stamps, and template zones.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Database**: PostgreSQL via Prisma 7 + `@prisma/adapter-pg`
- **State**: Zustand
- **Drag & Drop**: dnd-kit
- **Styling**: Tailwind CSS 4
- **Rich Text**: Tiptap

---

## Prerequisites

Make sure the following are installed before you begin:

- **Node.js** v20 or later — https://nodejs.org
- **PostgreSQL** v14 or later — https://www.postgresql.org/download/
- **npm** (comes with Node.js)

---

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone https://github.com/beedev/adbuilder.git
cd adbuilder
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create the Environment File

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

If `.env.example` does not exist, create `.env` manually with the following content:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/weekly_ad_builder
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

> Change the `DATABASE_URL` credentials if your local PostgreSQL uses a different user or password.

### 4. Create the PostgreSQL Database

Open a terminal and connect to PostgreSQL:

```bash
psql -U postgres
```

Then run:

```sql
CREATE DATABASE weekly_ad_builder;
\q
```

### 5. Run Database Migrations

This creates all the required tables:

```bash
npx prisma migrate dev --name init
```

If migrations already exist (e.g., you cloned a repo with a `prisma/migrations` folder):

```bash
npx prisma migrate deploy
```

### 6. Seed the Database

This populates users, templates, and sample block data:

```bash
npx prisma db seed
```

This runs `prisma/seed.ts` and creates:
- 3 seed users (see **Seed Users** below)
- 15 layout templates across 5 categories
- Sample block/product data

### 7. Seed the Meijer Sample Ad (Optional but Recommended)

This creates a fully built sample weekly ad page with real product blocks so you can see the editor in action immediately:

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-meijer-sample.ts
```

### 8. Generate Prisma Client

If Prisma types are not generated yet:

```bash
npx prisma generate
```

### 9. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Navigating the App

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | Dashboard — lists all weekly ads |
| `http://localhost:3000/builder/[ad-id]` | Canvas editor for a specific ad |
| `http://localhost:3000/review/[ad-id]` | Review/approval view |

The sample ad ID from the Meijer seed script is printed to the terminal when seeding completes. You can also find ad IDs on the dashboard.

---

## Seed Users

These accounts are created by `prisma/seed.ts`:

| Email | Role |
|-------|------|
| `admin@meijer.com` | Admin |
| `designer@meijer.com` | Designer |
| `approver@meijer.com` | Approver |

> Passwords are configured in the seed file. Check `prisma/seed.ts` for the default values.

---

## Images

**No local image setup is required.**

All product and lifestyle images used in seed data are sourced from [Unsplash](https://unsplash.com) via publicly accessible URLs, for example:

```
https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80
```

These load automatically over the internet. No image downloads or S3 buckets are needed for development.

### Using Custom Images

To use your own product images, provide any publicly accessible image URL when creating or editing a block's feed JSON. The image field accepts:

```json
{
  "images": {
    "product": { "url": "https://your-cdn.com/product.jpg", "altText": "Product name" },
    "lifestyle": { "url": "https://your-cdn.com/lifestyle.jpg", "altText": "Lifestyle shot" }
  }
}
```

For production use, upload images to an S3 bucket, Cloudinary, or any CDN and reference their public URLs.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open Prisma DB browser GUI |
| `npx prisma migrate dev` | Create and apply a new migration |
| `npx prisma db seed` | Seed users, templates, and block data |

---

## Troubleshooting

**`Error: P1001 - Can't reach database server`**
- Ensure PostgreSQL is running: `brew services start postgresql` (macOS) or `sudo service postgresql start` (Linux)
- Verify `DATABASE_URL` in `.env` has the correct host, port, user, and password

**`PrismaClientInitializationError`**
- Run `npx prisma generate` to regenerate the client
- Ensure `@prisma/adapter-pg` is installed — this project uses the PG adapter pattern, not the default Prisma client

**`Module not found: ts-node`**
- Run `npm install` — `ts-node` is in `devDependencies`
- For seed scripts use the `--compiler-options '{"module":"CommonJS"}'` flag as shown above

**Port 3000 already in use**
- Kill the existing process: `lsof -ti:3000 | xargs kill -9`
- Or start on a different port: `npm run dev -- -p 3001`

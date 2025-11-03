# Aplikasi BK Sekolah

Aplikasi Bimbingan Konseling (BK) Sekolah adalah aplikasi web full-stack berbasis Next.js 15 yang dirancang untuk mendigitalisasi layanan Bimbingan Konseling di sekolah.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Development Environment**: Docker Desktop (PostgreSQL)

## Getting Started

### Prerequisites

- Node.js 20+ 
- Docker Desktop
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy environment variables:

```bash
cp .env.example .env.local
```

4. Start PostgreSQL with Docker:

```bash
docker-compose up -d
```

5. Generate Prisma client:

```bash
npm run db:generate
```

6. Run database migrations:

```bash
npm run db:migrate
```

7. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
aplikasi-bk-sekolah/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages (role-based)
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Shadcn/ui components
│   ├── shared/           # Shared components
│   ├── admin/            # Admin components
│   ├── guru-bk/          # Guru BK components
│   ├── wali-kelas/       # Wali Kelas components
│   └── siswa/            # Siswa components
├── lib/                   # Utilities and configurations
│   ├── actions/          # Server Actions
│   ├── db/               # Database configuration
│   ├── auth/             # Authentication configuration
│   ├── encryption/       # Encryption utilities
│   └── validations/      # Zod schemas
├── prisma/               # Prisma schema and migrations
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run analyze` - Analyze bundle size with webpack bundle analyzer
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

## Database Management

### Start PostgreSQL

```bash
docker-compose up -d
```

### Stop PostgreSQL

```bash
docker-compose down
```

### View Database

```bash
npm run db:studio
```

## Environment Variables

See `.env.example` for required environment variables.

## Performance Optimization

### Bundle Size Analysis

To analyze the bundle size and identify optimization opportunities:

```bash
npm run analyze
```

This will:
1. Build the application with bundle analyzer enabled
2. Generate interactive HTML reports in `.next/analyze/`
3. Open reports automatically in your browser

**Reports Generated:**
- `client.html` - Client-side bundle analysis
- `nodejs.html` - Server-side bundle analysis
- `edge.html` - Edge runtime bundle analysis

**What to Look For:**
- Large packages (>100KB)
- Duplicate dependencies
- Unused code
- Code splitting effectiveness

For detailed optimization results, see `BUNDLE_OPTIMIZATION_REPORT.md`.

## License

Private - School Use Only

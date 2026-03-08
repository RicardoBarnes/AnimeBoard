# AnimeBoard MVP

A modern web application for anime fans to share and discover favorite characters and scenes.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, Postgres, Storage, RLS)
- **Deployment**: Vercel (frontend) + Supabase (backend)

## Features

### ✅ Phase 1 & 2 Complete

- **Authentication**: Email/password signup and login with Supabase Auth
- **User Profiles**: Username, role, avatar support
- **Image Library**: Upload and manage anime images
  - File validation (5MB max, JPEG/PNG/WEBP/GIF)
  - Metadata: character name, series name, tags
  - Search by character or series
  - Responsive grid gallery
- **Protected Routes**: Auth middleware with automatic redirects

### ✅ Phase 2 (Posts, Voting & Comments)
- **Post Builder** at `/app/create`
  - Create posts with customizable titles (1-200 chars)
  - Add up to 10 slides per post
  - Single image slides (from your library)
  - Collage slides with 4 templates (2-grid, 3-grid, 2x2, vertical-stack)
- **Post Viewer** at `/p/[id]`
  - Swipeable slide carousel with navigation
  - Client-side collage rendering from JSON recipes
  - Agree/Disagree voting with toggle
  - Vote counts via RPC (privacy-safe)
- **Comments System**
  - Tabbed view (Agree/Disagree sections)
  - Threaded replies support
  - Emoji support in comments 😊
- **Public Feed** at `/`
  - Browse recent posts with thumbnails
  - See titles, authors, and dates

### 🚧 Coming Soon

- Admin moderation panel
- Report submission

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   
   Create a `.env.local` file:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Set up Supabase**:

   a. Run the database migrations in order:
   ```sql
   -- In Supabase SQL Editor
   -- 1. Run: supabase/migrations/20260212_initial_schema.sql
   -- 2. Run: supabase/migrations/20260212_patch_schema_v4.sql
   ```

   b. Create Storage bucket:
   - Go to Storage in Supabase Dashboard
   - Create bucket named `user-uploads`
   - Set to **Public** bucket
   - Add policies:
     - SELECT: `(bucket_id = 'user-uploads')`
     - INSERT: `(bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text)`
     - DELETE: `(bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text)`

4. **Run the development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
AnimeBoard/
├── app/
│   ├── actions/          # Server actions
│   │   ├── auth.ts       # Authentication actions
│   │   └── images.ts     # Image upload/search actions
│   ├── app/              # Protected routes
│   │   ├── layout.tsx    # App layout with nav
│   │   ├── page.tsx      # Dashboard
│   │   └── images/       # Image library
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   └── layout.tsx        # Root layout
├── components/
│   ├── auth/             # Auth components
│   └── images/           # Image components
├── lib/
│   ├── supabase/         # Supabase clients
│   │   ├── client.ts     # Browser client
│   │   ├── server.ts     # Server client
│   │   └── middleware.ts # Auth middleware
│   └── types/            # TypeScript types
├── middleware.ts         # Next.js middleware
└── supabase/
    └── migrations/       # Database migrations
```

## Database Schema

### Tables

- **profiles**: User profile data (username, avatar, role)
- **images**: Image metadata and storage references
- **posts**: User-created posts (coming soon)
- **slides**: Post slides (single or collage)
- **votes**: Agree/Disagree votes on posts
- **comments**: Threaded comments on posts
- **reports**: Content moderation reports

### Security

All tables use Row Level Security (RLS):
- Users can read non-removed content
- Users can create their own content
- Users can only update/delete their own content
- Admins can soft-remove any content

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Testing Phase 2 Features

1. **Upload Images**: Go to `/app/images` and upload a few anime images
2. **Create a Post**:
   - Navigate to `/app/create`
   - Enter a title
   - Click on images to add them as slides (up to 10)
   - Click "Publish Post"
3. **View Post**:
   - You'll be redirected to `/p/[id]`
   - Use arrow buttons or dots to navigate slides
   - Click Agree or Disagree to vote
   - Add comments in either section
4. **Public Feed**: Visit `/` to see your post in the feed
5. **Reply to Comments**: Click "Reply" on any comment to create threaded discussions

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

## Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Supabase

Already configured - just ensure migrations are run.

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.

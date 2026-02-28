# Frontend - Next.js with TypeScript

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the frontend directory:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 3. Copy Images

Make sure these images are in the `public` folder:
- `hero.png` - Landing page hero image
- `rcc_placeholder.png` - Default candidate image

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at: `http://localhost:3000`

## Pages

### Public Pages

**/ (Landing Page)**
- Hero image with election information
- Start voting button (if voting is open)
- View results button (if voting is closed)
- Statistics overview

**/verify (Identity Verification)**
- Name input for voter verification
- Device fingerprint generation
- Error handling for invalid voters

**/ballot (Voting Page)**
- All 4 positions with descriptions
- Candidate cards with images
- Selection tracking
- Progress indicator
- Confirmation modal
- Vote submission

**/thank-you (Confirmation)**
- Success message
- Instructions to wait for results
- Link to results page

**/results (Results Page)**
- Pending status (before release)
- Winner display for each position
- Vote counts
- Animated reveal

### Admin Pages

**/admin/dashboard (Admin Dashboard)**
- System status overview
- Voting statistics
- Real-time vote breakdown
- Close voting action
- Release results action
- Requires Django admin login

## Components Structure

```
src/
├── pages/
│   ├── _app.tsx          # App wrapper
│   ├── _document.tsx     # HTML document
│   ├── index.tsx         # Landing page
│   ├── verify.tsx        # Voter verification
│   ├── ballot.tsx        # Voting page
│   ├── thank-you.tsx     # Confirmation page
│   ├── results.tsx       # Results page
│   └── admin/
│       └── dashboard.tsx # Admin dashboard
├── lib/
│   ├── api.ts           # API client
│   └── utils.ts         # Utility functions
├── types/
│   └── index.ts         # TypeScript types
└── styles/
    └── globals.css      # Global styles
```

## Styling

### Theme Colors
- **Black**: Primary background (#0a0a0a, #1a1a1a)
- **Gold**: Accent color (#D4AF37)
- **Emerald**: Success/action color (#10B981)

### CSS Classes

**Glass Effects:**
```css
.glass-effect           /* Light blur effect */
.glass-effect-strong    /* Stronger blur effect */
```

**Glow Effects:**
```css
.gold-glow      /* Gold glow shadow */
.emerald-glow   /* Emerald glow shadow */
```

**Card Effects:**
```css
.card-hover      /* Hover transition */
.selected-card   /* Selected state */
```

## API Integration

All API calls use the `apiClient` from `@/lib/api.ts`:

```typescript
import { apiClient } from '@/lib/api';

// Get positions
const positions = await apiClient.getPositions();

// Verify voter
const result = await apiClient.verifyVoter(fullName, deviceHash);

// Submit votes
await apiClient.submitVotes(fullName, deviceHash, votes);

// Get results
const results = await apiClient.getResults();
```

## Device Fingerprinting

Uses `fingerprintjs2` to generate unique device identifiers:

```typescript
import { getDeviceFingerprint } from '@/lib/utils';

const deviceHash = await getDeviceFingerprint();
```

## State Management

Uses React hooks and sessionStorage for voter session:

```typescript
// Store voter info after verification
sessionStorage.setItem('voter_name', fullName);
sessionStorage.setItem('device_hash', deviceHash);
sessionStorage.setItem('voter_id', voterId);

// Clear after voting
sessionStorage.clear();
```

## Build for Production

```bash
# Build
npm run build

# Start production server
npm start
```

## Deployment

### Vercel
```bash
vercel --prod
```

### Netlify
```bash
netlify deploy --prod
```

Make sure to set environment variables:
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Troubleshooting

### Port Already in Use
```bash
# Change port
npm run dev -- -p 3001
```

### API Connection Issues
1. Check backend is running on `http://localhost:8000`
2. Verify CORS settings in Django
3. Check `.env.local` has correct API URL

### Image Loading Issues
1. Ensure images are in `public/` folder
2. Check Next.js config for image domains
3. Verify image paths don't have spaces (use underscores)

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## Scripts

```bash
npm run dev      # Development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

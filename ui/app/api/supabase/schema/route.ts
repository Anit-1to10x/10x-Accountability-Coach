import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PROJECT_ROOT } from '@/lib/paths'

const SCHEMA_DIR = path.join(PROJECT_ROOT, 'data', 'schemas')

// GET: Get the full schema SQL
export async function GET() {
  try {
    const schemaPath = path.join(SCHEMA_DIR, 'full_schema.sql')
    const schemaContent = await fs.readFile(schemaPath, 'utf-8')

    return NextResponse.json({
      success: true,
      schema: schemaContent,
      tables: [
        'profiles_auth',
        'profiles',
        'todos',
        'challenges',
        'checkins',
        'activities',
      ],
      instructions: `
## How to Run the Schema

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Click "New Query"
4. Paste the entire schema SQL
5. Click "Run" to execute
6. Come back here and click "Mark as Complete"

## What This Creates

- **profiles_auth**: Links Supabase auth users to app profiles
- **profiles**: User profile information
- **todos**: Tasks and to-do items
- **challenges**: Streak challenges and goals
- **checkins**: Daily check-ins for challenges
- **activities**: Activity log for analytics

## Security

All tables have Row Level Security (RLS) enabled:
- Users can only access their own data
- Service role (API) has full access for sync operations
- Auth is handled via Supabase's built-in auth system
      `.trim(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

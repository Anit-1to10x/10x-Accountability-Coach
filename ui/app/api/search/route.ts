import { NextRequest, NextResponse } from 'next/server'

interface SearchRequest {
  query: string
  source?: 'web' | 'local' | 'all'
}

interface DuckDuckGoResponse {
  Answer?: string
  Abstract?: string
  AbstractSource?: string
  AbstractURL?: string
  Definition?: string
  DefinitionSource?: string
  DefinitionURL?: string
  RelatedTopics?: Array<{
    Text?: string
    FirstURL?: string
  }>
}

// POST: Perform a search
export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json()
    const { query, source = 'web' } = body

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    if (source === 'web' || source === 'all') {
      // Perform web search using DuckDuckGo
      const encodedQuery = encodeURIComponent(query)
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`

      const response = await fetch(ddgUrl, {
        headers: {
          'User-Agent': 'OpenAnalyst/1.0',
        },
      })

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Web search failed' },
          { status: 500 }
        )
      }

      const data: DuckDuckGoResponse = await response.json()

      // Format results
      const results = {
        query,
        source: 'DuckDuckGo',
        instant: data.Answer || null,
        abstract: data.Abstract
          ? {
              text: data.Abstract,
              source: data.AbstractSource,
              url: data.AbstractURL,
            }
          : null,
        definition: data.Definition
          ? {
              text: data.Definition,
              source: data.DefinitionSource,
              url: data.DefinitionURL,
            }
          : null,
        related: (data.RelatedTopics || [])
          .filter((topic) => topic.Text)
          .slice(0, 5)
          .map((topic) => ({
            text: topic.Text,
            url: topic.FirstURL,
          })),
      }

      // Check if we got meaningful results
      const hasResults =
        results.instant ||
        results.abstract?.text ||
        results.definition?.text ||
        results.related.length > 0

      return NextResponse.json({
        success: true,
        hasResults,
        results,
      })
    }

    // For local search, we'd query the local data
    // This could be extended in the future
    return NextResponse.json({
      success: true,
      hasResults: false,
      results: {
        query,
        source: 'local',
        message: 'Local search not implemented in this endpoint',
      },
    })
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET: Quick search via query params
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
  }

  // Redirect to POST handler logic
  const mockRequest = new Request(request.url, {
    method: 'POST',
    body: JSON.stringify({ query, source: 'web' }),
    headers: { 'Content-Type': 'application/json' },
  })

  return POST(new NextRequest(mockRequest))
}

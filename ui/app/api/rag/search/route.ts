/**
 * RAG Search API - Search documents for retrieval
 * POST /api/rag/search
 */

import { NextRequest, NextResponse } from 'next/server';
import { ragService } from '@/lib/rag';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, options = {} } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if RAG service is available
    if (!ragService.isAvailable()) {
      return NextResponse.json(
        { error: 'RAG service not available. Check Supabase configuration.' },
        { status: 503 }
      );
    }

    // Perform agentic search
    const context = await ragService.agenticSearch(query, {
      limit: options.limit || 5,
      category: options.category,
      tags: options.tags,
      threshold: options.threshold || 0.5,
    });

    return NextResponse.json({
      success: true,
      query,
      results: {
        documents: context.relevantDocuments,
        contextText: context.contextText,
        sources: context.sources,
        confidence: context.confidence,
      },
    });
  } catch (error) {
    console.error('[RAG Search] Error:', error);
    return NextResponse.json(
      { error: 'RAG search failed', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!query) {
      // Return all documents if no query
      const documents = await ragService.getAllDocuments({ limit, category: category || undefined });
      return NextResponse.json({
        success: true,
        documents,
        count: documents.length,
      });
    }

    // Perform search
    const context = await ragService.agenticSearch(query, {
      limit,
      category: category || undefined,
    });

    return NextResponse.json({
      success: true,
      query,
      results: {
        documents: context.relevantDocuments,
        sources: context.sources,
        confidence: context.confidence,
      },
    });
  } catch (error) {
    console.error('[RAG Search] Error:', error);
    return NextResponse.json(
      { error: 'RAG search failed', details: String(error) },
      { status: 500 }
    );
  }
}

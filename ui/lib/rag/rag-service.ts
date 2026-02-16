/**
 * Agentic RAG Service
 * Provides intelligent retrieval augmented generation with Supabase
 */

import { getSupabaseClient, isSupabaseConfigured } from './supabase-client';

// RAG Document type
export interface RAGDocument {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category: string;
  tags: string[];
  source?: string;
  source_url?: string;
  author?: string;
  metadata?: Record<string, unknown>;
  similarity?: number;
  rank?: number;
  created_at?: string;
}

// RAG Query options
export interface RAGQueryOptions {
  limit?: number;
  category?: string;
  tags?: string[];
  threshold?: number;
  includeMetadata?: boolean;
}

// RAG Search result
export interface RAGSearchResult {
  documents: RAGDocument[];
  query: string;
  method: 'keyword' | 'semantic' | 'hybrid' | 'tags';
  totalFound: number;
  processingTime: number;
}

// RAG Context for AI
export interface RAGContext {
  relevantDocuments: RAGDocument[];
  contextText: string;
  sources: Array<{ title: string; url?: string }>;
  confidence: number;
}

/**
 * Main RAG Service class
 */
class RAGService {
  private enabled: boolean = false;

  constructor() {
    this.enabled = isSupabaseConfigured();
  }

  /**
   * Check if RAG is available
   */
  isAvailable(): boolean {
    return this.enabled && isSupabaseConfigured();
  }

  /**
   * Search documents by keyword (full-text search)
   */
  async searchByKeyword(
    query: string,
    options: RAGQueryOptions = {}
  ): Promise<RAGSearchResult> {
    const startTime = Date.now();
    const { limit = 5, category } = options;

    const supabase = getSupabaseClient();
    if (!supabase) {
      return this.emptyResult(query, 'keyword', startTime);
    }

    try {
      // Use the search function or fallback to direct query
      const { data, error } = await supabase.rpc('search_rag_documents_keyword', {
        search_query: query,
        match_count: limit,
        filter_category: category || null,
      });

      if (error) {
        // Fallback to simple ILIKE search if function doesn't exist
        console.warn('[RAG] Keyword search function not available, using fallback');
        return this.fallbackKeywordSearch(query, options, startTime);
      }

      return {
        documents: data || [],
        query,
        method: 'keyword',
        totalFound: data?.length || 0,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[RAG] Keyword search error:', error);
      return this.fallbackKeywordSearch(query, options, startTime);
    }
  }

  /**
   * Extract meaningful keywords from a query
   */
  private extractKeywords(query: string): string[] {
    // Common stop words to filter out
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'to', 'of', 'in', 'for',
      'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'under', 'again',
      'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
      'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
      'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
      'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'about',
      'against', 'what', 'which', 'who', 'whom', 'this', 'that', 'these',
      'those', 'am', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'you',
      'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its',
      'they', 'them', 'their', 'theirs', 'get', 'got', 'become', 'want',
      'need', 'help', 'please', 'tell', 'give', 'make', 'know', 'think',
    ]);

    // Extract words and filter
    const words = query
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove punctuation except hyphens
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    // Return unique keywords
    return [...new Set(words)];
  }

  /**
   * Fallback keyword search using ILIKE
   */
  private async fallbackKeywordSearch(
    query: string,
    options: RAGQueryOptions,
    startTime: number
  ): Promise<RAGSearchResult> {
    const { limit = 5, category } = options;
    const supabase = getSupabaseClient();

    if (!supabase) {
      return this.emptyResult(query, 'keyword', startTime);
    }

    try {
      // Extract meaningful keywords from the query
      const keywords = this.extractKeywords(query);

      if (keywords.length === 0) {
        return this.emptyResult(query, 'keyword', startTime);
      }

      // Build OR conditions for each keyword
      const orConditions = keywords
        .map(kw => `title.ilike.%${kw}%,content.ilike.%${kw}%,tags.cs.{${kw}}`)
        .join(',');

      let queryBuilder = supabase
        .from('rag_documents')
        .select('*')
        .eq('is_active', true)
        .or(orConditions)
        .limit(limit);

      if (category) {
        queryBuilder = queryBuilder.eq('category', category);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      // Sort by relevance (number of keyword matches)
      const sortedData = (data || []).sort((a, b) => {
        const aMatches = keywords.filter(kw =>
          a.title?.toLowerCase().includes(kw) ||
          a.content?.toLowerCase().includes(kw) ||
          a.tags?.some((t: string) => t.toLowerCase().includes(kw))
        ).length;
        const bMatches = keywords.filter(kw =>
          b.title?.toLowerCase().includes(kw) ||
          b.content?.toLowerCase().includes(kw) ||
          b.tags?.some((t: string) => t.toLowerCase().includes(kw))
        ).length;
        return bMatches - aMatches;
      });

      console.log(`[RAG] Extracted keywords: ${keywords.join(', ')} -> Found ${sortedData.length} documents`);

      return {
        documents: sortedData,
        query,
        method: 'keyword',
        totalFound: sortedData.length,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[RAG] Fallback search error:', error);
      return this.emptyResult(query, 'keyword', startTime);
    }
  }

  /**
   * Search documents by tags
   */
  async searchByTags(
    tags: string[],
    options: RAGQueryOptions = {}
  ): Promise<RAGSearchResult> {
    const startTime = Date.now();
    const { limit = 10 } = options;

    const supabase = getSupabaseClient();
    if (!supabase) {
      return this.emptyResult(tags.join(', '), 'tags', startTime);
    }

    try {
      const { data, error } = await supabase
        .from('rag_documents')
        .select('*')
        .eq('is_active', true)
        .overlaps('tags', tags)
        .limit(limit);

      if (error) throw error;

      return {
        documents: data || [],
        query: tags.join(', '),
        method: 'tags',
        totalFound: data?.length || 0,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[RAG] Tag search error:', error);
      return this.emptyResult(tags.join(', '), 'tags', startTime);
    }
  }

  /**
   * Get all documents (for small datasets)
   */
  async getAllDocuments(options: RAGQueryOptions = {}): Promise<RAGDocument[]> {
    const { limit = 100, category } = options;

    const supabase = getSupabaseClient();
    if (!supabase) return [];

    try {
      let queryBuilder = supabase
        .from('rag_documents')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (category) {
        queryBuilder = queryBuilder.eq('category', category);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('[RAG] Get all documents error:', error);
      return [];
    }
  }

  /**
   * Intelligent agentic search - combines multiple strategies
   */
  async agenticSearch(
    query: string,
    options: RAGQueryOptions = {}
  ): Promise<RAGContext> {
    const { limit = 5, threshold = 0.5 } = options;

    // Extract potential tags from query
    const extractedTags = this.extractTags(query);

    // Run searches in parallel
    const [keywordResults, tagResults] = await Promise.all([
      this.searchByKeyword(query, { ...options, limit }),
      extractedTags.length > 0
        ? this.searchByTags(extractedTags, { ...options, limit: 3 })
        : Promise.resolve({ documents: [], query, method: 'tags', totalFound: 0, processingTime: 0 } as RAGSearchResult),
    ]);

    // Merge and deduplicate results
    const allDocs = [...keywordResults.documents, ...tagResults.documents];
    const uniqueDocs = this.deduplicateDocuments(allDocs);

    // Sort by relevance (keyword matches first, then tag matches)
    const sortedDocs = uniqueDocs.slice(0, limit);

    // Build context for AI
    const contextText = this.buildContextText(sortedDocs);
    const sources = sortedDocs.map((doc) => ({
      title: doc.title,
      url: doc.source_url,
    }));

    // Calculate confidence based on match quality
    const confidence = this.calculateConfidence(sortedDocs, query);

    return {
      relevantDocuments: sortedDocs,
      contextText,
      sources,
      confidence,
    };
  }

  /**
   * Build context text for AI from documents
   */
  buildContextText(documents: RAGDocument[]): string {
    if (documents.length === 0) {
      return '';
    }

    const sections = documents.map((doc, index) => {
      const header = `### ${index + 1}. ${doc.title}`;
      const category = doc.category ? `**Category:** ${doc.category}` : '';
      const tags = doc.tags?.length ? `**Tags:** ${doc.tags.join(', ')}` : '';
      const content = doc.summary || doc.content.slice(0, 500);

      return [header, category, tags, content].filter(Boolean).join('\n');
    });

    return `## Relevant Knowledge Base Articles\n\n${sections.join('\n\n---\n\n')}`;
  }

  /**
   * Extract potential tags from query
   */
  private extractTags(query: string): string[] {
    const commonTags = [
      'productivity',
      'habits',
      'goals',
      'motivation',
      'accountability',
      'time-management',
      'mindset',
      'focus',
      'discipline',
      'success',
      'planning',
      'routine',
    ];

    const queryLower = query.toLowerCase();
    return commonTags.filter((tag) => queryLower.includes(tag.replace('-', ' ')));
  }

  /**
   * Deduplicate documents by ID
   */
  private deduplicateDocuments(documents: RAGDocument[]): RAGDocument[] {
    const seen = new Set<string>();
    return documents.filter((doc) => {
      if (seen.has(doc.id)) return false;
      seen.add(doc.id);
      return true;
    });
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(documents: RAGDocument[], query: string): number {
    if (documents.length === 0) return 0;

    const queryWords = query.toLowerCase().split(/\s+/);
    let totalScore = 0;

    for (const doc of documents) {
      const titleLower = doc.title.toLowerCase();
      const contentLower = doc.content.toLowerCase();

      let docScore = 0;
      for (const word of queryWords) {
        if (titleLower.includes(word)) docScore += 0.3;
        if (contentLower.includes(word)) docScore += 0.1;
      }

      totalScore += Math.min(docScore, 1);
    }

    return Math.min(totalScore / documents.length, 1);
  }

  /**
   * Empty result helper
   */
  private emptyResult(
    query: string,
    method: RAGSearchResult['method'],
    startTime: number
  ): RAGSearchResult {
    return {
      documents: [],
      query,
      method,
      totalFound: 0,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Insert a document (admin function)
   */
  async insertDocument(doc: Omit<RAGDocument, 'id' | 'created_at'>): Promise<RAGDocument | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('rag_documents')
        .insert([doc])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('[RAG] Insert document error:', error);
      return null;
    }
  }

  /**
   * Bulk insert documents (admin function)
   */
  async insertDocuments(docs: Array<Omit<RAGDocument, 'id' | 'created_at'>>): Promise<number> {
    const supabase = getSupabaseClient();
    if (!supabase) return 0;

    try {
      const { data, error } = await supabase
        .from('rag_documents')
        .insert(docs)
        .select();

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('[RAG] Bulk insert error:', error);
      return 0;
    }
  }
}

// Singleton instance
export const ragService = new RAGService();

// Export for convenience
export default ragService;

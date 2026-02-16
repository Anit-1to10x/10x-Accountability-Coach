/**
 * RAG Module - Retrieval Augmented Generation
 * Exports all RAG functionality for the application
 */

export { ragService, type RAGDocument, type RAGQueryOptions, type RAGSearchResult, type RAGContext } from './rag-service';
export { getSupabaseClient, isSupabaseConfigured } from './supabase-client';

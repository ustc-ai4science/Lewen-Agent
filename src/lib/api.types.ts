export type SessionStatus = "idle" | "ITERATING" | "PAUSED" | "COMPLETED";
export type PaperSource = "search" | "expand";
export type ConfidenceLevel = "high" | "medium" | "low";
export type CitationFormat = "bibtex" | "ris" | "text";
export type AnswerMode = "strict" | "balanced";

export interface ApiSuccess<T> {
  code: 0;
  message: "ok";
  request_id: string;
  data: T;
}

export interface ApiError {
  code: number;
  message: string;
  request_id: string;
  error: {
    type: string;
    details: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface AgentState {
  currentStep: number;
  totalSteps: number;
  searchCount: number;
  expandCount: number;
  paperCount: number;
  scannedCount: number;
  isSearching: boolean;
}

export interface PaperItem {
  id: string;
  title: string;
  authors: string;
  year: string;
  abstract: string;
  url: string;
  isExpanded: boolean;
  isExpanding: boolean;
  score: number;
  source: PaperSource;
  origin: string;
}

export interface AnswerEvidenceItem {
  claim: string;
  paper_ids: string[];
  confidence: ConfidenceLevel;
}

export interface AnswerBlock {
  summary: string;
  key_evidence: AnswerEvidenceItem[];
  limitations: string[];
  next_questions: string[];
}

export interface CitationItem {
  paper_id: string;
  format: CitationFormat;
  content: string;
}

export interface CreateSessionRequest {
  query: string;
  max_steps?: number;
}

export interface CreateSessionData {
  session_id: string;
  status: SessionStatus;
}

export interface GetSessionData {
  status: SessionStatus;
  agentState: AgentState;
  papers: PaperItem[];
}

export interface ControlSessionData {
  status: SessionStatus;
}

export interface ExpandPaperRequest {
  arxiv_id: string;
}

export interface ExpandPaperData {
  accepted: boolean;
  arxiv_id: string;
}

export interface GetAnswerQuery {
  mode?: AnswerMode;
}

export interface GetAnswerData {
  answer: AnswerBlock;
  confidence: ConfidenceLevel;
  evidence_cards: PaperItem[];
}

export interface GetCitationsData {
  format: CitationFormat;
  items: CitationItem[];
}

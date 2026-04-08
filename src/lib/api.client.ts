import type {
  ApiResponse,
  CitationFormat,
  CreateSessionData,
  CreateSessionRequest,
  ExpandPaperData,
  ExpandPaperRequest,
  GetAnswerData,
  GetAnswerQuery,
  GetCitationsData,
  GetSessionData,
  ControlSessionData
} from "./api.types";

interface RequestOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface ApiClientOptions {
  baseUrl: string;
  token?: string;
  defaultTimeoutMs?: number;
}

function joinUrl(base: string, path: string): string {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${b}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) q.set(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { code: 1500, message: text, request_id: "invalid_json", error: { type: "INVALID_JSON", details: {} } };
  }
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly token?: string;
  private readonly defaultTimeoutMs: number;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.token = options.token;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 20000;
  }

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (body !== undefined) headers["Content-Type"] = "application/json";
      if (this.token) headers.Authorization = `Bearer ${this.token}`;

      const res = await fetch(joinUrl(this.baseUrl, path), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: options?.signal ?? controller.signal
      });

      const payload = (await parseJsonSafe(res)) as ApiResponse<T>;
      if (!res.ok && (!payload || typeof payload !== "object")) {
        return {
          code: 1500,
          message: `http error ${res.status}`,
          request_id: "http_error",
          error: { type: "HTTP_ERROR", details: { status: res.status } }
        };
      }
      return payload;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return {
          code: 3005,
          message: "request timeout or aborted",
          request_id: "client_abort",
          error: { type: "DEPENDENCY_TIMEOUT", details: {} }
        };
      }
      return {
        code: 1500,
        message: "unexpected client error",
        request_id: "client_error",
        error: { type: "INTERNAL_ERROR", details: { reason: String(err) } }
      };
    } finally {
      clearTimeout(timer);
    }
  }

  createSession(payload: CreateSessionRequest): Promise<ApiResponse<CreateSessionData>> {
    return this.request("POST", "/sessions", payload);
  }

  getSession(sessionId: string): Promise<ApiResponse<GetSessionData>> {
    return this.request("GET", `/sessions/${encodeURIComponent(sessionId)}`);
  }

  pauseSession(sessionId: string): Promise<ApiResponse<ControlSessionData>> {
    return this.request("POST", `/sessions/${encodeURIComponent(sessionId)}/pause`, {});
  }

  resumeSession(sessionId: string): Promise<ApiResponse<ControlSessionData>> {
    return this.request("POST", `/sessions/${encodeURIComponent(sessionId)}/resume`, {});
  }

  stopSession(sessionId: string): Promise<ApiResponse<ControlSessionData>> {
    return this.request("POST", `/sessions/${encodeURIComponent(sessionId)}/stop`, {});
  }

  expandPaper(sessionId: string, payload: ExpandPaperRequest): Promise<ApiResponse<ExpandPaperData>> {
    return this.request("POST", `/sessions/${encodeURIComponent(sessionId)}/expand`, payload);
  }

  getAnswer(sessionId: string, query?: GetAnswerQuery): Promise<ApiResponse<GetAnswerData>> {
    const q = buildQuery({ mode: query?.mode });
    return this.request("GET", `/sessions/${encodeURIComponent(sessionId)}/answer${q}`);
  }

  getCitations(sessionId: string, format: CitationFormat, paperIds?: string[]): Promise<ApiResponse<GetCitationsData>> {
    const q = buildQuery({
      format,
      paper_ids: paperIds && paperIds.length > 0 ? paperIds.join(",") : undefined
    });
    return this.request("GET", `/sessions/${encodeURIComponent(sessionId)}/citations${q}`);
  }
}

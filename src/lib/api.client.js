function joinUrl(base, path) {
    const b = base.endsWith("/") ? base.slice(0, -1) : base;
    return `${b}${path.startsWith("/") ? path : `/${path}`}`;
}
function buildQuery(params) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined)
            q.set(k, v);
    });
    const s = q.toString();
    return s ? `?${s}` : "";
}
async function parseJsonSafe(res) {
    const text = await res.text();
    if (!text)
        return null;
    try {
        return JSON.parse(text);
    }
    catch {
        return { code: 1500, message: text, request_id: "invalid_json", error: { type: "INVALID_JSON", details: {} } };
    }
}
export class ApiClient {
    constructor(options) {
        this.baseUrl = options.baseUrl;
        this.token = options.token;
        this.defaultTimeoutMs = options.defaultTimeoutMs ?? 20000;
    }
    async request(method, path, body, options) {
        const controller = new AbortController();
        const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const headers = { Accept: "application/json" };
            if (body !== undefined)
                headers["Content-Type"] = "application/json";
            if (this.token)
                headers.Authorization = `Bearer ${this.token}`;
            const res = await fetch(joinUrl(this.baseUrl, path), {
                method,
                headers,
                body: body === undefined ? undefined : JSON.stringify(body),
                signal: options?.signal ?? controller.signal
            });
            const payload = (await parseJsonSafe(res));
            if (!res.ok && (!payload || typeof payload !== "object")) {
                return {
                    code: 1500,
                    message: `http error ${res.status}`,
                    request_id: "http_error",
                    error: { type: "HTTP_ERROR", details: { status: res.status } }
                };
            }
            return payload;
        }
        catch (err) {
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
        }
        finally {
            clearTimeout(timer);
        }
    }
    createSession(payload) {
        return this.request("POST", "/sessions", payload);
    }
    getSession(sessionId) {
        return this.request("GET", `/sessions/${encodeURIComponent(sessionId)}`);
    }
    pauseSession(sessionId) {
        return this.request("POST", `/sessions/${encodeURIComponent(sessionId)}/pause`, {});
    }
    resumeSession(sessionId) {
        return this.request("POST", `/sessions/${encodeURIComponent(sessionId)}/resume`, {});
    }
    stopSession(sessionId) {
        return this.request("POST", `/sessions/${encodeURIComponent(sessionId)}/stop`, {});
    }
    expandPaper(sessionId, payload) {
        return this.request("POST", `/sessions/${encodeURIComponent(sessionId)}/expand`, payload);
    }
    getAnswer(sessionId, query) {
        const q = buildQuery({ mode: query?.mode });
        return this.request("GET", `/sessions/${encodeURIComponent(sessionId)}/answer${q}`);
    }
    getCitations(sessionId, format, paperIds) {
        const q = buildQuery({
            format,
            paper_ids: paperIds && paperIds.length > 0 ? paperIds.join(",") : undefined
        });
        return this.request("GET", `/sessions/${encodeURIComponent(sessionId)}/citations${q}`);
    }
}

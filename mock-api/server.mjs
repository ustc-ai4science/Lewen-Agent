import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { URL } from "node:url";
import { createFixture, listFixtures } from "./fixtures.mjs";

const PORT = Number(process.env.MOCK_API_PORT || 8787);
const HOST = process.env.MOCK_API_HOST || "127.0.0.1";
const sessions = new Map();

function jsonClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function success(data, requestId = randomUUID()) {
  return {
    statusCode: 200,
    body: {
      code: 0,
      message: "ok",
      request_id: requestId,
      data
    }
  };
}

function failure(code, message, type, statusCode = 400, details = {}, requestId = randomUUID()) {
  return {
    statusCode,
    body: {
      code,
      message,
      request_id: requestId,
      error: {
        type,
        details
      }
    }
  };
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
}

function createSessionRecord(payload = {}) {
  const fixture = createFixture(payload.query);
  const sessionId = `sess_${randomUUID().slice(0, 8)}`;
  return {
    sessionId,
    query: fixture.query,
    maxSteps: payload.max_steps || fixture.maxSteps,
    createdAt: Date.now(),
    updatedAt: nowIso(),
    statusOverride: null,
    stopAt: null,
    pauseStartedAt: null,
    pausedDurationMs: 0,
    expandedPaperIds: new Set(),
    fixture
  };
}

function getElapsedMs(session) {
  if (session.pauseStartedAt) {
    return session.pauseStartedAt - session.createdAt - session.pausedDurationMs;
  }
  if (session.stopAt) {
    return session.stopAt - session.createdAt - session.pausedDurationMs;
  }
  return Date.now() - session.createdAt - session.pausedDurationMs;
}

function getPhase(session) {
  const elapsed = getElapsedMs(session);
  let current = session.fixture.phases[0];
  for (const phase of session.fixture.phases) {
    if (elapsed >= phase.afterMs) current = phase;
  }
  return current;
}

function buildSessionState(session) {
  const phase = getPhase(session);
  const shownPapers = session.fixture.basePapers.slice(0, phase.papersShown).map((paper) => {
    const nextPaper = jsonClone(paper);
    if (session.expandedPaperIds.has(paper.id)) nextPaper.isExpanded = true;
    return nextPaper;
  });

  if (session.expandedPaperIds.size > 0 && !shownPapers.some((paper) => paper.id === session.fixture.expandedPaper.id)) {
    shownPapers.push(jsonClone(session.fixture.expandedPaper));
  }

  const status = session.statusOverride || phase.status;
  return {
    status,
    agentState: {
      currentStep: phase.currentStep,
      totalSteps: session.maxSteps,
      searchCount: phase.searchCount,
      expandCount: phase.expandCount + session.expandedPaperIds.size,
      paperCount: shownPapers.length,
      scannedCount: phase.scannedCount + session.expandedPaperIds.size * 3,
      isSearching: status === "ITERATING"
    },
    papers: shownPapers
  };
}

function filterCitationIds(sessionState, searchParams) {
  const requested = searchParams.get("paper_ids");
  if (!requested) return sessionState.papers.map((paper) => paper.id);
  const allowed = new Set(sessionState.papers.map((paper) => paper.id));
  return requested
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id && allowed.has(id));
}

function writeJson(res, response) {
  res.writeHead(response.statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  });
  res.end(JSON.stringify(response.body));
}

function getSessionOrFail(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) {
    return failure(1404, "session not found", "SESSION_NOT_FOUND", 404);
  }
  return session;
}

const server = createServer(async (req, res) => {
  if (!req.url || !req.method) {
    writeJson(res, failure(1500, "invalid request", "INTERNAL_ERROR", 500));
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  const path = url.pathname;

  try {
    if (req.method === "GET" && path === "/mock/cases") {
      writeJson(res, success({ items: listFixtures() }));
      return;
    }

    if (req.method === "POST" && path === "/sessions") {
      const payload = await readJson(req);
      const session = createSessionRecord(payload);
      sessions.set(session.sessionId, session);
      writeJson(
        res,
        success({
          session_id: session.sessionId,
          status: "ITERATING",
          mock_case_id: session.fixture.id
        })
      );
      return;
    }

    const sessionMatch = path.match(/^\/sessions\/([^/]+)$/);
    if (req.method === "GET" && sessionMatch) {
      const resolved = getSessionOrFail(sessionMatch[1]);
      if ("statusCode" in resolved) {
        writeJson(res, resolved);
        return;
      }
      writeJson(res, success(buildSessionState(resolved)));
      return;
    }

    const pauseMatch = path.match(/^\/sessions\/([^/]+)\/pause$/);
    if (req.method === "POST" && pauseMatch) {
      const resolved = getSessionOrFail(pauseMatch[1]);
      if ("statusCode" in resolved) {
        writeJson(res, resolved);
        return;
      }
      if (!resolved.pauseStartedAt) resolved.pauseStartedAt = Date.now();
      resolved.statusOverride = "PAUSED";
      resolved.updatedAt = nowIso();
      writeJson(res, success({ status: "PAUSED" }));
      return;
    }

    const resumeMatch = path.match(/^\/sessions\/([^/]+)\/resume$/);
    if (req.method === "POST" && resumeMatch) {
      const resolved = getSessionOrFail(resumeMatch[1]);
      if ("statusCode" in resolved) {
        writeJson(res, resolved);
        return;
      }
      if (resolved.pauseStartedAt) {
        resolved.pausedDurationMs += Date.now() - resolved.pauseStartedAt;
      }
      resolved.pauseStartedAt = null;
      resolved.statusOverride = "ITERATING";
      resolved.updatedAt = nowIso();
      writeJson(res, success({ status: "ITERATING" }));
      return;
    }

    const stopMatch = path.match(/^\/sessions\/([^/]+)\/stop$/);
    if (req.method === "POST" && stopMatch) {
      const resolved = getSessionOrFail(stopMatch[1]);
      if ("statusCode" in resolved) {
        writeJson(res, resolved);
        return;
      }
      resolved.stopAt = Date.now();
      resolved.pauseStartedAt = null;
      resolved.statusOverride = "COMPLETED";
      resolved.updatedAt = nowIso();
      writeJson(res, success({ status: "COMPLETED" }));
      return;
    }

    const expandMatch = path.match(/^\/sessions\/([^/]+)\/expand$/);
    if (req.method === "POST" && expandMatch) {
      const resolved = getSessionOrFail(expandMatch[1]);
      if ("statusCode" in resolved) {
        writeJson(res, resolved);
        return;
      }
      const payload = await readJson(req);
      const paperId = payload.arxiv_id;
      const current = buildSessionState(resolved).papers;
      if (!current.some((paper) => paper.id === paperId)) {
        writeJson(res, failure(2404, "paper not found in session", "PAPER_NOT_FOUND_IN_POOL", 404));
        return;
      }
      resolved.expandedPaperIds.add(paperId);
      resolved.updatedAt = nowIso();
      writeJson(res, success({ accepted: true, arxiv_id: paperId }));
      return;
    }

    const answerMatch = path.match(/^\/sessions\/([^/]+)\/answer$/);
    if (req.method === "GET" && answerMatch) {
      const resolved = getSessionOrFail(answerMatch[1]);
      if ("statusCode" in resolved) {
        writeJson(res, resolved);
        return;
      }
      const sessionState = buildSessionState(resolved);
      writeJson(
        res,
        success({
          answer: jsonClone(resolved.fixture.answer),
          confidence: "high",
          evidence_cards: sessionState.papers
        })
      );
      return;
    }

    const citationsMatch = path.match(/^\/sessions\/([^/]+)\/citations$/);
    if (req.method === "GET" && citationsMatch) {
      const resolved = getSessionOrFail(citationsMatch[1]);
      if ("statusCode" in resolved) {
        writeJson(res, resolved);
        return;
      }
      const format = url.searchParams.get("format") || "bibtex";
      const sessionState = buildSessionState(resolved);
      const ids = filterCitationIds(sessionState, url.searchParams);
      const items = ids.map((paperId) => ({
        paper_id: paperId,
        format,
        content: resolved.fixture.citations[paperId]?.[format] || resolved.fixture.citations[paperId]?.text || ""
      }));
      writeJson(res, success({ format, items }));
      return;
    }

    writeJson(res, failure(1404, "route not found", "ROUTE_NOT_FOUND", 404));
  } catch (error) {
    writeJson(
      res,
      failure(1500, "mock api internal error", "INTERNAL_ERROR", 500, { reason: String(error) })
    );
  }
});

server.listen(PORT, HOST, () => {
  console.log(`mock api ready at http://${HOST}:${PORT}`);
});

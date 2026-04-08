import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { ApiClient } from "./lib/api.client";
import brandLogo from "./assets/lewen-logo.svg";
const DEFAULT_MAX_STEPS = 12;
const QUICK_MAX_STEPS = 5;
const SEARCH_DEPTH_OPTIONS = [
    { value: "quick", label: "快速搜索", maxSteps: QUICK_MAX_STEPS },
    { value: "deep", label: "深度检索", maxSteps: DEFAULT_MAX_STEPS }
];
const PREVIEW_AGENT_STATE = {
    currentStep: 8,
    totalSteps: 12,
    searchCount: 6,
    expandCount: 2,
    paperCount: 4,
    scannedCount: 39,
    isSearching: false
};
const PREVIEW_PAPERS = [
    {
        id: "1706.03762",
        title: "Attention Is All You Need",
        authors: "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones",
        year: "2017",
        abstract: "The Transformer replaces recurrence with multi-head self-attention, allowing each token to directly aggregate information from distant positions while remaining highly parallelizable.",
        url: "https://arxiv.org/abs/1706.03762",
        isExpanded: true,
        isExpanding: false,
        score: 0.96,
        source: "search",
        origin: "preview"
    },
    {
        id: "1803.02155",
        title: "Generating Wikipedia by Summarizing Long Sequences",
        authors: "Angela Fan, Mike Lewis, Yann Dauphin",
        year: "2018",
        abstract: "This work shows how sparse and efficient attention variants help sequence models capture long-range dependencies when input length becomes very large.",
        url: "https://arxiv.org/abs/1803.02155",
        isExpanded: false,
        isExpanding: false,
        score: 0.89,
        source: "search",
        origin: "preview"
    },
    {
        id: "1904.10509",
        title: "Transformer-XL: Attentive Language Models Beyond a Fixed-Length Context",
        authors: "Zihang Dai, Zhilin Yang, Yiming Yang, Jaime Carbonell",
        year: "2019",
        abstract: "Transformer-XL extends the context window through segment-level recurrence, improving the model's ability to preserve and use long-term information across segments.",
        url: "https://arxiv.org/abs/1904.10509",
        isExpanded: false,
        isExpanding: false,
        score: 0.87,
        source: "expand",
        origin: "preview"
    },
    {
        id: "2004.05150",
        title: "Longformer: The Long-Document Transformer",
        authors: "Iz Beltagy, Matthew E. Peters, Arman Cohan",
        year: "2020",
        abstract: "Longformer introduces sparse attention patterns that preserve relevance over long documents while keeping computation manageable for long-context tasks.",
        url: "https://arxiv.org/abs/2004.05150",
        isExpanded: false,
        isExpanding: false,
        score: 0.83,
        source: "expand",
        origin: "preview"
    }
];
const PREVIEW_ANSWER = {
    summary: "Attention mechanisms improve long-range dependency modeling by letting each token directly attend to distant tokens instead of passing information step by step through recurrence. The strongest evidence shows this reduces path length for dependency propagation, improves parallelism, and scales better when paired with sparse or segment-level attention variants.",
    key_evidence: [
        {
            claim: "Self-attention creates direct token-to-token connections, which shortens the effective path between distant positions.",
            paper_ids: ["1706.03762"],
            confidence: "high"
        },
        {
            claim: "Long-context transformer variants preserve these benefits at larger sequence lengths by using recurrence or sparse attention patterns.",
            paper_ids: ["1904.10509", "2004.05150"],
            confidence: "high"
        },
        {
            claim: "Empirical results across language generation tasks show better retention of long-range information than fixed-window baselines.",
            paper_ids: ["1803.02155", "1904.10509"],
            confidence: "medium"
        }
    ],
    limitations: [
        "Attention alone does not remove quadratic cost unless paired with sparse or memory-efficient variants.",
        "Different long-context architectures trade off fidelity, efficiency, and implementation complexity."
    ],
    next_questions: [
        "What are the best sparse attention designs for long-context LLMs?",
        "How does attention compare with recurrence on streaming tasks?"
    ]
};
const MOCK_ACCOUNT_PROFILE = {
    name: "陈明月",
    nickname: "明月",
    handle: "cmy-lab",
    avatarTheme: "ember",
    gender: "男",
    email: "chenmingyue@cmylab.ai",
    almaMater: "中国科学技术大学",
    role: "LLM 检索与学术工作流",
    initials: "CM",
    institution: "Academic AI Lab",
    plan: "Plus"
};
const MOCK_SEARCH_HISTORY = [
    {
        id: "hist-1",
        query: "How do transformer attention mechanisms improve long-range dependency modeling?",
        time: "今天 14:20",
        resultCount: 5,
        note: "已整理出长程依赖建模的核心结论和 5 篇高相关论文。"
    },
    {
        id: "hist-2",
        query: "What is the current evidence for retrieval-augmented generation in medicine?",
        time: "昨天 21:08",
        resultCount: 6,
        note: "重点关注医学问答、幻觉控制和临床证据可追溯性。"
    },
    {
        id: "hist-3",
        query: "Which evaluation metrics matter most for long-context document QA systems?",
        time: "3 月 6 日",
        resultCount: 4,
        note: "保留了长上下文问答常见指标与评测局限。"
    }
];
const MOCK_SAVED_PAPERS = [
    {
        id: "save-1",
        title: "Attention Is All You Need",
        authors: "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit",
        year: "2017",
        savedAt: "今天 14:28",
        note: "Transformer 起点论文，适合放在长程依赖建模综述的开头。",
        url: "https://arxiv.org/abs/1706.03762"
    },
    {
        id: "save-2",
        title: "Transformer-XL: Attentive Language Models Beyond a Fixed-Length Context",
        authors: "Zihang Dai, Zhilin Yang, Yiming Yang, Jaime Carbonell",
        year: "2019",
        savedAt: "昨天 21:16",
        note: "适合说明 segment recurrence 如何缓解固定上下文窗口问题。",
        url: "https://arxiv.org/abs/1901.02860"
    },
    {
        id: "save-3",
        title: "Longformer: The Long-Document Transformer",
        authors: "Iz Beltagy, Matthew E. Peters, Arman Cohan",
        year: "2020",
        savedAt: "3 月 6 日",
        note: "可作为稀疏注意力路线的代表论文。",
        url: "https://arxiv.org/abs/2004.05150"
    }
];
const MOCK_LAB_FEATURES = [
    {
        id: "lab-0",
        title: "论文检索页",
        badge: "New",
        query: "Give me papers that share some insights about how large language models gain in-context learning capability in the process of pre-training.",
        view: "paper-search"
    },
    {
        id: "lab-1",
        title: "深度追问",
        badge: "Beta",
        query: "Compare long-context retrieval strategies for academic QA systems and summarize the trade-offs."
    },
    {
        id: "lab-2",
        title: "对比阅读",
        badge: "New",
        query: "Compare Transformer-XL, Longformer, and Mamba for long-range dependency modeling in academic tasks."
    },
    {
        id: "lab-3",
        title: "科言文修",
        badge: "姐妹产品",
        query: "",
        href: "https://writelearn.bdaa.pro/"
    }
];
const EXAMPLE_QUERIES = [
    "Transformer 注意力机制如何建模长程依赖",
    "RAG 在医疗问答中的应用与局限",
    "大语言模型 Chain-of-Thought 推理机制",
    "时间序列异常检测方法综述",
];
const PAPER_FINDER_EXAMPLES = [
    {
        label: "ICL 与预训练",
        note: "看 emergence / pretraining dynamics",
        query: "Give me papers that share some insights about how large language models gain in-context learning capability in the process of pre-training."
    },
    {
        label: "医学 RAG",
        note: "看 current evidence / limitations",
        query: "What is the current evidence for retrieval-augmented generation in medicine?"
    },
    {
        label: "长程依赖",
        note: "看 transformer attention 机制",
        query: "How do transformer attention mechanisms improve long-range dependency modeling?"
    }
];
const AVATAR_THEME_OPTIONS = [
    { value: "ember", label: "暖橙" },
    { value: "forest", label: "青绿" },
    { value: "ink", label: "深墨" }
];
function isError(res) {
    return res.code !== 0;
}
function downloadText(content, name) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
}
function getStatusLabel(status) {
    if (status === "ITERATING")
        return "搜索中";
    if (status === "PAUSED")
        return "已暂停";
    if (status === "COMPLETED")
        return "已完成";
    return "待开始";
}
function getAvatarThemeClass(theme) {
    return `is-${theme}`;
}
function getNarrative(status, agentState, papers) {
    if (status === "idle") {
        return "为探索未知的人，搭一座通往知识的桥";
    }
    if (status === "PAUSED") {
        return `搜索已暂停，当前保留 ${papers} 篇高相关论文。`;
    }
    if (status === "COMPLETED") {
        if (!agentState)
            return `搜索完成，保留了 ${papers} 篇值得看的论文。`;
        return `已筛过 ${agentState.scannedCount} 篇候选，最后保留 ${agentState.paperCount} 篇高相关结果。`;
    }
    if (!agentState || papers === 0) {
        return "正在理解问题并打开第一批相关论文。";
    }
    return `正在筛选与扩展，已保留 ${papers} 篇值得看的论文。`;
}
function getPaperFinderNarrative(status, agentState, papers) {
    if (status === "idle") {
        return "更接近 PaSa 的交互：输入 academic query，直接展开论文列表。";
    }
    if (status === "PAUSED") {
        return `检索已暂停，当前弹出了 ${papers} 篇相关论文。`;
    }
    if (status === "COMPLETED") {
        if (!agentState)
            return `检索完成，当前共有 ${papers} 篇论文结果。`;
        return `已浏览 ${agentState.scannedCount} 篇候选，当前保留 ${papers} 篇。`;
    }
    if (!agentState || papers === 0) {
        return "正在理解 query 并打开第一批论文。";
    }
    return `正在持续补充论文列表，当前已保留 ${papers} 篇。`;
}
function getRelevanceLabel(score) {
    if (score >= 0.9)
        return "高度相关";
    if (score >= 0.78)
        return "优先阅读";
    return "相关";
}
function getInitialAppView() {
    return "main";
}
function syncAppViewInUrl(view) {
    if (typeof window === "undefined")
        return;
    const url = new URL(window.location.href);
    if (view === "main") {
        url.searchParams.delete("page");
    }
    else {
        url.searchParams.set("page", view);
    }
    window.history.pushState({}, "", url);
}
function buildEvidenceLookup(answer) {
    if (!answer)
        return {};
    return answer.key_evidence.reduce((acc, item) => {
        item.paper_ids.forEach((paperId) => {
            if (!acc[paperId])
                acc[paperId] = [];
            acc[paperId].push(item.claim);
        });
        return acc;
    }, {});
}
function getAnswerHeadline(status, hasAnswer) {
    if (hasAnswer)
        return "先给你结论，再给你来源";
    if (status === "COMPLETED")
        return "正在整理最终回答";
    if (status === "PAUSED")
        return "当前搜索已暂停";
    return "正在整理值得看的结论";
}
function getConfidenceLabel(confidence) {
    if (confidence === "high")
        return "高度可信";
    if (confidence === "medium")
        return "中等可信";
    return "待验证";
}
function SearchGlyph() {
    return (_jsxs("svg", { "aria-hidden": "true", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { cx: "11", cy: "11", r: "6.5", stroke: "currentColor", strokeWidth: "2.2" }), _jsx("path", { d: "M16 16L20 20", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "2.2" })] }));
}
function LabGlyph() {
    return (_jsxs("svg", { "aria-hidden": "true", fill: "none", viewBox: "0 0 24 24", children: [_jsx("path", { d: "M9 3H15", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "2" }), _jsx("path", { d: "M10 3V8L5.8 15.2C4.6 17.4 6.1 20 8.6 20H15.4C17.9 20 19.4 17.4 18.2 15.2L14 8V3", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2" }), _jsx("path", { d: "M8 14C9.5 13.6 10.4 13.8 11.5 14.5C12.8 15.3 13.8 15.4 16 14.4", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "2" })] }));
}
function ChevronGlyph() {
    return (_jsx("svg", { "aria-hidden": "true", fill: "none", viewBox: "0 0 16 16", width: "14", height: "14", children: _jsx("path", { d: "M4 6L8 10L12 6", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.8" }) }));
}
function SearchDepthSelect({ value, onChange }) {
    return (_jsx("label", { className: "search-depth-select", children: _jsx("select", { value: value, onChange: (event) => onChange(event.target.value), children: SEARCH_DEPTH_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) }) }));
}
export function App() {
    const previewMode = useMemo(() => {
        if (typeof window === "undefined")
            return "";
        return new URLSearchParams(window.location.search).get("preview") ?? "";
    }, []);
    const [appView, setAppView] = useState(() => getInitialAppView());
    const isResultsPreview = previewMode === "results";
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
    const api = useMemo(() => new ApiClient({ baseUrl: apiBaseUrl }), [apiBaseUrl]);
    const timerRef = useRef(null);
    const finderTimerRef = useRef(null);
    const searchInputRef = useRef(null);
    const finderInputRef = useRef(null);
    const finderResultsRef = useRef(null);
    const labMenuRef = useRef(null);
    const accountMenuRef = useRef(null);
    const modeWrapRef = useRef(null);
    const [query, setQuery] = useState(isResultsPreview ? "How do transformer attention mechanisms improve long-range dependency modeling?" : "");
    const [sessionId, setSessionId] = useState(isResultsPreview ? "preview-session" : "");
    const [status, setStatus] = useState(isResultsPreview ? "COMPLETED" : "idle");
    const [agentState, setAgentState] = useState(isResultsPreview ? PREVIEW_AGENT_STATE : null);
    const [papers, setPapers] = useState(isResultsPreview ? PREVIEW_PAPERS : []);
    const [answer, setAnswer] = useState(isResultsPreview ? PREVIEW_ANSWER : null);
    const [confidence, setConfidence] = useState(isResultsPreview ? "high" : "-");
    const [message, setMessage] = useState("");
    const [citationFormat, setCitationFormat] = useState("bibtex");
    const [expandedIds, setExpandedIds] = useState({});
    const [answeredSessionId, setAnsweredSessionId] = useState(isResultsPreview ? "preview-session" : "");
    const [showAllSources, setShowAllSources] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAnswerLoading, setIsAnswerLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [savedPaperIds, setSavedPaperIds] = useState(new Set());
    const [isLabMenuOpen, setIsLabMenuOpen] = useState(false);
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
    const [accountSection, setAccountSection] = useState("overview");
    const [accountProfile, setAccountProfile] = useState(MOCK_ACCOUNT_PROFILE);
    const [profileDraft, setProfileDraft] = useState(MOCK_ACCOUNT_PROFILE);
    const [showModeMenu, setShowModeMenu] = useState(false);
    const [finderQuery, setFinderQuery] = useState("");
    const [finderSessionId, setFinderSessionId] = useState("");
    const [finderStatus, setFinderStatus] = useState("idle");
    const [finderAgentState, setFinderAgentState] = useState(null);
    const [finderPapers, setFinderPapers] = useState([]);
    const [finderMessage, setFinderMessage] = useState("");
    const [finderExpandedIds, setFinderExpandedIds] = useState({});
    const [finderIsSubmitting, setFinderIsSubmitting] = useState(false);
    const [showAllFinderSources, setShowAllFinderSources] = useState(false);
    const [searchDepthMode, setSearchDepthMode] = useState("deep");
    const [resultView, setResultView] = useState("compact");
    const selectedMaxSteps = searchDepthMode === "quick" ? QUICK_MAX_STEPS : DEFAULT_MAX_STEPS;
    useEffect(() => {
        return () => {
            if (timerRef.current !== null)
                window.clearInterval(timerRef.current);
            if (finderTimerRef.current !== null)
                window.clearInterval(finderTimerRef.current);
        };
    }, []);
    useEffect(() => {
        const handlePopState = () => {
            setAppView(getInitialAppView());
        };
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);
    useEffect(() => {
        if (!showModeMenu)
            return;
        function handleClick(e) {
            if (modeWrapRef.current && !modeWrapRef.current.contains(e.target)) {
                setShowModeMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [showModeMenu]);
    // 首页自动聚焦搜索框
    useEffect(() => {
        if (!isResultsPreview) {
            searchInputRef.current?.focus();
        }
    }, []);
    useEffect(() => {
        if (appView === "paper-search") {
            finderInputRef.current?.focus();
        }
    }, [appView]);
    useEffect(() => {
        if (appView !== "paper-search")
            return;
        if (finderStatus === "idle")
            return;
        finderResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [appView, finderStatus]);
    useEffect(() => {
        if (!isAccountMenuOpen && !isLabMenuOpen)
            return;
        const handlePointerDown = (event) => {
            const target = event.target;
            if (accountMenuRef.current?.contains(target))
                return;
            if (labMenuRef.current?.contains(target))
                return;
            setIsAccountMenuOpen(false);
            setIsLabMenuOpen(false);
        };
        window.addEventListener("mousedown", handlePointerDown);
        return () => window.removeEventListener("mousedown", handlePointerDown);
    }, [isAccountMenuOpen, isLabMenuOpen]);
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key !== "Escape")
                return;
            setIsLabMenuOpen(false);
            setIsAccountMenuOpen(false);
            setIsAccountDrawerOpen(false);
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, []);
    const syncSession = async (sid) => {
        if (isResultsPreview)
            return;
        const res = await api.getSession(sid);
        if (isError(res)) {
            setMessage(`查询状态失败: ${res.message}`);
            return;
        }
        setStatus(res.data.status);
        setAgentState(res.data.agentState);
        setPapers(res.data.papers);
        if (res.data.status === "COMPLETED" && timerRef.current !== null) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };
    const startPolling = (sid) => {
        if (isResultsPreview)
            return;
        if (timerRef.current !== null)
            window.clearInterval(timerRef.current);
        timerRef.current = window.setInterval(() => {
            void syncSession(sid);
        }, 1500);
    };
    const fetchAnswer = async (sid, silent = false) => {
        if (isResultsPreview)
            return;
        setIsAnswerLoading(true);
        const res = await api.getAnswer(sid, { mode: "balanced" });
        if (isError(res)) {
            if (!silent)
                setMessage(`整理回答失败: ${res.message}`);
            setIsAnswerLoading(false);
            return;
        }
        setAnswer(res.data.answer);
        setConfidence(res.data.confidence);
        setIsAnswerLoading(false);
    };
    useEffect(() => {
        if (!sessionId || status !== "COMPLETED" || answeredSessionId === sessionId)
            return;
        setAnsweredSessionId(sessionId);
        void fetchAnswer(sessionId, true);
    }, [answeredSessionId, sessionId, status]);
    const createSession = async (overrideQuery) => {
        if (isResultsPreview)
            return;
        const q = (overrideQuery ?? query).trim();
        if (!q || isSubmitting)
            return;
        setIsSubmitting(true);
        setResultView("compact");
        setMessage("");
        setAnswer(null);
        setConfidence("-");
        setPapers([]);
        setAgentState(null);
        setAnsweredSessionId("");
        setShowAllSources(false);
        const res = await api.createSession({ query: q, max_steps: selectedMaxSteps });
        if (isError(res)) {
            setMessage(`创建会话失败: ${res.message}`);
            setIsSubmitting(false);
            return;
        }
        setSessionId(res.data.session_id);
        setStatus(res.data.status);
        await syncSession(res.data.session_id);
        startPolling(res.data.session_id);
        setIsSubmitting(false);
    };
    const handleCreateSession = async (event) => {
        event.preventDefault();
        await createSession();
    };
    const handleQueryKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void createSession();
        }
    };
    const handleStopSearch = async () => {
        if (isResultsPreview)
            return;
        if (!sessionId)
            return;
        const res = await api.stopSession(sessionId);
        if (isError(res)) {
            setMessage(`停止搜索失败: ${res.message}`);
            return;
        }
        setStatus(res.data.status);
        if (timerRef.current !== null) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setMessage("已停止当前搜索。");
    };
    const handleResumeSearch = async () => {
        if (isResultsPreview)
            return;
        if (!sessionId)
            return;
        const res = await api.resumeSession(sessionId);
        if (isError(res)) {
            setMessage(`继续搜索失败: ${res.message}`);
            return;
        }
        setStatus(res.data.status);
        startPolling(sessionId);
        setMessage("已继续当前搜索。");
    };
    const syncFinderSession = async (sid) => {
        if (isResultsPreview)
            return;
        const res = await api.getSession(sid);
        if (isError(res)) {
            setFinderMessage(`查询状态失败: ${res.message}`);
            return;
        }
        setFinderStatus(res.data.status);
        setFinderAgentState(res.data.agentState);
        setFinderPapers(res.data.papers);
        if (res.data.status === "COMPLETED" && finderTimerRef.current !== null) {
            window.clearInterval(finderTimerRef.current);
            finderTimerRef.current = null;
        }
    };
    const startFinderPolling = (sid) => {
        if (isResultsPreview)
            return;
        if (finderTimerRef.current !== null)
            window.clearInterval(finderTimerRef.current);
        finderTimerRef.current = window.setInterval(() => {
            void syncFinderSession(sid);
        }, 1500);
    };
    const createFinderSession = async (overrideQuery) => {
        if (isResultsPreview)
            return;
        const q = (overrideQuery ?? finderQuery).trim();
        if (!q || finderIsSubmitting)
            return;
        setFinderIsSubmitting(true);
        setFinderMessage("");
        setFinderPapers([]);
        setFinderAgentState(null);
        setFinderExpandedIds({});
        setShowAllFinderSources(false);
        const res = await api.createSession({ query: q, max_steps: selectedMaxSteps });
        if (isError(res)) {
            setFinderMessage(`创建会话失败: ${res.message}`);
            setFinderIsSubmitting(false);
            return;
        }
        setFinderQuery(q);
        setFinderSessionId(res.data.session_id);
        setFinderStatus(res.data.status);
        await syncFinderSession(res.data.session_id);
        startFinderPolling(res.data.session_id);
        setFinderIsSubmitting(false);
    };
    const handleFinderCreateSession = async (event) => {
        event.preventDefault();
        await createFinderSession();
    };
    const handleFinderKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void createFinderSession();
        }
    };
    const handleFinderStopSearch = async () => {
        if (isResultsPreview || !finderSessionId)
            return;
        const res = await api.stopSession(finderSessionId);
        if (isError(res)) {
            setFinderMessage(`停止搜索失败: ${res.message}`);
            return;
        }
        setFinderStatus(res.data.status);
        if (finderTimerRef.current !== null) {
            window.clearInterval(finderTimerRef.current);
            finderTimerRef.current = null;
        }
        setFinderMessage("已停止当前检索。");
    };
    const handleFinderResumeSearch = async () => {
        if (isResultsPreview || !finderSessionId)
            return;
        const res = await api.resumeSession(finderSessionId);
        if (isError(res)) {
            setFinderMessage(`继续搜索失败: ${res.message}`);
            return;
        }
        setFinderStatus(res.data.status);
        startFinderPolling(finderSessionId);
        setFinderMessage("已继续当前检索。");
    };
    const handleFinderExpand = async (paperId) => {
        if (isResultsPreview || !finderSessionId)
            return;
        setFinderExpandedIds((prev) => ({ ...prev, [paperId]: true }));
        const res = await api.expandPaper(finderSessionId, { arxiv_id: paperId });
        if (isError(res)) {
            setFinderMessage(`继续找关联失败: ${res.message}`);
            setFinderExpandedIds((prev) => ({ ...prev, [paperId]: false }));
            return;
        }
        setFinderMessage("正在继续扩展关联论文。");
        await syncFinderSession(finderSessionId);
        setFinderExpandedIds((prev) => ({ ...prev, [paperId]: false }));
    };
    const handleExpand = async (paperId) => {
        if (isResultsPreview)
            return;
        if (!sessionId)
            return;
        setExpandedIds((prev) => ({ ...prev, [paperId]: true }));
        const res = await api.expandPaper(sessionId, { arxiv_id: paperId });
        if (isError(res)) {
            setMessage(`继续找关联失败: ${res.message}`);
            setExpandedIds((prev) => ({ ...prev, [paperId]: false }));
            return;
        }
        setMessage("正在继续扩展关联论文。");
        await syncSession(sessionId);
        setExpandedIds((prev) => ({ ...prev, [paperId]: false }));
    };
    const handleExportCitations = async () => {
        if (isResultsPreview)
            return;
        if (!sessionId)
            return;
        setIsExporting(true);
        setMessage("");
        const res = await api.getCitations(sessionId, citationFormat);
        if (isError(res)) {
            setMessage(`导出失败: ${res.message}`);
            setIsExporting(false);
            return;
        }
        const body = res.data.items.map((item) => item.content).join("\n\n");
        const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
        downloadText(body, `citations-${stamp}.${citationFormat === "text" ? "txt" : citationFormat}`);
        setIsExporting(false);
        setMessage(`已导出 ${res.data.items.length} 条引用。`);
    };
    const handleRefreshAnswer = async () => {
        if (isResultsPreview)
            return;
        if (!sessionId)
            return;
        await fetchAnswer(sessionId);
    };
    const openAccountDrawer = (section) => {
        setProfileDraft(accountProfile);
        setAccountSection(section);
        setIsAccountMenuOpen(false);
        setIsAccountDrawerOpen(true);
    };
    const closeAccountDrawer = () => {
        setIsAccountDrawerOpen(false);
    };
    const openProfileManager = () => {
        setProfileDraft(accountProfile);
        setAccountSection("profile");
    };
    const openLabMenu = () => {
        setIsAccountMenuOpen(false);
        setIsLabMenuOpen(true);
    };
    const openAppView = (view) => {
        setAppView(view);
        syncAppViewInUrl(view);
    };
    const handleOpenPaperSearchPage = (prefill = "") => {
        if (prefill)
            setFinderQuery(prefill);
        setIsLabMenuOpen(false);
        setIsAccountMenuOpen(false);
        setIsAccountDrawerOpen(false);
        openAppView("paper-search");
        window.requestAnimationFrame(() => {
            finderInputRef.current?.focus();
            if (prefill) {
                finderInputRef.current?.setSelectionRange(prefill.length, prefill.length);
            }
        });
    };
    const handleOpenAboutPage = () => {
        setIsLabMenuOpen(false);
        setIsAccountMenuOpen(false);
        setIsAccountDrawerOpen(false);
        openAppView("about");
    };
    const handleCloseAboutPage = () => {
        openAppView("main");
        window.requestAnimationFrame(() => {
            searchInputRef.current?.focus();
        });
    };
    const handleClosePaperSearchPage = () => {
        if (finderTimerRef.current !== null) {
            window.clearInterval(finderTimerRef.current);
            finderTimerRef.current = null;
        }
        setIsLabMenuOpen(false);
        setFinderMessage("");
        openAppView("main");
        window.requestAnimationFrame(() => {
            searchInputRef.current?.focus();
        });
    };
    const handleExampleQuery = (q) => {
        setQuery(q);
        window.requestAnimationFrame(() => {
            searchInputRef.current?.focus();
            searchInputRef.current?.setSelectionRange(q.length, q.length);
        });
    };
    const openLabFeature = (feature) => {
        if (feature.view === "paper-search") {
            setFinderMessage(`AI实验室：已打开“${feature.title}”。`);
            handleOpenPaperSearchPage(feature.query);
            return;
        }
        setQuery(feature.query);
        setIsLabMenuOpen(false);
        setMessage(`AI实验室：已载入“${feature.title}”示例问题。`);
        window.requestAnimationFrame(() => {
            searchInputRef.current?.focus();
            searchInputRef.current?.setSelectionRange(feature.query.length, feature.query.length);
        });
    };
    const restoreSearchQuery = (nextQuery) => {
        setQuery(nextQuery);
        setIsAccountDrawerOpen(false);
        setIsAccountMenuOpen(false);
        setIsLabMenuOpen(false);
        window.requestAnimationFrame(() => {
            searchInputRef.current?.focus();
            searchInputRef.current?.setSelectionRange(nextQuery.length, nextQuery.length);
        });
    };
    const handleGoHome = () => {
        if (timerRef.current !== null) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setQuery("");
        setSessionId("");
        setStatus("idle");
        setAgentState(null);
        setPapers([]);
        setAnswer(null);
        setConfidence("-");
        setAnsweredSessionId("");
        setShowAllSources(false);
        setResultView("compact");
        setMessage("");
    };
    const handleFollowupQuery = (q) => {
        setQuery(q);
        void createSession(q);
    };
    const handleFinderExampleQuery = (nextQuery) => {
        setFinderQuery(nextQuery);
        window.requestAnimationFrame(() => {
            finderInputRef.current?.focus();
            finderInputRef.current?.setSelectionRange(nextQuery.length, nextQuery.length);
        });
    };
    const handleToggleSave = (paperId) => {
        setSavedPaperIds((prev) => {
            const next = new Set(prev);
            if (next.has(paperId)) {
                next.delete(paperId);
            }
            else {
                next.add(paperId);
            }
            return next;
        });
    };
    const handleProfileFieldChange = (field, value) => {
        setProfileDraft((prev) => ({ ...prev, [field]: value }));
    };
    const handleSaveProfile = (event) => {
        event.preventDefault();
        setAccountProfile(profileDraft);
        setMessage("资料已保存到当前浏览器会话。");
    };
    const handleResetProfileDraft = () => {
        setProfileDraft(accountProfile);
        setMessage("已恢复为当前已保存的资料。");
    };
    const finderNarrative = getPaperFinderNarrative(finderStatus, finderAgentState, finderPapers.length);
    const finderVisiblePapers = showAllFinderSources ? finderPapers : finderPapers.slice(0, 6);
    const finderHasResults = finderStatus !== "idle" || finderPapers.length > 0;
    if (appView === "about") {
        return (_jsxs("div", { className: "about-page", children: [_jsxs("header", { className: "about-hero", children: [_jsx("div", { className: "hero-orb hero-orb-left" }), _jsx("div", { className: "hero-orb hero-orb-right" }), _jsx("div", { className: "hero-grid" }), _jsxs("div", { className: "about-shell", children: [_jsxs("div", { className: "about-topbar", children: [_jsx("button", { className: "finder-back-button", onClick: handleCloseAboutPage, type: "button", children: "\u8FD4\u56DE\u9996\u9875" }), _jsx("img", { alt: "\u5B66\u672F\u4E50\u95EE", className: "finder-logo", src: brandLogo })] }), _jsxs("section", { className: "about-intro", children: [_jsx("span", { className: "eyebrow", children: "About Us" }), _jsx("h1", { children: "\u5173\u4E8E\u6211\u4EEC" }), _jsx("p", { children: "\u5B66\u672F\u4E50\u95EE\u9762\u5411\u7814\u7A76\u8005\u4E0E\u5B66\u751F\uFF0C\u76EE\u6807\u662F\u628A\u201C\u63D0\u95EE\u9898\u3001\u627E\u8BBA\u6587\u3001\u8BFB\u8BC1\u636E\u3001\u6574\u7406\u56DE\u7B54\u201D\u8FD9\u6761\u94FE\u8DEF\u538B\u7F29\u6210\u66F4\u987A\u624B\u7684\u5B66\u672F\u5DE5\u4F5C\u6D41\u3002" })] })] })] }), _jsxs("main", { className: "about-shell about-content", children: [_jsxs("section", { className: "about-intro-grid", children: [_jsxs("article", { className: "about-card about-card-lead", children: [_jsx("span", { className: "eyebrow", children: "\u6211\u4EEC\u5728\u505A\u4EC0\u4E48" }), _jsx("h2", { children: "\u628A\u68C0\u7D22\u3001\u7B5B\u9009\u3001\u9605\u8BFB\u548C\u6574\u7406\uFF0C\u6536\u8FDB\u4E00\u6761\u66F4\u987A\u624B\u7684\u5B66\u672F\u5DE5\u4F5C\u6D41" }), _jsx("p", { children: "\u5B66\u672F\u4E50\u95EE\u5F53\u524D\u805A\u7126\u8BBA\u6587\u68C0\u7D22\u3001\u6765\u6E90\u7EC4\u7EC7\u4E0E\u7ED3\u6784\u5316\u56DE\u7B54\u3002\u9996\u9875\u504F\u201C\u95EE\u9898\u9A71\u52A8\u201D\uFF0C\u8BBA\u6587\u68C0\u7D22\u9875\u504F\u201C\u7ED3\u679C\u9A71\u52A8\u201D\uFF0C\u4F46\u4E24\u8005\u90FD\u56F4\u7ED5\u540C\u4E00\u5957 academic search session \u5DE5\u4F5C\u3002" })] }), _jsxs("aside", { className: "about-summary-stack", children: [_jsxs("article", { className: "about-card about-summary-card", children: [_jsx("span", { className: "eyebrow", children: "\u5B9A\u4F4D" }), _jsx("h3", { children: "\u7814\u7A76\u8005\u53CB\u597D\u7684\u5B66\u672F\u68C0\u7D22\u524D\u7AEF" }), _jsx("p", { children: "\u4E0D\u662F\u5355\u7EAF\u641C\u7D22\u6846\uFF0C\u4E5F\u4E0D\u662F\u7EAF\u804A\u5929\u7A97\u53E3\uFF0C\u800C\u662F\u628A\u6765\u6E90\u548C\u56DE\u7B54\u653E\u5728\u4E00\u8D77\u7684\u7814\u7A76\u754C\u9762\u3002" })] }), _jsxs("article", { className: "about-card about-summary-card", children: [_jsx("span", { className: "eyebrow", children: "\u9636\u6BB5" }), _jsx("h3", { children: "MVP / \u5FEB\u901F\u8FED\u4EE3\u4E2D" }), _jsx("p", { children: "\u5F53\u524D\u4EE5\u524D\u7AEF\u539F\u578B\u548C\u672C\u5730 mock \u4E3A\u4E3B\uFF0C\u4FBF\u4E8E\u6301\u7EED\u9A8C\u8BC1\u9875\u9762\u7ED3\u6784\u3001\u4EA4\u4E92\u8282\u594F\u548C\u4FE1\u606F\u7EC4\u7EC7\u65B9\u5F0F\u3002" })] })] })] }), _jsxs("section", { className: "about-card-grid", children: [_jsxs("article", { className: "about-card", children: [_jsx("span", { className: "eyebrow", children: "\u5F53\u524D\u80FD\u529B" }), _jsxs("ul", { className: "about-list", children: [_jsx("li", { children: "\u652F\u6301\u57FA\u4E8E query \u7684\u8BBA\u6587\u68C0\u7D22\u4F1A\u8BDD\u521B\u5EFA\u4E0E\u8F6E\u8BE2\u3002" }), _jsx("li", { children: "\u652F\u6301\u7ED3\u679C\u6269\u5C55\u3001\u5F15\u7528\u5BFC\u51FA\u548C\u7ED3\u6784\u5316\u56DE\u7B54\u5C55\u793A\u3002" }), _jsx("li", { children: "\u652F\u6301\u72EC\u7ACB\u7684\u8BBA\u6587\u68C0\u7D22\u9875\uFF0C\u9002\u5408\u5FEB\u901F\u626B paper list\u3002" })] })] }), _jsxs("article", { className: "about-card", children: [_jsx("span", { className: "eyebrow", children: "\u4EA7\u54C1\u65B9\u5411" }), _jsxs("ul", { className: "about-list", children: [_jsx("li", { children: "\u51CF\u5C11\u201C\u641C\u7D22\u5DE5\u5177\u201D\u548C\u201C\u5199\u4F5C\u5DE5\u5177\u201D\u4E4B\u95F4\u7684\u5207\u6362\u6210\u672C\u3002" }), _jsx("li", { children: "\u8BA9\u56DE\u7B54\u5C3D\u91CF\u53EF\u8FFD\u6EAF\uFF0C\u6BCF\u4E2A\u7ED3\u8BBA\u90FD\u80FD\u843D\u56DE\u8BBA\u6587\u6765\u6E90\u3002" }), _jsx("li", { children: "\u9010\u6B65\u4ECE\u6F14\u793A\u578B\u4EA7\u54C1\u8D70\u5411\u53EF\u6301\u7EED\u7684\u5B66\u672F\u5DE5\u4F5C\u53F0\u3002" })] })] }), _jsxs("article", { className: "about-card", children: [_jsx("span", { className: "eyebrow", children: "\u8BBE\u8BA1\u539F\u5219" }), _jsxs("ul", { className: "about-list", children: [_jsx("li", { children: "\u5148\u8BA9\u7528\u6237\u770B\u5230\u4FE1\u606F\u7ED3\u6784\uFF0C\u518D\u51B3\u5B9A\u662F\u5426\u6DF1\u5165\u9605\u8BFB\u3002" }), _jsx("li", { children: "\u5C3D\u91CF\u7528\u66F4\u5C11\u7684\u9875\u9762\u8DF3\u8F6C\u627F\u8F7D\u5B8C\u6574\u7684\u7814\u7A76\u94FE\u8DEF\u3002" }), _jsx("li", { children: "\u5728\u201C\u56DE\u7B54\u611F\u201D\u548C\u201C\u8BC1\u636E\u611F\u201D\u4E4B\u95F4\u4FDD\u6301\u5E73\u8861\u3002" })] })] }), _jsxs("article", { className: "about-card", children: [_jsx("span", { className: "eyebrow", children: "\u9879\u76EE\u80CC\u666F" }), _jsx("p", { className: "about-card-copy", children: "\u5F53\u524D\u9875\u9762\u4E2D\u7684\u673A\u6784\u4E0E\u8D26\u6237\u4FE1\u606F\u4ECD\u4EE5\u672C\u5730\u9884\u89C8\u6570\u636E\u4E3A\u4E3B\u3002\u524D\u7AEF\u5DF2\u7ECF\u5177\u5907\u57FA\u7840\u9875\u9762\u6846\u67B6\uFF0C\u540E\u7EED\u53EF\u4EE5\u7EE7\u7EED\u63A5\u5165\u771F\u5B9E\u7528\u6237\u8D44\u6599\u3001\u771F\u5B9E\u68C0\u7D22\u540E\u7AEF\u4E0E\u66F4\u5B8C\u6574\u7684\u5185\u5BB9\u9875\u3002" })] })] })] })] }));
    }
    if (appView === "paper-search") {
        return (_jsxs("div", { className: "finder-page", children: [_jsxs("header", { className: "finder-hero", children: [_jsx("div", { className: "hero-orb hero-orb-left" }), _jsx("div", { className: "hero-orb hero-orb-right" }), _jsx("div", { className: "hero-grid" }), _jsxs("div", { className: "finder-stage", children: [_jsxs("div", { className: "finder-topbar", children: [_jsx("button", { className: "finder-back-button", onClick: handleClosePaperSearchPage, type: "button", children: "\u8FD4\u56DE\u4E50\u95EE" }), _jsx("img", { alt: "\u5B66\u672F\u4E50\u95EE", className: "finder-logo", src: brandLogo })] }), _jsx("form", { className: "search-shell finder-search-shell", onSubmit: handleFinderCreateSession, children: _jsxs("div", { className: "search-main", children: [_jsx("textarea", { className: `search-input${!finderQuery.trim() ? " is-empty" : ""}`, ref: finderInputRef, value: finderQuery, onChange: (event) => setFinderQuery(event.target.value), onKeyDown: handleFinderKeyDown, rows: 2, placeholder: "Please enter an academic query in English." }), _jsx("button", { "aria-label": finderIsSubmitting ? "正在搜索" : "开始搜索", className: "hero-button is-icon", disabled: finderIsSubmitting || !finderQuery.trim(), type: "submit", children: _jsx(SearchGlyph, {}) })] }) }), _jsx("div", { className: "finder-example-list", "aria-label": "\u8BBA\u6587\u68C0\u7D22\u9875\u793A\u4F8B\u95EE\u9898", children: PAPER_FINDER_EXAMPLES.map((item) => (_jsxs("button", { className: "finder-example-card", onClick: () => handleFinderExampleQuery(item.query), type: "button", children: [_jsx("span", { className: "finder-example-label", children: item.label }), _jsx("span", { className: "finder-example-query", children: item.query })] }, item.query))) })] })] }), _jsx("main", { className: "finder-workspace", children: _jsxs("section", { className: `finder-results-panel${finderHasResults ? " is-visible" : ""}`, ref: finderResultsRef, children: [_jsxs("div", { className: "finder-results-head", children: [_jsxs("div", { children: [_jsx("span", { className: "eyebrow", children: "Results" }), _jsx("h2", { children: finderHasResults ? "检索到的论文列表" : "检索结果会在这里弹出" })] }), _jsxs("div", { className: "finder-results-meta", children: [finderStatus !== "idle" ? (_jsx("span", { className: `status-pill is-${finderStatus.toLowerCase()}`, children: getStatusLabel(finderStatus) })) : null, finderAgentState ? (_jsxs("span", { className: "quiet-copy", children: ["\u5DF2\u626B\u63CF ", finderAgentState.scannedCount, " \u7BC7\uFF0C\u5F53\u524D\u4FDD\u7559 ", finderPapers.length, " \u7BC7"] })) : null, finderStatus === "ITERATING" && finderSessionId ? (_jsx("button", { className: "text-button", onClick: () => void handleFinderStopSearch(), type: "button", children: "\u505C\u6B62" })) : null, finderStatus === "PAUSED" && finderSessionId ? (_jsx("button", { className: "text-button", onClick: () => void handleFinderResumeSearch(), type: "button", children: "\u7EE7\u7EED" })) : null] })] }), finderMessage ? _jsx("p", { className: "message finder-message", children: finderMessage }) : null, finderVisiblePapers.length === 0 ? (finderStatus === "ITERATING" ? (_jsx("div", { className: "source-skeleton-list", children: [0, 1, 2].map((i) => (_jsxs("div", { className: "source-skeleton-card", children: [_jsx("div", { className: "skeleton-line short" }), _jsx("div", { className: "skeleton-line medium" }), _jsx("div", { className: "skeleton-line long" }), _jsx("div", { className: "skeleton-line long" })] }, i))) })) : (_jsxs("div", { className: "finder-empty-state", children: [_jsx("h3", { children: "\u8FD9\u91CC\u4F1A\u5148\u51FA\u73B0 paper list" }), _jsx("p", { children: "\u8F93\u5165\u4E00\u4E2A\u82F1\u6587 query \u540E\uFF0C\u7CFB\u7EDF\u4F1A\u6301\u7EED\u8865\u5145\u6807\u9898\u3001\u4F5C\u8005\u3001\u5E74\u4EFD\u548C\u6458\u8981\uFF0C\u4E0D\u5FC5\u7B49\u603B\u7ED3\u751F\u6210\u5B8C\u3002" })] }))) : (_jsx("div", { className: "finder-paper-grid", children: finderVisiblePapers.map((paper) => (_jsxs("article", { className: "finder-paper-card", children: [_jsxs("div", { className: "finder-paper-meta", children: [_jsxs("span", { className: "finder-paper-id", children: ["arXiv ", paper.id] }), _jsx("span", { className: "relevance-pill", children: getRelevanceLabel(paper.score) }), _jsx("span", { className: `source-type-badge is-${paper.source}`, children: paper.source === "expand" ? "关联扩展" : "搜索发现" }), _jsx("span", { children: paper.year })] }), _jsx("h3", { children: paper.title }), _jsx("p", { className: "source-authors", children: paper.authors || "作者信息暂缺" }), _jsxs("p", { className: "finder-paper-origin", children: ["\u6765\u6E90\u7EBF\u7D22\uFF1A", paper.origin] }), _jsx("p", { className: "source-abstract", children: paper.abstract }), _jsxs("div", { className: "source-actions", children: [_jsx("a", { className: "source-open-link", href: paper.url, rel: "noreferrer", target: "_blank", children: "\u6253\u5F00\u539F\u6587" }), _jsx("button", { className: "ghost-button", disabled: paper.isExpanded || paper.isExpanding || finderExpandedIds[paper.id] || isResultsPreview, onClick: () => void handleFinderExpand(paper.id), type: "button", children: paper.isExpanding || finderExpandedIds[paper.id] ? "扩展中..." : paper.isExpanded ? "已扩展" : "继续找关联" })] })] }, paper.id))) })), finderPapers.length > 6 ? (_jsx("button", { className: "text-button align-left", onClick: () => setShowAllFinderSources((value) => !value), type: "button", children: showAllFinderSources ? "收起多余来源" : `查看更多来源（+${finderPapers.length - 6}）` })) : null] }) })] }));
    }
    const evidenceLookup = buildEvidenceLookup(answer);
    const visiblePapers = showAllSources ? papers : papers.slice(0, 6);
    const narrative = getNarrative(status, agentState, papers.length);
    const hasResults = status !== "idle" || papers.length > 0 || answer !== null;
    const isCompactResults = hasResults && resultView === "compact";
    const pageClassName = hasResults
        ? `page has-results${isCompactResults ? " is-list" : ""}`
        : "page is-home";
    return (
        <div className={pageClassName}>
            <header className={`hero${hasResults ? " is-results-hero" : " is-home-hero"}`}>
                <div className="hero-orb hero-orb-left" />
                <div className="hero-orb hero-orb-right" />
                <div className="hero-grid" />
                <div className={`hero-inner${hasResults ? " is-results-layout" : " is-home-layout"}`}>
                    {!hasResults ? (
                        <div className="home-main">
                            <div className="brand-row">
                                <img
                                    alt="学术乐问"
                                    className="brand-logo"
                                    src={brandLogo}
                                    onClick={() => window.location.reload()}
                                    style={{ cursor: "pointer" }}
                                />
                            </div>
                            <form className="search-shell is-home" onSubmit={handleCreateSession}>
                                <div className="search-main">
                                    <SearchDepthSelect value={searchDepthMode} onChange={setSearchDepthMode} />
                                    <textarea
                                        className={`search-input${!query.trim() ? " is-empty" : ""}`}
                                        ref={searchInputRef}
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        onKeyDown={handleQueryKeyDown}
                                        rows={1}
                                        placeholder="让每一个研究问题，都有更好的回答"
                                    />
                                    <button
                                        aria-label={isSubmitting ? "正在搜索" : "开始搜索"}
                                        className="hero-button is-icon"
                                        disabled={isSubmitting || !query.trim()}
                                        type="submit"
                                    >
                                        <SearchGlyph />
                                    </button>
                                </div>
                            </form>
                            <p className="status-inline">{narrative}</p>
                            <div className="example-queries" aria-label="示例问题">
                                {EXAMPLE_QUERIES.map((q) => (
                                    <button className="example-query-chip" onClick={() => handleExampleQuery(q)} type="button" key={q}>
                                        {q}
                                    </button>
                                ))}
                            </div>
                            {message ? <p className="message">{message}</p> : null}
                        </div>
                    ) : (
                        <>
                            <button aria-label="返回首页" className="results-logo-btn" onClick={handleGoHome} type="button">
                                <img alt="学术乐问" className="results-logo" src={brandLogo} />
                            </button>
                            <form className="search-shell is-results" onSubmit={handleCreateSession}>
                                <div className="search-main">
                                    <SearchDepthSelect value={searchDepthMode} onChange={setSearchDepthMode} />
                                    <textarea
                                        className="search-input"
                                        ref={searchInputRef}
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        onKeyDown={handleQueryKeyDown}
                                        rows={1}
                                        placeholder="让每一个研究问题，都有更好的回答"
                                    />
                                    <button
                                        aria-label={isSubmitting ? "正在搜索" : "开始搜索"}
                                        className="hero-button is-icon"
                                        disabled={isSubmitting || !query.trim()}
                                        type="submit"
                                    >
                                        <SearchGlyph />
                                    </button>
                                </div>
                            </form>
                            {status !== "idle" ? (
                                <div className="status-row">
                                    <span className={`status-pill is-${status.toLowerCase()}`}>{getStatusLabel(status)}</span>
                                    <span className="status-copy">{narrative}</span>
                                    {status === "ITERATING" && sessionId ? (
                                        <button className="text-button" onClick={() => void handleStopSearch()} type="button">
                                            停止本次搜索
                                        </button>
                                    ) : null}
                                    {status === "PAUSED" && sessionId ? (
                                        <button className="text-button" onClick={() => void handleResumeSearch()} type="button">
                                            继续搜索
                                        </button>
                                    ) : null}
                                </div>
                            ) : (
                                <p className="status-inline">{narrative}</p>
                            )}
                            <div className="result-view-actions">
                                <button
                                    className={`result-view-button${resultView === "compact" ? " is-active" : ""}`}
                                    onClick={() => setResultView("compact")}
                                    type="button"
                                >
                                    简略模式
                                </button>
                            </div>
                            {message ? <p className="message">{message}</p> : null}
                        </>
                    )}
                </div>
            </header>
            {isCompactResults ? (
                <main className="workspace">
                    <div className="list-page-body">
                        <div className="list-page-meta">
                            <span className="list-paper-count">
                                {status === "ITERATING" && papers.length === 0 ? "正在检索…" : `${papers.length} 篇相关论文`}
                            </span>
                            {agentState ? (
                                <span className="quiet-copy">
                                    已扫描 {agentState.scannedCount} 篇，当前保留 {papers.length} 篇
                                </span>
                            ) : null}
                        </div>
                        {papers.length === 0 ? (
                            status === "ITERATING" ? (
                                <div className="list-loading-row">
                                    <span className="list-loading-dot" />
                                    <span className="list-loading-dot" />
                                    <span className="list-loading-dot" />
                                </div>
                            ) : (
                                <p className="quiet-copy compact-empty-copy">系统还在等待第一批检索结果。</p>
                            )
                        ) : (
                            <div className="list-paper-list">
                                {papers.map((paper, i) => (
                                    <article className="list-paper-card" key={paper.id}>
                                        <span className="list-paper-num">{i + 1}</span>
                                        <div className="list-paper-body">
                                            <a href={paper.url} target="_blank" rel="noreferrer" className="list-paper-title">
                                                {paper.title}
                                            </a>
                                            <p className="list-paper-meta">
                                                {paper.authors || "作者信息暂缺"} · {paper.year || "-"}
                                            </p>
                                            {paper.abstract ? <p className="list-paper-abstract">{paper.abstract}</p> : null}
                                            <div className="list-paper-tags">
                                                <span className="relevance-pill">{getRelevanceLabel(paper.score)}</span>
                                                <span className={`source-type-badge is-${paper.source}`}>
                                                    {paper.source === "expand" ? "关联扩展" : "搜索发现"}
                                                </span>
                                            </div>
                                        </div>
                                        <a href={paper.url} target="_blank" rel="noreferrer" className="list-arxiv-badge">
                                            arXiv
                                        </a>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            ) : hasResults ? (
                <main className="workspace">
                    <section className="results-layout">
                        <section className="panel answer-panel">
                            <div className="panel-head">
                                <div>
                                    <span className="eyebrow">回答</span>
                                    <h2>{getAnswerHeadline(status, Boolean(answer))}</h2>
                                </div>
                            </div>
                            {answer ? (
                                <div className="answer-body">
                                    <div className="answer-meta">
                                        <span className="confidence-pill">置信度 {getConfidenceLabel(confidence)}</span>
                                        {agentState ? (
                                            <span className="quiet-copy">
                                                已筛过 {agentState.scannedCount} 篇候选，只保留最相关的 {papers.length} 篇。
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="summary-copy">{answer.summary}</p>
                                    <section className="answer-section">
                                        <h3>核心依据</h3>
                                        <ul className="evidence-list">
                                            {answer.key_evidence.map((item, index) => (
                                                <li key={`${item.claim}-${index}`}>
                                                    <span>{item.claim}</span>
                                                    <small>{getConfidenceLabel(item.confidence)}</small>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                    {answer.limitations.length > 0 ? (
                                        <section className="answer-section">
                                            <h3>边界与局限</h3>
                                            <ul className="plain-list">
                                                {answer.limitations.map((item, index) => (
                                                    <li key={`${item}-${index}`}>{item}</li>
                                                ))}
                                            </ul>
                                        </section>
                                    ) : null}
                                    {answer.next_questions.length > 0 ? (
                                        <section className="answer-section">
                                            <h3>你接下来可能会继续问</h3>
                                            <div className="followup-list">
                                                {answer.next_questions.map((item) => (
                                                    <button className="followup-chip" onClick={() => handleFollowupQuery(item)} type="button" key={item}>
                                                        {item}
                                                    </button>
                                                ))}
                                            </div>
                                        </section>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="loading-state">
                                    <div className="pulse-ring" />
                                    <h3>{status === "COMPLETED" ? "正在生成最终回答" : "正在筛选最有价值的论文"}</h3>
                                    <p>{narrative}</p>
                                    <p className="quiet-copy">
                                        {agentState
                                            ? `已筛过 ${agentState.scannedCount} 篇候选，目前留下 ${papers.length} 篇高相关结果。`
                                            : "系统会先找结果，再为你整理出更适合阅读的结论。"}
                                    </p>
                                    <button
                                        className="ghost-button"
                                        disabled={!sessionId || isAnswerLoading || status !== "COMPLETED" || isResultsPreview}
                                        onClick={() => void handleRefreshAnswer()}
                                        type="button"
                                    >
                                        {isAnswerLoading ? "整理中..." : "刷新最终总结"}
                                    </button>
                                </div>
                            )}
                        </section>
                        <aside className="panel sources-panel">
                            <div className="panel-head">
                                <div>
                                    <span className="eyebrow">来源</span>
                                    <h2>{papers.length > 0 ? `${papers.length} 篇值得看的论文` : "来源正在出现"}</h2>
                                </div>
                                {agentState ? <span className="quiet-copy">候选 {agentState.scannedCount}</span> : null}
                            </div>
                            {visiblePapers.length === 0 ? (
                                status === "ITERATING" ? (
                                    <div className="source-skeleton-list">
                                        {[0, 1, 2].map((i) => (
                                            <div className="source-skeleton-card" key={i}>
                                                <div className="skeleton-line short" />
                                                <div className="skeleton-line medium" />
                                                <div className="skeleton-line long" />
                                                <div className="skeleton-line long" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="quiet-copy">系统还在检索第一批结果。</p>
                                )
                            ) : (
                                <div className="source-list">
                                    {visiblePapers.map((paper) => {
                                        const evidence = evidenceLookup[paper.id] ?? [];
                                        return (
                                            <article className="source-card" key={paper.id}>
                                                <div className="source-meta">
                                                    <span className="relevance-pill">{getRelevanceLabel(paper.score)}</span>
                                                    <span className={`source-type-badge is-${paper.source}`}>
                                                        {paper.source === "expand" ? "关联扩展" : "搜索发现"}
                                                    </span>
                                                    <span>{paper.year}</span>
                                                </div>
                                                <h3>{paper.title}</h3>
                                                <p className="source-authors">{paper.authors || "作者信息暂缺"}</p>
                                                {evidence.length > 0 ? <p className="source-evidence">回答引用：{evidence[0]}</p> : null}
                                                <p className="source-abstract">{paper.abstract}</p>
                                                <div className="source-actions">
                                                    <a className="source-open-link" href={paper.url} rel="noreferrer" target="_blank">
                                                        打开原文
                                                    </a>
                                                    <button
                                                        className="ghost-button"
                                                        disabled={paper.isExpanded || paper.isExpanding || expandedIds[paper.id] || isResultsPreview}
                                                        onClick={() => void handleExpand(paper.id)}
                                                        type="button"
                                                    >
                                                        {paper.isExpanding || expandedIds[paper.id]
                                                            ? "扩展中..."
                                                            : paper.isExpanded
                                                              ? "已扩展"
                                                              : "继续找关联"}
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                            {papers.length > 6 ? (
                                <button className="text-button align-left" onClick={() => setShowAllSources((value) => !value)} type="button">
                                    {showAllSources ? "收起多余来源" : `查看更多来源（+${papers.length - 6}）`}
                                </button>
                            ) : null}
                        </aside>
                    </section>
                </main>
            ) : null}
        </div>
    );
}

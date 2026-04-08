const PHASES = [
  { afterMs: 0, status: "ITERATING", scannedCount: 8, papersShown: 0, currentStep: 1, searchCount: 1, expandCount: 0 },
  { afterMs: 1400, status: "ITERATING", scannedCount: 17, papersShown: 2, currentStep: 3, searchCount: 3, expandCount: 0 },
  { afterMs: 3200, status: "ITERATING", scannedCount: 28, papersShown: 4, currentStep: 6, searchCount: 5, expandCount: 1 },
  { afterMs: 5200, status: "COMPLETED", scannedCount: 39, papersShown: 5, currentStep: 8, searchCount: 6, expandCount: 2 }
];

function jsonClone(value) {
  return JSON.parse(JSON.stringify(value));
}

const ATTENTION_CASE = {
  id: "attention-long-context",
  label: "Transformer 长程依赖",
  description: "展示 attention 如何改善 long-range dependency modeling。",
  sampleQuery: "How do transformer attention mechanisms improve long-range dependency modeling?",
  matchKeywords: ["transformer", "attention", "long-range", "dependency", "context"],
  maxSteps: 12,
  basePapers: [
    {
      id: "1706.03762",
      title: "Attention Is All You Need",
      authors: "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones",
      year: "2017",
      abstract:
        "The Transformer replaces recurrence with multi-head self-attention, allowing each token to directly aggregate information from distant positions while remaining highly parallelizable.",
      url: "https://arxiv.org/abs/1706.03762",
      isExpanded: false,
      isExpanding: false,
      score: 0.96,
      source: "search",
      origin: "transformer attention mechanism"
    },
    {
      id: "1803.02155",
      title: "Generating Wikipedia by Summarizing Long Sequences",
      authors: "Angela Fan, Mike Lewis, Yann Dauphin",
      year: "2018",
      abstract:
        "This work shows how sparse and efficient attention variants help sequence models capture long-range dependencies when input length becomes very large.",
      url: "https://arxiv.org/abs/1803.02155",
      isExpanded: false,
      isExpanding: false,
      score: 0.89,
      source: "search",
      origin: "long-range dependency transformer"
    },
    {
      id: "1904.10509",
      title: "Transformer-XL: Attentive Language Models Beyond a Fixed-Length Context",
      authors: "Zihang Dai, Zhilin Yang, Yiming Yang, Jaime Carbonell",
      year: "2019",
      abstract:
        "Transformer-XL extends the context window through segment-level recurrence, improving the model's ability to preserve and use long-term information across segments.",
      url: "https://arxiv.org/abs/1904.10509",
      isExpanded: false,
      isExpanding: false,
      score: 0.87,
      source: "expand",
      origin: "[1706.03762] Attention Is All You Need"
    },
    {
      id: "2004.05150",
      title: "Longformer: The Long-Document Transformer",
      authors: "Iz Beltagy, Matthew E. Peters, Arman Cohan",
      year: "2020",
      abstract:
        "Longformer introduces sparse attention patterns that preserve relevance over long documents while keeping computation manageable for long-context tasks.",
      url: "https://arxiv.org/abs/2004.05150",
      isExpanded: false,
      isExpanding: false,
      score: 0.83,
      source: "expand",
      origin: "[1803.02155] Generating Wikipedia by Summarizing Long Sequences"
    },
    {
      id: "2001.08361",
      title: "Reformer: The Efficient Transformer",
      authors: "Nikita Kitaev, Lukasz Kaiser, Anselm Levskaya",
      year: "2020",
      abstract:
        "Reformer reduces the memory and compute cost of attention with locality-sensitive hashing and reversible layers, making longer sequences tractable.",
      url: "https://arxiv.org/abs/2001.08361",
      isExpanded: false,
      isExpanding: false,
      score: 0.8,
      source: "search",
      origin: "efficient transformer long context"
    }
  ],
  expandedPaper: {
    id: "2212.14052",
    title: "Hyena Hierarchy: Towards Larger Convolutional Language Models",
    authors: "Michael Poli, Stefano Massaroli, Tri Dao, Eric Nguyen",
    year: "2023",
    abstract:
      "Hyena explores an alternative to attention for long-context sequence modeling, making it useful as a contrastive reference when evaluating where attention still wins.",
    url: "https://arxiv.org/abs/2212.14052",
    isExpanded: false,
    isExpanding: false,
    score: 0.74,
    source: "expand",
    origin: "[1904.10509] Transformer-XL: Attentive Language Models Beyond a Fixed-Length Context"
  },
  answer: {
    summary:
      "Attention mechanisms improve long-range dependency modeling by letting each token directly attend to distant tokens instead of passing information step by step through recurrence. The strongest evidence shows this reduces path length for dependency propagation, improves parallelism, and scales better when paired with sparse or segment-level attention variants.",
    key_evidence: [
      {
        claim:
          "Self-attention creates direct token-to-token connections, which shortens the effective path between distant positions.",
        paper_ids: ["1706.03762"],
        confidence: "high"
      },
      {
        claim:
          "Long-context transformer variants preserve these benefits at larger sequence lengths by using recurrence or sparse attention patterns.",
        paper_ids: ["1904.10509", "2004.05150"],
        confidence: "high"
      },
      {
        claim:
          "Empirical results across language generation tasks show better retention of long-range information than fixed-window baselines.",
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
  },
  citations: {
    "1706.03762": {
      bibtex: `@article{vaswani2017attention,
  title={Attention Is All You Need},
  author={Vaswani, Ashish and Shazeer, Noam and Parmar, Niki and Uszkoreit, Jakob},
  journal={arXiv preprint arXiv:1706.03762},
  year={2017}
}`,
      ris: `TY  - JOUR
TI  - Attention Is All You Need
AU  - Vaswani, Ashish
AU  - Shazeer, Noam
PY  - 2017
JO  - arXiv preprint arXiv:1706.03762
ER  - `,
      text: "Vaswani A, Shazeer N, Parmar N, et al. Attention Is All You Need. arXiv:1706.03762, 2017."
    },
    "1803.02155": {
      bibtex: `@article{fan2018generating,
  title={Generating Wikipedia by Summarizing Long Sequences},
  author={Fan, Angela and Lewis, Mike and Dauphin, Yann},
  journal={arXiv preprint arXiv:1803.02155},
  year={2018}
}`,
      ris: `TY  - JOUR
TI  - Generating Wikipedia by Summarizing Long Sequences
AU  - Fan, Angela
AU  - Lewis, Mike
PY  - 2018
JO  - arXiv preprint arXiv:1803.02155
ER  - `,
      text: "Fan A, Lewis M, Dauphin Y. Generating Wikipedia by Summarizing Long Sequences. arXiv:1803.02155, 2018."
    },
    "1904.10509": {
      bibtex: `@article{dai2019transformerxl,
  title={Transformer-XL: Attentive Language Models Beyond a Fixed-Length Context},
  author={Dai, Zihang and Yang, Zhilin and Yang, Yiming and Carbonell, Jaime},
  journal={arXiv preprint arXiv:1904.10509},
  year={2019}
}`,
      ris: `TY  - JOUR
TI  - Transformer-XL: Attentive Language Models Beyond a Fixed-Length Context
AU  - Dai, Zihang
AU  - Yang, Zhilin
PY  - 2019
JO  - arXiv preprint arXiv:1904.10509
ER  - `,
      text: "Dai Z, Yang Z, Yang Y, et al. Transformer-XL: Attentive Language Models Beyond a Fixed-Length Context. arXiv:1904.10509, 2019."
    },
    "2004.05150": {
      bibtex: `@article{beltagy2020longformer,
  title={Longformer: The Long-Document Transformer},
  author={Beltagy, Iz and Peters, Matthew E. and Cohan, Arman},
  journal={arXiv preprint arXiv:2004.05150},
  year={2020}
}`,
      ris: `TY  - JOUR
TI  - Longformer: The Long-Document Transformer
AU  - Beltagy, Iz
AU  - Peters, Matthew E.
PY  - 2020
JO  - arXiv preprint arXiv:2004.05150
ER  - `,
      text: "Beltagy I, Peters ME, Cohan A. Longformer: The Long-Document Transformer. arXiv:2004.05150, 2020."
    },
    "2001.08361": {
      bibtex: `@article{kitaev2020reformer,
  title={Reformer: The Efficient Transformer},
  author={Kitaev, Nikita and Kaiser, Lukasz and Levskaya, Anselm},
  journal={arXiv preprint arXiv:2001.08361},
  year={2020}
}`,
      ris: `TY  - JOUR
TI  - Reformer: The Efficient Transformer
AU  - Kitaev, Nikita
AU  - Kaiser, Lukasz
PY  - 2020
JO  - arXiv preprint arXiv:2001.08361
ER  - `,
      text: "Kitaev N, Kaiser L, Levskaya A. Reformer: The Efficient Transformer. arXiv:2001.08361, 2020."
    },
    "2212.14052": {
      bibtex: `@article{poli2023hyena,
  title={Hyena Hierarchy: Towards Larger Convolutional Language Models},
  author={Poli, Michael and Massaroli, Stefano and Dao, Tri and Nguyen, Eric},
  journal={arXiv preprint arXiv:2212.14052},
  year={2023}
}`,
      ris: `TY  - JOUR
TI  - Hyena Hierarchy: Towards Larger Convolutional Language Models
AU  - Poli, Michael
AU  - Massaroli, Stefano
PY  - 2023
JO  - arXiv preprint arXiv:2212.14052
ER  - `,
      text: "Poli M, Massaroli S, Dao T, et al. Hyena Hierarchy: Towards Larger Convolutional Language Models. arXiv:2212.14052, 2023."
    }
  }
};

const MEDICAL_RAG_CASE = {
  id: "medical-rag",
  label: "医学 RAG",
  description: "展示检索增强生成在医学问答里的结果页形态。",
  sampleQuery: "What is the current evidence for retrieval-augmented generation in medicine?",
  matchKeywords: ["medicine", "medical", "clinical", "rag", "retrieval", "healthcare"],
  maxSteps: 12,
  basePapers: [
    {
      id: "2005.11401",
      title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
      authors: "Patrick Lewis, Ethan Perez, Aleksandara Piktus, Fabio Petroni",
      year: "2020",
      abstract:
        "RAG combines a neural retriever with a generator, improving factual recall on knowledge-intensive tasks and reducing reliance on parametric memory alone.",
      url: "https://arxiv.org/abs/2005.11401",
      isExpanded: false,
      isExpanding: false,
      score: 0.94,
      source: "search",
      origin: "retrieval augmented generation medicine"
    },
    {
      id: "2312.10997",
      title: "Retrieval-Augmented Generation for Large Language Models: A Survey",
      authors: "Yunfan Gao, Yun Xiong, Xinyu Gao, Kangxiang Jia",
      year: "2023",
      abstract:
        "This survey organizes the design space of retrieval-augmented generation systems, including retrieval strategies, grounding mechanisms, and evaluation concerns.",
      url: "https://arxiv.org/abs/2312.10997",
      isExpanded: false,
      isExpanding: false,
      score: 0.9,
      source: "search",
      origin: "rag survey healthcare"
    },
    {
      id: "2402.13138",
      title: "MedRAG: Retrieval-Augmented Generation for Medical Question Answering",
      authors: "Synthetic Demo Authors",
      year: "2024",
      abstract:
        "MedRAG-style systems show that combining medical retrieval corpora with LLM generation can improve grounded answering quality and reduce unsupported claims.",
      url: "https://arxiv.org/abs/2402.13138",
      isExpanded: false,
      isExpanding: false,
      score: 0.88,
      source: "expand",
      origin: "[2005.11401] Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks"
    },
    {
      id: "2404.00497",
      title: "Evaluating Hallucination Reduction in Clinical Retrieval-Augmented QA",
      authors: "Synthetic Demo Authors",
      year: "2024",
      abstract:
        "Clinical retrieval grounding helps reduce unsupported medical claims, but gains depend heavily on retrieval quality and evidence selection.",
      url: "https://arxiv.org/abs/2404.00497",
      isExpanded: false,
      isExpanding: false,
      score: 0.85,
      source: "search",
      origin: "hallucination reduction medical rag"
    },
    {
      id: "2401.09183",
      title: "Benchmarking Retrieval-Augmented Generation for Medical Evidence QA",
      authors: "Synthetic Demo Authors",
      year: "2024",
      abstract:
        "This benchmark evaluates whether retrieved clinical evidence improves answer trustworthiness, calibration, and citation quality for medical QA.",
      url: "https://arxiv.org/abs/2401.09183",
      isExpanded: false,
      isExpanding: false,
      score: 0.82,
      source: "expand",
      origin: "[2312.10997] Retrieval-Augmented Generation for Large Language Models: A Survey"
    }
  ],
  expandedPaper: {
    id: "2405.01828",
    title: "Practical Failure Modes of Medical RAG Systems",
    authors: "Synthetic Demo Authors",
    year: "2024",
    abstract:
      "Ablation-style analysis of medical RAG systems shows that retrieval miss, stale evidence, and citation mismatch remain the dominant failure modes in practice.",
    url: "https://arxiv.org/abs/2405.01828",
    isExpanded: false,
    isExpanding: false,
    score: 0.77,
    source: "expand",
    origin: "[2402.13138] MedRAG: Retrieval-Augmented Generation for Medical Question Answering"
  },
  answer: {
    summary:
      "Current evidence suggests retrieval-augmented generation can substantially improve medical QA when the retriever is high quality and the model is forced to ground answers in external evidence. The gains are strongest for factual recall and citation quality, but hallucination risk is not eliminated and still depends on retrieval coverage, document freshness, and answer verification.",
    key_evidence: [
      {
        claim:
          "RAG improves knowledge grounding by moving part of the factual burden from model memory to retrieved evidence.",
        paper_ids: ["2005.11401", "2312.10997"],
        confidence: "high"
      },
      {
        claim:
          "Medical-domain RAG systems show better answer support and lower unsupported claim rates when retrieval quality is strong.",
        paper_ids: ["2402.13138", "2404.00497"],
        confidence: "high"
      },
      {
        claim:
          "The main residual risks are retrieval miss, stale evidence, and citation mismatch rather than language generation alone.",
        paper_ids: ["2401.09183", "2405.01828"],
        confidence: "medium"
      }
    ],
    limitations: [
      "Most reported gains depend on curated retrieval corpora and may weaken in noisier clinical settings.",
      "Citation presence is not the same as citation correctness; evidence alignment still needs checking."
    ],
    next_questions: [
      "Which medical RAG evaluation benchmarks are most reliable today?",
      "How should a medical RAG system detect weak or missing evidence before answering?"
    ]
  },
  citations: {
    "2005.11401": {
      bibtex: `@article{lewis2020rag,
  title={Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks},
  author={Lewis, Patrick and Perez, Ethan and Piktus, Aleksandara and Petroni, Fabio},
  journal={arXiv preprint arXiv:2005.11401},
  year={2020}
}`,
      ris: `TY  - JOUR
TI  - Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks
AU  - Lewis, Patrick
AU  - Perez, Ethan
PY  - 2020
JO  - arXiv preprint arXiv:2005.11401
ER  - `,
      text: "Lewis P, Perez E, Piktus A, et al. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. arXiv:2005.11401, 2020."
    },
    "2312.10997": {
      bibtex: `@article{gao2023ragsurvey,
  title={Retrieval-Augmented Generation for Large Language Models: A Survey},
  author={Gao, Yunfan and Xiong, Yun and Gao, Xinyu and Jia, Kangxiang},
  journal={arXiv preprint arXiv:2312.10997},
  year={2023}
}`,
      ris: `TY  - JOUR
TI  - Retrieval-Augmented Generation for Large Language Models: A Survey
AU  - Gao, Yunfan
AU  - Xiong, Yun
PY  - 2023
JO  - arXiv preprint arXiv:2312.10997
ER  - `,
      text: "Gao Y, Xiong Y, Gao X, et al. Retrieval-Augmented Generation for Large Language Models: A Survey. arXiv:2312.10997, 2023."
    },
    "2402.13138": {
      bibtex: `@article{demo2024medrag,
  title={MedRAG: Retrieval-Augmented Generation for Medical Question Answering},
  author={Synthetic Demo Authors},
  journal={arXiv preprint arXiv:2402.13138},
  year={2024}
}`,
      ris: `TY  - JOUR
TI  - MedRAG: Retrieval-Augmented Generation for Medical Question Answering
AU  - Synthetic Demo Authors
PY  - 2024
JO  - arXiv preprint arXiv:2402.13138
ER  - `,
      text: "Synthetic Demo Authors. MedRAG: Retrieval-Augmented Generation for Medical Question Answering. arXiv:2402.13138, 2024."
    },
    "2404.00497": {
      bibtex: `@article{demo2024clinicalrag,
  title={Evaluating Hallucination Reduction in Clinical Retrieval-Augmented QA},
  author={Synthetic Demo Authors},
  journal={arXiv preprint arXiv:2404.00497},
  year={2024}
}`,
      ris: `TY  - JOUR
TI  - Evaluating Hallucination Reduction in Clinical Retrieval-Augmented QA
AU  - Synthetic Demo Authors
PY  - 2024
JO  - arXiv preprint arXiv:2404.00497
ER  - `,
      text: "Synthetic Demo Authors. Evaluating Hallucination Reduction in Clinical Retrieval-Augmented QA. arXiv:2404.00497, 2024."
    },
    "2401.09183": {
      bibtex: `@article{demo2024medbenchmark,
  title={Benchmarking Retrieval-Augmented Generation for Medical Evidence QA},
  author={Synthetic Demo Authors},
  journal={arXiv preprint arXiv:2401.09183},
  year={2024}
}`,
      ris: `TY  - JOUR
TI  - Benchmarking Retrieval-Augmented Generation for Medical Evidence QA
AU  - Synthetic Demo Authors
PY  - 2024
JO  - arXiv preprint arXiv:2401.09183
ER  - `,
      text: "Synthetic Demo Authors. Benchmarking Retrieval-Augmented Generation for Medical Evidence QA. arXiv:2401.09183, 2024."
    },
    "2405.01828": {
      bibtex: `@article{demo2024ragfailure,
  title={Practical Failure Modes of Medical RAG Systems},
  author={Synthetic Demo Authors},
  journal={arXiv preprint arXiv:2405.01828},
  year={2024}
}`,
      ris: `TY  - JOUR
TI  - Practical Failure Modes of Medical RAG Systems
AU  - Synthetic Demo Authors
PY  - 2024
JO  - arXiv preprint arXiv:2405.01828
ER  - `,
      text: "Synthetic Demo Authors. Practical Failure Modes of Medical RAG Systems. arXiv:2405.01828, 2024."
    }
  }
};

const CASES = [ATTENTION_CASE, MEDICAL_RAG_CASE];

export function listFixtures() {
  return CASES.map((item) => ({
    id: item.id,
    label: item.label,
    description: item.description,
    sampleQuery: item.sampleQuery
  }));
}

export function createFixture(rawQuery = "") {
  const query = String(rawQuery || "").trim().toLowerCase();
  const matched =
    CASES.find((item) => item.matchKeywords.some((keyword) => query.includes(keyword))) || CASES[0];

  return {
    id: matched.id,
    label: matched.label,
    description: matched.description,
    query: rawQuery || matched.sampleQuery,
    maxSteps: matched.maxSteps,
    phases: jsonClone(PHASES),
    basePapers: jsonClone(matched.basePapers),
    expandedPaper: jsonClone(matched.expandedPaper),
    answer: jsonClone(matched.answer),
    citations: jsonClone(matched.citations)
  };
}

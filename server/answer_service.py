from __future__ import annotations

from typing import Literal

from server.response_utils import ApiError

ConfidenceLevel = Literal["high", "medium", "low"]


def _pick_confidence(paper_count: int) -> ConfidenceLevel:
    if paper_count >= 5:
        return "high"
    if paper_count >= 2:
        return "medium"
    return "low"


def build_answer_payload(query: str, papers: list[dict], mode: str = "balanced") -> dict:
    if not papers:
        raise ApiError(
            code=2404,
            message="no papers available for current session",
            error_type="NO_PAPERS_AVAILABLE",
            status_code=404,
            details={"mode": mode},
        )

    top_papers = papers[: min(3, len(papers))]
    confidence = _pick_confidence(len(papers))
    summary_titles = ", ".join(paper["title"] for paper in top_papers)

    key_evidence = [
        {
            "claim": f'{paper["title"]} is one of the strongest papers surfaced for the current query.',
            "paper_ids": [paper["id"]],
            "confidence": "high" if float(paper.get("score", 0.0)) >= 0.8 else "medium",
        }
        for paper in top_papers
    ]

    return {
        "answer": {
            "summary": (
                f'For the query "{query}", the current session surfaced {len(papers)} relevant papers. '
                f"The highest-ranked sources include {summary_titles}."
            ),
            "key_evidence": key_evidence,
            "limitations": [
                "This summary is generated directly from the current paper pool.",
                "You should still inspect the original abstracts and cited sources for deeper verification.",
            ],
            "next_questions": [
                f"What are the main differences among the top papers for: {query}?",
                f"Which paper should be expanded next for: {query}?",
            ],
        },
        "confidence": confidence,
        "evidence_cards": top_papers,
    }

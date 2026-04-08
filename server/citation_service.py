from __future__ import annotations

import re
from typing import Literal


CitationFormat = Literal["bibtex", "ris", "text"]


def _escape_bibtex(value: str) -> str:
    return value.replace("{", "").replace("}", "").strip()


def _citation_key(authors: str, year: str, title: str) -> str:
    lead_author = authors.split(",")[0].strip().split()[-1].lower() if authors.strip() else "paper"
    title_token = re.sub(r"[^a-z0-9]+", "", title.lower())[:12] or "result"
    return f"{lead_author}{year}{title_token}"


def _to_bibtex(paper: dict) -> str:
    year = paper.get("year") or "N/A"
    title = _escape_bibtex(str(paper.get("title") or "Untitled"))
    authors = _escape_bibtex(str(paper.get("authors") or "Unknown"))
    url = str(paper.get("url") or "")
    paper_id = str(paper.get("id") or "")
    key = _citation_key(authors, year, title)
    return (
        f"@article{{{key},\n"
        f"  title={{{title}}},\n"
        f"  author={{{authors}}},\n"
        f"  journal={{arXiv preprint arXiv:{paper_id}}},\n"
        f"  year={{{year}}},\n"
        f"  url={{{url}}}\n"
        f"}}"
    )


def _to_ris(paper: dict) -> str:
    year = str(paper.get("year") or "N/A")
    title = str(paper.get("title") or "Untitled")
    authors = [author.strip() for author in str(paper.get("authors") or "").split(",") if author.strip()]
    lines = ["TY  - JOUR", f"TI  - {title}"]
    lines.extend(f"AU  - {author}" for author in authors)
    lines.extend(
        [
            f"PY  - {year}",
            f"UR  - {paper.get('url') or ''}",
            f"JO  - arXiv preprint arXiv:{paper.get('id') or ''}",
            "ER  - ",
        ]
    )
    return "\n".join(lines)


def _to_text(paper: dict) -> str:
    authors = str(paper.get("authors") or "Unknown")
    title = str(paper.get("title") or "Untitled")
    year = str(paper.get("year") or "N/A")
    paper_id = str(paper.get("id") or "")
    return f"{authors}. {title}. arXiv:{paper_id}, {year}."


def build_citation_items(
    papers: list[dict],
    citation_format: CitationFormat,
    paper_ids: list[str] | None = None,
) -> dict:
    allowed_ids = set(paper_ids or [])
    selected_papers = [paper for paper in papers if not allowed_ids or paper["id"] in allowed_ids]

    formatter = {
        "bibtex": _to_bibtex,
        "ris": _to_ris,
        "text": _to_text,
    }[citation_format]

    return {
        "format": citation_format,
        "items": [
            {
                "paper_id": paper["id"],
                "format": citation_format,
                "content": formatter(paper),
            }
            for paper in selected_papers
        ],
    }

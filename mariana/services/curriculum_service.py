# services/curriculum_service.py
import json
import re
from pathlib import Path
from models.resource import CurriculumOutcome

class CurriculumService:
    """
    Loads the hardcoded syllabus JSON and matches a teacher's topic
    to the relevant ACARA content descriptors + Scootle URLs.
    """
    def __init__(self, syllabus_path: str = "data/syllabus.json"):
        """Initializes the CurriculumService by loading the syllabus JSON."""
        with open(Path(syllabus_path), "r") as f:
            self._syllabus = json.load(f)

    def get_outcomes(
        self,
        subject: str,
        grade: str,
        topic: str,
    ) -> list[CurriculumOutcome]:
        """
        Returns all descriptors that match the given subject/grade/topic.
        Matching strategy (in order):
        1. Exact sub-strand name match
        2. Keyword overlap between topic and descriptor description
        3. Fallback: return ALL descriptors for the subject/grade
        """
        try:
            content = (
                self._syllabus[subject][grade]["content_descriptions"]
            )
        except KeyError:
            return []  # Subject/grade not in our hardcoded slice

        all_descriptors = self._flatten(content)

        # Try sub-strand match first (e.g. topic = "Biological sciences")
        sub_strand_match = self._match_by_sub_strand(all_descriptors, topic)
        if sub_strand_match:
            return sub_strand_match

        # Try keyword match against descriptor descriptions
        keyword_match = self._match_by_keywords(all_descriptors, topic)
        if keyword_match:
            return keyword_match

        # Fallback: return everything — the LLM will filter relevance
        return all_descriptors

    def get_context_block(
        self,
        subject: str,
        grade: str,
        topic: str,
    ) -> str:
        """
        Returns a formatted string block to inject into the prompt,
        listing the matched curriculum outcomes.
        """
        outcomes = self.get_outcomes(subject, grade, topic)
        if not outcomes:
            return ""
        lines = [
            f"AUSTRALIAN CURRICULUM OUTCOMES FOR {subject.upper()} {grade.upper()}",
            f"Topic: {topic}",
            f"The following ACARA content descriptors are relevant. "
            f"Resources MUST address at least one of these outcomes:\n",
        ]
        for o in outcomes:
            lines.append(f"[{o.code}] {o.sub_strand}: {o.description}")
            lines.append(f"  Scootle: {o.scootle_url}")
        return "\n".join(lines)

    # ── Private helpers ────────────────────────────────────────────────────────

    def _flatten(self, content_descriptions: dict) -> list[CurriculumOutcome]:
        """Walk the JSON tree and return a flat list of CurriculumOutcome."""
        outcomes = []
        for strand_name, strand_data in content_descriptions.items():
            for sub_strand_name, descriptors in strand_data.items():
                for d in descriptors:
                    outcomes.append(
                        CurriculumOutcome(
                            code=d["code"],
                            description=d["description"],
                            scootle_url=d["scootle_url"],
                            strand=strand_name,
                            sub_strand=sub_strand_name,
                        )
                    )
        return outcomes

    def _match_by_sub_strand(
        self, outcomes: list[CurriculumOutcome], topic: str
    ) -> list[CurriculumOutcome]:
        """Matches outcomes by comparing the topic string with sub-strand names."""
        topic_lower = topic.lower()
        matched = [
            o for o in outcomes
            if topic_lower in o.sub_strand.lower()
            or o.sub_strand.lower() in topic_lower
        ]
        return matched

    def _match_by_keywords(
        self, outcomes: list[CurriculumOutcome], topic: str
    ) -> list[CurriculumOutcome]:
        """Matches outcomes based on keyword overlap between the topic and descriptions."""
        # Extract meaningful words (>3 chars, not stopwords)
        stopwords = {"and", "the", "for", "with", "that", "this", "from", "their", "into"}
        keywords = set(re.findall(r"\b\w{4,}\b", topic.lower())) - stopwords

        if not keywords:
            return []

        matched = []
        for o in outcomes:
            desc_words = set(re.findall(r"\b\w{4,}\b", o.description.lower()))
            sub_words  = set(re.findall(r"\b\w{4,}\b", o.sub_strand.lower()))
            if keywords & (desc_words | sub_words):  # any keyword overlap
                matched.append(o)
        return matched

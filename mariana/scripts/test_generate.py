from pathlib import Path

import httpx
import json

# Use the actual resources from your discovery response
mock_request = {
    "grade": "Year 10",
    "subject": "History",
    "state": "NSW",
    "topic": "Causes of World War I",
    "additional_context": "Focus on Australian involvement and the MAIN causes framework.",
    "selected_resources": [
        {
            "title": "world_war_1.txt",
            "url": None,
            "summary": "Introduces the M.A.I.N. acronym as a framework for understanding the long-term causes of WWI.",
            "source_type": "teacher_upload",
            "curriculum_alignment": "high",
            "bias_risk": "low",
            "reading_level": "Year 10",
            "domain": "teacher_upload",
            "follow_up_questions": ["Why is the M.A.I.N. acronym useful for historians?"],
            "document_id": "700d7360-1203-4a58-911a-5d839034954b"
        },
        {
            "title": "world_war_1.txt",
            "url": None,
            "summary": "Explains the alliance systems (Triple Entente vs. Triple Alliance) and how they contributed to escalation.",
            "source_type": "teacher_upload",
            "curriculum_alignment": "high",
            "bias_risk": "low",
            "reading_level": "Year 10",
            "domain": "teacher_upload",
            "follow_up_questions": ["How did the alliance system create a domino effect?"],
            "document_id": "ed35fb02-62fb-4b3c-b756-50bba0229b69"
        },
        {
            "title": "First World War - Australian War Memorial",
            "url": "https://www.awm.gov.au/learn/schools/resources/firstworldwar",
            "summary": "Australian War Memorial educational resources including case studies and primary sources.",
            "source_type": "web",
            "curriculum_alignment": "high",
            "bias_risk": "low",
            "reading_level": "Year 10",
            "domain": "awm.gov.au",
            "follow_up_questions": ["How can AWM digital collections support student inquiry?"],
            "document_id": None
        }
    ]
}

response = httpx.post(
    "http://localhost:8000/api/generate",
    json=mock_request,
    timeout=120.0  # generation takes a while
)

print(f"Status: {response.status_code}")
data = response.json()
markdown = data.get("markdown", "# Error\n\nNo markdown returned.")

output_path = Path("scripts/output/study_plan.md")
output_path.parent.mkdir(parents=True, exist_ok=True)
output_path.write_text(markdown, encoding="utf-8")

print(f"✅ Status: {response.status_code}")
print(f"📄 Study plan saved to: {output_path.resolve()}")
# 📥 UPSC PYQ Import Folder (`pyqs_to_import`)

Paste your UPSC question JSON files here!

---

### Supported Files:
You can drop any 2025, 2026, or earlier UPSC CSE question papers here:
- **GS Paper-I** (General Studies)
- **CSAT Paper-II** (Civil Services Aptitude Test)

---

### Supported JSON Formats:

#### Format 1: Standard Wrapper (Recommended)
```json
{
  "meta": {
    "exam": "UPSC CSE Prelims",
    "year": 2025,
    "paper": "General Studies Paper-I",
    "paper_type": "GS1",
    "total_questions": 100,
    "marks_per_correct": 2.0,
    "negative_marks_per_wrong": 0.67
  },
  "passages": [
    {
      "id": "passage_1",
      "text": "Read the following passage and answer the questions..."
    }
  ],
  "questions": [
    {
      "question_number": 1,
      "question": "Which of the following statements about the Constitution is correct?",
      "statements": [
        "1. It was adopted in 1949.",
        "2. It came into force on 26th January 1950."
      ],
      "options": [
        { "id": "A", "text": "1 only" },
        { "id": "B", "text": "2 only" },
        { "id": "C", "text": "Both 1 and 2" },
        { "id": "D", "text": "Neither 1 nor 2" }
      ],
      "correct_answer": "C",
      "subject": "Indian Polity",
      "topic": "Constitutional Framework",
      "explanation": "The Constitution was adopted on 26 Nov 1949 and came into effect on 26 Jan 1950."
    }
  ]
}
```

#### Format 2: Direct Question Array
```json
[
  {
    "year": 2026,
    "paper_type": "CSAT",
    "question_number": 1,
    "passage_text": "Passage content here if applicable...",
    "question": "What is the logical corollary to the passage?",
    "options": {
      "A": "Option A text",
      "B": "Option B text",
      "C": "Option C text",
      "D": "Option D text"
    },
    "correct_answer": "B",
    "subject": "Reading Comprehension",
    "topic": "Critical Reasoning",
    "explanation": "Detailed explanation..."
  }
]
```

---

### How to Import:
Whenever you paste new JSON files here, simply tell me or run:
```bash
npm run db:import
```
The importer automatically:
1. Scans this folder (`assets/data/pyqs_to_import`) and `assets/data/pyqs`.
2. Normalizes options (objects, arrays, or key-value pairs).
3. Detects GS1 vs CSAT scoring schemes.
4. Generates unique SHA-256 fingerprints to ensure zero duplicate questions.
5. Saves directly to your Supabase `questions` database.

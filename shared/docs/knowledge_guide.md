# Knowledge Engineering Platform (KEP) Integration Manual
## JCCAD Company Intelligence Platform (CIP)

---

## 1. Structured Knowledge Model

Unlike raw documents, KEP transforms assets into **Knowledge Items** containing clean semantic models:

```
[Knowledge Item Entry]
  ├── Title: "Mechatronics Department Syllabus"
  ├── Category: "Courses"
  ├── Sections: [
  │     { heading: "Course Description", content: "...", contentType: "paragraph" },
  │     { heading: "Required Materials", content: "...", contentType: "list" }
  │   ]
  ├── Relationships: [
  │     { type: "belongs_to", targetItemId: "Dept_101", targetItemTitle: "Mechatronics Department" }
  │   ]
  ├── Source: { sourceType: "Document", sourceId: "Doc_88", sourceVersion: 1 }
  └── Metadata: { topic: "Robotics", qualityScore: 95, language: "en" }
```

---

## 2. Extraction Cleaning Rules

To maintain high data quality, inputs pass through normalized cleaning filters:
1. **Whitespace Normalization:** Removes tabs, duplicate spaces, and blank line runs to prevent token bloat.
2. **Boilerplate Strip:** Removes header patterns, page numbering footers, and footer blocks using regular expressions.
3. **Quality Score Assignment:** Scans section headings and paragraph lengths, penalizing empty fields or brief content chunks.

---

## 3. Relationship Graph Modeling

KEP establishes semantic relationships between assets, helping the chatbot query connected resources:

```
                  +--------------------------------+
                  |   Mechatronics Department      | (Category: Departments)
                  +--------------------------------+
                                  ^
                                  | belongs_to
                  +--------------------------------+
                  |       Robotics 101             | (Category: Courses)
                  +--------------------------------+
                    ^                            ^
         taught_by  |                            | prerequisite_of
                    |                            |
  +-----------------+----+          +------------+------------+
  |    Dr. Alan Turing   |          |       Robotics 102      |
  |  (Category: Faculty) |          |   (Category: Courses)   |
  +----------------------+          +-------------------------+
```

* **Belongs To:** Connects services or courses to parent departments.
* **Taught By:** Links courses to instructors.
* **Prerequisite Of:** Sets dependencies between curriculum elements.
* **Relates To:** Captures general associations (e.g., FAQ points connected to courses).

---

## 4. Downstream AI Integration Readiness
Published knowledge items emit `knowledge:published` events to the Redis event channel. 
AI modules can subscribe to this stream to retrieve the compiled sections, relationships, and metadata directly. This allows them to generate embeddings and construct dynamic grounding prompts without processing raw document files.

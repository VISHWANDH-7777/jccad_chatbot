# Product Design Specification
## JCCAD Company Intelligence Platform (CIP)

**Prepared by the Product Design Council**

| Version | Date | Status | Target Audience |
| :--- | :--- | :--- | :--- |
| v1.0.0 | 2026-06-30 | Released | UI/UX Designers, Frontend Engineers, Product Managers |

---

## SECTION 1: Product Design Principles

The JCCAD Company Intelligence Platform (CIP) interface is built around a **content-first, minimal aesthetic** to ensure users can access information quickly.

* **Visual Hierarchy:** Critical elements (such as system status indicators, action inputs, and active messages) are positioned at key visual focal points, while secondary metadata uses smaller, muted styling.
* **Consistency:** The interface uses standardized design tokens across the chat, administration, and dashboard viewports.
* **Clarity:** Interface layouts prioritize clean grid divisions and generous whitespace to guide the user's focus to content blocks.
* **Feedback:** System status updates (including document synchronization progress, vector processing states, and connection dropouts) are displayed via persistent notifications or toast alerts.
* **Accessibility:** Built from the ground up to comply with **WCAG 2.2 AA** guidelines, featuring high-contrast themes and keyboard focus states.
* **AI Transparency:** Renders active AI routing modes (Company Expert vs General AI) and grounds statements using superscript citations linked to source documents.

---

## SECTION 2: Information Architecture & Navigation

The platform's navigation maps to the user's role and permission levels.

```
                           +--------------------------------------+
                           |          Platform App Root           |
                           +--------------------------------------+
                                              |
      +------------------+--------------------+-------------------+------------------+
      |                  |                    |                   |                  |
      v                  v                    v                   v                  v
+-----------+      +-----------+        +-----------+       +-----------+      +-----------+
| Guest/Std |      |   Client  |        | Staff/Emp |       |  Manager  |      | Admin/SA  |
| Chat UI   |      | Portal UI |        | Search UI |       | Analytics |      | Dashboard |
+-----------+      +-----------+        +-----------+       +-----------+      +-----------+
```

### Navigational Mappings by Role

* **Guest / Student Nav Map:**
  * `Chat Interface` (Primary workspace)
  * `Syllabi Directory` (Read-only course FAQ lists)
  * `Support Links`
* **Professional / Client Nav Map:**
  * `Chat Interface` (Includes vision upload tools)
  * `Service Capability Sheets`
  * `Project Workspace`
* **Employee / Instructor Nav Map:**
  * `Chat Interface` (Includes internal database access)
  * `Knowledge Search Portal`
* **Manager Nav Map:**
  * `Chat Interface`
  * `Analytics Dashboard` (Review query logs, token charts, and user satisfaction metrics)
* **Admin / Super Admin Nav Map:**
  * `Chat Workspace`
  * `Admin Dashboard` (Files panel, web crawler scheduler, system configurations, and security audits)

---

## SECTION 3: User Flows & ASCII Wireframes

### 3.1 Main Chat Layout Wireframe (Desktop)
```
+-----------------------------------------------------------------------------+
| JCCAD CIP | Mode: [Expert] (Auto) | Lang: [EN]                 (Profile) [V] |
+-----------+-----------------------------------------------------------------+
| HISTORY   |                                                                 |
| Today     |  JCCAD Assistant: Hello! How can I help you today?              |
| - CAD fees|                                                                 |
| - Drone   |  User: What is the fee for Mechatronics Engineering courses?    |
| Yesterday |                                                                 |
| - PLC lab |  JCCAD Assistant: The fee for the Mechatronics Course is        |
| - SolidW  |  $650 per semester [1]. Registrations close next Monday [2].    |
|           |                                                                 |
|           |  [1] Syllabus_Mechatronics_2026.pdf (Page 3)                    |
|           |  [2] Course_Deadlines_2026.pdf (Page 1)                         |
|           |                                                                 |
|           |  Suggested: [How do I register?] [Are there discounts?]         |
|           +-----------------------------------------------------------------+
|           | [ + ] Enter your question here...                         [Send] |
+-----------+-----------------------------------------------------------------+
```

### 3.2 Admin Dashboard Wireframe (Desktop)
```
+-----------------------------------------------------------------------------+
| JCCAD Admin Portal | [Overview] [Files] [Crawler] [Users] [Settings]         |
+--------------------+--------------------------------------------------------+
| KNOWLEDGE BASE UPLOADS                                                      |
| [ + Upload File (Max 50MB) ]                                                |
|                                                                             |
| Name                         Size     Status      Access       Actions      |
| Syllabus_CAD_2026.pdf       12.4MB   [INDEXED]   Public       [Edit] [Del]  |
| UAV_Design_Internal.pptx    24.1MB   [INDEXED]   Internal     [Edit] [Del]  |
| Lab_Safety_Rules.docx        4.2MB   [PENDING]   Staff        [Edit] [Del]  |
|                                                                             |
| WEB CRAWLER STATUS                                                          |
| Seed URL: https://www.jccad.com/courses    Depth: 3    Schedule: Weekly     |
| Last Crawl: 2026-06-29 22:15 GMT           Status: [Success (54 pages)]     |
+-----------------------------------------------------------------------------+
```

### User Journey Flows

#### 1. Ingesting New Course Files
* Admin logs in $\rightarrow$ Navigates to Admin Dashboard $\rightarrow$ Opens Files tab $\rightarrow$ Drags and drops `Syllabus_PLC_2026.pdf` $\rightarrow$ File validation runs $\rightarrow$ Progress bar shows parsing status $\rightarrow$ Success state displays index confirmation.

#### 2. Querying in Chat
* User navigates to page $\rightarrow$ Automatic Mode Router defaults to Company Expert Mode $\rightarrow$ User sends query $\rightarrow$ Typing indicators show search status $\rightarrow$ Tokens stream into view $\rightarrow$ Citation tooltips display source page links.

---

## SECTION 4: Design System & Tokens

CIP defines a strict spacing, grid, and layout system.

| Spacing Token | Value (px) | Application |
| :--- | :--- | :--- |
| `spacing-xs` | 4px | Padding around small badges, icon buttons, and tooltips. |
| `spacing-sm` | 8px | Padding within input text fields and list items. |
| `spacing-md` | 16px | Padding inside chat bubbles, buttons, and alert callouts. |
| `spacing-lg` | 24px | Grid spacing, padding inside dashboard blocks and sidebar views. |
| `spacing-xl` | 32px | Outer layout margins for landing views and large components. |

### Visual Tokens
* **Radius:** Small UI elements use `4px` borders (inputs, tooltip popups), card components use `8px` borders, and avatars use circular formatting (`50%`).
* **Borders:** Thin grey lines (`1px solid var(--neutral-border)`) separate sidebar lists and header elements.
* **Elevation:** Small shadows (`0 2px 4px rgba(0,0,0,0.05)`) emphasize dropdown menus and hover elements.

---

## SECTION 5: Color System

The brand color palette uses high-contrast accessibility configurations across both themes.

| Theme Class | Light Mode Value | Dark Mode Value | Contrast Ratio (Accessibility) | Brand Category |
| :--- | :--- | :--- | :--- | :--- |
| `primary` | `#0f172a` (Slate-900) | `#f8fafc` (Slate-50) | $\ge 7:1$ (AAA Compliant) | Base Text / UI headers |
| `secondary`| `#475569` (Slate-600) | `#cbd5e1` (Slate-300) | $\ge 4.5:1$ (AA Compliant) | Body Text / Muted labels |
| `accent` | `#0284c7` (Sky-600) | `#38bdf8` (Sky-400) | $\ge 4.5:1$ (AA Compliant) | Focus rings / citation links |
| `bg-main` | `#f8fafc` | `#0f172a` | AAA Compliant | Outer Viewport Background |
| `bg-card` | `#ffffff` | `#1e293b` (Slate-800) | AAA Compliant | Chat Bubbles / Table containers|
| `border` | `#e2e8f0` | `#334155` | N/A | Dividing rules / borders |
| `error` | `#dc2626` | `#f87171` | $\ge 4.5:1$ (AA Compliant) | Validation Alerts |

---

## SECTION 6: Typography Scale

CIP targets system-level sans-serif font families (e.g., Inter, Segoe UI, Roboto, system-ui) to ensure fast rendering.

| Style Name | Size | Weight | Line Height | Case | Layout Element |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Heading 1** | 32px | 700 (Bold) | 40px | Sentence | Page Titles |
| **Heading 2** | 24px | 600 (Semi-bold)| 32px | Sentence | Section Headers |
| **Heading 3** | 18px | 600 (Semi-bold)| 24px | Sentence | Card & Form Titles |
| **Body Large** | 16px | 400 (Regular) | 24px | Sentence | User Chat Prompts |
| **Body Normal**| 14px | 400 (Regular) | 20px | Sentence | Assistant Chat Text / Tables |
| **Caption** | 12px | 400 (Regular) | 16px | Sentence | Citations, Timestamps, Badges |
| **Code Block** | 13px | 500 (Medium) | 18px | Source | Monospace code displays |

---

## SECTION 7: Component Library Specification

All components support high-contrast outline states for accessibility.

```
                  +---------------------------------------+
                  |           Button component            |
                  +---------------------------------------+
                   /                                     \
                  /                                       \
                 v                                         v
+-----------------------------+             +-----------------------------+
|        Active State         |             |      Keyboard Focus         |
|   (Solid Slate Background)  |             |  (Sky Blue Outline Ring)    |
+-----------------------------+             +-----------------------------+
```

* **Interactive Inputs:** Text inputs use dynamic styles. Clicking or focusing on an input shows a sky-blue border ring:
  `box-shadow: 0 0 0 2px var(--accent-ring);`
* **Dropdowns & Modals:** Dialog views use grey borders with drop shadows. They feature large exit buttons in the top-right corner to allow easy keyboard navigation.
* **Toasts & Tooltips:** Toast alerts slide in from the top-right corner to confirm operations (such as uploads or file deletions). Hovering over citations opens tooltip popovers displaying source page numbers.

---

## SECTION 8: Chat Experience & Interactions

The chat window is optimized for rapid interactions.

```
                    +------------------------------------+
                    |        Greeting & Suggestions      |
                    +------------------------------------+
                                       |
                                       v
                    +------------------------------------+
                    |         User types query           |
                    +------------------------------------+
                                       |
                                       v
                    +------------------------------------+
                    |   Thinking & Typing indicator      |
                    +------------------------------------+
                                       |
                                       v
                    +------------------------------------+
                    |     Stream response with links     |
                    +------------------------------------+
```

* **Welcome Screen:** Displays a greeting accompanied by three dynamic suggested prompt chips (e.g., *"How do I register for classes?"*).
* **Thinking State:** Displays a pulsing dot animation while search queries run.
* **Streaming Responses:** Streams generated text into the chat thread dynamically, automatically scrolling the viewport to follow the token stream.
* **Feedback Blocks:** Displays thumbs-up/down icons below each response. Clicking thumbs-down opens a text popup requesting feedback comments.

---

## SECTION 9: Admin Dashboard Experience

The Admin Dashboard provides tools to manage the platform's knowledge base and parameters.

* **Overview Panel:** Renders key metrics, including chat volumes, feedback ratios, and active sessions.
* **Files Panel:** Display uploaded documents in a table, showing file status (e.g., `Processing`, `Indexed`, or `Failed`) and metadata permissions.
* **Web Crawler Panel:** Configure seed URLs and crawl depth settings. Includes a manually triggered sync option.

---

## SECTION 10: Responsive Design & Breakpoints

Interface layouts adjust dynamically based on target device resolutions.

```
Mobile (<768px)       --> Sidebar collapses into hamburger menu. Chat expands to 100% width.
Tablet (768px-1024px) --> Sidebar reduces to icon display. Tables wrap columns.
Desktop (>1024px)     --> Full layout visible. Sidebar remains open.
```

---

## SECTION 11: Accessibility Compliance (WCAG 2.2 AA)

* **Contrast Integrity:** Ensures contrast ratios between text elements and card backgrounds exceed $4.5:1$.
* **Keyboard Focus Routing:** Pressing the `Tab` key cycles focus through inputs, button components, and links in logical order.
* **Screen Reader Labels:** Add descriptive aria-labels to elements without visible text (e.g., `aria-label="Submit Question"` for input send buttons).

---

## SECTION 12: Micro-interactions & Transitions

Micro-interactions provide system feedback during user actions.

* **Button Hovers:** Buttons subtly change opacity on hover, returning to standard styles on mouseout.
* **Upload Drop Action:** Dragging files over the dropzone changes the area border color to Sky Blue to confirm the file drag event.

---

## SECTION 13: Empty States

Empty states provide clear guidance to help users take the next step.

* **Empty Chat Thread:** Displays JCCAD branding, a welcome message, and suggested prompts.
* **No Search Results:** Renders: *"No documents match your query. Try clearing active category filters or adjusting search terms."*

---

## SECTION 14: Error Experience & Resolution

Error interfaces provide clear resolution instructions:

| Error Category | Visual Indicator | Recovery Actions |
| :--- | :--- | :--- |
| **Network Offline** | Red warning bar at top of screen. | Auto-retries connection every 5 seconds. Displays manual retry button. |
| **Parsing Failure**| Status badge switches to Red `FAILED`. | Hovering over badge displays error reason (e.g., encrypted file). |
| **Auth Expiration**| Modal overlay blocks interaction. | Displays: *"Session expired. Re-routing to JCCAD Login..."* |

---

## SECTION 15: UX Writing Guidelines

* **Button Labels:** Use short, action-focused verbs (e.g., `Synchronize`, `Upload File`, `Delete Document`).
* **Error Messaging:** Clearly explain what went wrong and provide a recovery action: *"Unable to parse Syllabus.pdf. Please verify the document is not password-protected and upload again."*
* **AI Fallback Messaging:** Grounded answers state boundaries clearly: *"I cannot locate that detail in JCCAD's official files. Please contact us directly at training@jccad.com for official details."*

---

## SECTION 16: Future UI Scalability

* **Voice Controls:** The chat input is designed to accommodate a microphone icon button in future updates.
* **Multi-tenant Configurations:** Header views include space to support brand selector dropdown elements, allowing administrators to switch company profiles in future versions.

---
*(End of Product Design Specification)*

# Frontend Engineering Specification
## JCCAD Company Intelligence Platform (CIP)

**Prepared by the Frontend Architecture Council**

| Version | Date | Status | Target Audience |
| :--- | :--- | :--- | :--- |
| v1.0.0 | 2026-06-30 | Released | Frontend Engineers, Tech Leads, Engineering Directors |

---

## SECTION 1: Frontend Architecture & Module Boundaries

The JCCAD Company Intelligence Platform (CIP) frontend is designed around a **Feature-Based (Feature-First), Layered Architecture** using React, TypeScript, and Tailwind CSS. The architecture is decoupled to allow teams to build and scale features independently.

```
+-----------------------------------------------------------------------------+
|                            React UI Layout Root                             |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
|    Application Layer (React Router, Global Providers, Auth, Theme, I18n)     |
+-----------------------------------------------------------------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
         v                                                         v
+------------------------------------+               +------------------------------------+
|  Feature Layer (Chat UI, Files)    |               |  Shared UI Layer (Design System)   |
|  - Components, Hooks, API Clients  |               |  - Buttons, Modals, Inputs, Cards  |
+------------------------------------+               +------------------------------------+
         |                                                         |
         +----------------------------+----------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
|  Infrastructure Layer (Axios Core Clients, EventSource Hooks, LocalCache)   |
+-----------------------------------------------------------------------------+
```

### Module Boundaries & Separation of Concerns
1. **Feature Decoupling:** Every feature inside `/features` represents a functional vertical. Features are prohibited from importing private modules from other features. Shared logic must be moved to `/components` or `/hooks`.
2. **Strict Public API Contract:** Features must expose their components, types, and hooks through a public index file (`index.ts`). Imports from subfolders within another feature are blocked by linter rules.
3. **API Layer Separation:** UI components do not call HTTP/SSE services directly. They consume custom hooks that handle server states (via React Query) or data fetching.

---

## SECTION 2: Project Folder Structure

CIP uses a standardized folder structure designed to support scale.

```
src/
├── assets/             # Raw media assets (SVGs, static icons, brand logos)
├── components/         # Reusable design system UI elements (Buttons, Inputs)
├── config/             # Environment configurations, route maps, constants
├── contexts/           # Global React Context providers (Auth, Theme)
├── features/           # Feature-based verticals (Self-contained modules)
│   ├── chat/           # Chat interface components, message lists, stream hooks
│   ├── knowledge/      # File upload managers, document lists, web crawl sync
│   └── analytics/      # Metric dashboards, Recharts containers, report logs
├── hooks/              # Global custom hooks (useSession, useIntersectionObserver)
├── layouts/            # Page layouts (DashboardLayout, AuthLayout, WidgetFrame)
├── pages/              # Route entry point views (ChatPage, LoginPage, AdminPage)
├── providers/          # Global context container wrap scripts
├── services/           # Backend API clients (Axios configs, SSE listeners)
├── styles/             # Global Tailwind configurations and custom sheets
├── types/              # Domain-level TypeScript definitions
└── utils/              # Helper utilities (formatting dates, text manipulation)
```

---

## SECTION 3: Routing Strategy

Routing is managed declaratively using **React Router v6** with dynamic loaders and page bundle lazy loading.

```
                                  +--------------------------------------+
                                  |             App Router               |
                                  +--------------------------------------+
                                                     |
                     +-------------------------------+-------------------------------+
                     |                                                               |
                     v                                                               v
       +----------------------------+                                  +----------------------------+
       |       Public Routes        |                                  |      Protected Routes      |
       +----------------------------+                                  +----------------------------+
       | - Login Page               |                                  | - Chat Workspace           |
       | - 404 Error Page           |                                  | - Document Upload Panel    |
       | - Maintenance Page         |                                  | - Settings & Admin Console |
       +----------------------------+                                  +----------------------------+
```

### Code Splitting & Lazy Loading Strategy
All major entry page components are loaded lazily to reduce initial bundle sizes:

```typescript
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
```

During route transitions, React Router displays localized skeleton loaders. Critical assets are pre-fetched during idle time using standard link declarations.

---

## SECTION 4: Application State Architecture

CIP splits state into three layers to prevent unnecessary UI updates.

```
                     +------------------------------------------------+
                     |                 Application State              |
                     +------------------------------------------------+
                                       |
          +----------------------------+----------------------------+
          |                            |                            |
          v                            v                            v
+--------------------+       +--------------------+       +--------------------+
|    Global State    |       |    Server State    |       |    Local State     |
| (Auth, Theme, Lang)|       | (Files, Users, Logs)|       | (UI toggles, Inputs)|
+--------------------+       +--------------------+       +--------------------+
```

### State Storage Allocations

* **Global State (React Context):** Holds static configurations, including user authentication state, current themes, and locale configurations.
* **Client Store (Zustand):** Manages active chat threads, current query streaming arrays, and historical session logs.
* **Server State (React Query / TanStack Query):** Manages cache lifecycles for remote data (such as document records, crawler statuses, and analytics logs).
* **Local Component State (React `useState`):** Manages local UI states (such as active navigation states, open/closed dropdowns, and text field inputs).

---

## SECTION 5: Component Architecture

Components are built using atomic design patterns:

```
[Atom: Button / Badge] --> [Molecule: Search Field] --> [Organism: Chat Input Form]
```

* **Layout Components:** Container layouts (e.g., standard layout frames, split panels, grid margins) structure the page layout.
* **Feedback Components:** Includes toast alerts, file validation badges, and dialog confirmations.
* **Accessibility Components:** Keyboard wrappers handle keyboard navigation and visual focus rings.

---

## SECTION 6: Chat UI Engineering

The Chat interface uses a dynamic token streaming pipeline:

```
                     +--------------------------------------+
                     |         API / SSE stream             |
                     +--------------------------------------+
                                        |
                                        v
                     +--------------------------------------+
                     |         SSE parsing Hook             |
                     |  - Decodes chunks                    |
                     |  - Appends to Zustand state          |
                     +--------------------------------------+
                                        |
                                        v
                     +--------------------------------------+
                     |     React virtualized message List   |
                     |  - Dynamic render with Markdown      |
                     |  - Citation superscript triggers      |
                     +--------------------------------------+
```

* **Render Optimization:** Long conversation threads are rendered using virtualization libraries (e.g., `react-window`) to reduce DOM nodes.
* **Markdown Rendering:** Markdown parsers convert assistant responses into structured lists, tables, and code blocks, using custom styling for citations.
* **Feedback Actions:** UI blocks allow users to copy responses, request a regeneration, or submit thumbs-up/down ratings.

---

## SECTION 7: Forms & Validation

Form validations are managed using **React Hook Form** combined with **Zod** schema schemas.

```
[User Form Submit] --> [Zod Schema Verification Check] --> [Fail: Display ARIA Alerts]
                                                    \
                                                     --> [Pass: Submit payload]
```

* **Error UX:** Errors are displayed dynamically below fields, updating ARIA tags (`aria-invalid="true"`) to inform screen readers of validation issues.
* **Localization:** Field labels and error messages load translations dynamically based on target language settings.

---

## SECTION 8: Authentication UX & RBAC Rendering

Authentication checks are performed on every page navigation:

* **Session Validation:** Custom hooks check token expiration, showing alerts before session timeouts.
* **Role-Based UI Rendering:** Decoupled components render conditionally based on user permissions:
  ```typescript
  <PermissionGuard permission="knowledge:upload">
    <UploadButton />
  </PermissionGuard>
  ```

---

## SECTION 9: Knowledge Management UI

The Admin Knowledge portal provides file management tools:

```
[File Selection] -> [Checks Size & Format] -> [Uploads to S3] -> [Worker Index Status Tracker]
```

* **Status Mapping:** Files are displayed in tables, updating status badges (`Indexed`, `Processing`, `Failed`) dynamically using database change notifications.

---

## SECTION 10: Admin Dashboard Interface

The Admin Dashboard provides telemetry metrics:

* **Telemetry Charts:** Rerenders time-series charts displaying latencies, token consumption, and feedback metrics using optimized chart libraries (e.g., Recharts).
* **Web Crawler Configuration:** Displays forms to configure crawling schedules, target depths, and seed URLs.

---

## SECTION 11: Performance Optimization

* **Memoization:** Standard components use `React.memo` to prevent unnecessary updates.
* **Bundle Optimization:** Tree-shaking splits large dependencies (such as Recharts and Lucide-React icons) into separate bundles.
* **Caching:** Cache search results and query configurations in local memory to speed up navigation.

---

## SECTION 12: Accessibility Implementation

* **Focus Management:** Focus state rings are enforced for all interactive components.
* **Keyboard Navigation:** Users can open dropdown menus, select fields, and click button links using standard keyboard commands (`Tab`, `Enter`, `Escape`).
* **Reduced Motion:** Animations adjust dynamically based on user preferences.

---

## SECTION 13: Error Handling & Recovery

* **Error Boundary Fallbacks:** Captures rendering exceptions using React Error Boundaries.
* **Recovery UX:** Displays user-friendly recovery instructions (such as offline reload warnings) for network dropouts.

---

## SECTION 14: Internationalization (I18n)

* **Translation Catalogs:** Interface text is loaded dynamically using JSON translation files.
* **Unicode Support:** Stored datasets and system strings utilize UTF-8 configurations.
* **RTL layout adjustments:** Component layout directions update dynamically (`dir="rtl"`) when RTL languages (e.g., Arabic) are selected.

---

## SECTION 15: Testing Strategy

```
[Unit / Component Tests (Vitest + React Testing Library)] --> [Integration Testing]
                                                                     |
                                                                     v
[End-to-End Testing (Playwright)]                       <-- [Accessibility (axe-core)]
```

* **Component Tests:** Verifies focus tracking, page navigation, and state updates using React Testing Library.
* **Visual Regression:** Compares screenshot changes to identify visual alignment regressions.
* **End-to-End Testing:** Automates user journey verifications (including authentication and document uploading) using Playwright.

---

## SECTION 16: Frontend Security

* **XSS Prevention:** Sanitizes text content before rendering HTML formatting.
* **Token Storage Policies:** Stores session refresh tokens inside secure HTTP-only cookies, saving only transient tokens in memory.
* **File Upload Safeguards:** Evaluates file headers and size parameters in-browser before beginning S3 upload operations.

---

## SECTION 17: Observability & Telemetry

* **Error Tracing:** Captures client-side javascript runtime exceptions using error monitoring integrations (e.g., Sentry).
* **Usage Metrics:** Logs page load performance, rendering latencies, and interaction events.

---

## SECTION 18: Future Scalability

* **Voice Controls:** The UI is designed to accommodate microphone toggles for speech-to-text integrations in future updates.
* **Multi-tenant Configurations:** Navigation bars include space to support brand selector dropdown elements, allowing administrators to switch company profiles in future versions.

---
*(End of Frontend Engineering Specification)*

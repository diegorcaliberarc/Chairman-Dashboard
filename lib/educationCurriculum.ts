export type MasteryTierId = "beginner" | "advanced" | "master";

export interface QuizQuestion {
  id: string;
  scenario: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AdrLabSpec {
  title: string;
  missionPrompt: string;
  starterTemplate: string;
  evaluationChecklist: string[];
}

export interface CurriculumClass {
  classNumber: number;
  slug: string;
  tier: MasteryTierId;
  title: string;
  shortTitle: string;
  primaryProjectImpact: string;
  enterpriseRiskNeutralized: string;
  pillarId: number;
  whatItTeaches: string;
  whereUsedInProject: string;
  howItWorks: string;
  whyImportant: string;
  coreConcepts: string[];
  asciiDiagram: string;
  microDiagram?: string;
  lessonXp: number;
  quizXp: number;
  labXp: number;
  quiz: QuizQuestion[];
  adrLab: AdrLabSpec;
}

export interface MasteryTierMeta {
  id: MasteryTierId;
  label: string;
  badgeTitle: string;
  subtitle: string;
  classRange: string;
  accentHex: string;
  classNumbers: number[];
}

export interface RankLevelSpec {
  level: number;
  minXp: number;
  rankTitle: string;
  unlocksBadgeId?: string;
  perks: string;
}

export interface EducationBadgeSpec {
  id: string;
  title: string;
  description: string;
  tier: MasteryTierId | "executive";
  accentHex: string;
}

export interface ClosedPillar {
  id: number;
  name: string;
  domain: string;
  coveredClasses: string;
  classNumbers: number[];
  coreResponsibility: string;
  accentHex: string;
}

export interface EnterpriseOperationalLayer {
  id: "A" | "B" | "C";
  code: string;
  title: string;
  subtitle: string;
  accentHex: string;
  disciplines: {
    name: string;
    standards: string;
    description: string;
  }[];
}

export interface JargonMatrixRow {
  id: string;
  buzzwords: string;
  individualTerms: string[];
  whatItActuallyIs: string;
  associatedClassLabel: string;
  associatedClassNumbers: number[];
  pillarId: number;
}

export interface ExcludedDomain {
  id: number;
  title: string;
  technologies: string;
  rationale: string;
}

export const EXECUTIVE_COURSE_OVERVIEW = {
  title: "Systems Engineering & Enterprise Software Architecture Master Curriculum",
  subtitle: "From Zero-Code Orchestration to $250k+ Staff Platform Architect",
  thisIsTheCourse:
    "Systems Engineering & Enterprise Software Architecture. It is a complete master blueprint designed to take an operator who orchestrates code via AI and elevate them into an authoritative Systems Architect capable of designing, verifying, and defending mission-critical enterprise platforms.",
  whatItTeaches:
    "Relational data modeling, strict API boundary contracts, multi-tenant Row-Level Security (RLS), asynchronous event queues and webhook pipelines, modular application decoupling, observability and telemetry, cloud edge networking, connection pooling, automated testing gates (TDD, Playwright), CI/CD release engineering, and high-concurrency distributed system design.",
  whereUsed:
    "In the Chairman Dashboard (centralizing Plaid financial aggregation, Samsung Health/Renpho telemetry, ClickUp-style project management, and live whiteboarding) and Equipsynx (multi-tenant heavy machinery rental SaaS with billing, dispatch, POS, and inventory tracking).",
  howItWorks:
    'Every single software component is governed by a strict "spec-first" lifecycle: Schema Definition -> Interface Contract -> Automated Test Gate -> Bounded AI Implementation. You never write or prompt for ad-hoc code; you define the architectural boundaries, and the AI fills in the implementation under strict constraints.',
  whyImportant:
    "It eliminates architectural rot, prevents data leaks, guarantees zero-downtime scalability, and provides the exact technical and operational mastery required to command $250,000+ Total Compensation as a Staff Engineer, Principal Solutions Architect, or Lead Defense Systems Engineer.",
};

export const SPEC_FIRST_LIFECYCLE = [
  {
    step: 1,
    phase: "Schema Definition",
    detail:
      "Lock relational cardinalities, surrogate keys, foreign key RESTRICT/CASCADE rules, B-Tree compound indexes, and PostgreSQL RLS policies before writing application code.",
    classes: [1, 3],
  },
  {
    step: 2,
    phase: "Interface Contract",
    detail:
      "Define explicit REST/OpenAPI routes, Pydantic v2 DTO request validators (422 rejection), response stripping models, and stateless JWT claims.",
    classes: [2, 5],
  },
  {
    step: 3,
    phase: "Automated Test Gate",
    detail:
      "Author pytest unit/integration specs, Playwright E2E browser journeys, and SAST/DAST CI gates before prompting any AI implementation.",
    classes: [8, 9],
  },
  {
    step: 4,
    phase: "Bounded AI Implementation",
    detail:
      "Direct AI agents inside modular, decoupled service/repository layers with circuit breakers, PgBouncer pooling, and ADR executive defense.",
    classes: [4, 6, 7, 10],
  },
];

export const RANK_LEVEL_CURVE: RankLevelSpec[] = [
  {
    level: 1,
    minXp: 0,
    rankTitle: "Zero-Code Orchestrator",
    perks: "Spec-First Lifecycle unlocked • Beginner Tier active",
  },
  {
    level: 2,
    minXp: 450,
    rankTitle: "Relational Schema Tactician",
    perks: "3NF & Compound Index mastery • Foreign key integrity",
  },
  {
    level: 3,
    minXp: 1100,
    rankTitle: "Boundary & RLS Enforcer",
    unlocksBadgeId: "beginner-badge",
    perks: "Unlocks Beginner Mastery Badge • Zero-Trust tenant isolation",
  },
  {
    level: 4,
    minXp: 1900,
    rankTitle: "Async & Decoupled Systems Builder",
    perks: "Idempotent webhook queues & 7-layer modular decoupling",
  },
  {
    level: 5,
    minXp: 2800,
    rankTitle: "Edge & Observability Commander",
    unlocksBadgeId: "advanced-badge",
    perks: "Unlocks Advanced Mastery Badge • Circuit Breakers & PgBouncer",
  },
  {
    level: 6,
    minXp: 3600,
    rankTitle: "Verification & Zero-Downtime Architect",
    perks: "Playwright CI Gates & 5-Step Expand-Contract Migrations",
  },
  {
    level: 7,
    minXp: 4200,
    rankTitle: "$250k+ Staff Platform Architect",
    unlocksBadgeId: "master-seal",
    perks: "Unlocks Master Architect Seal • Multi-Region RTO <60s Defense",
  },
];

export const EDUCATION_BADGES: EducationBadgeSpec[] = [
  {
    id: "first-spec-locked",
    title: "Spec-First Initiate",
    description: "Completed your first Systems Engineering briefing or ADR lab.",
    tier: "beginner",
    accentHex: "#38bdf8",
  },
  {
    id: "beginner-badge",
    title: "Boundary & RLS Enforcer",
    description: "Reached Level 3 or mastered Beginner Tier (Classes 1–3: Schemas, DTOs & RLS).",
    tier: "beginner",
    accentHex: "#10b981",
  },
  {
    id: "advanced-badge",
    title: "Edge & Observability Commander",
    description: "Reached Level 5 or mastered Advanced Tier (Classes 4–7: Async, Decoupling, Telemetry & PgBouncer).",
    tier: "advanced",
    accentHex: "#f59e0b",
  },
  {
    id: "adr-defender",
    title: "Executive ADR Defender",
    description: "Authored and defended 3+ Spec-First Architecture Decision Records.",
    tier: "executive",
    accentHex: "#ec4899",
  },
  {
    id: "quiz-sharpshooter",
    title: "Verification Gate Ace",
    description: "Scored 100% (3/3) across 5 or more Staff Architecture scenario quizzes.",
    tier: "executive",
    accentHex: "#06b6d4",
  },
  {
    id: "master-seal",
    title: "$250k+ Staff Platform Seal",
    description: "Reached Level 7 or completed all 10 Master Curriculum Classes.",
    tier: "master",
    accentHex: "#8b5cf6",
  },
];

export const MASTERY_TIERS: MasteryTierMeta[] = [
  {
    id: "beginner",
    label: "BEGINNER TIER",
    badgeTitle: "Core Persistence, Boundaries & Zero-Trust",
    subtitle: "Immutable PostgreSQL schemas, Pydantic v2 DTO boundaries, and disk-level multi-tenant RLS.",
    classRange: "Classes 1–3",
    accentHex: "#10b981",
    classNumbers: [1, 2, 3],
  },
  {
    id: "advanced",
    label: "ADVANCED TIER",
    badgeTitle: "Async Execution, Decoupling, Observability & Edge Infra",
    subtitle: "Idempotent webhook queues, killing God Components, circuit breakers, and PgBouncer transaction pooling.",
    classRange: "Classes 4–7",
    accentHex: "#f59e0b",
    classNumbers: [4, 5, 6, 7],
  },
  {
    id: "master",
    label: "MASTER TIER",
    badgeTitle: "Verification Gates, Zero-Downtime CI/CD & $250k+ Staff Architecture",
    subtitle: "Spec-first TDD/Playwright gates, 5-step Expand-Contract migrations, and multi-region RTO <60s defense.",
    classRange: "Classes 8–10",
    accentHex: "#8b5cf6",
    classNumbers: [8, 9, 10],
  },
];

export const CURRICULUM_CLASSES: CurriculumClass[] = [
  {
    classNumber: 1,
    slug: "class-1-relational-data-modeling",
    tier: "beginner",
    title: "Relational Data Modeling & Immutable Schema Design",
    shortTitle: "Relational Data Modeling & Schemas",
    primaryProjectImpact: "Supabase Database Schema",
    enterpriseRiskNeutralized: "Data corruption, unscalable joins",
    pillarId: 1,
    whatItTeaches:
      "How to design relational schemas in PostgreSQL; 1:1, 1:N, and N:M cardinality using junction tables; surrogate vs. natural keys (UUIDv4 vs. ULID vs. BigInt); referential integrity; foreign key cascade behaviors (CASCADE vs. RESTRICT); B-Tree, compound, and GIN/GiST indexes; database normalization (3NF) vs. strategic denormalization for read-heavy dashboards.",
    whereUsedInProject:
      "The foundation of both Chairman Dashboard and Equipsynx in Supabase PostgreSQL (e.g., mapping Users to Accounts, Equipment Units, Rental Contracts, Invoices, and Biometric Logs).",
    howItWorks:
      "Instead of letting the application handle relationship rules, the database engine itself enforces constraints. If a client attempts to insert an orphaned record or delete an active rental asset, the database engine immediately rejects the transaction.",
    whyImportant:
      "Bad UI code can be rewritten in an afternoon; a corrupted or inconsistent database destroys an enterprise. If the schema is clean and indexed, 80% of application reliability and query speed is guaranteed.",
    coreConcepts: [
      "1:1, 1:N & N:M Junction Tables",
      "UUIDv4 vs ULID vs BigInt Keys",
      "ON DELETE RESTRICT vs CASCADE",
      "B-Tree Compound, GIN & GiST Indexes",
      "3NF Normalization vs Read Denormalization",
    ],
    asciiDiagram: `+-------------------------------------------------------------------------------+
| MACRO VIEW: Supabase PostgreSQL Engine                                        |
|                                                                               |
|  +--------------------+         1:N         +-----------------------------+   |
|  |   organizations    |-------------------->|          equipment          |   |
|  |  (tenant root ID)  |                     | (serial_num, status, rates) |   |
|  +--------------------+                     +-----------------------------+   |
|            |                                               |                  |
|            | 1:N                                           | 1:N              |
|            v                                               v                  |
|  +--------------------+         1:N         +-----------------------------+   |
|  |       users        |-------------------->|      rental_contracts       |   |
|  | (auth_id, role, pk)|                     |  (dates, total, deposits)   |   |
|  +--------------------+                     +-----------------------------+   |
|                                                            |                  |
|                                                            | 1:N              |
|                                                            v                  |
|                                             +-----------------------------+   |
|                                             |      contract_invoices      |   |
|                                             |  (FK: contract_id, balance) |   |
|                                             +-----------------------------+   |
+-------------------------------------------------------------------------------+`,
    microDiagram: `+-------------------------------------------------------------------------------+
| MICRO VIEW: Index & Constraint Enforcement                                    |
| [Query: SELECT * FROM rental_contracts WHERE org_id = 'X' AND status = 'ACTIVE']
|                                       |                                       |
|                                       v                                       |
|                            [B-Tree Compound Index]                            |
|                        (org_id, status, start_date DESC)                      |
|                                       |                                       |
|                        +--------------+---------------+                       |
|                        v                              v                       |
|             [Index Seek: 0.4ms]             [Full Scan: AVOIDED]              |
+-------------------------------------------------------------------------------+`,
    lessonXp: 100,
    quizXp: 150,
    labXp: 200,
    quiz: [
      {
        id: "c1-q1",
        scenario:
          "In Equipsynx, an admin attempts to delete an excavator from `equipment` that has 14 historical `contract_invoices` for tax auditing. Which foreign key behavior MUST govern `rental_contracts.equipment_id`?",
        options: [
          "ON DELETE CASCADE so cleanup happens automatically in one query",
          "ON DELETE RESTRICT (plus soft-status archival) so PostgreSQL rejects destroying historical financial records",
          "Application-side check in React before calling DELETE",
          "ON DELETE SET NULL on primary invoice balances",
        ],
        correctIndex: 1,
        explanation:
          "ON DELETE RESTRICT enforces referential integrity at the storage engine level, making it physically impossible for a buggy script or UI call to wipe out audited rental contracts and invoices.",
      },
      {
        id: "c1-q2",
        scenario:
          "Your dashboard runs `SELECT * FROM rental_contracts WHERE org_id = $1 AND status = 'ACTIVE' ORDER BY start_date DESC` 500 times/minute across 4M rows. Which index eliminates full table scans and sort overhead?",
        options: [
          "Three separate single-column indexes on (org_id), (status), and (start_date)",
          "A GIN full-text index on rental_contracts(status)",
          "A B-Tree compound index on (org_id, status, start_date DESC)",
          "Switching primary keys from UUID to VARCHAR(255)",
        ],
        correctIndex: 2,
        explanation:
          "Following equality-prefix then sort-order rules, a B-Tree compound index on (org_id, status, start_date DESC) turns a costly sequential scan + sort into a 0.4ms index seek.",
      },
      {
        id: "c1-q3",
        scenario:
          "Why do high-write distributed ledgers often prefer ULID (or UUIDv7) over random UUIDv4 for B-Tree primary keys?",
        options: [
          "UUIDv4 only supports 10,000 rows per table in PostgreSQL",
          "ULIDs are lexicographically time-sortable, preventing random B-Tree page splits and WAL write amplification",
          "UUIDv4 cannot be used as a foreign key in junction tables",
          "ULIDs automatically encrypt JSONB columns",
        ],
        correctIndex: 1,
        explanation:
          "Random UUIDv4 inserts scatter writes across arbitrary B-Tree leaf pages causing fragmentation and cache misses, whereas time-prefixed ULIDs/UUIDv7 append sequentially while remaining globally unique.",
      },
    ],
    adrLab: {
      title: "ADR-001: Equipsynx Multi-Asset Rental Contract & Ledger Schema",
      missionPrompt:
        "A single Equipsynx `rental_contract` can now lease MULTIPLE pieces of heavy machinery (N:M cardinality) with per-unit daily rates, while preserving strict 3NF invoice auditability. Author the Spec-First Schema ADR.",
      starterTemplate: `# ADR-001: N:M Equipment-to-Contract Junction & Constraint Spec
## Context
Equipsynx contracts lease multiple serialized fleet units simultaneously. Storing an array of equipment IDs in JSONB breaks foreign key integrity.

## Decision (Tables, Keys & Cascade Rules)
- Primary Keys (UUIDv7/ULID vs BigInt): 
- Junction Table (\`contract_line_items\`): 
- Foreign Key Constraints (\`RESTRICT\` vs \`CASCADE\`): 

## Indexing Strategy
- Compound B-Tree Index: 

## Trade-offs & Risk Neutralized
- `,
      evaluationChecklist: [
        "Defines an explicit N:M junction table (e.g., contract_equipment_items) with composite uniqueness",
        "Specifies ON DELETE RESTRICT on financial/equipment foreign keys",
        "Includes a B-Tree compound index scoped by org_id + status/date",
      ],
    },
  },
  {
    classNumber: 2,
    slug: "class-2-interface-contracts-dtos",
    tier: "beginner",
    title: "Interface Contracts & API Boundary Design",
    shortTitle: "Interface Contracts & Pydantic DTOs",
    primaryProjectImpact: "FastAPI Backend & Client Boundaries",
    enterpriseRiskNeutralized: "Payload leakage, frontend coupling",
    pillarId: 2,
    whatItTeaches:
      "RESTful API semantics and HTTP standards; Data Transfer Objects (DTOs); Pydantic v2 validation models; decoupling internal database tables from public API payloads; OAuth2 token exchange and stateless JWT lifecycle; keyset/cursor-based pagination.",
    whereUsedInProject:
      "The FastAPI backend connecting the Next.js frontend to Supabase and external APIs (Plaid, Renpho, MyFitnessPal, Samsung Health).",
    howItWorks:
      "When a request hits FastAPI, Pydantic intercepts the JSON payload, checks every field against defined types, rejects extra/malicious fields with 422 Unprocessable Entity, passes valid data to the service layer, and strips sensitive internal fields before returning the response model.",
    whyImportant:
      "Prevents frontend bugs from corrupting the database and prevents sensitive data leaks (such as password hashes, service role keys, or private bank account tokens).",
    coreConcepts: [
      "Strict Request & Response DTOs",
      "Pydantic v2 `extra='forbid'` & 422 Rejection",
      "Response Secret Field Stripping",
      "OAuth2 Token Exchange & Stateless JWTs",
      "Keyset / Cursor Pagination vs OFFSET",
    ],
    asciiDiagram: `+-------------------------------------------------------------------------------+
| MACRO VIEW: End-to-End API Pipeline                                           |
|                                                                               |
| [Next.js Client] --(HTTP POST /api/v1/rentals)--> [FastAPI Ingress Router]    |
|                                                              |                |
|                                                              v                |
|                                                   [Pydantic DTO Validator]    |
|                                                   (Schema: RentalCreateReq)   |
|                                                              |                |
|                                     +------------------------+-------------+  |
|                                     | (Valid)                              |  |
|                                     v                              (Invalid)  |
|                          [Service Business Logic]                          v  |
|                                     |                         [422 Error +    |
|                                     v                          Field Details] |
|                          [Repository / Supabase DB]                        |  |
|                                     |                         [Immediate      |
|                                     v                          Rejection]     |
|                          [Pydantic Response Model]                            |
|                          (Strips internal secret fields)                      |
|                                     |                                         |
|                                     v                                         |
|                     [Clean 201 Created Response to Client]                    |
+-------------------------------------------------------------------------------+`,
    lessonXp: 100,
    quizXp: 150,
    labXp: 200,
    quiz: [
      {
        id: "c2-q1",
        scenario:
          "A malicious user sends `{\"equipment_id\": \"abc\", \"daily_rate\": 1, \"is_admin\": true, \"plaid_access_token\": \"override\"}` to `POST /api/v1/rentals`. How should the API boundary neutralize mass-assignment?",
        options: [
          "Pass `request.json()` directly into `prisma.rental.create({ data: body })`",
          "Enforce a strict Pydantic v2 `RentalCreateRequest` DTO (`extra='forbid'`) that ignores/rejects undeclared fields with 422 and computes `daily_rate` server-side",
          "Hide the `is_admin` input field using CSS `display: none`",
          "Return HTTP 200 OK and log a warning later",
        ],
        correctIndex: 1,
        explanation:
          "Strict input DTOs decouple public HTTP payloads from internal ORM rows, rejecting unknown fields with HTTP 422 before business logic or database repositories ever execute.",
      },
      {
        id: "c2-q2",
        scenario:
          "Why does returning raw database user/account entities directly from an endpoint cause catastrophic security incidents?",
        options: [
          "JSON serialization fails if a table has more than 10 columns",
          "Internal columns (`plaid_access_token`, `password_hash`, `stripe_secret_ref`) leak into browser DevTools network payloads unless filtered through an explicit Response DTO",
          "PostgreSQL locks the table during JSON stringify",
          "Next.js cannot parse snake_case keys",
        ],
        correctIndex: 1,
        explanation:
          "Outbound Response Models act as an allowlist firewall—stripping internal tokens, hashes, and margin metadata even if `SELECT *` was run in the repository.",
      },
      {
        id: "c2-q3",
        scenario:
          "Chairman Dashboard scrolls through 250,000 Plaid ledger transactions. Why should the API contract use keyset/cursor pagination (`WHERE (posted_at, id) < ($cursor_ts, $cursor_id) LIMIT 50`) instead of `OFFSET 200000`?",
        options: [
          "OFFSET 200000 forces PostgreSQL to scan and discard 200,000 rows on every request (`O(N)` degradation) and skips/duplicates rows during live inserts",
          "LIMIT is deprecated in PostgreSQL 16",
          "Keyset pagination works without any database indexes",
          "Cursors store the entire 250k dataset inside the user's JWT",
        ],
        correctIndex: 0,
        explanation:
          "Keyset pagination uses the B-Tree index to jump directly to the cursor coordinate in O(log N) constant ~1ms time regardless of how deep the user scrolls.",
      },
    ],
    adrLab: {
      title: "ADR-002: Plaid Financial Sync & Rental Creation DTO Contract",
      missionPrompt:
        "Design the strict inbound/outbound API boundary contract for `POST /api/v1/plaid/accounts/sync` and `GET /api/v1/transactions` ensuring zero secret token leakage and sub-5ms cursor pagination.",
      starterTemplate: `# ADR-002: Strict DTO Boundary & Cursor Pagination Contract
## Inbound Request DTO (Validation & 422 Rules)
- Endpoint & Method: 
- Allowed Fields & Type Constraints: 
- Extra Field Policy (\`extra='forbid'\`): 

## Outbound Response DTO (Redaction Guarantee)
- Explicitly Stripped DB Columns: 
- Public Safe Fields Returned: 

## Pagination & Auth Lifecycle
- Stateless JWT Verification: 
- Keyset Cursor Signature: `,
      evaluationChecklist: [
        "Separates Inbound Request DTO, DB Model, and Outbound Response DTO",
        "Explicitly strips sensitive fields (plaid_access_token, service keys)",
        "Uses deterministic keyset cursor pagination `(timestamp, id)` instead of OFFSET",
      ],
    },
  },
  {
    classNumber: 3,
    slug: "class-3-multi-tenancy-rls-zero-trust",
    tier: "beginner",
    title: "Multi-Tenancy, Row-Level Security (RLS) & Zero-Trust Governance",
    shortTitle: "Multi-Tenancy & Postgres RLS",
    primaryProjectImpact: "Equipsynx Org Isolation",
    enterpriseRiskNeutralized: "Catastrophic cross-tenant data leaks",
    pillarId: 1,
    whatItTeaches:
      "Multi-tenancy architecture patterns (pooled DB vs. separate schemas); declarative Row-Level Security in PostgreSQL; JWT claims inspection (`auth.jwt() ->> 'tenant_id'`); Role-Based Access Control (RBAC) permission matrices; environment secrets isolation.",
    whereUsedInProject:
      "Equipsynx multi-tenant organization isolation (ensuring Rental Company A cannot see Rental Company B's machinery or revenue) and Chairman Dashboard personal vs. business partition.",
    howItWorks:
      "Even if an engineer writes a buggy backend query like `SELECT * FROM invoices`, PostgreSQL evaluates the RLS policy on the disk engine level: `WHERE tenant_id = current_setting('app.current_tenant_id')`. Data from other organizations is physically invisible.",
    whyImportant:
      "Multi-tenant data leakage is an existential business event that destroys enterprise contracts and invites massive liability. RLS guarantees that application-layer vulnerabilities cannot breach data boundaries.",
    coreConcepts: [
      "Pooled Multi-Tenant DB vs Siloed Schemas",
      "PostgreSQL Declarative RLS Engine Policies",
      "JWT Claims (`auth.jwt() ->> 'org_id'`)",
      "RBAC Role Permission Matrices",
      "Zero-Trust Service Role & Secret Isolation",
    ],
    asciiDiagram: `+-------------------------------------------------------------------------------+
| MACRO VIEW: Multi-Tenant Zero-Trust Access Pipeline                           |
|                                                                               |
|  [User: Org Alpha]                            [User: Org Beta]                |
|          |                                            |                       |
|          v                                            v                       |
|  [Bearer JWT: org_id="alpha"]                 [Bearer JWT: org_id="beta"]     |
|           \\                                          /                        |
|            \\                                        /                         |
|             v                                      v                          |
|  +-------------------------------------------------------------------------+  |
|  | Supabase PostgreSQL Engine (Pooled Shared Multi-Tenant Database)        |  |
|  |                                                                         |  |
|  |  +-------------------------------------------------------------------+  |  |
|  |  | RLS ENGINE FILTER: WHERE org_id = auth.jwt() ->> 'org_id'         |  |  |
|  |  +-------------------------------------------------------------------+  |  |
|  |             |                                         |                 |  |
|  |             v                                         v                 |  |
|  |   [Org Alpha Rows Only]                     [Org Beta Rows Only]        |  |
|  |   - Fleet Units: 14                         - Fleet Units: 82           |  |
|  |   - Revenue: $42,000                        - Revenue: $310,000         |  |
|  +-------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------+`,
    lessonXp: 100,
    quizXp: 150,
    labXp: 200,
    quiz: [
      {
        id: "c3-q1",
        scenario:
          "An AI coding assistant forgets to include `WHERE org_id = $1` on a new Equipsynx revenue analytics endpoint (`SELECT * FROM invoices`). What happens when PostgreSQL RLS is properly enabled and enforced?",
        options: [
          "Org Alpha sees $310,000 of Org Beta's confidential revenue",
          "PostgreSQL automatically injects the declarative RLS predicate (`org_id = auth.jwt() ->> 'org_id'`) at the disk engine layer, returning ONLY Org Alpha's rows",
          "The query drops the `invoices` table",
          "The browser filters out Org Beta's rows in React `useMemo`",
        ],
        correctIndex: 1,
        explanation:
          "Declarative PostgreSQL RLS enforces Zero-Trust at the storage engine level—making cross-tenant rows physically invisible even when application SQL omits a WHERE clause.",
      },
      {
        id: "c3-q2",
        scenario:
          "Why must `SUPABASE_SERVICE_ROLE_KEY` NEVER be prefixed with `NEXT_PUBLIC_` or shipped to client bundles?",
        options: [
          "It makes the Next.js bundle 4KB larger",
          "Service role keys bypass all PostgreSQL RLS policies completely, granting anyone inspecting browser JS full read/write/delete control over every tenant",
          "Service role keys expire every 30 seconds",
          "Vercel blocks environment variables longer than 32 characters",
        ],
        correctIndex: 1,
        explanation:
          "`service_role` carries `BYPASSRLS` privileges for trusted backend workers only; exposing it to clients annihilates every tenant boundary instantly.",
      },
      {
        id: "c3-q3",
        scenario:
          "Within Org Beta, a Yard Dispatcher should inspect equipment schedules (`SELECT`), while only an Org Owner or Billing Admin can void `contract_invoices` (`UPDATE`/`DELETE`). How do RLS and RBAC combine?",
        options: [
          "Create a separate AWS account per employee",
          "Combine `org_id` tenant scoping with RBAC role claims (`(auth.jwt() ->> 'role') IN ('owner', 'billing_admin')`) inside `FOR UPDATE / DELETE` policies",
          "Trust frontend disabled button states exclusively",
          "Share one admin password across all employees",
        ],
        correctIndex: 1,
        explanation:
          "Zero-Trust combines horizontal tenant isolation (`org_id`) with vertical RBAC capability matrices (`role` claims) enforced on both API controllers and per-command RLS policies.",
      },
    ],
    adrLab: {
      title: "ADR-003: Zero-Trust Multi-Tenant RLS & RBAC Matrix",
      missionPrompt:
        "Author the PostgreSQL RLS & RBAC governance specification for Equipsynx `contract_invoices` across three roles (`owner`, `dispatcher`, `auditor`) in a pooled multi-tenant database.",
      starterTemplate: `# ADR-003: Multi-Tenant RLS & RBAC Governance Spec
## Tenancy Topology
- Pooled Shared Tables vs Isolated Schemas justification: 

## PostgreSQL RLS Policy Definitions
- \`ENABLE ROW LEVEL SECURITY\` & \`FORCE ROW LEVEL SECURITY\`: 
- Tenant Isolation Predicate (\`USING\` / \`WITH CHECK\`): 

## RBAC Permission Matrix (\`owner\` | \`dispatcher\` | \`auditor\`)
- SELECT policy: 
- INSERT / UPDATE / DELETE policy: 

## Secrets & Bypass Governance
- Service Role containment rule: `,
      evaluationChecklist: [
        "Enables RLS on pooled tenant tables using JWT or session `current_setting` tenant_id",
        "Includes both USING (read visibility) and WITH CHECK (write mutation) clauses",
        "Defines clear RBAC role separation and isolates service_role secrets server-side",
      ],
    },
  },
  {
    classNumber: 4,
    slug: "class-4-async-pipelines-webhooks",
    tier: "advanced",
    title: "Asynchronous Pipelines, Webhooks & Idempotent Event Workers",
    shortTitle: "Async Pipelines & Idempotent Webhooks",
    primaryProjectImpact: "Plaid & Stripe Background Sync",
    enterpriseRiskNeutralized: "Duplicate charges, timeout drops",
    pillarId: 3,
    whatItTeaches:
      "Asynchronous event architecture; webhook ingestion; HMAC signature verification; Redis distributed locking and idempotency keys; task queues (n8n, Celery, Redis Streams); handling retries, exponential backoff with jitter, and Dead-Letter Queues (DLQs).",
    whereUsedInProject:
      "Ingesting Plaid transaction updates, Stripe rental payments, and wearable biometrics (Samsung Health / Renpho) without timing out the web server.",
    howItWorks:
      "The webhook receiver verifies the cryptographic signature, checks Redis for an idempotency key (preventing duplicate execution), immediately returns `200 OK` in under 30ms, and pushes the payload onto a queue for background workers to process.",
    whyImportant:
      "External webhooks retry automatically if your server takes too long to respond. Without idempotency and queuing, a single payment webhook retry could charge a customer twice or corrupt financial ledgers.",
    coreConcepts: [
      "HMAC Cryptographic Signature Verification",
      "Redis Idempotency Keys & Distributed Locks",
      "<30ms `200 OK` Fast Ingestion Ack",
      "Redis Streams / Celery / n8n Workers",
      "Exponential Backoff + Jitter & DLQs",
    ],
    asciiDiagram: `+-------------------------------------------------------------------------------+
| MACRO VIEW: Asynchronous Ingestion & Idempotency Pipeline                     |
|                                                                               |
| [Plaid / Stripe Server]                                                       |
|            |                                                                  |
|            | Webhook POST (Payload + HMAC Signature Header)                   |
|            v                                                                  |
| [FastAPI Ingestion Endpoint]                                                  |
|   1. Verify HMAC cryptographic signature                                      |
|   2. Check Redis for Idempotency Key: \`event_id_xyz\`                          |
|      - IF EXISTS -> Return 200 OK (Duplicate Ignored)                         |
|      - IF NEW    -> Set Key in Redis (TTL: 24h)                               |
|   3. Respond to Provider with \`200 OK\` (Elapsed: 22ms)                        |
|   4. Dispatch Task to Background Queue                                        |
|            |                                                                  |
|            v                                                                  |
|   +-----------------+                                                         |
|   |  Message Queue  |                                                         |
|   |   (Redis/n8n)   |                                                         |
|   +-----------------+                                                         |
|            |                                                                  |
|            +--------------------------------+                                 |
|            v (Worker Consumes)              v (On 3 Failures)                 |
|   [Background Worker]               [Dead-Letter Queue (DLQ)]                 |
|   - Parse transactions              - Alert on Slack / Sentry                 |
|   - Update Supabase DB              - Preserve payload for replay             |
+-------------------------------------------------------------------------------+`,
    lessonXp: 100,
    quizXp: 150,
    labXp: 200,
    quiz: [
      {
        id: "c4-q1",
        scenario:
          "Stripe delivers `invoice.payment_succeeded` (`evt_9921`). Your endpoint synchronously generates a PDF, emails the customer, and reconciles 400 Plaid rows, taking 14 seconds. Stripe times out at 10s and retries 3 times. What goes wrong and how do you fix it?",
        options: [
          "Ask Stripe support to increase their webhook timeout to 5 minutes",
          "Verify HMAC, atomically set `SET event_id NX EX 86400` in Redis, enqueue the job, and return `200 OK` in <30ms so workers process asynchronously once",
          "Ignore webhook retries by returning HTTP 500",
          "Disable Stripe webhooks and poll every second from the browser",
        ],
        correctIndex: 1,
        explanation:
          "Decoupling fast ingestion (<30ms ack + HMAC + Redis idempotency key) from heavy worker execution eliminates provider timeouts and guarantees exactly-once ledger side effects.",
      },
      {
        id: "c4-q2",
        scenario:
          "When 2,000 background biometric sync jobs fail simultaneously due to a brief partner API blip, why must workers retry with **exponential backoff + random jitter** rather than fixed 5-second intervals?",
        options: [
          "Jitter compresses JSON payloads by 50%",
          "Without random jitter, all 2,000 workers wake up at the exact same millisecond ('thundering herd'), repeatedly DDOSing the recovering downstream service",
          "Redis Streams deletes messages if retry intervals are integers",
          "Exponential backoff skips HMAC signature checks",
        ],
        correctIndex: 1,
        explanation:
          "Exponential backoff (`2^attempt`) paired with random jitter spreads retry storms smoothly across time, letting downstream dependencies recover cleanly.",
      },
      {
        id: "c4-q3",
        scenario:
          "A malformed Renpho telemetry payload fails schema parsing 3 times in a worker. What happens if there is NO Dead-Letter Queue (DLQ)?",
        options: [
          "Either the poison message loops forever blocking healthy jobs, or it gets silently dropped with zero audit trail for replay",
          "PostgreSQL automatically fixes the malformed JSON",
          "Cloudflare caches the failed webhook",
          "The user's JWT is revoked",
        ],
        correctIndex: 0,
        explanation:
          "A Dead-Letter Queue quarantines poison/exhausted payloads after N retries, fires a Sentry/Slack alert, and preserves the exact raw event so engineers can fix the parser and replay with zero data loss.",
      },
    ],
    adrLab: {
      title: "ADR-004: Idempotent Webhook & DLQ Pipeline for Stripe + Plaid",
      missionPrompt:
        "Design the asynchronous webhook ingestion, Redis idempotency lock, retry schedule, and Dead-Letter Queue replay architecture for Equipsynx Stripe billing + Chairman Plaid sync.",
      starterTemplate: `# ADR-004: Asynchronous Webhook Ingestion & DLQ Spec
## Ingress Verification & <30ms SLA
- HMAC Header & Raw Body Verification: 
- Redis Idempotency Key Format & TTL: 

## Queue & Worker Execution
- Broker Choice (Redis Streams / Celery / n8n): 
- Database Upsert Idempotency Fallback: 

## Failure Modes, Backoff & DLQ Replay
- Retry Policy (Max attempts + Exponential Backoff + Jitter): 
- Dead-Letter Queue Alerting & Replay Procedure: `,
      evaluationChecklist: [
        "Verifies cryptographic HMAC over raw request bytes before parsing",
        "Enforces Redis idempotency key + DB unique constraint with <30ms 200 OK response",
        "Specifies exponential backoff with jitter and a Dead-Letter Queue replay path",
      ],
    },
  },
  {
    classNumber: 5,
    slug: "class-5-application-decoupling",
    tier: "advanced",
    title: "Application Decoupling & Eliminating Architectural Anti-Patterns",
    shortTitle: "Application Decoupling & Modularization",
    primaryProjectImpact: "Next.js & FastAPI Architecture",
    enterpriseRiskNeutralized: '"God component" spaghetti code',
    pillarId: 2,
    whatItTeaches:
      'Separation of Concerns; domain-driven modularization; eliminating "God Components" (multi-thousand-line files); structuring frontend state (Server State vs. Client UI State via TanStack Query and Zustand); standardizing API client singletons.',
    whereUsedInProject:
      "Next.js App Router codebase and FastAPI service layers for both Chairman Dashboard and Equipsynx, maintaining modular directory trees.",
    howItWorks:
      "UI components only care about presentation. Data fetching is isolated into custom hooks. Business calculations are isolated in backend service layers. Database queries are isolated in repository modules.",
    whyImportant:
      "When code is decoupled, AI coding agents can work cleanly inside one file without hallucinating changes across unrelated parts of the app or breaking surrounding features.",
    coreConcepts: [
      "7-Layer Separation of Concerns",
      "Killing Multi-Thousand-Line God Components",
      "TanStack Query (Server Cache) vs Zustand (UI State)",
      "Unified `apiClient` Singleton & Interceptors",
      "Service Layer vs Repository Layer Isolation",
    ],
    asciiDiagram: `+-------------------------------------------------------------------------------+
| MACRO VIEW: Decoupled Multi-Tier Architecture                                 |
|                                                                               |
| [PRESENTATION LAYER]   Next.js React Server & Client Components               |
|                        (Pure UI, Tailwind styling, zero SQL/business logic)   |
|                                    |                                          |
|                                    v                                          |
| [STATE & CACHE LAYER]  TanStack Query (Server Cache) + Zustand (UI State)     |
|                                    |                                          |
|                                    v                                          |
| [API CLIENT LAYER]     Unified \`apiClient\` (Auth header, interceptors)        |
|                                    |                                          |
|                                    v (HTTP / REST)                            |
| [ROUTING LAYER]        FastAPI Route Controllers (\`/api/v1/...\`)              |
|                                    |                                          |
|                                    v                                          |
| [SERVICE LAYER]        Pure Business Logic Modules (Tax, Depreciation)        |
|                                    |                                          |
|                                    v                                          |
| [DATA ACCESS LAYER]    Repository / Prisma / Supabase Client (Raw SQL/ORM)    |
|                                    |                                          |
|                                    v                                          |
| [STORAGE LAYER]        PostgreSQL Tables (Row-Level Security Active)          |
+-------------------------------------------------------------------------------+`,
    lessonXp: 100,
    quizXp: 150,
    labXp: 200,
    quiz: [
      {
        id: "c5-q1",
        scenario:
          "You find a 3,800-line `RentalDashboard.tsx` file containing raw `fetch()` calls with hardcoded bearer headers, equipment depreciation tax formulas, modal booleans, and Tailwind markup. Why does AI orchestration degrade severely on this file?",
        options: [
          "TypeScript refuses to compile files above 2,000 lines",
          "Tightly coupled 'God Components' saturate context windows and cause edits in UI layout to accidentally mutate tax math, auth headers, or data-fetching race conditions",
          "Tailwind classes stop working inside large components",
          "React hooks only work in files under 200 lines",
        ],
        correctIndex: 1,
        explanation:
          "Decoupling into Presentation -> State/Hooks -> Unified `apiClient` -> Route Controller -> Pure Service -> Repository gives AI agents crisp, bounded files where changes cannot bleed across layers.",
      },
      {
        id: "c5-q2",
        scenario:
          "How should frontend state be partitioned between **TanStack Query** and **Zustand** in an enterprise dashboard?",
        options: [
          "Put every API response, loading boolean, and cache invalidation manually inside one giant Redux/Zustand store",
          "Use TanStack Query for async Server State (caching, background revalidation, optimistic updates) and Zustand strictly for ephemeral Client UI State (sidebar open, active filter, modal drawer)",
          "Refetch the entire database on every mouse click with `window.location.reload()`",
          "Store database tables in `localStorage` permanently",
        ],
        correctIndex: 1,
        explanation:
          "Server state has asynchronous staleness, retries, and invalidation lifecycles solved by TanStack Query, keeping Zustand lightweight and dedicated solely to synchronous UI state.",
      },
      {
        id: "c5-q3",
        scenario:
          "Why should backend business formulas (such as heavy-machinery prorated weekend rental rates + state tax) live in a pure **Service Layer** separate from FastAPI Route Controllers and SQL Repositories?",
        options: [
          "So identical deterministic business logic can be unit-tested in 2ms without spinning up HTTP servers or databases, and reused across REST endpoints, CLI scripts, and webhook workers",
          "Because FastAPI routes cannot import Python math libraries",
          "So SQL queries execute inside the browser",
          "To double the number of network hops",
        ],
        correctIndex: 0,
        explanation:
          "Isolating pure domain calculations in the Service Layer makes business rules 100% portable across HTTP controllers and async workers while enabling instant deterministic unit tests.",
      },
    ],
    adrLab: {
      title: "ADR-005: Refactoring a God Component into the 7-Layer Architecture",
      missionPrompt:
        "Decompose a monolithic 3,200-line Equipsynx Fleet Dispatch & Billing screen into the 7 clean architectural layers so bounded AI agents can modify UI, state, tax logic, and SQL independently.",
      starterTemplate: `# ADR-005: 7-Layer Modular Decoupling Blueprint
## 1–3. Frontend Boundaries (Presentation, State & API Client)
- Pure Presentation Components: 
- TanStack Query Hooks vs Zustand UI Store: 
- Unified \`apiClient\` Singleton (Auth & Error Interceptors): 

## 4–7. Backend & Storage Boundaries
- Routing Controller (\`/api/v1/dispatch\`): 
- Pure Service Module (Billing/Depreciation Rules): 
- Repository Module & RLS Storage Boundary: 

## AI Agent Blast-Radius Constraint
- File-ownership rules for future prompts: `,
      evaluationChecklist: [
        "Separates TanStack Query server cache from Zustand client UI state",
        "Centralizes HTTP auth/error handling in a single apiClient module",
        "Isolates pure domain logic in Service modules away from Route Controllers and SQL Repositories",
      ],
    },
  },
  {
    classNumber: 6,
    slug: "class-6-telemetry-observability-resilience",
    tier: "advanced",
    title: "Telemetry, Observability & Graceful Degradation",
    shortTitle: "Telemetry, Observability & Resilience",
    primaryProjectImpact: "System Monitoring & Error Catching",
    enterpriseRiskNeutralized: "Blind production crashes",
    pillarId: 5,
    whatItTeaches:
      "Structured JSON logging; distributed tracing with correlation IDs; health check probes (`/healthz`, `/readyz`); circuit breakers; fallback UI states and graceful degradation when external services experience downtime.",
    whereUsedInProject:
      "Production monitoring across Chairman Dashboard's third-party integrations (Plaid, Renpho, Google Calendar) and Equipsynx payment gateways.",
    howItWorks:
      "Every incoming request receives a unique `X-Request-ID`. If an external integration begins timing out, a circuit breaker trips to prevent cascading server crashes, serving cached data while logging structured errors to an observability dashboard.",
    whyImportant:
      "Enterprise systems must stay online even when dependencies fail. Knowing an outage occurred within seconds—with exact trace IDs—is what distinguishes senior engineering from amateur development.",
    coreConcepts: [
      "Structured JSON Logging (Datadog / Sentry)",
      "Distributed Tracing via `X-Request-ID`",
      "Liveness (`/healthz`) vs Readiness (`/readyz`)",
      "Circuit Breaker State Machine (CLOSED -> OPEN -> HALF-OPEN)",
      "Cached Fallback UI & Graceful Degradation",
    ],
    asciiDiagram: `+-------------------------------------------------------------------------------+
| MACRO VIEW: Observability & Circuit Breaker Fault Tolerance                   |
|                                                                               |
| Client Request ---> [API Gateway: Injects X-Request-ID: "req-9821a"]          |
|                                       |                                       |
|                                       v                                       |
|                           [FastAPI Internal Service]                          |
|                                       |                                       |
|                            [Circuit Breaker State]                            |
|                            /                     \\                            |
|      (State: CLOSED - Healthy)          (State: OPEN - Tripped after 5 TOs)   |
|                  |                                        |                   |
|                  v                                        v                   |
|         [Call External API]                    [Fast Fallback Response]       |
|          (Plaid / Samsung)                     (Serve cached data to UI)      |
|                  |                                        |                   |
|                  \\___________________  ___________________/                   |
|                                      v                                        |
|                           [Structured JSON Logger]                            |
|                {"req_id": "req-9821a", "status": 200, "lat": "42ms"}          |
|                                      |                                        |
|                                      v                                        |
|                   [Centralized Dashboard (Datadog/Sentry)]                    |
+-------------------------------------------------------------------------------+`,
    lessonXp: 100,
    quizXp: 150,
    labXp: 200,
    quiz: [
      {
        id: "c6-q1",
        scenario:
          "Plaid's API suffers a regional brownout where requests hang for 30 seconds before failing. Without a Circuit Breaker, what happens to your Chairman Dashboard backend?",
        options: [
          "Only the Plaid widget turns grey while all other routes stay fast",
          "Every worker thread blocks waiting 30s on Plaid, exhausting compute pools and causing cascading 503 crashes across completely unrelated Calendar, Task, and Habit endpoints",
          "PostgreSQL automatically caches Plaid's HTTP responses",
          "DNS switches Plaid traffic to Google Calendar",
        ],
        correctIndex: 1,
        explanation:
          "After N consecutive timeouts (e.g., 5), a Circuit Breaker trips to `OPEN`, failing fast in <1ms and serving last-known cached balances with a stale-timestamp badge so worker threads stay healthy.",
      },
      {
        id: "c6-q2",
        scenario:
          "In container orchestration (Cloud Run / ECS / Kubernetes), what is the critical operational difference between `/healthz` (liveness) and `/readyz` (readiness)?",
        options: [
          "They are identical aliases required by HTTP/2",
          "`/healthz` checks if the process itself is alive (restart container if deadlocked); `/readyz` checks if dependencies like DB/PgBouncer are reachable (stop routing traffic without restart-looping)",
          "`/readyz` deletes stale logs every hour",
          "`/healthz` is public HTML for marketing SEO",
        ],
        correctIndex: 1,
        explanation:
          "If `/healthz` checked downstream dependencies during a brief DB failover, the orchestrator would kill and restart every healthy app container simultaneously; `/readyz` safely drains traffic instead.",
      },
      {
        id: "c6-q3",
        scenario:
          "Why do Staff Architects forbid unstructured `console.log('Failed user ' + id)` in favor of structured JSON logs carrying `X-Request-ID`?",
        options: [
          "`console.log` uses 10x more RAM in Node.js",
          "Structured JSON (`{\"req_id\":\"req-9821a\",\"org_id\":\"alpha\",\"lat_ms\":42}`) lets Datadog/Sentry index fields and correlate one user request across Edge, FastAPI, Queue Workers, and DB in seconds",
          "Browsers block servers that use `print()`",
          "JSON logs do not require disk storage",
        ],
        correctIndex: 1,
        explanation:
          "Propagating `X-Request-ID` across every hop in machine-parsable JSON turns hours of blind grep debugging into an instant single-trace lookup.",
      },
    ],
    adrLab: {
      title: "ADR-006: Circuit Breaker, Correlation Tracing & Graceful Degradation",
      missionPrompt:
        "Specify the observability and fault-tolerance architecture for Chairman Dashboard so a simultaneous Plaid + Renpho API outage causes zero page crashes and sub-100ms degraded responses.",
      starterTemplate: `# ADR-006: Telemetry, Circuit Breakers & Graceful Degradation Spec
## Distributed Correlation & Structured Logging
- \`X-Request-ID\` Propagation Path: 
- Mandatory JSON Log Schema Fields (PII-scrubbed): 

## Circuit Breaker State Machine
- CLOSED -> OPEN Trip Threshold (Timeouts / Window): 
- HALF-OPEN Probe Recovery Interval: 
- Degraded Fallback Payload & UI Stale Indicator: 

## Health Probes
- \`/healthz\` vs \`/readyz\` Verification Checks: `,
      evaluationChecklist: [
        "Propagates X-Request-ID end-to-end in structured PII-safe JSON logs",
        "Defines CLOSED, OPEN, and HALF-OPEN circuit breaker thresholds with cached UI fallback",
        "Correctly distinguishes liveness (/healthz) from readiness (/readyz) probes",
      ],
    },
  },
  {
    classNumber: 7,
    slug: "class-7-cloud-infra-edge-pooling",
    tier: "advanced",
    title: "Cloud Infrastructure, Edge Routing & Connection Pooling",
    shortTitle: "Cloud Networking & Connection Pooling",
    primaryProjectImpact: "Edge Compute & PgBouncer",
    enterpriseRiskNeutralized: "Database connection pool crashes",
    pillarId: 3,
    whatItTeaches:
      "Cloud topology, DNS, Anycast routing, and SSL termination; serverless compute vs. stateful containers; database connection saturation and connection poolers (PgBouncer in transaction mode); Docker multi-stage container builds.",
    whereUsedInProject:
      "Vercel deployment of Next.js frontend, Dockerized FastAPI backend on Cloud Run/ECS, and Supabase PostgreSQL connection management.",
    howItWorks:
      "Serverless frontend functions spin up and tear down rapidly, easily exhausting PostgreSQL's maximum connection limit. A connection pooler acts as an intermediary, multiplexing hundreds of serverless requests across a pool of persistent database connections.",
    whyImportant:
      "One of the most common ways serverless applications crash in production is by opening 500 direct database connections during traffic spikes, locking the database engine.",
    coreConcepts: [
      "DNS, Cloudflare Anycast CDN & SSL Termination",
      "Serverless Edge Functions vs Stateful Cloud Run/ECS",
      "PgBouncer Transaction Mode Multiplexing",
      "`DATABASE_URL` (Pooled 6543) vs `DIRECT_URL` (5432)",
      "Multi-Stage Distroless/Slim Docker Builds",
    ],
    asciiDiagram: `+-------------------------------------------------------------------------------+
| MACRO VIEW: Cloud Network Topology & Connection Pooling                       |
|                                                                               |
| [User Traffic] ---> [Cloudflare Anycast CDN / SSL Termination]                |
|                                       |                                       |
|                   +-------------------+-------------------+                   |
|                   | (Static & UI)                         | (API Calls)       |
|                   v                                       v                   |
|        [Vercel Edge Network]                  [Cloud Run / ECS Container]     |
|        - Next.js Server Components            - Dockerized FastAPI backend    |
|        - 200+ Regional Edge Nodes             - Stateless, auto-scaling       |
|                   |                                       |                   |
|                   +-------------------+-------------------+                   |
|                                       | Hundreds of ephemeral connections     |
|                                       v                                       |
|                           +---------------------------+                       |
|                           | PgBouncer Connection Pool |                       |
|                           | (Transaction Mode Active) |                       |
|                           +---------------------------+                       |
|                                       | 15 Dedicated Persistent Connections   |
|                                       v                                       |
|                           +---------------------------+                       |
|                           |  Supabase PostgreSQL DB   |                       |
|                           |  (Protected CPU & Memory) |                       |
|                           +---------------------------+                       |
+-------------------------------------------------------------------------------+`,
    lessonXp: 100,
    quizXp: 150,
    labXp: 200,
    quiz: [
      {
        id: "c7-q1",
        scenario:
          "During a morning traffic burst, 450 Vercel Serverless Function instances spin up simultaneously. Each opens a direct TCP connection to PostgreSQL (`max_connections = 100`). What happens, and how does PgBouncer Transaction Mode solve it?",
        options: [
          "PostgreSQL throws `FATAL: sorry, too many clients already`; PgBouncer Transaction Mode solves this by multiplexing all 450 ephemeral client connections onto ~15 persistent backend DB connections, releasing each connection the millisecond a SQL transaction commits",
          "Vercel queues excess users for 24 hours",
          "PgBouncer converts PostgreSQL into SQLite",
          "Increasing `max_connections` to 50,000 has zero RAM or CPU context-switch cost",
        ],
        correctIndex: 0,
        explanation:
          "Each raw Postgres backend process consumes ~5–10MB RAM and OS scheduling overhead; PgBouncer Transaction Mode lends a pooled connection only for the ~2ms duration of the SQL query.",
      },
      {
        id: "c7-q2",
        scenario:
          "In Prisma + Supabase (`schema.prisma`), why do we configure BOTH `url = env('DATABASE_URL')` (PgBouncer port 6543 with `?pgbouncer=true`) AND `directUrl = env('DIRECT_URL')` (port 5432)?",
        options: [
          "To send reads to port 6543 and deletes to port 5432",
          "Runtime serverless queries require PgBouncer Transaction Mode (`DATABASE_URL`), whereas schema DDL migrations (`prisma migrate deploy`) require session-level advisory locks on a direct connection (`DIRECT_URL`)",
          "Port 5432 only accepts HTTP GET requests",
          "Prisma duplicates every insert across two databases",
        ],
        correctIndex: 1,
        explanation:
          "PgBouncer Transaction Mode does not persist session-scoped advisory locks or prepared statements across transactions, so runtime traffic uses `DATABASE_URL` (`?pgbouncer=true`) while DDL migrations use `DIRECT_URL`.",
      },
      {
        id: "c7-q3",
        scenario:
          "Why do enterprise FastAPI deployments on Cloud Run/ECS use **multi-stage Dockerfiles** running as a non-root user instead of a single `FROM ubuntu:latest` image with compilers installed?",
        options: [
          "Multi-stage builds strip compilers, build caches, and dev dependencies—shrinking images from >1.2GB to ~120MB for rapid container cold-starts while eliminating shell/privilege-escalation attack surfaces",
          "Single-stage Dockerfiles cannot expose port 8080",
          "Cloudflare Anycast only routes to Alpine Linux",
          "Multi-stage builds eliminate the need for TLS certificates",
        ],
        correctIndex: 0,
        explanation:
          "Smaller, minimal runtime stages pull and scale horizontally in seconds during traffic spikes and dramatically shrink CVE vulnerability footprints.",
      },
    ],
    adrLab: {
      title: "ADR-007: Edge Compute, Container Runtime & PgBouncer Topology",
      missionPrompt:
        "Architect the production cloud topology separating Vercel Edge UI, Cloud Run FastAPI stateful/compute workloads, multi-stage Docker hardening, and PgBouncer Transaction Mode pooling.",
      starterTemplate: `# ADR-007: Cloud Edge Routing & PgBouncer Pooling Spec
## Edge Ingress & Workload Placement
- Cloudflare Anycast / TLS Termination: 
- What runs on Vercel Edge/Serverless vs Cloud Run/ECS Containers: 

## Database Connection Pooling Math
- Max Serverless Concurrency vs Postgres \`max_connections\`: 
- PgBouncer Mode (\`transaction\`) & Prisma \`?pgbouncer=true\` + \`DIRECT_URL\`: 

## Multi-Stage Container Hardening
- Builder Stage vs Minimal Non-Root Runtime Stage: `,
      evaluationChecklist: [
        "Routes UI/SSR to Edge/Serverless and long-lived/CPU tasks to stateless auto-scaling containers",
        "Specifies PgBouncer Transaction Mode sizing and separates runtime DATABASE_URL from migration DIRECT_URL",
        "Includes multi-stage non-root Docker build hardening",
      ],
    },
  },
  {
    classNumber: 8,
    slug: "class-8-verification-gates-tdd",
    tier: "master",
    title: "Automated Verification Gates, TDD & Regression Prevention",
    shortTitle: "Automated Testing Gates & TDD",
    primaryProjectImpact: "Playwright & Pytest CI Verification",
    enterpriseRiskNeutralized: "Silent regressions, manual QA lag",
    pillarId: 4,
    whatItTeaches:
      "Test-Driven Development (TDD) with AI; writing unit tests for core business calculations before writing features; integration testing with containerized databases; End-to-End (E2E) browser automation using Playwright; continuous integration (CI) test gates.",
    whereUsedInProject:
      "The automated safety net across Chairman Dashboard and Equipsynx ensuring that new AI-generated code never breaks existing rental billing, task management, or financial calculations.",
    howItWorks:
      "Before prompting the AI for application code, you write the test spec. When the AI generates code, the automated test suite executes immediately. If a test fails, the code is rejected automatically before human review.",
    whyImportant:
      "Manual clicking across 50 dashboard screens to test changes is slow and prone to error. Automated test suites give you 100% confidence to deploy multiple times a day without fear of regressions.",
    coreConcepts: [
      "Spec-First TDD Harness for AI Agents",
      "Deterministic Unit Tests (`pytest` / `vitest`)",
      "Containerized DB Integration Tests (RLS + SQL)",
      "Playwright Headless E2E Browser Automation",
      "Mandatory GitHub Actions Branch Merge Gates",
    ],
    asciiDiagram: `+-------------------------------------------------------------------------------+
| MACRO VIEW: The Automated Verification Pipeline (TDD Gate)                    |
|                                                                               |
| 1. Write Test Spec First ---> [pytest / Playwright Test Definitions]          |
|                                                |                              |
|                                                v                              |
| 2. Prompt AI for Code    ---> [AI Generates Implementation Code]              |
|                                                |                              |
|                                                v                              |
| 3. Execution Gate        ---> [Run Automated Test Suite Locally]              |
|                                                |                              |
|                             +------------------+------------------+           |
|                             | (Fails)                             | (Passes)  |
|                             v                                     v           |
|                  [Reject Code Instantly]             [Commit to Git Branch]   |
|                  [Feed Error Back to AI]                          |           |
|                                                                   v           |
| 4. Remote CI Gate        ---> [GitHub Actions Cloud Runner: Lint + Test + E2E]|
|                                                                   |           |
|                                                                   v           |
| 5. Production Merge      ---> [Authorized to Merge into \`main\` Branch]        |
+-------------------------------------------------------------------------------+`,
    lessonXp: 100,
    quizXp: 150,
    labXp: 200,
    quiz: [
      {
        id: "c8-q1",
        scenario:
          "Why must the test specification be locked BEFORE (or independently from) asking an AI coding agent to implement a complex Equipsynx late-fee & tax prorating engine?",
        options: [
          "If the AI writes the code first and then generates tests from its own code, the tests simply mirror and rubber-stamp any hallucinated math bug in the implementation",
          "pytest refuses to run files created after implementation files",
          "Playwright requires tests to be written in Assembly",
          "Unit tests replace PostgreSQL constraints",
        ],
        correctIndex: 0,
        explanation:
          "Spec-First TDD anchors truth in immutable business assertions first; the AI then iterates until its bounded implementation satisfies the external oracle.",
      },
      {
        id: "c8-q2",
        scenario:
          "Your unit tests mock the database and pass 100%, yet production leaks data because an RLS policy had a typo. Which verification layer catches this before `main` merge?",
        options: [
          "CSS snapshot tests",
          "Integration tests running real SQL queries as Org Alpha and Org Beta JWTs against an ephemeral containerized PostgreSQL instance in CI",
          "Adding more `any` types in TypeScript",
          "Increasing Playwright viewport width",
        ],
        correctIndex: 1,
        explanation:
          "Mocked unit tests never execute PostgreSQL's RLS engine or SQL constraints; containerized DB integration tests prove real cross-tenant isolation in CI.",
      },
      {
        id: "c8-q3",
        scenario:
          "What role does Playwright E2E serve in the GitHub Actions CI gate alongside unit and integration tests?",
        options: [
          "Playwright tests every permutation of 500 math edge cases instead of unit tests",
          "Playwright drives a real headless Chromium browser through critical revenue/auth user journeys (Login -> Create Rental -> Stripe Checkout -> Invoice Render) to catch hydration, routing, and API contract mismatches",
          "Playwright replaces Cloudflare CDN",
          "Playwright compiles Docker images",
        ],
        correctIndex: 1,
        explanation:
          "Following the Testing Trophy/Pyramid: fast unit tests cover combinatorial math, integration tests verify DB/RLS/DTO boundaries, and Playwright E2E proves critical end-to-end user journeys.",
      },
    ],
    adrLab: {
      title: "ADR-008: Spec-First AI Verification Gate & GitHub Actions Pipeline",
      missionPrompt:
        "Design the 4-stage automated CI verification gate (Static Types/SAST -> Unit -> Ephemeral Postgres RLS Integration -> Playwright E2E) governing all AI-authored PRs into `main`.",
      starterTemplate: `# ADR-008: Automated TDD & CI Merge Gate Specification
## Spec-First AI Workflow
- Rule preventing AI self-grading (Immutable Test Lock): 

## Verification Pyramid Matrix
- Stage 1 (Typecheck, Lint, SAST Semgrep/Snyk): 
- Stage 2 (Unit Specs — Billing, Tax, Scorecards): 
- Stage 3 (Containerized Postgres Integration + Cross-Tenant RLS Test): 
- Stage 4 (Playwright Critical User Journeys): 

## Branch Protection & Merge Policy
- Required status checks & failure feedback loop: `,
      evaluationChecklist: [
        "Enforces writing/locking test assertions prior to bounded AI code generation",
        "Includes real containerized PostgreSQL cross-tenant RLS integration assertions",
        "Gates `main` branch merges on green Typecheck + SAST + Unit + Integration + Playwright E2E",
      ],
    },
  },
  {
    classNumber: 9,
    slug: "class-9-cicd-zero-downtime-migrations",
    tier: "master",
    title: "Release Engineering, CI/CD & Zero-Downtime Database Migrations",
    shortTitle: "CI/CD & Zero-Downtime Migrations",
    primaryProjectImpact: "GitHub Actions & Expand-Contract",
    enterpriseRiskNeutralized: "Broken deployments, update downtime",
    pillarId: 4,
    whatItTeaches:
      'Git trunk-based development; automated CI/CD deployment pipelines (GitHub Actions); the "Expand and Contract" database migration pattern; blue-green and canary deployments; automated rollbacks.',
    whereUsedInProject:
      "Continuous deployment of Chairman Dashboard to Vercel and Equipsynx backend services to cloud containers with zero downtime during schema updates.",
    howItWorks:
      "To update a database column in production without taking the site offline, you first expand (add the new column while keeping the old one), deploy code that reads both, migrate data, deploy code that writes only to the new column, and finally contract (drop the old column).",
    whyImportant:
      "Dropping or renaming a database column in production while existing application instances are running causes immediate 500 errors for active users. Zero-downtime release engineering is mandatory at enterprise scale.",
    coreConcepts: [
      "Trunk-Based Git Development & Feature Flags",
      "5-Step Expand-Contract Schema Migration",
      "`CREATE INDEX CONCURRENTLY` Lock Avoidance",
      "Blue-Green & Canary Progressive Traffic Shifts",
      "Automated Rollbacks on Error-Rate Spikes",
    ],
    asciiDiagram: `+-------------------------------------------------------------------------------+
| MACRO VIEW: Expand-Contract Zero-Downtime Migration Pattern                   |
|                                                                               |
| STEP 1: EXPAND (Database)                                                     |
| Add new column \`customer_full_name\` alongside old \`customer_name\`.            |
| Both exist simultaneously. Zero code broken.                                  |
|                                                                               |
| STEP 2: DUAL-WRITE (Application Deployment v1.1)                              |
| Deploy app version that writes to BOTH columns, reads from old column.        |
|                                                                               |
| STEP 3: BACKFILL DATA (Background Script)                                     |
| Populate \`customer_full_name\` for all historical rows.                        |
|                                                                               |
| STEP 4: SWITCH READS (Application Deployment v1.2)                            |
| Deploy app version that reads exclusively from \`customer_full_name\`.          |
|                                                                               |
| STEP 5: CONTRACT (Database)                                                   |
| Safely drop old column \`customer_name\`. Migration complete with 0s downtime.  |
+-------------------------------------------------------------------------------+`,
    lessonXp: 100,
    quizXp: 150,
    labXp: 200,
    quiz: [
      {
        id: "c9-q1",
        scenario:
          "During a rolling deployment, v1.0 containers are still serving live Equipsynx checkouts for 90 seconds while v1.1 containers boot. If v1.1 runs `ALTER TABLE customers RENAME COLUMN customer_name TO customer_full_name`, what happens?",
        options: [
          "Zero downtime because PostgreSQL automatically aliases renamed columns",
          "Every live v1.0 container immediately throws `500 Internal Server Error: column customer_name does not exist` until rollover finishes—and rolling back v1.1 breaks v1.1's schema too",
          "Vercel pauses user browsers politely",
          "PgBouncer rewrites the SQL column names automatically",
        ],
        correctIndex: 1,
        explanation:
          "Destructive renames/drops break N-1 running instances and make instant code rollbacks impossible. Expand -> Dual-Write -> Backfill -> Switch Reads -> Contract guarantees 100% N-1 compatibility at every step.",
      },
      {
        id: "c9-q2",
        scenario:
          "You need to add a new B-Tree index on a 25-million-row `transactions` table during peak business hours. Which PostgreSQL command avoids blocking live `INSERT` and `UPDATE` traffic?",
        options: [
          "`CREATE INDEX idx_tx_org ON transactions(org_id);` inside a long transaction",
          "`CREATE INDEX CONCURRENTLY idx_tx_org ON transactions(org_id);`",
          "`LOCK TABLE transactions IN ACCESS EXCLUSIVE MODE;`",
          "Drop the table, add the index, and restore from backup",
        ],
        correctIndex: 1,
        explanation:
          "Standard `CREATE INDEX` acquires a write-blocking lock for the entire build duration; `CREATE INDEX CONCURRENTLY` builds the index in multiple passes without blocking concurrent writes.",
      },
      {
        id: "c9-q3",
        scenario:
          "How does a **Canary Deployment** combined with automated rollback protect revenue during high-risk releases?",
        options: [
          "It deploys exclusively on Friday nights at 11 PM",
          "It routes 5% of live traffic to the new revision first, monitors latency and 5xx error SLAs automatically, and shifts 100% back to the healthy baseline within seconds if error budgets breach",
          "It emails customers asking them to clear browser cache",
          "It disables database backups during deployment",
        ],
        correctIndex: 1,
        explanation:
          "Canary progressive delivery bounds the blast radius of subtle production regressions to a tiny slice of traffic and triggers automated rollback before human operators even open Slack.",
      },
    ],
    adrLab: {
      title: "ADR-009: Zero-Downtime Expand-Contract Migration & Canary Rollout",
      missionPrompt:
        "Equipsynx must migrate `rental_contracts.total_amount` (floating-point dollars) to `total_cents` (`BIGINT` integer cents) across 1.8M active rows with 0 seconds of checkout downtime and instant rollback safety.",
      starterTemplate: `# ADR-009: Zero-Downtime Expand-Contract Release Plan
## Context & N-1 Compatibility Requirement
- Why in-place \`ALTER COLUMN TYPE\` is forbidden: 

## 5-Step Expand-Contract Execution Sequence
- Step 1 (Expand Schema): 
- Step 2 (Dual-Write App v1.1): 
- Step 3 (Batched Idempotent Backfill): 
- Step 4 (Cutover Reads App v1.2 + Canary 5% -> 100%): 
- Step 5 (Contract Old Column): 

## Automated Rollback Trigger
- Error-rate / latency SLA abort condition: `,
      evaluationChecklist: [
        "Walks cleanly through all 5 steps (Expand, Dual-Write, Batched Backfill, Switch Reads, Contract)",
        "Preserves N-1 application compatibility so code can roll back instantly at Steps 2–4",
        "Uses batched throttling during backfill and Canary health gates before Step 5 Contract",
      ],
    },
  },
  {
    classNumber: 10,
    slug: "class-10-staff-distributed-architecture",
    tier: "master",
    title: "Staff-Plus Distributed System Design & Executive Architectural Defense",
    shortTitle: "Staff-Plus Distributed System Design",
    primaryProjectImpact: "Enterprise Scale & Technical Governance",
    enterpriseRiskNeutralized: "Multi-million dollar design failures",
    pillarId: 5,
    whatItTeaches:
      "High-throughput system design for 50,000+ requests/sec; back-of-the-envelope capacity planning (IOPS, memory bandwidth, latency budgets); CAP theorem tradeoffs (Consistency vs. Availability); disaster recovery with RPO and RTO measured in seconds; Architecture Decision Records (ADRs); defending architectural decisions before leadership.",
    whereUsedInProject:
      "The overarching enterprise roadmap for scaling platforms to national fleets, multi-region failovers, and commanding $250k+ technical leadership authority.",
    howItWorks:
      "You evaluate business objectives against hard physics and engineering constraints, author structured ADRs documenting why specific trade-offs were selected, and build self-healing distributed topologies that survive regional cloud outages.",
    whyImportant:
      "This is the skill set that commands top-tier enterprise compensation. Companies do not pay $250k+ for typing code; they pay for leaders who can guarantee systems never fail, prevent multi-million dollar architectural mistakes, and direct engineering execution with mathematical precision.",
    coreConcepts: [
      "50,000+ req/s Capacity & IOPS Envelope Math",
      "CAP Theorem Tradeoffs (CP Financial Ledgers vs AP Feeds)",
      "Multi-Region Active-Passive Failover (`us-east` -> `us-west`)",
      "Disaster Recovery SLAs: RTO < 60s & RPO < 1s",
      "Executive ADRs & Board-Level Tradeoff Defense",
    ],
    asciiDiagram: `+-------------------------------------------------------------------------------+
| MACRO VIEW: Staff-Level Globally Resilient Multi-Region Architecture          |
|                                                                               |
|                  [Global DNS / Anycast Traffic Director]                      |
|                       /                           \\                           |
|       (Primary Region: US-East)           (Disaster Recovery: US-West)        |
|                   |                                   |                       |
|                   v                                   v                       |
|      +-------------------------+         +-------------------------+          |
|      | Load Balancer / Ingress |         |  Standby Load Balancer  |          |
|      +-------------------------+         +-------------------------+          |
|                   |                                   |                       |
|                   v                                   v                       |
|      +-------------------------+         +-------------------------+          |
|      | Stateless Compute Clust |         |  Warm Standby Compute   |          |
|      +-------------------------+         +-------------------------+          |
|                   |                                   |                       |
|                   v                                   v                       |
|      +-------------------------+  Repl   +-------------------------+          |
|      | Primary DB (Read/Write) |=======>>| Read Replica (Promotable|          |
|      +-------------------------+ (<50ms) +-------------------------+          |
|                   |                                   |                       |
|                   v                                   v                       |
|        [Redis In-Memory Cache]             [Redis In-Memory Cache]            |
|                                                                               |
|  FAILOVER SLA: Recovery Time Objective (RTO) < 60s | RPO < 1s Data Loss       |
+-------------------------------------------------------------------------------+`,
    lessonXp: 100,
    quizXp: 150,
    labXp: 200,
    quiz: [
      {
        id: "c10-q1",
        scenario:
          "During a network partition between `us-east-1` and `us-west-2`, CAP theorem forces a choice between **Consistency (CP)** and **Availability (AP)**. How should a Staff Architect partition Equipsynx's double-booking/invoice ledger vs. its equipment GPS map telemetry?",
        options: [
          "Make everything AP so two customers can book and pay for the exact same excavator simultaneously",
          "Enforce strict Consistency (CP / single-leader serializable locking) for equipment reservation & financial ledgers, while choosing Availability (AP / eventual consistency) for high-frequency GPS breadcrumb telemetry",
          "Shut down the entire platform whenever latency exceeds 20ms",
          "Store financial ledgers in browser cookies",
        ],
        correctIndex: 1,
        explanation:
          "Staff Architects apply CAP per bounded domain: financial & inventory reservations demand strong consistency (CP), whereas telemetry/analytics streams prioritize uninterrupted write availability (AP).",
      },
      {
        id: "c10-q2",
        scenario:
          "Back-of-the-envelope math: Your platform targets **50,000 read requests/sec** with a 90% Redis cache hit ratio, and **2,500 write requests/sec**. How many read queries/sec actually reach PostgreSQL, and how do you scale it cleanly?",
        options: [
          "50,000 reads/sec hit Primary DB; buy a mainframe",
          "Only 10% (5,000 reads/sec) bypass Redis cache; route read-only queries across promotable Read Replicas via PgBouncer while reserving Primary DB IOPS for the 2,500 writes/sec",
          "0 reads/sec ever hit PostgreSQL",
          "Shard into 500 microservices before reaching 100 users",
        ],
        correctIndex: 1,
        explanation:
          "`50,000 * (1 - 0.90) = 5,000 DB reads/s`—easily absorbed by 1–2 indexed Read Replicas behind PgBouncer without premature multi-node sharding complexity.",
      },
      {
        id: "c10-q3",
        scenario:
          "Executive leadership asks for the exact difference between **RTO < 60s** and **RPO < 1s** in your Multi-Region Disaster Recovery SLA. Which defense is accurate?",
        options: [
          "RTO is monthly cloud cost; RPO is CPU utilization",
          "RTO (Recovery Time Objective < 60s) is the maximum elapsed downtime to promote US-West Read Replica + shift Anycast DNS; RPO (Recovery Point Objective < 1s) is the maximum window of committed data at risk via sub-50ms WAL streaming replication",
          "RTO and RPO both measure Playwright test runtime",
          "RPO < 1s means nightly tape backups taken every 24 hours",
        ],
        correctIndex: 1,
        explanation:
          "RTO measures *how fast service resumes* (<60s automated DNS + replica promotion); RPO measures *how much data could be lost* (<1s continuous WAL streaming).",
      },
    ],
    adrLab: {
      title: "ADR-010: Executive Board Defense — 50,000 req/s Multi-Region Platform",
      missionPrompt:
        "Author a Staff-Plus Executive ADR defending a 50,000 req/s national Equipsynx + Chairman Platform topology before the Board: capacity math, CP vs AP split, US-East/US-West failover (RTO <60s, RPO <1s), and why premature Kubernetes/Sharding was rejected.",
      starterTemplate: `# ADR-010: National Multi-Region Scale & Disaster Recovery Defense
## 1. Back-of-the-Envelope Capacity Math (50,000 req/s)
- Peak Read/Write QPS, Redis Hit Ratio & Net Postgres IOPS: 
- Latency Budget Breakdown (Edge TLS + Compute + Cache/DB < 120ms p95): 

## 2. Domain CAP Trade-offs
- CP Domains (Strict Consistency): 
- AP Domains (High Availability / Async Queue): 

## 3. Multi-Region Failover SLA (RTO < 60s | RPO < 1s)
- US-East Primary -> US-West Warm Standby & Replica Promotion Sequence: 

## 4. Rejected Over-Engineering & FinOps Justification
- Why Modular Monolith + Read Replicas beats premature 40-microservice sharding: `,
      evaluationChecklist: [
        "Shows explicit back-of-the-envelope QPS, cache-hit, and DB IOPS calculations",
        "Splits CP (billing/reservations) vs AP (telemetry/feeds) domains rigorously",
        "Defines concrete US-East -> US-West failover achieving RTO <60s and RPO <1s with FinOps discipline",
      ],
    },
  },
];

// Section 11: The 5 Closed Pillars of Systems Engineering (The Universal Boundary)
export const FIVE_CLOSED_PILLARS: ClosedPillar[] = [
  {
    id: 1,
    name: "1. Data & State",
    domain: "Persistence & Integrity",
    coveredClasses: "Class 1 (Relational Schemas) & Class 3 (RLS)",
    classNumbers: [1, 3],
    coreResponsibility:
      "Tables, cardinalities, constraints, indexing, normalization, and row-level access control.",
    accentHex: "#10b981",
  },
  {
    id: 2,
    name: "2. Interface Bounds",
    domain: "Contracts & Protocols",
    coveredClasses: "Class 2 (DTOs/Contracts) & Class 5 (Decoupling)",
    classNumbers: [2, 5],
    coreResponsibility:
      "OpenAPI, Pydantic schemas, REST/gRPC semantics, stateless auth, and client-server boundaries.",
    accentHex: "#38bdf8",
  },
  {
    id: 3,
    name: "3. Execution Pipelines",
    domain: "Compute & Flow",
    coveredClasses: "Class 4 (Async & Queues) & Class 7 (Cloud/Edge)",
    classNumbers: [4, 7],
    coreResponsibility:
      "Synchronous requests, webhooks, task brokers, workers, container runtimes, and edge routing.",
    accentHex: "#f59e0b",
  },
  {
    id: 4,
    name: "4. Verification Gates",
    domain: "Quality & Assurance",
    coveredClasses: "Class 8 (TDD/E2E), Class 9 (CI/CD) & SAST/DAST",
    classNumbers: [8, 9],
    coreResponsibility:
      "Automated test execution, security scanning, regression prevention, and deploy gates.",
    accentHex: "#ec4899",
  },
  {
    id: 5,
    name: "5. System Resilience & Governance",
    domain: "Enterprise Survivability",
    coveredClasses: "Class 6 (Observability), Class 10 (Distributed), FinOps, Compliance",
    classNumbers: [6, 10],
    coreResponsibility:
      "Monitoring, tracing, circuit breakers, disaster recovery (RPO/RTO), unit cost control, and legal audit boundaries.",
    accentHex: "#8b5cf6",
  },
];

// Section 12: The 3 Operational Enterprise Layers
export const THREE_ENTERPRISE_LAYERS: EnterpriseOperationalLayer[] = [
  {
    id: "A",
    code: "LAYER A",
    title: "Regulatory Governance, Compliance & Data Boundaries",
    subtitle: "Legal, financial, healthcare, and defense-grade data isolation standards.",
    accentHex: "#10b981",
    disciplines: [
      {
        name: "Fintech & Payment Standards",
        standards: "PCI-DSS & GLBA",
        description:
          "Tokenization of card data and bank feeds (Plaid, Stripe). Strict isolation of payment secrets; zero storage of raw card numbers or unencrypted bank credentials.",
      },
      {
        name: "Health & Biometrics Privacy",
        standards: "HIPAA & Consumer Health Regulations",
        description:
          "Separation of biometric telemetry (Samsung Health, Renpho) from user identity tables, zero-knowledge encryption at rest, and automated data purge mechanisms.",
      },
      {
        name: "Enterprise Security Standards",
        standards: "SOC 2 Type II & DoD Zero Trust",
        description:
          "Comprehensive immutable audit logging on every data mutation (who, what, when, IP address, previous state) and MFA enforcement across administrative touchpoints.",
      },
    ],
  },
  {
    id: "B",
    code: "LAYER B",
    title: "FinOps & Cloud Unit Economics (Cost Engineering)",
    subtitle: "Margin-protecting unit economics, billing circuit breakers, and cloud portability.",
    accentHex: "#f59e0b",
    disciplines: [
      {
        name: "Unit Cost Modeling",
        standards: "COGS per Active Tenant / Asset",
        description:
          "Calculating the exact monthly compute, database IOPS, and API cost per active user or tracked asset.",
      },
      {
        name: "Runaway Budget Circuit Breakers",
        standards: "Hard Spend & Queue Throttling",
        description:
          "Establishing hard billing alerts, concurrency caps, rate limiters, and queue throttling to prevent recursive loop cloud bill spikes.",
      },
      {
        name: "Vendor Lock-In Avoidance",
        standards: "Repository Abstraction Portability",
        description:
          "Architecting data access layers to allow seamless transitions between managed backends (Supabase/Vercel) and self-hosted cloud instances (AWS RDS/Cloud Run).",
      },
    ],
  },
  {
    id: "C",
    code: "LAYER C",
    title: "The Non-Coder AI Verification Harness",
    subtitle: "Automated security, stress testing, and formal decision records governing AI code.",
    accentHex: "#8b5cf6",
    disciplines: [
      {
        name: "Automated Security Scanners",
        standards: "SAST / DAST (Semgrep, Snyk)",
        description:
          "Automated vulnerability scanning (Semgrep, Snyk) in CI pipelines to catch SQL injection risks, exposed keys, and package vulnerabilities before merge.",
      },
      {
        name: "Load & Stress Testing",
        standards: "k6 / Locust (5,000 VUs < 200ms SLA)",
        description:
          "Automated load-generation scripts testing backend endpoints against 5,000 concurrent virtual users to verify sub-200ms latency SLAs.",
      },
      {
        name: "Architecture Decision Records",
        standards: "Formal 1-Page Markdown ADRs",
        description:
          "Formal, standardized 1-page markdown records capturing context, considered options, trade-offs, and final decisions for every significant architectural change.",
      },
    ],
  },
];

// Section 13: Demystifying the '40 Things': Industry Jargon vs. Core Foundations
export const JARGON_TRANSLATION_MATRIX: JargonMatrixRow[] = [
  {
    id: "jargon-1",
    buzzwords: "Kafka, RabbitMQ, SQS, Redis Streams",
    individualTerms: ["Kafka", "RabbitMQ", "SQS", "Redis Streams"],
    whatItActuallyIs: "Distributed message brokers and queues for background execution.",
    associatedClassLabel: "Class 4: Async Pipelines & Queues",
    associatedClassNumbers: [4],
    pillarId: 3,
  },
  {
    id: "jargon-2",
    buzzwords: "GraphQL, gRPC, WebSockets, tRPC",
    individualTerms: ["GraphQL", "gRPC", "WebSockets", "tRPC"],
    whatItActuallyIs: "Alternative wire protocols to standard RESTful HTTP.",
    associatedClassLabel: "Class 2: Interface Contracts & DTOs",
    associatedClassNumbers: [2],
    pillarId: 2,
  },
  {
    id: "jargon-3",
    buzzwords: "Event Sourcing & CQRS",
    individualTerms: ["Event Sourcing", "CQRS"],
    whatItActuallyIs: "Separating read queries from write commands through event logs.",
    associatedClassLabel: "Class 1 & Class 4",
    associatedClassNumbers: [1, 4],
    pillarId: 1,
  },
  {
    id: "jargon-4",
    buzzwords: "Microservices vs. Modular Monoliths",
    individualTerms: ["Microservices", "Modular Monoliths"],
    whatItActuallyIs: "Deciding whether backend services run in one binary or multiple services.",
    associatedClassLabel: "Class 5: Application Decoupling",
    associatedClassNumbers: [5],
    pillarId: 2,
  },
  {
    id: "jargon-5",
    buzzwords: "OpenTelemetry, Prometheus, Datadog",
    individualTerms: ["OpenTelemetry", "Prometheus", "Datadog", "Sentry"],
    whatItActuallyIs: "Structured log collection, metrics aggregation, and trace monitoring.",
    associatedClassLabel: "Class 6: Observability & Resilience",
    associatedClassNumbers: [6],
    pillarId: 5,
  },
  {
    id: "jargon-6",
    buzzwords: "Kubernetes, Nomad, Docker Swarm",
    individualTerms: ["Kubernetes", "K8s", "Nomad", "Docker Swarm"],
    whatItActuallyIs: "Container orchestration across clusters of physical machines.",
    associatedClassLabel: "Class 7: Cloud Infra & Containers",
    associatedClassNumbers: [7],
    pillarId: 3,
  },
  {
    id: "jargon-7",
    buzzwords: "Terraform, OpenTofu, Pulumi",
    individualTerms: ["Terraform", "OpenTofu", "Pulumi", "IaC"],
    whatItActuallyIs: "Declarative Infrastructure-as-Code for cloud provisioning.",
    associatedClassLabel: "Class 7: Cloud Infrastructure",
    associatedClassNumbers: [7],
    pillarId: 3,
  },
  {
    id: "jargon-8",
    buzzwords: "Canary Releases, Blue-Green, Feature Flags",
    individualTerms: ["Canary Releases", "Blue-Green", "Feature Flags"],
    whatItActuallyIs: "Staged deployment techniques to verify changes on a subset of users.",
    associatedClassLabel: "Class 9: Release Engineering & CI/CD",
    associatedClassNumbers: [9],
    pillarId: 4,
  },
  {
    id: "jargon-9",
    buzzwords: "OAuth2, OIDC, SAML, Keycloak",
    individualTerms: ["OAuth2", "OIDC", "SAML", "Keycloak", "SSO"],
    whatItActuallyIs: "Token-based authentication and federated identity protocols.",
    associatedClassLabel: "Class 2 & Class 3",
    associatedClassNumbers: [2, 3],
    pillarId: 1,
  },
  {
    id: "jargon-10",
    buzzwords: "Database Sharding, CockroachDB, Citus",
    individualTerms: ["Database Sharding", "CockroachDB", "Citus"],
    whatItActuallyIs: "Horizontal partitioning of relational tables across multiple database nodes.",
    associatedClassLabel: "Class 10: Distributed System Design",
    associatedClassNumbers: [10],
    pillarId: 5,
  },
];

export const SAFELY_EXCLUDED_DOMAINS: ExcludedDomain[] = [
  {
    id: 1,
    title: "Low-Level Hardware & Systems Programming",
    technologies: "C, C++, Rust, Assembly",
    rationale: "Device drivers, CPU memory pointers, and microcontrollers are outside cloud enterprise SaaS platform architecture.",
  },
  {
    id: 2,
    title: "Compiler Theory & AST Parsing",
    technologies: "Lexers, Syntax Parsers, Bytecode Compilers",
    rationale: "Language runtime internals do not affect distributed system topology, data integrity, or multi-tenant SaaS governance.",
  },
  {
    id: 3,
    title: "Training Foundation AI Models from Scratch",
    technologies: "PyTorch / CUDA Pre-Training Clusters",
    rationale: "Platform engineering focuses on orchestrating frontier models via APIs, structured context, verification gates, and MCP.",
  },
  {
    id: 4,
    title: "Game Engines & 3D Physics",
    technologies: "Unreal Engine, Unity, Custom Shader Pipelines",
    rationale: "Real-time 3D frame physics and shader pipelines are distinct from transactional web platforms and financial/operations SaaS.",
  },
  {
    id: 5,
    title: "Native Mobile OS Compilation Internals",
    technologies: "Objective-C / Kotlin Kernel Bridges",
    rationale: "Replaced for business dashboards and enterprise SaaS by modern responsive web applications and PWA architectures.",
  },
];

export const TOTAL_POSSIBLE_CURRICULUM_XP = CURRICULUM_CLASSES.reduce(
  (sum, c) => sum + c.lessonXp + c.quizXp + c.labXp,
  0
); // 4,500 XP

export function calculateRankForXp(xp: number): RankLevelSpec {
  const safeXp = Math.max(0, Math.floor(xp || 0));
  let matched = RANK_LEVEL_CURVE[0];
  for (const spec of RANK_LEVEL_CURVE) {
    if (safeXp >= spec.minXp) {
      matched = spec;
    }
  }
  return matched;
}

export function getNextLevelInfo(xp: number): {
  current: RankLevelSpec;
  next: RankLevelSpec | null;
  progressPct: number;
  xpIntoLevel: number;
  xpNeededForNext: number;
} {
  const safeXp = Math.max(0, Math.floor(xp || 0));
  const current = calculateRankForXp(safeXp);
  const idx = RANK_LEVEL_CURVE.findIndex((r) => r.level === current.level);
  const next = idx >= 0 && idx < RANK_LEVEL_CURVE.length - 1 ? RANK_LEVEL_CURVE[idx + 1] : null;
  if (!next) {
    return {
      current,
      next: null,
      progressPct: 100,
      xpIntoLevel: safeXp - current.minXp,
      xpNeededForNext: 0,
    };
  }
  const span = Math.max(1, next.minXp - current.minXp);
  const into = Math.max(0, safeXp - current.minXp);
  const pct = Math.min(100, Math.round((into / span) * 100));
  return {
    current,
    next,
    progressPct: pct,
    xpIntoLevel: into,
    xpNeededForNext: Math.max(0, next.minXp - safeXp),
  };
}

export interface ClassProgressRecord {
  class_slug: string;
  tier: string;
  is_completed: boolean;
  quiz_score: number;
  quiz_total: number;
  lab_completed: boolean;
  adr_notes: string;
  xp_earned: number;
  completed_at?: string | null;
  updated_at?: string | null;
}

export function computeUnlockedBadges(
  xp: number,
  progressRows: ClassProgressRecord[],
  existingBadges: string[] = []
): string[] {
  const unlocked = new Set<string>(existingBadges);
  const bySlug = new Map(progressRows.map((r) => [r.class_slug, r]));

  const anyAction = progressRows.some(
    (r) => r.is_completed || r.lab_completed || r.quiz_score > 0
  );
  if (anyAction || xp >= 100) {
    unlocked.add("first-spec-locked");
  }

  const isClassFullyDone = (c: CurriculumClass) => {
    const p = bySlug.get(c.slug);
    return !!(p && (p.is_completed || (p.quiz_score >= 2 && p.lab_completed)));
  };

  const beginnerClasses = CURRICULUM_CLASSES.filter((c) => c.tier === "beginner");
  if (xp >= 1100 || beginnerClasses.every(isClassFullyDone)) {
    unlocked.add("beginner-badge");
  }

  const advancedClasses = CURRICULUM_CLASSES.filter((c) => c.tier === "advanced");
  if (xp >= 2800 || advancedClasses.every(isClassFullyDone)) {
    unlocked.add("advanced-badge");
  }

  const completedLabs = progressRows.filter((r) => r.lab_completed).length;
  if (completedLabs >= 3) {
    unlocked.add("adr-defender");
  }

  const perfectQuizzes = progressRows.filter(
    (r) => r.quiz_total > 0 && r.quiz_score >= r.quiz_total
  ).length;
  if (perfectQuizzes >= 5) {
    unlocked.add("quiz-sharpshooter");
  }

  if (xp >= 4200 || CURRICULUM_CLASSES.every(isClassFullyDone)) {
    unlocked.add("master-seal");
  }

  return Array.from(unlocked);
}

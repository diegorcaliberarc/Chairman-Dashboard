import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import tsParser from "@typescript-eslint/parser";
import boundaries from "eslint-plugin-boundaries";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/**
 * Custom inline ESLint plugin banning low-value conversational / prompt-history
 * AI narration comments while allowing JSDoc (`/** ... * /`) and technical notes.
 */
const chairmanEngineeringPlugin = {
  rules: {
    "no-narrated-comments": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Forbid conversational prompt-history narration in code comments; keep JSDoc and algorithmic explanations.",
        },
        schema: [],
      },
      create(context) {
        const NARRATED_PATTERNS = [
          /\bas requested by (?:the )?user\b/i,
          /\bper (?:the )?user(?:'s)? (?:prompt|request)\b/i,
          /\b(?:round\s+[1-9]|phase\s+[1-9])\s+(?:fix|polish|update)\b/i,
          /\bhere we (?:fix|update|changed|added) this because\b/i,
          /\bchanged from .+ to .+ as asked\b/i,
        ];
        return {
          Program() {
            const sourceCode = context.sourceCode || context.getSourceCode();
            const comments = sourceCode.getAllComments();
            for (const comment of comments) {
              // Always allow JSDoc blocks (`/** ... */`)
              if (comment.type === "Block" && comment.value.startsWith("*")) {
                continue;
              }
              for (const pattern of NARRATED_PATTERNS) {
                if (pattern.test(comment.value)) {
                  context.report({
                    loc: comment.loc,
                    message:
                      "Avoid narrated prompt-history comments. Explain non-obvious domain/algorithmic why, or use JSDoc.",
                  });
                  break;
                }
              }
            }
          },
        };
      },
    },
  },
};

/**
 * Pre-existing files >350 lines grandfathered on a "warn" ratchet so `npm run verify:all`
 * passes on day 1 while strictly blocking ANY new or <=350-line file from exceeding 350 lines.
 */
const LEGACY_OVERSIZED_ALLOWLIST = [
  "app/page.tsx",
  "app/artifacts/page.tsx",
  "app/budget/page.tsx",
  "app/calendar/page.tsx",
  "app/caliber-arc/page.tsx",
  "app/codebase-diagrams/page.tsx",
  "app/education/page.tsx",
  "app/epistemic/page.tsx",
  "app/family-hub/page.tsx",
  "app/horizon/page.tsx",
  "app/integrations/page.tsx",
  "app/kpis/page.tsx",
  "app/life-ops/page.tsx",
  "app/macro-ops/page.tsx",
  "app/marketing-agent/page.tsx",
  "app/mindset/page.tsx",
  "app/org-chart/page.tsx",
  "app/pms/page.tsx",
  "app/resources/page.tsx",
  "app/roadmaps/page.tsx",
  "app/skills/page.tsx",
  "app/vault/page.tsx",
  "app/workouts/page.tsx",
  "app/api/budget/route.ts",
  "app/api/calendar-ops/route.ts",
  "app/api/circadian/radar/route.ts",
  "app/api/circadian/route.ts",
  "app/api/command/route.ts",
  "app/api/copilot/route.ts",
  "app/api/education/route.ts",
  "app/api/epistemic/route.ts",
  "app/api/family-hub/route.ts",
  "app/api/horizon/route.ts",
  "app/api/integrations/route.ts",
  "app/api/life-ops/route.ts",
  "app/api/marketing-agent/route.ts",
  "app/api/mindset/route.ts",
  "app/api/nutrition/route.ts",
  "app/api/parse-food/route.ts",
  "app/api/pms/route.ts",
  "app/api/pods/route.ts",
  "app/api/roadmaps/synthesize/route.ts",
  "app/api/trading/route.ts",
  "app/api/vault/route.ts",
  "app/api/widgets/route.ts",
  "components/AppearanceSettings.tsx",
  "components/FoodLoggerCard.tsx",
  "components/Sidebar.tsx",
  "components/UserAccountModal.tsx",
  "components/chairman/circadian/CircadianCalendarContainer.tsx",
  "components/chairman/copilot/ChairmanCopilotHUD.tsx",
  "components/chairman/pixel-pals/DittoGengarPals.tsx",
  "components/chairman/pods/HisAndHersDualWheel.tsx",
  "components/chairman/pods/PodContainer.tsx",
  "components/circadian/CalendarOpsCommandDeck.tsx",
  "components/circadian/CircadianDialStage.tsx",
  "components/circadian/CircadianEventModal.tsx",
  "components/command/SundayReviewWizardModal.tsx",
  "components/macro-ops/GengarHydrationCard.tsx",
  "components/macro-ops/QuickMealLogModal.tsx",
  "components/mission/MissionFlowNavigatorModal.tsx",
  "components/pms/PmsHierarchySidebar.tsx",
  "components/pms/TaskDetailModal.tsx",
  "components/roadmaps/DagCanvasView.tsx",
  "components/roadmaps/ExecutionPyramidView.tsx",
  "components/roadmaps/TacticalDossierModal.tsx",
  "components/temporal/GeospatialTacticalMap.tsx",
  "components/temporal/YearlyRadialView.tsx",
  "components/topology/topologyTemplates.ts",
  "lib/architectureRegistry.ts",
  "lib/circadianMath.ts",
  "lib/circadianTypes.ts",
  "lib/defaultStrategicTrees.ts",
  "lib/educationCurriculum.ts",
  "lib/glassTheme.ts",
  "lib/missionFlowTypes.ts",
  "lib/temporalData.ts",
];

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      "backend/**",
      "prisma/**",
      "supabase/**",
      "scripts/**",
      "tests/**",
      "*.js",
      "next-env.d.ts",
    ],
  },

  ...compat.extends("next/core-web-vitals"),

  // Global Architectural, Complexity & Comment Guardrails
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      boundaries,
      chairman: chairmanEngineeringPlugin,
    },
    settings: {
      "boundaries/include": ["features/**/*", "shared/**/*", "services/**/*", "lib/**/*"],
      "boundaries/elements": [
        {
          type: "feature",
          pattern: "features/*/**",
          capture: ["featureName"],
        },
        {
          type: "feature-barrel",
          pattern: "features/*/index.ts",
          capture: ["featureName"],
        },
        {
          type: "shared",
          pattern: "shared/**/*",
        },
        {
          type: "services",
          pattern: "services/**/*",
        },
        {
          type: "lib",
          pattern: "lib/**/*",
        },
      ],
    },
    rules: {
      // Relax legacy Next/React stylistic warnings that don't affect runtime safety
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "react-hooks/exhaustive-deps": "warn",

      // 1. Hard 350-line cap on all new files & modular components
      "max-lines": [
        "error",
        {
          max: 350,
          skipBlankLines: true,
          skipComments: true,
        },
      ],

      // 2. Ban narrated AI prompt-history comments
      "chairman/no-narrated-comments": "error",

      // 3. Feature Co-Location & Barrel Isolation via eslint-plugin-boundaries
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: ["feature"],
              disallow: [
                ["feature", { featureName: "!${from.featureName}" }],
              ],
              message:
                "Features cannot import internal files of sibling features. Import from the sibling's public index.ts barrel (@features/<name>) instead.",
            },
            {
              from: ["shared"],
              disallow: ["feature", "feature-barrel"],
              message: "Shared modules must remain domain-agnostic and cannot depend on feature modules.",
            },
          ],
        },
      ],

      // Forbid deep path imports into feature internals from anywhere outside that feature
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@features/*/*", "@/features/*/*"],
              message:
                "Import features exclusively through their public index.ts barrel (e.g. '@features/strategic-roadmap'), never deep internal files.",
            },
          ],
        },
      ],
    },
  },

  // Data-Layer Isolation: UI Components & Client Pages cannot import Prisma, Supabase, or API Route modules
  {
    files: [
      "components/**/*.ts",
      "components/**/*.tsx",
      "features/**/components/**/*.ts",
      "features/**/components/**/*.tsx",
      "app/**/page.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@prisma/client",
              message:
                "Data-Layer Isolation: UI components/pages cannot import '@prisma/client'. Route queries through services/, Server Actions, or /api/*.",
            },
            {
              name: "@/lib/prisma",
              message:
                "Data-Layer Isolation: UI components/pages cannot import '@/lib/prisma' directly.",
            },
            {
              name: "@/lib/livingOsDb",
              message:
                "Data-Layer Isolation: UI components/pages cannot import raw DB helpers '@/lib/livingOsDb'.",
            },
            {
              name: "@supabase/supabase-js",
              message:
                "Data-Layer Isolation: UI components/pages cannot instantiate or import raw Supabase DB clients directly.",
            },
          ],
          patterns: [
            {
              group: ["@features/*/*", "@/features/*/*"],
              message:
                "Import features exclusively through their public index.ts barrel ('@features/<name>').",
            },
            {
              group: ["@/app/api/**", "../api/**", "../../api/**"],
              message:
                "Data-Layer Isolation: Client/UI files cannot import server API route modules. Move shared DTO types to lib/ or features/<name>/.",
            },
          ],
        },
      ],
    },
  },

  // Strict React Anti-Pattern Guard in new `features/**` modules: error on raw fetch() inside useEffect
  {
    files: ["features/**/*.ts", "features/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='useEffect'] CallExpression[callee.name='fetch']",
          message:
            "Avoid raw fetch() chains inside useEffect. Use Server Components, dedicated data hooks/SWR, or explicit event handlers.",
        },
      ],
    },
  },

  // Legacy `app/**` & `components/**` raw useEffect fetch warning
  {
    files: ["app/**/page.tsx", "components/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "CallExpression[callee.name='useEffect'] CallExpression[callee.name='fetch']",
          message:
            "Prefer Server Components, dedicated service hooks, or explicit event handlers over raw fetch() inside useEffect.",
        },
      ],
    },
  },

  // Legacy Debt Ratchet Override: warn on pre-existing >350-line files; error on any new file
  {
    files: LEGACY_OVERSIZED_ALLOWLIST,
    rules: {
      "max-lines": [
        "warn",
        {
          max: 350,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
];

export default config;

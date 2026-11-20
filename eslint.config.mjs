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
 * Custom Chairman Dashboard v3.0 AST plugin enforcing zero-slop comments and
 * repo-wide zero lint/compiler suppression escape hatches.
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
            for (const comment of sourceCode.getAllComments()) {
              if (comment.type === "Block" && comment.value.startsWith("*")) {
                continue;
              }
              for (const pattern of NARRATED_PATTERNS) {
                if (pattern.test(comment.value)) {
                  context.report({
                    loc: comment.loc,
                    message:
                      "Narrated prompt-history comment forbidden. Remediation: delete conversational history and use JSDoc (/** ... */) only for non-obvious domain math or invariants.",
                  });
                  break;
                }
              }
            }
          },
        };
      },
    },

    "no-suppression-escapes": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Ban inline eslint-disable, @ts-ignore, and @ts-nocheck escape hatches; require root architectural or type fixes.",
        },
        schema: [],
      },
      create(context) {
        const SUPPRESSION_PATTERN =
          /(?:^\s*eslint-disable(?:-next-line|-line)?\b|@ts-ignore\b|@ts-nocheck\b)/;
        return {
          Program() {
            const sourceCode = context.sourceCode || context.getSourceCode();
            for (const comment of sourceCode.getAllComments()) {
              if (SUPPRESSION_PATTERN.test(comment.value)) {
                context.report({
                  loc: comment.loc,
                  message:
                    "Inline suppression escape hatch forbidden (eslint-disable / @ts-ignore / @ts-nocheck). Remediation: resolve the underlying TypeScript contract, React hook dependency, barrel boundary, or 350-line module split at its root cause.",
                });
              }
            }
          },
        };
      },
    },

    "no-tautological-tests": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Forbid rubber-stamp tautological assertions (expect(x).toBe(x), expect(true).toBe(true), or literal truthiness checks) in test suites.",
        },
        schema: [],
      },
      create(context) {
        const EQUALITY_MATCHERS = new Set([
          "toBe",
          "toEqual",
          "toStrictEqual",
          "toMatchObject",
        ]);
        const TRIVIAL_BOOL_MATCHERS = new Set(["toBeTruthy", "toBeFalsy"]);

        return {
          CallExpression(node) {
            if (
              node.callee?.type !== "MemberExpression" ||
              node.callee.property?.type !== "Identifier"
            ) {
              return;
            }
            const matcherName = node.callee.property.name;
            const expectCall = node.callee.object;
            if (
              expectCall?.type !== "CallExpression" ||
              expectCall.callee?.type !== "Identifier" ||
              expectCall.callee.name !== "expect" ||
              expectCall.arguments.length === 0
            ) {
              return;
            }

            const sourceCode = context.sourceCode || context.getSourceCode();
            const actualNode = expectCall.arguments[0];

            if (
              EQUALITY_MATCHERS.has(matcherName) &&
              node.arguments.length >= 1
            ) {
              const expectedNode = node.arguments[0];
              const actualText = sourceCode.getText(actualNode).trim();
              const expectedText = sourceCode.getText(expectedNode).trim();
              if (actualText === expectedText) {
                context.report({
                  node,
                  message: `Tautological self-assertion 'expect(${actualText}).${matcherName}(${expectedText})' is forbidden. Remediation: assert a real state-machine transition, forbidden-state rejection (INV-1..INV-7 / INV-PMS-1..4), schema error (422/403/409), or DOM contract.`,
                });
              }
            } else if (
              TRIVIAL_BOOL_MATCHERS.has(matcherName) &&
              actualNode.type === "Literal"
            ) {
              const actualText = sourceCode.getText(actualNode).trim();
              context.report({
                node,
                message: `Tautological literal assertion 'expect(${actualText}).${matcherName}()' is forbidden. Remediation: assert behavioral output from a real reducer, API contract, or rendered component.`,
              });
            }
          },
        };
      },
    },
  },
};

const IMPERATIVE_TIMER_SELECTORS = [
  {
    selector:
      "CallExpression[callee.name=/^(setTimeout|setInterval|requestAnimationFrame)$/]",
    message:
      "Imperative timer API forbidden here. Remediation: use CSS transitions/onAnimationEnd for transient UI feedback, useLayoutEffect + ResizeObserver for DOM measurements, or encapsulate legitimate polling inside a dedicated hook in lib/hooks/.",
  },
  {
    selector:
      "CallExpression[callee.object.name='window'][callee.property.name=/^(setTimeout|setInterval|requestAnimationFrame)$/]",
    message:
      "Imperative window timer API forbidden here. Remediation: use declarative CSS animations/transitions, reducer state transitions, or a dedicated hook in lib/hooks/.",
  },
];

/**
 * Legacy Debt Ratchet Allowlist (71 grandfathered files; down from 77 in v1 after pulling
 * app/kpis/page.tsx, app/roadmaps/page.tsx, DagCanvasView.tsx, ExecutionPyramidView.tsx,
 * TacticalDossierModal.tsx, and MissionFlowNavigatorModal.tsx). Whenever touching any file
 * below, extract subcomponents/hooks <350 lines and remove the refactored file from this list.
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
  "app/life-ops/page.tsx",
  "app/macro-ops/page.tsx",
  "app/marketing-agent/page.tsx",
  "app/mindset/page.tsx",
  "app/org-chart/page.tsx",
  "app/resources/page.tsx",
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
  "components/pms/PmsHierarchySidebar.tsx",
  "components/pms/TaskDetailModal.tsx",
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
      "playwright-report/**",
      "test-results/**",
      "*.js",
      "next-env.d.ts",
    ],
  },

  ...compat.extends("next/core-web-vitals"),

  {
    files: ["**/*.ts", "**/*.tsx"],
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: "error",
    },
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
        { type: "feature", pattern: "features/*/**", capture: ["featureName"] },
        { type: "feature-barrel", pattern: "features/*/index.ts", capture: ["featureName"] },
        { type: "shared", pattern: "shared/**/*" },
        { type: "services", pattern: "services/**/*" },
        { type: "lib", pattern: "lib/**/*" },
      ],
    },
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "react-hooks/exhaustive-deps": "warn",

      "max-lines": [
        "error",
        {
          max: 350,
          skipBlankLines: true,
          skipComments: true,
        },
      ],

      "chairman/no-narrated-comments": "error",
      "chairman/no-suppression-escapes": "error",

      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: ["feature"],
              disallow: [["feature", { featureName: "!${from.featureName}" }]],
              message:
                "Cross-Feature Internal Import Forbidden: features/${from.featureName} cannot import internal files of a sibling feature. Remediation: export the needed symbol from features/<sibling>/index.ts and import via '@features/<sibling>'.",
            },
            {
              from: ["shared"],
              disallow: ["feature", "feature-barrel"],
              message:
                "Shared Layer Purity Violation: shared/** primitives must remain domain-agnostic and cannot depend on features/**. Remediation: pass domain data via props/callbacks or move the component into features/<slug>/components/.",
            },
          ],
        },
      ],

      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@features/*/*", "@/features/*/*"],
              message:
                "Deep Feature Import Forbidden: never import internal paths under features/<slug>/*. Remediation: export the public contract from 'features/<slug>/index.ts' and import from '@features/<slug>'.",
            },
          ],
        },
      ],
    },
  },

  // Data-Layer Isolation: UI Components & Client Pages cannot import Prisma, Supabase, or API Routes
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
                "Data-Layer Isolation Violation: UI components/pages cannot import '@prisma/client'. Remediation: move database queries into 'services/<domain>Service.ts' and call via a Server Component, Server Action, or '/api/*' endpoint.",
            },
            {
              name: "@/lib/prisma",
              message:
                "Data-Layer Isolation Violation: UI components/pages cannot import '@/lib/prisma'. Remediation: create a server function in 'services/<domain>Service.ts' and invoke via Server Component or '/api/*'.",
            },
            {
              name: "@/lib/livingOsDb",
              message:
                "Data-Layer Isolation Violation: UI components/pages cannot import raw SQL helper '@/lib/livingOsDb'. Remediation: wrap SQL queries inside 'services/<domain>Service.ts' or an 'app/api/*/route.ts' handler.",
            },
            {
              name: "@supabase/supabase-js",
              message:
                "Data-Layer Isolation Violation: UI components/pages cannot instantiate raw Supabase clients. Remediation: move storage/DB logic into 'services/<domain>StorageService.ts' or '/api/*'.",
            },
          ],
          patterns: [
            {
              group: ["@features/*/*", "@/features/*/*"],
              message:
                "Deep Feature Import Forbidden: import exclusively from the public barrel '@features/<slug>' ('features/<slug>/index.ts').",
            },
            {
              group: ["@/app/api/**", "../api/**", "../../api/**"],
              message:
                "Server Route Leak Forbidden: UI files cannot import 'app/api/**' route handlers. Remediation: move shared DTO interfaces to 'lib/<domain>Types.ts' or 'features/<slug>/types.ts'.",
            },
          ],
        },
      ],
    },
  },

  // Anti-Footgun Tier for Modern Architecture (`features/**`, `shared/**`, `services/**`)
  {
    files: [
      "features/**/*.ts",
      "features/**/*.tsx",
      "shared/**/*.ts",
      "shared/**/*.tsx",
      "services/**/*.ts",
      "services/**/*.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='useEffect'] CallExpression[callee.name='fetch']",
          message:
            "Raw fetch() inside useEffect is forbidden in features/shared/services. Remediation: extract network I/O into 'services/<domain>ClientService.ts' and orchestrate via a dedicated hook in 'features/<slug>/hooks/' or a Server Component.",
        },
        ...IMPERATIVE_TIMER_SELECTORS,
      ],
    },
  },

  // Legacy `app/**` & `components/**` warning ratchet for raw useEffect fetch & imperative timers
  {
    files: ["app/**/page.tsx", "components/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "CallExpression[callee.name='useEffect'] CallExpression[callee.name='fetch']",
          message:
            "Legacy Warning: avoid raw fetch() inside useEffect. Extract typed fetch helpers to 'services/<domain>ClientService.ts' and state hooks to 'features/<slug>/hooks/'.",
        },
        ...IMPERATIVE_TIMER_SELECTORS,
      ],
    },
  },

  // Legacy Debt Ratchet Override: warn on remaining grandfathered >350-line files; error on all others
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

  // Anti-Tautology Test Enforcement (`tests/**/*.{ts,tsx}` — v3.2 Masterclass Guardrail)
  {
    files: ["tests/**/*.ts", "tests/**/*.tsx"],
    rules: {
      "chairman/no-tautological-tests": "error",
      "chairman/no-suppression-escapes": "error",
      "chairman/no-narrated-comments": "error",
      "max-lines": "off",
      "react-hooks/rules-of-hooks": "off",
    },
  },
];

export default config;

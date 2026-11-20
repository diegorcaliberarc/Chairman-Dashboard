# Canonical State-Chart Templates — Chairman Dashboard

Use these `stateDiagram-v2` patterns when authoring Before/After state charts in `walkthrough.md`.

## 1. Strategic Roadmap (`/roadmaps`) Canonical State Machine

```mermaid
stateDiagram-v2
  [*] --> DAG_VIEW

  state "Primary Workspace View" as Workspace {
    DAG_VIEW --> PYRAMID_VIEW : click roadmap-view-toggle-pyramid
    PYRAMID_VIEW --> DAG_VIEW : click roadmap-view-toggle-dag
  }

  state "Overlay & Modal Stack (Exclusive Discriminated Union)" as ModalStack {
    MODAL_IDLE --> DRAWER_INSPECTING : click dag-node-* or pyramid-panel-*
    DRAWER_INSPECTING --> MODAL_IDLE : click pardo-fmea-close-btn
    MODAL_IDLE --> DWY_INTERVIEW_OPEN : mode=DWY + launch interview
    DWY_INTERVIEW_OPEN --> SYNTHESIZING_DAG : submit DWY answers
    MODAL_IDLE --> DIY_BUILDER_OPEN : mode=DIY + open builder
    DIY_BUILDER_OPEN --> MODAL_IDLE : save node or close
  }

  state "Async Synthesis Lifecycle (Single-Flight)" as Synthesis {
    SYNTH_IDLE --> SYNTHESIZING_DAG : click roadmap-synthesize-dag-btn or copilot-generate-dag-btn
    SYNTHESIZING_DAG --> SYNTH_IDLE : API 200 tree hydrated (revalidates selectedNodeId)
    SYNTHESIZING_DAG --> ERROR_RECOVERY : API error / deterministic fallback toast
    ERROR_RECOVERY --> SYNTH_IDLE : dismiss or next user action
  }

  state "Backward Chain Trace Banner" as Trace {
    TRACE_CLOSED --> BACKWARD_CHAIN_OPEN : click roadmap-backward-chain-btn
    BACKWARD_CHAIN_OPEN --> TRACE_CLOSED : click roadmap-backward-chain-close-btn or toggle
  }
```

## 2. Master Calendar (`/calendar`) Engine & Horizon State Machine

```mermaid
stateDiagram-v2
  [*] --> SOLAR_DAY_WHEEL

  state "Solar Arc Engine (engineMode = solar)" as SolarEngine {
    SOLAR_DAY_WHEEL --> SOLAR_GEOSPATIAL_3D : dayMode = GEOSPATIAL_3D
    SOLAR_GEOSPATIAL_3D --> SOLAR_DAY_WHEEL : dayMode = SOLAR_WHEEL
    SOLAR_DAY_WHEEL --> SOLAR_WEEK_RADIAL : horizon = WEEK
    SOLAR_WEEK_RADIAL --> SOLAR_MONTH_RADIAL : horizon = MONTH
    SOLAR_MONTH_RADIAL --> SOLAR_YEAR_RADIAL : horizon = YEAR
    SOLAR_YEAR_RADIAL --> SOLAR_DAY_WHEEL : horizon = DAY
  }

  state "Google Calendar Engine (engineMode = google)" as GoogleEngine {
    GCAL_MONTH --> GCAL_DAY : view = day
    GCAL_DAY --> GCAL_FOUR_DAY : view = four_day
    GCAL_FOUR_DAY --> GCAL_YEAR : view = year
    GCAL_YEAR --> GCAL_SCHEDULE : view = schedule
    GCAL_SCHEDULE --> GCAL_MONTH : view = month
  }

  SolarEngine --> GoogleEngine : click calendar-engine-google (preserves selectedDate ISO)
  GoogleEngine --> SolarEngine : click calendar-engine-solar (preserves selectedDate ISO)
```

## 3. Guided Mission Flow Navigator (`MissionFlowNavigatorModal`)

```mermaid
stateDiagram-v2
  [*] --> CLOSED
  CLOSED --> STAGE_1_IGNITION : click sidebar-guided-mission-btn
  STAGE_1_IGNITION --> STAGE_2_SOCRATIC : mission title + pillar valid
  STAGE_2_SOCRATIC --> STAGE_3_RESEARCH : Socratic answers captured
  STAGE_3_RESEARCH --> STAGE_4_STRATEGY : research grounded
  STAGE_4_STRATEGY --> STAGE_5_TACTICAL_DAG : strategy selected
  STAGE_5_TACTICAL_DAG --> STAGE_6_REVIEW_DEPLOY : WBS + schedule verified
  STAGE_6_REVIEW_DEPLOY --> DEPLOYING_MISSION : click deploy mission
  DEPLOYING_MISSION --> CLOSED : dispatches chairman:mission-deployed
  STAGE_1_IGNITION --> CLOSED : click close
```

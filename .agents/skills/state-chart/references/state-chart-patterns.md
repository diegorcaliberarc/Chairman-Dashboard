# Canonical State-Chart Templates — Chairman Dashboard v3.0

## 1. Strategic Roadmap (`/roadmaps`) State Machine

```mermaid
stateDiagram-v2
  [*] --> DAG_VIEW

  state "Primary Workspace View" as Workspace {
    DAG_VIEW --> PYRAMID_VIEW : click roadmap-view-toggle-pyramid
    PYRAMID_VIEW --> DAG_VIEW : click roadmap-view-toggle-dag
  }

  state "Exclusive Modal Union (activeModal)" as ModalStack {
    MODAL_IDLE --> DRAWER_INSPECTING : click dag-node-* or pyramid-panel-*
    DRAWER_INSPECTING --> MODAL_IDLE : click pardo-fmea-close-btn
    MODAL_IDLE --> DWY_INTERVIEW_OPEN : click copilot-dwy-launch-btn
    DWY_INTERVIEW_OPEN --> SYNTHESIZING_DAG : submit DWY answers
    MODAL_IDLE --> DIY_BUILDER_OPEN : click copilot-diy-open-btn
    DIY_BUILDER_OPEN --> MODAL_IDLE : ADD_MANUAL_NODE or close
  }

  state "Single-Flight Synthesis Lifecycle" as Synthesis {
    SYNTH_IDLE --> SYNTHESIZING_DAG : click roadmap-synthesize-dag-btn or copilot-generate-dag-btn
    SYNTHESIZING_DAG --> SYNTH_IDLE : SYNTHESIZE_SUCCESS (revalidates activeModal)
    SYNTHESIZING_DAG --> ERROR_RECOVERY : SYNTHESIZE_ERROR
    ERROR_RECOVERY --> SYNTH_IDLE : next user dispatch
  }
```

## 2. Guided Mission Flow Navigator (`MissionFlowNavigatorModal` 6-Stage Reducer)

```mermaid
stateDiagram-v2
  [*] --> STAGE_0_OOCEMR
  STAGE_0_OOCEMR --> STAGE_1_END_STATE : click mission-next-stage-btn or mission-skip-stage0-btn or RUN_DFY
  STAGE_1_END_STATE --> STAGE_2_WBS_100 : click mission-next-stage-btn
  STAGE_2_WBS_100 --> STAGE_3_BOM_CPM : click mission-next-stage-btn
  STAGE_3_BOM_CPM --> STAGE_4_FRAGO_DEPLOY : click mission-next-stage-btn
  STAGE_4_FRAGO_DEPLOY --> STAGE_1_END_STATE : DEPLOY_REJECT_MISSING_TITLE
  STAGE_4_FRAGO_DEPLOY --> DEPLOYING : click mission-deploy-btn (title valid, asyncPhase = IDLE)
  DEPLOYING --> STAGE_5_HUD_AAR : DEPLOY_SUCCESS (dispatches chairman:mission-deployed)
  STAGE_5_HUD_AAR --> SAVING_AAR : submit mission-aar-form
  SAVING_AAR --> STAGE_5_HUD_AAR : SAVE_AAR_SUCCESS
```

## 3. Zero-Trust Pod Consent & RBAC Governance Lifecycle

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> PENDING_REVIEW : SUBMIT_FOR_REVIEW (role != DEPENDENT)
  PENDING_REVIEW --> ACTIVE_GRANT : APPROVE_GRANT (role in OWNER, ADMIN)
  ACTIVE_GRANT --> RESTRICTED : RESTRICT_SCOPE (role in OWNER, ADMIN)
  RESTRICTED --> ACTIVE_GRANT : APPROVE_GRANT (role in OWNER, ADMIN)
  PENDING_REVIEW --> REVOKED : REVOKE_GRANT (role in OWNER, ADMIN)
  ACTIVE_GRANT --> REVOKED : REVOKE_GRANT (role in OWNER, ADMIN)
  RESTRICTED --> REVOKED : REVOKE_GRANT (role in OWNER, ADMIN)
  REVOKED --> DRAFT : REOPEN_DRAFT (role in OWNER, ADMIN)
```

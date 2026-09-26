# Agent Governance Policy Drafter, Module 5

*Session: 26 September 2026. This is the Governance Policy Drafter tool for Module 5.
Trak's own policy is in
[compounding-system.md, Governance Policy](compounding-system.md#governance-policy), and its agents
are in [Agent Topology](compounding-system.md#agent-topology). This file keeps the worked example.*

---

## Worked example, as provided

*SupportCopilot v1.2, a customer-support copilot. It is what the drafter's worked-example
loader fills in. The text below is the loader's output, unedited.*

<!-- Governance Policy, SupportCopilot v1.2 -->

## Governance Policy

**Scope:** AI features in the SupportCopilot product line, automated reply drafting, routing, and resolution scoring. Excludes: Internal-only analytics dashboards (covered by separate data-team policy).

**Autonomy boundaries:** Drafting automated replies, auto. Sending replies under $0 risk (FAQ, account info), auto. Sending replies with promised remedies (refunds, credits, escalations), even if confidence > 95%, human approval required. Closing tickets without reply, never auto.

**Escalation triggers:** (1) Confidence < 70% on response. (2) Customer message flagged legal, medical, or distressed. (3) Any reply mentioning refund, credit, or policy exception. (4) Customer requests human contact. (5) Three or more turns in a single conversation.

**Audit cadence:** Weekly, Automated eval against golden dataset (PM: Sam). Monthly, Human review of 50 random conversations + all escalation cases (Legal: Priya). Quarterly, Full policy review with security + legal (CTO sign-off).

**Regulatory exposure (EU AI Act / other):** EU AI Act, GDPR, SOC 2. Risk tier: limited. Controls: Data minimization in prompts · No training on customer PII · SOC 2 log retention controls in place · DPIA on file..

## Agent Topology

_Not shipping agents this version._

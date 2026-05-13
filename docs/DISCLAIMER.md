# SignalGrid Disclaimer

SignalGrid is an MVP-stage product and this repository contains demo, simulation, validation, and production-readiness materials. Use the guidance below when reviewing, demonstrating, or deploying the project.

## Demo and simulation scope

- Demo outputs are simulated unless the environment is explicitly configured and documented to use live customer systems.
- Demo personas, badge events, device posture, locations, policy responses, downstream actions, and integration responses are representative examples for validation and storytelling.
- Demo flows must not be treated as evidence that a specific customer integration, enforcement action, or production security control is active.

## Commercial and deployment status

- SignalGrid is MVP/pre-commercial unless it is deployed under a signed pilot, proof-of-concept, or production agreement.
- A signed pilot or deployment agreement should define environment boundaries, customer systems, data handling, security responsibilities, operational support, success criteria, and rollback procedures.
- Production operation requires the release gates, security controls, and runbook steps documented in this repository to be validated for the target environment.

## Relationship to existing enterprise systems

- SignalGrid does **not** replace IAM, UEM/MDM, DEX, NAC, SIEM, ITSM, endpoint security, or customer system-of-record platforms.
- SignalGrid is intended to orchestrate runtime trust decisions and downstream actions using signals and controls from those systems.
- Customers remain responsible for configuring and operating their identity, device-management, endpoint, network, observability, and compliance systems.

## Data and secrets warning

- Do **not** enter real customer secrets, production credentials, regulated data, patient data, employee records, or other sensitive production data into demo flows.
- Do not reuse demo secrets in staging, pilot, or production environments.
- Review generated reports, screenshots, logs, and exported demo artifacts before sharing externally.

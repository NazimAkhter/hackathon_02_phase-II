# Implementation Plan: Fix Hugging Face Space Deployment Authentication

**Branch**: `001-hf-deployment-fix` | **Date**: 2026-02-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-hf-deployment-fix/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Fix GitHub Actions workflow to successfully deploy backend to Hugging Face Spaces by resolving CLI installation, authentication, and git push errors. The workflow will install huggingface_hub, authenticate using HF_TOKEN secret, sync backend files, and push to the Space repository using HTTPS with token-based authentication.

## Technical Context

**Language/Version**: YAML (GitHub Actions workflow syntax v2), Python 3.11+ (for huggingface_hub CLI)
**Primary Dependencies**: huggingface_hub (Python package), git, GitHub Actions ubuntu-latest runner
**Storage**: N/A (CI/CD infrastructure, no persistent storage)
**Testing**: GitHub Actions workflow execution logs, deployment success verification
**Target Platform**: GitHub Actions runners (ubuntu-latest), Hugging Face Spaces (deployment target)
**Project Type**: CI/CD workflow (infrastructure automation)
**Performance Goals**: Complete deployment within 5 minutes of push to main branch
**Constraints**: Must use HF_TOKEN secret from GitHub repository secrets, must authenticate before git operations, must handle network failures gracefully
**Scale/Scope**: Single repository deployment to single Hugging Face Space, triggered on push to main branch

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Applicable Principles

**I. Agentic Development Workflow** - ✅ COMPLIANT
- This plan follows `/sp.specify` → `/sp.plan` → `/sp.tasks` workflow
- All changes will be generated through Claude Code agents
- ADRs will be created for significant decisions (authentication method, deployment strategy)

**II. Security-First Architecture** - ✅ COMPLIANT
- HF_TOKEN stored as GitHub repository secret (encrypted at rest)
- Token never exposed in logs or workflow output
- HTTPS-only communication with Hugging Face APIs
- Token permissions validated before deployment

**III. RESTful API Design Standards** - ⚠️ NOT APPLICABLE
- This feature is CI/CD infrastructure, not API development
- No API endpoints being created or modified

**IV. Stateless JWT Authentication** - ⚠️ NOT APPLICABLE
- This feature uses Hugging Face token authentication, not JWT
- No user authentication flow involved

**V. Multi-User Persistent Storage** - ⚠️ NOT APPLICABLE
- This feature is deployment automation, not data storage
- No database operations involved

### Technology Stack Compliance

**Development Tools** - ✅ COMPLIANT
- Claude Code used for all code generation
- Spec-Kit Plus workflow followed
- Git for version control

**Prohibited Technologies** - ✅ COMPLIANT
- No manual coding (all via Claude Code)
- No prohibited technologies used

### Security Gates

- ✅ Secrets stored in GitHub repository secrets (encrypted)
- ✅ Token never hardcoded in workflow file
- ✅ HTTPS-only communication
- ✅ Token permissions validated
- ✅ Error messages don't expose sensitive information

### Verdict

**PASS** - All applicable constitution principles are satisfied. Non-applicable principles (API design, JWT auth, database) are correctly excluded as this is infrastructure work, not application development.

## Project Structure

### Documentation (this feature)

```text
specs/001-hf-deployment-fix/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output - authentication & deployment strategy research
├── data-model.md        # Phase 1 output - workflow state model
├── quickstart.md        # Phase 1 output - deployment setup guide
├── contracts/           # Phase 1 output - workflow interface contracts
│   └── workflow-contract.yml  # GitHub Actions workflow interface
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
.github/
└── workflows/
    └── deploy-backend.yml    # GitHub Actions workflow (MODIFIED)

backend/                      # Backend source code (SYNCED to HF Space)
├── src/
│   ├── models/
│   ├── services/
│   └── api/
├── requirements.txt
└── README.md

.env.example                  # Environment variable template (REFERENCE)
```

**Structure Decision**: This is a CI/CD infrastructure fix targeting the existing GitHub Actions workflow at `.github/workflows/deploy-backend.yml`. The workflow will be modified to properly install huggingface_hub CLI, authenticate using HF_TOKEN, and push backend files to the Hugging Face Space repository. No new directories are created; only the existing workflow file is modified.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. This section is intentionally empty as all constitution checks passed.

---

## Phase 0: Research Summary

**Status**: ✅ COMPLETED

**Artifacts Created**:
- `research.md` - Architectural decisions for authentication, sync strategy, and workflow execution

**Key Decisions Documented**:
1. **Authentication Method**: HTTPS + Token (not SSH) - simpler, more secure for CI/CD
2. **Login Approach**: huggingface-cli login (not token-in-URL) - prevents token exposure in logs
3. **File Sync Strategy**: Direct git push with rsync (not git subtree) - maintains git history, triggers Space rebuild
4. **Workflow Execution**: Sequential step-by-step phases with fail-fast behavior

**Unknowns Resolved**: All technical clarifications addressed through research

---

## Phase 1: Design Summary

**Status**: ✅ COMPLETED

**Artifacts Created**:
- `data-model.md` - Workflow state entities and transitions
- `contracts/workflow-contract.md` - GitHub Actions workflow interface specification
- `quickstart.md` - Setup and troubleshooting guide

**Key Design Elements**:
1. **Workflow State Model**: 5 entities (Configuration, Execution State, File Sync Manifest, Git Commit Metadata, Deployment Result)
2. **Workflow Contract**: 10 sequential steps with clear inputs/outputs/success criteria
3. **Error Handling**: Fail-fast with descriptive error messages for each failure mode
4. **Performance**: Target 2-3 minutes, maximum 5 minutes

**Agent Context Updated**: ✅ CLAUDE.md updated with GitHub Actions, huggingface_hub, and CI/CD technologies

---

## Constitution Check (Post-Design Re-evaluation)

**Status**: ✅ PASS (no changes from initial evaluation)

All applicable principles remain satisfied after design phase:
- ✅ Agentic Development Workflow followed
- ✅ Security-First Architecture (secrets encrypted, HTTPS-only)
- ✅ No constitution violations introduced during design

---

## Implementation Approach

### Workflow Modification Strategy

**Target File**: `.github/workflows/deploy-backend.yml`

**Modification Type**: Complete rewrite of deployment job

**Key Changes**:
1. Add Python setup step (for huggingface_hub installation)
2. Add CLI installation step with verification
3. Add authentication step using HF_TOKEN secret
4. Replace broken push command with proper git workflow (clone → rsync → commit → push)
5. Add validation steps after each critical operation
6. Add clear error messages and status reporting

### Testing Strategy

**Pre-Implementation Testing**:
- Verify HF_TOKEN secret is configured in GitHub
- Verify Space repository exists and is accessible
- Verify backend directory structure matches expectations

**Post-Implementation Testing**:
1. Trigger workflow manually (workflow_dispatch)
2. Verify each step completes successfully
3. Check Space repository shows new commit
4. Verify Space rebuilds automatically
5. Confirm workflow completes in under 5 minutes

**Acceptance Criteria** (from spec):
- ✅ Workflow installs huggingface-cli without errors
- ✅ Authentication succeeds using HF_TOKEN
- ✅ Backend files sync to Space without errors
- ✅ Git push completes successfully
- ✅ Space shows updated backend code

---

## Risk Analysis

### High-Priority Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Invalid HF_TOKEN | Medium | High | Add token validation step with clear error message |
| Network timeout during push | Low | Medium | Add retry logic or manual re-run instructions |
| Space repository locked | Low | High | Check Space status before deployment, add error handling |
| Backend directory not found | Low | High | Add directory existence check before rsync |

### Medium-Priority Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Workflow exceeds 5-minute target | Low | Low | Add performance optimizations (caching, shallow clone) |
| Token permissions insufficient | Medium | Medium | Document required permissions in quickstart guide |
| Merge conflicts in Space repo | Very Low | Medium | Use rsync --delete to ensure exact mirror |

### Low-Priority Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Space doesn't rebuild after push | Very Low | Low | Document manual rebuild procedure |
| Git user configuration fails | Very Low | Low | Use default github-actions[bot] user |

---

## Architectural Decision Records (ADRs)

The following architectural decisions should be documented with `/sp.adr`:

### ADR 1: HTTPS Token Authentication vs SSH Keys
**Decision**: Use HTTPS with token authentication
**Rationale**: Simpler setup, better CI/CD integration, easier token rotation
**Alternatives**: SSH keys (rejected due to complexity)

### ADR 2: huggingface-cli login vs Token-in-URL
**Decision**: Use huggingface-cli login command
**Rationale**: Prevents token exposure in logs and command history
**Alternatives**: Embed token in git URL (rejected due to security risk)

### ADR 3: Direct Git Push vs rsync/API Upload
**Decision**: Use direct git push with rsync for file copy
**Rationale**: Maintains git history, triggers Space rebuild, simplest approach
**Alternatives**: rsync over SSH (rejected - no git history), Hugging Face API (rejected - more complex)

**Recommendation**: Run `/sp.adr "HTTPS Token Authentication for Hugging Face Deployment"` after implementation to document these decisions formally.

---

## Dependencies and Prerequisites

### External Dependencies
- GitHub Actions (ubuntu-latest runner)
- Python 3.11+ (pre-installed on runner)
- pip package manager (pre-installed)
- git (pre-installed on runner)
- huggingface_hub Python package (installed via pip)

### Configuration Dependencies
- `HF_TOKEN` secret in GitHub repository secrets
- Hugging Face Space repository exists and is accessible
- Backend directory exists in repository
- Token has write permissions to Space

### No Breaking Changes
- Existing backend code unchanged
- No database migrations required
- No API contract changes
- No frontend modifications needed

---

## Performance Targets

### Workflow Execution Time

| Phase | Target | Maximum | Optimization |
|-------|--------|---------|--------------|
| Setup (checkout, Python) | 30s | 1m | Use actions/cache for pip packages |
| CLI Installation | 30s | 1m | Cache pip packages between runs |
| Authentication | 5s | 15s | None needed (API call) |
| Clone Space Repo | 20s | 1m | Use --depth 1 for shallow clone |
| Sync Files | 30s | 2m | rsync is already efficient |
| Commit Changes | 5s | 15s | None needed (local operation) |
| Push to Space | 30s | 1m | None needed (network operation) |
| **Total** | **2m 30s** | **5m** | Caching + shallow clone |

### Success Metrics
- ✅ 100% of deployments complete within 5 minutes
- ✅ Zero authentication failures with valid token
- ✅ Zero manual interventions required
- ✅ Clear error messages for all failure modes

---

## Next Steps

### Immediate Actions (Phase 2)
1. Run `/sp.tasks` to generate implementation tasks from this plan
2. Tasks will be broken down by workflow step (install, auth, sync, push)
3. Each task will include acceptance criteria and test cases

### Implementation Sequence
1. **Task 1**: Update workflow YAML with Python setup and CLI installation
2. **Task 2**: Add authentication step with HF_TOKEN
3. **Task 3**: Implement file sync with rsync
4. **Task 4**: Add git commit and push steps
5. **Task 5**: Add validation and error reporting
6. **Task 6**: Test complete workflow end-to-end

### Post-Implementation
1. Create ADRs for key architectural decisions
2. Monitor first few deployments for issues
3. Update quickstart guide based on real-world usage
4. Consider adding performance optimizations if needed

---

## Appendix: Related Documentation

- **Feature Specification**: [spec.md](./spec.md)
- **Research Findings**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Workflow Contract**: [contracts/workflow-contract.md](./contracts/workflow-contract.md)
- **Setup Guide**: [quickstart.md](./quickstart.md)

---

**Plan Status**: ✅ COMPLETE - Ready for `/sp.tasks` command
**Last Updated**: 2026-02-10
**Next Command**: `/sp.tasks` to generate implementation tasks

# Climate Map Credibility Backlog

This backlog converts the roadmap into executable tickets for the repository.

## Delivery Principles
- Every displayed metric must include source, year, method, and license.
- No manual edits to published GeoJSON values.
- Every release requires data QA pass + reviewer sign-off.

## Team Roles
- Product Owner (PO): Scope and claim decisions.
- Data Engineer (DE): ETL, schema, quality checks.
- GIS Analyst (GIS): Boundaries, spatial joins, geospatial QA.
- Frontend Engineer (FE): Metadata UI, confidence badges, disclaimers.
- Reviewer (REV): Domain validation and release approval.

## Ticket Backlog

### Epic A: Scope and Data Governance

#### CLM-001 Define geographic scope and indicator dictionary
- Owner: PO
- Estimate: 0.5 day
- Priority: P0
- Depends on: None
- Deliverables:
  - Scope statement (KRG-only or KRG+adjacent governorates).
  - Indicator dictionary for `droughtRisk`, `tempIncrease`, `desertification`.
  - Claim policy for map text and popups.
- Acceptance Criteria:
  - Single approved document exists in repo (`docs/scope-and-indicators.md`).
  - Each indicator has explicit definition, unit, and valid range.

#### CLM-002 Create source registry with licensing
- Owner: DE
- Estimate: 1 day
- Priority: P0
- Depends on: CLM-001
- Deliverables:
  - Source registry table with URL, provider, temporal coverage, spatial resolution, license, and usage notes.
  - Candidate sources: World Bank CCKP, FAO AQUASTAT, IPCC-linked datasets, boundary source.
- Acceptance Criteria:
  - Registry file exists (`data/sources/registry.csv`).
  - All selected datasets have non-empty license and citation fields.

### Epic B: Reproducible Data Pipeline

#### CLM-003 Create raw/staging/processed data folders
- Owner: DE
- Estimate: 0.5 day
- Priority: P0
- Depends on: CLM-002
- Deliverables:
  - Folder structure:
    - `data/raw/`
    - `data/staging/`
    - `data/processed/`
  - Readme for data handling rules.
- Acceptance Criteria:
  - Structure committed and documented.
  - Existing climate GeoJSON moved to processed area or archived as legacy.

#### CLM-004 Build boundary ingestion script
- Owner: GIS
- Estimate: 1 day
- Priority: P0
- Depends on: CLM-003
- Deliverables:
  - Script to import and normalize chosen boundary dataset.
  - Output standard fields: `admin_name`, `admin_code`, `geometry`.
- Acceptance Criteria:
  - Script runs without manual intervention.
  - Output saved in `data/staging/boundaries.geojson`.

#### CLM-005 Build climate metrics ETL script
- Owner: DE
- Estimate: 2 days
- Priority: P0
- Depends on: CLM-004
- Deliverables:
  - ETL script to ingest selected sources and compute map-ready metrics.
  - Explicit formulas and transforms for each metric.
  - Output in deterministic order.
- Acceptance Criteria:
  - One command rebuilds output from raw inputs.
  - Processed file generated in `data/processed/governorates_climate.geojson`.
  - No hardcoded indicator values in script.

#### CLM-006 Add reproducible run command and docs
- Owner: DE
- Estimate: 0.5 day
- Priority: P1
- Depends on: CLM-005
- Deliverables:
  - `npm` script(s) for build pipeline (for example `npm run data:build`).
  - `docs/data-pipeline.md` with prerequisites and expected outputs.
- Acceptance Criteria:
  - Fresh clone can reproduce processed output using documented command.

### Epic C: Data Quality and Validation

#### CLM-007 Add schema validation
- Owner: DE
- Estimate: 1 day
- Priority: P0
- Depends on: CLM-005
- Deliverables:
  - JSON schema for processed climate dataset.
  - Validation script that fails CI on invalid output.
- Acceptance Criteria:
  - Required fields validated: name, indicators, source metadata, year.
  - Build fails on missing or out-of-range values.

#### CLM-008 Add geospatial QA checks
- Owner: GIS
- Estimate: 1 day
- Priority: P0
- Depends on: CLM-004
- Deliverables:
  - Checks for valid polygons, duplicates, out-of-area geometries, and extreme simplification artifacts.
- Acceptance Criteria:
  - QA summary report generated in `reports/geospatial-qa.md`.
  - Any blocking issue returns non-zero exit code.

#### CLM-009 Add reasonableness and drift tests
- Owner: DE
- Estimate: 1 day
- Priority: P1
- Depends on: CLM-005
- Deliverables:
  - Test thresholds for impossible jumps and suspicious rank inversions.
- Acceptance Criteria:
  - Test suite flags abnormal changes between releases.
  - Baseline snapshot committed for comparison.

#### CLM-010 External review checklist
- Owner: REV
- Estimate: 0.5 day
- Priority: P1
- Depends on: CLM-007, CLM-008
- Deliverables:
  - Reviewer checklist for methodology and claims.
- Acceptance Criteria:
  - Signed checklist attached to release PR.

### Epic D: Product Trust UX

#### CLM-011 Add data provenance panel in UI
- Owner: FE
- Estimate: 1 day
- Priority: P0
- Depends on: CLM-002
- Deliverables:
  - Panel showing source, year, method, and license for current metric.
- Acceptance Criteria:
  - User can view provenance without leaving map page.
  - Links are clickable and match source registry.

#### CLM-012 Add confidence badges and uncertainty labels
- Owner: FE
- Estimate: 1 day
- Priority: P1
- Depends on: CLM-011
- Deliverables:
  - Quality labels: High, Medium, Low with rule definition.
- Acceptance Criteria:
  - Each displayed metric has visible confidence level.
  - Badge logic documented and reproducible.

#### CLM-013 Replace over-precise wording in popups
- Owner: FE
- Estimate: 0.5 day
- Priority: P0
- Depends on: CLM-001
- Deliverables:
  - Updated narrative text to avoid unsupported certainty.
  - Disclaimer banner where data is modeled/estimated.
- Acceptance Criteria:
  - No popup text implies measured certainty without source backing.

### Epic E: Release Governance

#### CLM-014 Add release template and changelog
- Owner: PO
- Estimate: 0.5 day
- Priority: P1
- Depends on: CLM-006, CLM-010
- Deliverables:
  - Release note template with data delta, source updates, and method changes.
  - Changelog section in README.
- Acceptance Criteria:
  - Every release includes completed template.

#### CLM-015 Add CI gate for data integrity
- Owner: DE
- Estimate: 1 day
- Priority: P0
- Depends on: CLM-007, CLM-008, CLM-009
- Deliverables:
  - CI workflow that runs ETL + validation + QA checks.
- Acceptance Criteria:
  - PR cannot merge when data checks fail.

## Implementation Sequence (Recommended)
1. CLM-001, CLM-002
2. CLM-003, CLM-004, CLM-005, CLM-006
3. CLM-007, CLM-008, CLM-009, CLM-010
4. CLM-011, CLM-012, CLM-013
5. CLM-014, CLM-015

## Sprint Plan

### Sprint 1 (Week 1)
- Goal: Governance and source readiness.
- Tickets: CLM-001, CLM-002, CLM-003.
- Exit Criteria:
  - Approved definitions and source registry exist.
  - Data folder structure committed.

### Sprint 2 (Week 2)
- Goal: Reproducible ETL v1.
- Tickets: CLM-004, CLM-005, CLM-006.
- Exit Criteria:
  - `data:build` command generates processed climate GeoJSON from raw sources.

### Sprint 3 (Week 3)
- Goal: Quality gates and reviewer workflow.
- Tickets: CLM-007, CLM-008, CLM-009, CLM-010.
- Exit Criteria:
  - Validation and QA reports generated automatically.

### Sprint 4 (Week 4)
- Goal: Trust-focused product UX.
- Tickets: CLM-011, CLM-012, CLM-013.
- Exit Criteria:
  - Map shows provenance and confidence labels.

### Sprint 5 (Week 5)
- Goal: Release governance and merge protection.
- Tickets: CLM-014, CLM-015.
- Exit Criteria:
  - CI blocks unverified data releases.

## Definition of Done (Global)
- Data values in production are generated, not hand-entered.
- Every indicator is linked to source + year + method + license.
- Validation and geospatial QA pass in CI.
- UI communicates uncertainty and avoids unsupported certainty.
- Release notes include data and method deltas.

## Risks and Mitigations
- Risk: Source coverage gaps at governorate level.
  - Mitigation: Use transparent proxy methodology and confidence downgrade.
- Risk: Boundary disputes affecting interpretation.
  - Mitigation: Publish explicit scope policy and boundary source note.
- Risk: Manual edits reintroduced.
  - Mitigation: CI check compares processed output hash against pipeline output.
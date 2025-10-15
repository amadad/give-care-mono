# Medicare Reimbursement Implementation Roadmap

**Version**: 1.0.0
**Last Updated**: 2025-10-10
**Purpose**: Step-by-step guide to qualify GiveCare for Medicare CHI, PIN, and Caregiver Training billing
**Status**: Planning - Legal Review Required

---

## Executive Summary

This document provides a detailed roadmap for positioning GiveCare (or an affiliated entity) to participate in Medicare reimbursement for:
- **Community Health Integration (CHI)** - G0019/G0022
- **Principal Illness Navigation (PIN)** - G0023/G0024/G0140/G0146
- **Caregiver Training Services (CTS)** - G0541/G0542/G0543

**CRITICAL DISCLAIMER**: This is a roadmap based on CMS guidance, not final legal/regulatory advice. Always validate with CMS, your Medicare Administrative Contractor (MAC), and compliance counsel before implementing.

**Recommended Approach**: **Model 1 - Documentation Support Tool** (lowest risk, fastest implementation)

---

## Part 1: Typical Reimbursements & Payment Amounts

### 1.1 Community Health Integration (CHI) — G0019 / G0022

**National Average Rates** (Non-Facility):
- **G0019** (first 60 minutes/month): **$77.95** (NACHC guide)
  - Range: $70-$90 depending on locality
- **G0022** (additional 30 minutes): **$48.52** (2025 rate)
  - Range: $40-$60 depending on locality

**Payment Structure**:
- Medicare pays 80% of allowable amount
- Patient/secondary payer pays remaining 20% (coinsurance)
- Example: G0019 at $77.95 → Medicare pays $62.36, patient pays $15.59

**Locality Variations**:
- Geographic Practice Cost Indices (GPCI) adjust rates by region
- Facility vs non-facility distinction affects payment
- MAC-specific interpretations may vary

**Billing Frequency**:
- G0019: Once per calendar month (first 60 min)
- G0022: Multiple times if >90 min total (each 30-min increment beyond first 60 min)
- Only one provider may bill CHI per patient per month (no duplication)

---

### 1.2 Principal Illness Navigation (PIN / PIN-PS) — G0023 / G0024 / G0140 / G0146

**National Average Rates** (Locality-Dependent):
- **G0023** (first 60 minutes/month): **$77-90** (estimated range, MAC-specific)
- **G0024** (additional 30 minutes): **~$40** (estimated)
- **G0140** (PIN-Peer Support, 60 min): **Varies by locality**
- **G0146** (PIN-PS additional 30 min): **~$33.82** (Florida example)

**Payment Structure**:
- Based on Medicare Physician Fee Schedule (PFS)
- CY 2024/2025 PFS established valuation
- Less standardized than CHI (newer codes, 2024+)
- Local MAC/carrier schedules show specific amounts

**Billing Frequency**:
- G0023: Once per calendar month (first 60 min)
- G0024: Multiple times if >90 min total
- G0140/G0146: Cannot bill PIN and PIN-PS concurrently for same condition in same month
- Requires initiating visit by billing practitioner before PIN services start

---

### 1.3 Caregiver Training Services (CTS) — G0541 / G0542 / G0543

**National Average Rates** (Provisional, New for 2025):
- **G0541** (caregiver training, first 30 min, in-person): **$30-80 estimated** (locality-dependent)
- **G0542** (additional 15-minute increments): **Lower rate** (exact amount TBD by MACs)
- **G0543** (group caregiver training, 2-4 caregivers, 30 min): **TBD**
- **CPT 96202/96203** (multiple-family group behavior management): **PFS-based**

**Payment Structure**:
- New codes starting January 1, 2025
- Added to telehealth services list (provisional basis)
- Actual payments depend on MAC implementation
- Limited published benchmarks available yet

**Billing Requirements**:
- Training provided to caregivers **without patient present**
- Must teach direct care skills (wound care, mobility, medication management)
- Time-based billing in 30-minute or 15-minute increments
- Must document full time units (no partial billing)

---

### 1.4 Transitional Care Management (TCM) — CPT 99495 / 99496

**National Average Rates**:
- **CPT 99495** (moderate complexity, face-to-face visit within 14 days): **$201.20**
- **CPT 99496** (high complexity, face-to-face visit within 7 days): **$272.68**

**Payment Structure**:
- Medicare pays 80% of allowable
- Requires interactive contact with patient/caregiver within 2 business days of discharge
- Face-to-face visit by qualified practitioner within 7 or 14 days
- Medication reconciliation required

**GiveCare Role**:
- **Documentation support** for TCM billing
- SMS contact qualifies as "interactive digital communication"
- Time tracking for care coordination activities
- **Cannot bill TCM directly** (provider must complete face-to-face visit)

---

### 1.5 Summary Reimbursement Ranges (Order of Magnitude)

| Code | Service | First Hour | Additional 30 Min | Notes |
|------|---------|------------|-------------------|-------|
| **G0019/G0022** | CHI (SDOH) | $70-90 | $40-60 | Well-established, 2025 rates known |
| **G0023/G0024** | PIN (navigation) | $77-90 | ~$40 | Newer (2024+), MAC-specific |
| **G0140/G0146** | PIN-PS (peer support) | Varies | $30-40 | Behavioral health focus |
| **G0541/G0542** | Caregiver training | $30-80 | $15-40 | New 2025, provisional rates |
| **CPT 99495/99496** | TCM (post-discharge) | $201-273 | N/A | Established, widely used |

**Important Notes**:
- Medicare PFS conversion factor reduced 2.93% in 2025 (downward reimbursement pressure)
- All rates subject to locality adjustments (GPCI)
- Medicare pays 80%, patient/secondary pays 20% (unless Medicaid dual-eligible)

---

## Part 2: Eligibility Requirements & Constraints

### 2.1 Core Requirements (All Codes)

| Requirement | Description | Compliance Risk |
|-------------|-------------|-----------------|
| **Enrolled Medicare Billing Provider** | Entity submitting claims must be enrolled in Medicare with valid NPI and correct provider type (physician, NP, PA) | **HIGH** - False Claims Act if billing without enrollment |
| **"Incident To" Rules** | Services delivered by non-physician auxiliary staff (CHWs, navigators) under general supervision of billing clinician | **HIGH** - Medicare denials if supervision inadequate |
| **Initiating Visit** | For CHI/PIN, qualifying visit (E/M, AWV, TCM) must document need for services before starting | **HIGH** - Claims denied if no initiating visit |
| **Documentation** | Detailed records of need, care plan, services delivered, time tracking, outcomes | **MEDIUM** - Audits will scrutinize documentation |
| **Time Thresholds** | Must meet minimum durations (e.g., 60 min for G0019, 90 min before G0022) | **MEDIUM** - Partial time not billable |
| **Consent** | Verbal or written consent from patient/caregiver required (especially PIN) | **LOW** - Easy to obtain, document in chart |
| **Non-Duplication** | Cannot bill overlapping services for same time under multiple codes | **MEDIUM** - Requires careful time tracking |
| **MAC Locality Rules** | Each MAC may have specific interpretations, modifiers, coverage guidelines | **MEDIUM** - Varies by region |
| **Beneficiary Eligibility** | Patient must be Medicare beneficiary with qualifying condition (unmet SDOH, serious illness) | **LOW** - Clinical judgment determines eligibility |
| **Billing Setting** | Facility vs non-facility, home vs office affects reimbursement | **LOW** - Choose correct place of service code |

---

### 2.2 CHI-Specific Requirements (G0019 / G0022)

✅ **Eligible Activities**:
- Screening for social determinants of health (SDOH)
- Resource navigation (food banks, housing, transportation)
- Assistance with applications (SNAP, Medicaid, utility assistance)
- Follow-up to ensure barriers addressed

⚠️ **Critical Requirements**:
- **Initiating visit** must document unmet SDOH that interfere with medical care
- **Treatment plan** created by billing practitioner
- **Certified/trained community health workers (CHWs)** deliver services under supervision
- **Minimum 60 minutes** per calendar month for G0019
- **Minimum 90 minutes total** before billing G0022 (first 60 + additional 30)
- **Only one provider** may bill CHI per patient per month

❌ **Does NOT Qualify**:
- AI-only services without human CHW involvement
- Services not addressing documented SDOH barriers
- Activities unrelated to healthcare access/outcomes

---

### 2.3 PIN-Specific Requirements (G0023 / G0024 / G0140 / G0146)

✅ **Eligible Activities**:
- Navigation for serious high-risk conditions (cancer, CHF, COPD, dementia, stroke)
- Medication adherence support
- Symptom monitoring and escalation
- Coordination of care across providers
- Community resource connection

⚠️ **Critical Requirements**:
- **Initiating visit** (E/M, TCM, AWV) by billing practitioner identifies need for PIN
- **Documented consent** from patient/caregiver
- **Certified/trained auxiliary personnel** (RNs, social workers, navigators) under supervision
- **Minimum 60 minutes** per calendar month for G0023
- **Cannot bill PIN and PIN-PS concurrently** for same condition in same month

**PIN-PS (G0140/G0146) Additional Requirements**:
- Specifically for **behavioral health conditions** (depression, anxiety, caregiver burnout)
- Peer support by certified peer specialists
- May be billed separately from general PIN if different condition addressed

❌ **Does NOT Qualify**:
- AI-only services without human navigator involvement
- Services for non-serious conditions
- Navigation without practitioner order

---

### 2.4 Caregiver Training Requirements (G0541 / G0542 / G0543)

✅ **Eligible Activities**:
- Teaching direct care skills (wound care, mobility techniques, medication administration)
- Behavioral management training
- Safety techniques (fall prevention, emergency response)
- Disease-specific education (diabetes management, dementia care)

⚠️ **Critical Requirements**:
- **Training provided to caregivers WITHOUT patient present** (separate from patient care)
- **Must teach direct care skills** (not general education)
- **Time-based billing** in 30-minute increments (G0541) or 15-minute increments (G0542)
- **Must document full time units** (no rounding up)
- **Group training** (G0543) for 2-4 caregivers simultaneously

**New 2025 Codes**:
- G0541: Caregiver training, in-person, first 30 min (face-to-face, patient not present)
- G0542: Additional 15-minute increments (must have full 15 min)
- G0543: Group caregiver training (2-4 caregivers, 30 min)

❌ **Does NOT Qualify**:
- General education (not skill-building)
- Training with patient present (use other E/M codes)
- Videos/online courses without live trainer interaction (unless telehealth-approved)

---

### 2.5 TCM-Specific Requirements (CPT 99495 / 99496)

✅ **Eligible Activities**:
- Interactive contact with patient/caregiver within 2 business days of discharge
- Medication reconciliation
- Care coordination throughout 30-day period
- Face-to-face visit within 7 or 14 days (depending on complexity)

⚠️ **Critical Requirements**:
- **Face-to-face visit** by qualified practitioner within 7 days (99496) or 14 days (99495)
- **Interactive contact** via telephone or digital channels (SMS qualifies)
- **Medication reconciliation** completed by practitioner
- **Billing provider** must be physician or qualified practitioner

**GiveCare Role**:
- SMS contact within 2 business days meets interactive contact requirement
- Time tracking documents care coordination activities
- **Provider must complete face-to-face visit** (GiveCare cannot do this)

❌ **Does NOT Qualify**:
- AI-only contact without human practitioner review
- No face-to-face visit within required timeframe

---

## Part 3: Implementation Roadmap (Step-by-Step)

### Phase 1: Foundation (Months 1-3)

#### Step A: Partner with Medicare-Enrolled Provider

**Objective**: Establish relationship with billing entity that can "own" Medicare claims

**Options**:

**Option 1: Partner with Existing Provider** (Recommended for Model 1)
- Target: FQHCs, hospitals, health systems, ACOs with existing Medicare billing infrastructure
- GiveCare provides **documentation support tool** (SaaS platform)
- Provider's existing staff (CHWs, navigators, care coordinators) use GiveCare
- Provider bills Medicare codes, pays GiveCare fixed SaaS fee
- **Advantage**: No "incident to" compliance issues, fastest implementation

**Option 2: Create Affiliated Medical Practice** (For Model 2)
- Establish separate legal entity (e.g., "GiveCare Medical Services, LLC")
- Hire or contract with Medicare-enrolled physician/NP/PA as Medical Director
- Medical Director provides supervision for "incident to" billing
- GiveCare employs certified personnel (RNs, CHWs, navigators)
- **Advantage**: More control, higher revenue potential
- **Disadvantage**: Complex compliance, requires malpractice insurance, credentialing

**Action Items**:
- [ ] Legal review: Which partnership model to pursue (Model 1 vs Model 2)?
- [ ] Identify 3-5 target provider partners (FQHCs, hospitals, ACOs)
- [ ] Draft partnership agreement (SaaS license or staffing partnership)
- [ ] Obtain professional liability insurance quotes ($2M/occurrence minimum for Model 2)

**Timeline**: 8-12 weeks

**Cost**: $15k-$30k (legal fees, insurance deposits)

---

#### Step B: Hire or Train Auxiliary Personnel

**Objective**: Build team of certified CHWs, navigators, or trainers (if Model 2)

**Personnel Requirements**:

**Community Health Workers (CHWs)** - For CHI Services
- **Certification**: State-specific CHW certification (where required)
  - Example: California CHW certification via CDPH
  - Example: Massachusetts CHW Core Competency Training
- **Training**: 40-160 hours (varies by state)
- **Compensation**: $40k-$60k/year FTE
- **Ratio**: 1 CHW per 100-200 patients (for CHI services)

**Patient Navigators** - For PIN Services
- **Certification**: Certified Patient Navigator (CPN) via AONN or similar
- **Background**: RN, social worker, or healthcare background preferred
- **Training**: Navigation training (30-40 hours)
- **Compensation**: $50k-$75k/year FTE
- **Ratio**: 1 navigator per 50-100 high-risk patients

**Caregiver Trainers** - For CTS Services
- **Certification**: Clinical background (RN, OT, PT, or CNA with training certification)
- **Training**: Adult learning principles, teach-back methodology
- **Compensation**: $55k-$80k/year FTE
- **Ratio**: 1 trainer per 50-100 caregiver training sessions/year

**If Model 1 (Documentation Support)**:
- **No GiveCare hiring required** - provider uses own staff
- GiveCare provides training on platform use (2-4 hours per user)

**Action Items**:
- [ ] Determine staffing needs (Model 1 vs Model 2)
- [ ] If Model 2: Job descriptions for CHWs, navigators, trainers
- [ ] If Model 2: Recruitment (Indeed, LinkedIn, local CHW programs)
- [ ] Develop training curriculum (GiveCare platform + Medicare documentation)
- [ ] Create standard operating procedures (SOPs) for each service type

**Timeline**: 12-16 weeks (if hiring, includes recruitment + training)

**Cost**: $0 (Model 1) or $200k-$400k (Model 2, includes salaries, benefits, training)

---

#### Step C: Enroll/Credential with Medicare & MAC

**Objective**: Ensure billing provider(s) credentialed with Medicare in target geographies

**Credentialing Requirements**:
- Medicare enrollment via PECOS (Provider Enrollment, Chain and Ownership System)
- National Provider Identifier (NPI) for billing provider
- Provider type eligible for PFS billing (physician, NP, PA, group practice)
- State licenses current and in good standing
- Malpractice insurance (minimum $1M/occurrence, $3M aggregate)

**Action Items**:
- [ ] Verify provider partner has active Medicare enrollment
- [ ] Confirm NPI and provider type correct for CHI/PIN/CTS billing
- [ ] Identify Medicare Administrative Contractor (MAC) for target geography
  - Example: Novitas Solutions (Mid-Atlantic, New England)
  - Example: Palmetto GBA (Southeast)
  - Example: Noridian Healthcare Solutions (West, Midwest)
- [ ] Request MAC guidance on CHI/PIN/CTS billing (before submitting claims)
- [ ] If Model 2: Enroll GiveCare-employed personnel as auxiliary staff "incident to" supervising practitioner

**Timeline**: 8-12 weeks (if new enrollment), 2-4 weeks (if verifying existing)

**Cost**: $0 (if provider already enrolled) or $5k-$10k (if new enrollment, includes consulting fees)

---

#### Step D: Develop Operational Infrastructure & Workflows

**Objective**: Build systems for patient identification, service delivery, documentation, billing

**Workflow 1: CHI Services (G0019 / G0022)**

```
1. Patient Identification
   → EHR integration: Query for patients with documented SDOH barriers
   → Criteria: ICD-10 Z-codes (Z55-Z65: Social determinants of health)
   → Target: Food insecurity, housing instability, transportation barriers

2. Initiating Visit by Practitioner
   → Practitioner documents unmet SDOH during E/M, AWV, or TCM visit
   → Treatment plan created: "Patient needs CHI services to address food insecurity"
   → Order placed in EHR: "Refer to CHW for CHI services (G0019)"

3. CHW Delivers Services via GiveCare Platform
   → GiveCare sends SMS to patient: "Do you have trouble affording food?"
   → Patient responds: "Yes, I skip meals to afford rent"
   → CHW uses GiveCare to:
      - Log SDOH screening (10 min)
      - Connect to food bank resources (20 min)
      - Follow up: "Did you visit food bank?" (15 min)
      - Application assistance for SNAP benefits (15 min)
   → Total time tracked by GiveCare: 60 min

4. Billing Documentation Generated
   → GiveCare auto-generates CHI report:
      - Initiating visit date (E/M by Dr. Smith on 10/5/2025)
      - CHW name (Maria Gonzalez, Certified CHW)
      - Services delivered (SDOH screening, food bank connection, SNAP application)
      - Total time: 60 minutes (qualifies for G0019)
      - Supervising practitioner review: Dr. Smith reviewed on 10/31/2025
   → Billing recommendation: Submit G0019 for October 2025

5. Claim Submission
   → Provider submits claim to MAC with G0019 code
   → Documentation attached: CHI report from GiveCare
   → Medicare pays $77.95 (80% = $62.36)
   → Patient pays $15.59 (20% coinsurance)
```

**Workflow 2: PIN Services (G0023 / G0024)**

```
1. Patient Identification
   → EHR integration: Query for patients with serious high-risk conditions
   → Criteria: ICD-10 codes for CHF, COPD, cancer, dementia, stroke
   → Target: Recent hospital discharge, poor medication adherence, multiple comorbidities

2. Initiating Visit by Practitioner
   → Practitioner documents need for PIN services during E/M or TCM visit
   → Consent obtained: "Patient consents to navigation services"
   → Order placed in EHR: "Refer to navigator for PIN services (G0023)"

3. Navigator Delivers Services via GiveCare Platform
   → GiveCare sends SMS to caregiver: "This is Nurse Johnson. How is your mom managing her CHF medications?"
   → Caregiver responds: "She's confused about when to take them"
   → Navigator uses GiveCare to:
      - Medication adherence coaching (20 min)
      - Symptom monitoring: "Any swelling or shortness of breath?" (10 min)
      - Weight tracking reminders (5 min)
      - Resource connection: cardiac rehab info (15 min)
      - Escalate to MD if red flags detected (10 min)
   → Total time tracked by GiveCare: 60 min

4. Billing Documentation Generated
   → GiveCare auto-generates PIN report:
      - Initiating visit date (E/M by Dr. Lee on 10/8/2025)
      - Navigator name (Nurse Johnson, RN)
      - Services delivered (medication coaching, symptom monitoring, resource connection)
      - Total time: 60 minutes (qualifies for G0023)
      - Supervising practitioner review: Dr. Lee reviewed on 10/31/2025
   → Billing recommendation: Submit G0023 for October 2025

5. Claim Submission
   → Provider submits claim to MAC with G0023 code
   → Documentation attached: PIN report from GiveCare
   → Medicare pays ~$80-90 (varies by locality)
```

**Workflow 3: Caregiver Training (G0541 / G0542)**

```
1. Caregiver Identification
   → Referral from practitioner: "Patient's caregiver needs training in wound care"
   → Caregiver contacted via GiveCare SMS: "Would you like training on how to care for [patient]'s wound?"

2. Training Session Scheduled
   → GiveCare platform schedules 30-min training session (in-person or telehealth)
   → Trainer prepares curriculum (wound care basics, infection signs, dressing changes)

3. Training Delivered (WITHOUT Patient Present)
   → Trainer meets with caregiver via video (telehealth-approved for 2025)
   → Topics covered:
      - Wound assessment (10 min)
      - Dressing change demonstration (15 min)
      - Infection signs and when to call doctor (5 min)
   → Total time: 30 minutes (qualifies for G0541)
   → Caregiver demonstrates competency (teach-back method)

4. Billing Documentation Generated
   → GiveCare auto-generates CTS report:
      - Training date (10/15/2025)
      - Trainer name (Sarah RN, Wound Care Specialist)
      - Topics covered (wound assessment, dressing changes, infection signs)
      - Caregiver competency demonstrated: Yes
      - Total time: 30 minutes (qualifies for G0541)
   → Billing recommendation: Submit G0541

5. Claim Submission
   → Provider submits claim to MAC with G0541 code
   → Documentation attached: CTS report from GiveCare
   → Medicare pays $30-80 (varies by locality, new code)
```

**Action Items**:
- [ ] Build GiveCare platform features:
  - [ ] Time tracking (start/stop timers for each interaction)
  - [ ] Activity logging (dropdown: "SDOH screening", "medication coaching", "caregiver training")
  - [ ] Auto-calculation of total minutes per calendar month per patient
  - [ ] Compliance checkboxes: "Initiating visit completed? Y/N", "Supervising practitioner reviewed? Y/N"
  - [ ] Auto-generated billing reports (CHI, PIN, CTS formats)
  - [ ] Billing recommendations: "Qualifies for G0019" or "Does not qualify (only 45 min, need 60)"
- [ ] Integrate with provider EHR systems (HL7 FHIR, ADT feeds)
- [ ] Create patient identification queries (SDOH Z-codes, high-risk conditions)
- [ ] Develop informed consent templates (PIN services)
- [ ] Build billing report templates (CHI, PIN, CTS) with all CMS-required elements

**Timeline**: 12-16 weeks (platform development)

**Cost**: $100k-$200k (engineering, product, integration)

---

### Phase 2: Pilot Program (Months 4-6)

#### Step E: Pilot with Limited Geography / MAC

**Objective**: Test model with 1-2 provider partners in single MAC region

**Pilot Design**:

**Pilot Partner 1: FQHC (CHI Services)**
- Geography: Choose MAC with clear CHI guidance (e.g., Palmetto GBA in Southeast)
- Provider: Community health center with existing CHW program
- Scope: 50-100 patients with documented SDOH barriers
- Duration: 3 months
- GiveCare role: Documentation support tool (Model 1)
- Success metric: 80%+ CHI claim acceptance rate

**Pilot Partner 2: Hospital (TCM + PIN Services)**
- Geography: Same MAC as Pilot 1 (reduce complexity)
- Provider: Community hospital with care coordination program
- Scope: 100 post-discharge patients (TCM) + 50 high-risk chronic disease patients (PIN)
- Duration: 3 months
- GiveCare role: Documentation support tool (Model 1)
- Success metrics:
  - TCM billing capture rate increases from 30% to 70%+
  - PIN claim acceptance rate 80%+

**Pilot Metrics to Track**:
- **Claim Acceptance Rate**: % of submitted claims paid without denial
- **Denial Reasons**: Track why claims denied (missing documentation, time threshold not met, etc.)
- **Time to Payment**: Days from claim submission to payment
- **Provider Satisfaction**: Survey care coordinators, CHWs, navigators on GiveCare usability
- **Patient Outcomes**: SDOH barriers addressed, readmission rates, engagement rates

**Action Items**:
- [ ] Select 2 pilot partners (1 FQHC, 1 hospital)
- [ ] Execute pilot agreements (3-month trial, reduced pricing)
- [ ] Train pilot provider staff on GiveCare platform (2-4 hours per user)
- [ ] Submit first batch of claims (CHI, TCM, PIN)
- [ ] Monitor MAC responses (track acceptances, denials, feedback)
- [ ] Weekly check-ins with pilot partners (troubleshoot issues)
- [ ] Adjust documentation templates based on MAC feedback

**Timeline**: 12 weeks

**Cost**: $50k-$100k (pilot support, platform adjustments, potential claim denials)

---

#### Step F: Monitor Payer Responses, Appeals, Compliance

**Objective**: Track claim outcomes, appeal denials, refine compliance practices

**Claims Tracking Dashboard**:
- Claims submitted by code (G0019, G0023, G0541, 99495)
- Acceptance rate by code
- Denial rate by code
- Denial reasons (missing documentation, time threshold, no initiating visit, etc.)
- Time to payment (average days)
- Revenue captured per patient per month

**Common Denial Reasons & Resolutions**:

| Denial Reason | Resolution | Prevention |
|---------------|------------|------------|
| **Missing initiating visit documentation** | Submit medical records showing E/M visit with SDOH/PIN order | Ensure GiveCare billing report references initiating visit date + provider |
| **Time threshold not met** | Appeal with detailed time logs (if 60 min met but not documented) | GiveCare auto-calculates total minutes, flags if <60 min |
| **Supervision not documented** | Submit clinical oversight agreement, practitioner review signature | GiveCare requires "Supervising practitioner reviewed? Y/N" checkbox |
| **Consent not documented** | Submit signed consent form or chart note | GiveCare consent template, auto-attached to billing report |
| **Services overlap with other codes** | Clarify which provider billed which code, which time period | GiveCare checks for duplicate billing periods, warns user |

**Appeals Process**:
- If claim denied, review denial reason code
- Gather supporting documentation (time logs, initiating visit notes, consent forms)
- Submit appeal to MAC within 120 days (redetermination)
- If denied again, escalate to ALJ hearing (Administrative Law Judge)
- **Important**: Track appeal success rates by denial reason (inform documentation improvements)

**Action Items**:
- [ ] Build claims tracking dashboard in GiveCare admin panel
- [ ] Monitor first batch of pilot claims (expect 10-20% denial rate initially)
- [ ] Analyze denial reasons, adjust documentation templates
- [ ] Submit appeals for denied claims with proper documentation
- [ ] Conduct post-pilot debrief with MAC (request feedback on documentation quality)
- [ ] Refine GiveCare platform based on MAC feedback

**Timeline**: 12 weeks (overlaps with pilot)

**Cost**: $20k-$40k (billing consultant, appeal preparation)

---

### Phase 3: Scale & Expand (Months 7-12)

#### Step G: Scale and Expand

**Objective**: Expand to more providers, more geographies, more service types

**Expansion Plan**:

**Quarter 3 (Months 7-9)**:
- Add 5 new provider partners (3 FQHCs, 2 hospitals)
- Expand to 2 new MAC regions (based on pilot success)
- Launch PIN-Peer Support (G0140/G0146) for behavioral health
- Target: 500 patients receiving CHI/PIN/CTS services

**Quarter 4 (Months 10-12)**:
- Add 10 new provider partners
- Launch caregiver training program (G0541/G0542/G0543) at scale
- Expand to 4 MAC regions (cover 50% of US)
- Target: 2,000 patients receiving services

**Projected Revenue (Year 1)**:

| Service Type | Patients | Avg Reimbursement/Patient/Month | Annual Revenue | GiveCare Platform Fee | GiveCare Annual Revenue |
|--------------|----------|----------------------------------|----------------|----------------------|------------------------|
| **CHI (G0019/G0022)** | 1,000 | $80 (G0019 only) | $960k | $5/patient/month | $60k |
| **PIN (G0023/G0024)** | 500 | $85 (G0023 only) | $510k | $6/patient/month | $36k |
| **CTS (G0541/G0542)** | 300 caregivers | $40/session × 3 sessions/year | $36k | $10/session | $9k |
| **TCM (99495)** | 1,000 discharges | $201 (99495) | $2.41M | $50/discharge | $50k |
| **TOTAL** | N/A | N/A | **$3.92M** | N/A | **$155k** |

**Notes**:
- Revenue captured by provider partners, not GiveCare (unless Model 2)
- GiveCare revenue = SaaS platform fees (Model 1)
- If Model 2 (staffing partnership): GiveCare revenue = platform fees + personnel margins ($15-21/patient/month)

**Action Items**:
- [ ] Sales pipeline: Identify 50 target providers (FQHCs, hospitals, ACOs, health plans)
- [ ] Marketing collateral: Case studies from pilot partners, ROI calculators
- [ ] Account management: Assign CSMs to each provider partner (ensure retention)
- [ ] Platform improvements: Auto-escalation for high-risk patients, predictive analytics
- [ ] Regulatory monitoring: Stay updated on CMS Final Rules, MAC transmittals for CHI/PIN/CTS

**Timeline**: 24 weeks

**Cost**: $200k-$400k (sales, marketing, CSM salaries, platform scaling)

---

## Part 4: Financial Pro Forma (Year 1)

### 4.1 Model 1: Documentation Support Tool (Recommended)

**Assumptions**:
- GiveCare charges fixed SaaS fees (no revenue share)
- Provider partners use own staff, bill Medicare directly
- GiveCare provides platform + billing documentation automation

**Revenue**:
| Service | Patients/Discharges | GiveCare Fee | Annual GiveCare Revenue |
|---------|---------------------|--------------|------------------------|
| CHI (G0019) | 1,000 patients | $5/patient/month | $60k |
| PIN (G0023) | 500 patients | $6/patient/month | $36k |
| CTS (G0541) | 300 caregivers, 3 sessions/year | $10/session | $9k |
| TCM (99495) | 1,000 discharges | $50/discharge | $50k |
| **TOTAL** | N/A | N/A | **$155k** |

**Costs**:
| Category | Year 1 Cost |
|----------|-------------|
| Platform development | $150k (engineering, product) |
| Legal/compliance review | $30k (healthcare attorney) |
| Sales & marketing | $80k (collateral, events, outreach) |
| Customer success | $100k (2 CSMs) |
| Billing consultant | $40k (MAC guidance, appeal support) |
| **TOTAL** | **$400k** |

**Net Loss**: -$245k (Year 1)

**Breakeven**: Year 2 (need ~2,500 patients on platform at current pricing)

---

### 4.2 Model 2: Staffing Partnership (Higher Revenue, Higher Risk)

**Assumptions**:
- GiveCare employs certified personnel (CHWs, navigators)
- Provider partners bill Medicare, pay GiveCare for platform + personnel
- GiveCare charges $15-21/patient/month (vs $5-6 for platform only)

**Revenue**:
| Service | Patients | GiveCare Fee (Platform + Personnel) | Annual GiveCare Revenue |
|---------|----------|-------------------------------------|------------------------|
| CHI (G0019) | 1,000 patients | $15/patient/month (5 CHWs employed) | $180k |
| PIN (G0023) | 500 patients | $21/patient/month (3 navigators employed) | $126k |
| CTS (G0541) | 300 caregivers | $20/session (1 trainer employed) | $18k |
| TCM (99495) | 1,000 discharges | $75/discharge (platform + care coordinator oversight) | $75k |
| **TOTAL** | N/A | N/A | **$399k** |

**Costs**:
| Category | Year 1 Cost |
|----------|-------------|
| Platform development | $150k |
| Legal/compliance review | $50k (more complex for Model 2) |
| Personnel salaries (9 FTE) | $450k (5 CHWs, 3 navigators, 1 trainer) |
| Malpractice insurance | $40k ($2M/occurrence) |
| Training & credentialing | $30k (CHW/navigator certifications) |
| Sales & marketing | $80k |
| Customer success | $100k |
| Billing consultant | $40k |
| **TOTAL** | **$940k** |

**Net Loss**: -$541k (Year 1)

**Breakeven**: Year 2-3 (need ~4,000 patients on platform at current pricing)

**Higher Risk**: "Incident to" compliance, state licensure, supervision documentation

---

### 4.3 Recommendation: Start with Model 1, Expand to Model 2 Later

**Rationale**:
- **Model 1** = Lower risk, faster time to market, lower capital requirements
- **Model 2** = Higher revenue potential, but requires legal review, malpractice insurance, credentialing complexity
- **Strategy**: Launch Model 1 in Year 1 (prove billing compliance), expand to Model 2 in Year 2 (after legal approval)

**Year 1 Goal**: 2,000 patients on platform (Model 1), $155k revenue, breakeven by Month 18

**Year 2 Goal**: 5,000 patients (mix of Model 1 + Model 2), $500k+ revenue, profitability

---

## Part 5: Risk Mitigation & Compliance

### 5.1 Legal/Compliance Risks

| Risk | Severity | Mitigation | Cost |
|------|----------|------------|------|
| **False Claims Act** (billing AI-only services) | **CRITICAL** | Only bill for human-delivered services, AI is support tool | Legal review: $15k-$30k |
| **Stark Law** (revenue share arrangements) | **HIGH** | Avoid revenue share (Model 3), use fixed SaaS fees (Model 1) | Legal review included |
| **Anti-Kickback Statute** (payments tied to referrals) | **HIGH** | Fixed SaaS fees unrelated to Medicare billings | Legal review included |
| **"Incident To" Billing Rules** (supervision inadequate) | **HIGH** | Clinical oversight agreements, practitioner review signatures | Template creation: $5k |
| **State Licensure** (unlicensed practice) | **MEDIUM** | Ensure CHWs/navigators have state certifications | Certification costs: $30k |
| **MAC Denials** (documentation inadequate) | **MEDIUM** | Billing consultant review, appeals process | Consultant: $40k/year |

**Total Risk Mitigation Cost**: $120k-$200k (Year 1)

---

### 5.2 Operational Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Low claim acceptance rate** (<70%) | **HIGH** | Pilot with 1 MAC first, adjust documentation templates based on feedback |
| **Provider partners churn** (platform too complex) | **MEDIUM** | User testing, onboarding support, CSM engagement |
| **Personnel turnover** (Model 2, high CHW/navigator turnover) | **MEDIUM** | Competitive compensation, career development, retention bonuses |
| **MAC policy changes** (codes discontinued or payment reduced) | **MEDIUM** | Diversify across CHI, PIN, CTS, TCM (not dependent on single code) |
| **Reimbursement rates decrease** (PFS conversion factor down 2.93% in 2025) | **LOW** | Accept lower margins, focus on volume scaling |

---

## Part 6: Next Steps & Decision Points

### 6.1 Immediate Actions (Next 30 Days)

1. **Legal Review** (CRITICAL)
   - [ ] Engage healthcare attorney specializing in Medicare billing compliance
   - [ ] Review Model 1 vs Model 2 vs Model 3 partnership structures
   - [ ] Draft provider partnership agreement template (Model 1)
   - [ ] Review Stark Law, Anti-Kickback Statute, "incident to" rules
   - **Cost**: $15k-$30k
   - **Timeline**: 4-6 weeks

2. **Provider Partner Outreach**
   - [ ] Identify 10 target FQHCs/hospitals/ACOs for pilot
   - [ ] Cold outreach: "New CMS codes (CHI, PIN, CTS) can generate $X/year, but documentation is complex. GiveCare automates this."
   - [ ] Schedule discovery calls (30 min) with CMO, CFO, or care management director
   - **Cost**: $0 (founder-led sales)
   - **Timeline**: 4 weeks

3. **MAC Research**
   - [ ] Identify 3 MACs with clearest CHI/PIN/CTS guidance
   - [ ] Request MAC guidance documents on billing requirements
   - [ ] Schedule call with MAC provider relations (ask: "What are common denial reasons for CHI/PIN codes?")
   - **Cost**: $0
   - **Timeline**: 2 weeks

4. **Platform Feature Prioritization**
   - [ ] Finalize MVP requirements for Model 1 (documentation support tool)
   - [ ] Key features: Time tracking, activity logging, auto-billing reports, compliance checkboxes
   - [ ] Engineering estimate: 12-16 weeks, $100k-$150k
   - **Cost**: $0 (planning only)
   - **Timeline**: 1 week

---

### 6.2 Decision Points (30-60 Days)

**Decision 1**: Model 1 vs Model 2 vs Model 3?
- **If legal review approves Model 1**: Proceed with documentation support tool (lowest risk)
- **If legal review requires modifications**: Adjust partnership agreements, resubmit
- **If legal review rejects all models**: Pursue alternative reimbursement (Medicaid, commercial, employer direct)

**Decision 2**: Which geography/MAC to pilot first?
- **Criteria**: MAC with published CHI/PIN guidance, low claim denial rates, FQHC density
- **Top candidates**: Palmetto GBA (Southeast), Novitas Solutions (Mid-Atlantic)

**Decision 3**: FQHC vs Hospital vs ACO as first pilot partner?
- **FQHC**: Best for CHI services (existing CHW programs, SDOH focus)
- **Hospital**: Best for TCM services (high discharge volume, care coordination infrastructure)
- **ACO**: Best for PIN services (high-risk patient population, value-based contracts)
- **Recommendation**: Start with FQHC (CHI services, simplest use case)

---

### 6.3 Go/No-Go Criteria (60-90 Days)

**GO** if:
- ✅ Legal review approves Model 1 (documentation support tool)
- ✅ 2+ provider partners commit to 3-month pilot
- ✅ Engineering estimates MVP at <$200k, <20 weeks
- ✅ MAC provides clear guidance on billing requirements
- ✅ Pilot agreements signed with reduced pricing

**NO-GO** if:
- ❌ Legal review identifies unmitigable compliance risks (False Claims Act, Stark Law)
- ❌ No provider partners interested (market not ready)
- ❌ MAC indicates high denial rates for CHI/PIN codes (>40%)
- ❌ Engineering estimates MVP >$300k or >30 weeks
- ❌ Alternative reimbursement models (Medicaid, commercial) prove more attractive

**Contingency Plan** (if NO-GO):
- Pursue **Medicaid** reimbursement (state-specific, some states reimburse CHWs)
- Pursue **commercial payer** value-based contracts (shared savings, no fee-for-service)
- Pursue **employer direct contracting** (no insurance billing)
- Pursue **grant funding** (ACL, HRSA for FQHCs/CBOs)

---

## Part 7: Conclusion & Recommendations

### 7.1 Summary

**Medicare reimbursement opportunity is real but complex**:
- **CHI (G0019/G0022)**: $70-90/patient/month, well-established
- **PIN (G0023/G0024)**: $77-90/patient/month, newer (2024+), MAC-specific
- **CTS (G0541/G0542)**: $30-80/session, brand new (2025), provisional rates
- **TCM (99495/99496)**: $201-273/discharge, well-established

**But requires**:
- Medicare-enrolled billing provider (cannot bill directly as SaaS company)
- "Incident to" supervision (certified CHWs, navigators, trainers under practitioner oversight)
- Initiating visit by practitioner (documents need for CHI/PIN/CTS services)
- Detailed documentation (time tracking, activity logs, consent forms)
- Compliance with MAC-specific rules (varies by region)

**Three partnership models**:
- **Model 1** (Documentation Support Tool): Lowest risk, fastest implementation, lower revenue
- **Model 2** (Staffing Partnership): Higher revenue, medium risk, requires legal review
- **Model 3** (Revenue Share): Highest revenue, highest risk, Stark/Anti-Kickback concerns

---

### 7.2 Recommendations

1. **Start with Model 1** (Documentation Support Tool)
   - Partner with 2 providers (1 FQHC for CHI, 1 hospital for TCM/PIN)
   - Charge fixed SaaS fees ($5-6/patient/month, $50/discharge)
   - Prove billing compliance, claim acceptance rates >80%
   - **Timeline**: 6-9 months to first revenue
   - **Investment**: $400k (platform, legal, pilot support)

2. **Obtain Legal Review IMMEDIATELY**
   - Engage healthcare attorney ($15k-$30k)
   - Confirm Model 1 structure is compliant
   - Draft provider partnership agreements
   - **Timeline**: 4-6 weeks

3. **Pilot with 1 MAC Region First**
   - Choose MAC with clear CHI/PIN guidance (Palmetto GBA or Novitas Solutions)
   - Test claim submission, track denial rates, refine documentation
   - **Timeline**: 3 months (Months 4-6)

4. **Expand to Model 2 Later** (Year 2)
   - If Model 1 successful (>80% claim acceptance, 10+ provider partners)
   - Hire certified personnel (CHWs, navigators)
   - Charge $15-21/patient/month (platform + personnel)
   - **Timeline**: 12-18 months after Model 1 launch

5. **Maintain Backup Plan** (Alternative Reimbursement)
   - If Medicare proves too complex, pivot to Medicaid, commercial, employer direct, grants
   - Some states (Oregon, Massachusetts) reimburse CHWs directly
   - Health plans pay vendors for SDOH interventions via value-based contracts

---

### 7.3 Question for Leadership

**Do you want to pursue Medicare reimbursement via Model 1 (Documentation Support Tool)?**

**If YES**:
- Next step: Obtain legal review ($15k-$30k, 4-6 weeks)
- Then: Build MVP ($100k-$150k, 12-16 weeks)
- Then: Pilot with 2 providers (3 months)
- **Total investment**: $400k over 9 months
- **Expected outcome**: $155k revenue in Year 1, breakeven Month 18

**If NO**:
- Alternative: Pursue Medicaid, commercial, employer direct, grants
- Or: Focus on D2C market ($4.99-$14.99/month subscriptions)
- Or: Pure B2B SaaS to providers (no reimbursement involvement)

**Recommendation**: **Pursue Model 1** - opportunity is significant ($3.9M in captured Medicare revenue for providers), risk is manageable (documentation support role), and aligns with CMS priorities (SDOH, chronic disease management, caregiver support).

---

**Last Updated**: 2025-10-10
**Next Review**: After legal review completion
**Owner**: Product/Business Development Team

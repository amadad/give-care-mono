# Security & Compliance Documentation

**Last Updated:** 2025-10-15
**Version:** 1.0
**Owner:** Ali Madad
**Status:** IN PROGRESS — HIPAA Compliance Q1 2026

---

## Executive Summary

GiveCare is built on enterprise-grade, SOC 2 Type II compliant infrastructure with encryption at rest and in transit. We are actively pursuing full HIPAA compliance for healthcare partnerships, with targeted completion in Q1 2026.

**Current Status:**
- ✅ **SOC 2 Type II** compliant infrastructure (Convex)
- ✅ **OpenAI BAA** signed (AI processing covered)
- 🚧 **Convex BAA** pending execution (database)
- 🚧 **Twilio BAA** pending execution (SMS channel)
- 🎯 **Full HIPAA compliance** target: Q1 2026

---

## Infrastructure Security

### Data Encryption

**At Rest:**
- AES-256 encryption for all databases
- Encrypted file storage
- Encrypted search indexes
- Isolated customer databases with unique credentials

**In Transit:**
- TLS 1.3 for all external connections
- SSH for internal system access
- HTTPS-only API endpoints
- Encrypted Twilio webhooks

### Platform Architecture

**Convex (Backend Database & Functions):**
- SOC 2 Type II compliant
- HIPAA-compliant infrastructure (BAA execution in progress)
- Hosted on AWS (SOC 2, ISO 9001, GDPR, HIPAA certified)
- Automated vulnerability scanning
- Annual third-party penetration testing
- Multi-factor authentication (MFA) for all production access

**OpenAI (AI Processing):**
- ✅ Business Associate Agreement (BAA) **SIGNED**
- HIPAA-compliant AI processing
- No training on customer data
- 30-day conversation retention policy
- Zero data retention (ZDR) mode available

**Twilio (SMS/RCS Communication):**
- HIPAA-eligible products (Programmable Messaging)
- BAA execution pending (Q1 2026)
- End-to-end encryption for messages
- Secure webhook delivery (HTTPS only)

---

## HIPAA Compliance Roadmap

### Current State (October 2024)

| Component | Status | BAA Signed | HIPAA Ready |
|-----------|--------|------------|-------------|
| **OpenAI** (AI agents) | ✅ Compliant | ✅ Yes | ✅ Yes |
| **Convex** (database) | 🚧 In Progress | ❌ Not yet | 🎯 Q1 2026 |
| **Twilio** (SMS) | 🚧 In Progress | ❌ Not yet | 🎯 Q1 2026 |

**What this means:**
- We use HIPAA-compliant infrastructure
- We are **not yet fully HIPAA-compliant** as a service
- Protected Health Information (PHI) processing requires executed BAAs with all vendors

---

## Path to Full HIPAA Compliance

### Phase 1: Business Associate Agreements (Q4 2025 - Q1 2026)

**Convex BAA Execution:**
- **Timeline:** 4-6 weeks from initiation
- **Requirements:**
  - Enterprise plan upgrade (if required)
  - Legal review and execution
  - HIPAA features enablement
- **Status:** Pending contact with Convex legal team

**Twilio HIPAA Account:**
- **Timeline:** 2-3 weeks from approval
- **Cost:** $2,000/month (HIPAA Accounts tier)
- **Features included:**
  - Comprehensive encryption on PHI
  - 7-year audit log retention (vs. 1-year standard)
  - Tighter access controls and monitoring
  - Automatic 15-minute idle logout in console
  - Custom routing through secure/direct carrier connections
- **Status:** Quote received, pending budget approval

**Resources provided by Twilio:**
- [Twilio x HIPAA Overview](https://www.twilio.com/docs/usage/security/hipaa)
- [Architecting for HIPAA on Twilio](https://www.twilio.com/docs/usage/security/hipaa-architecting)
- [HIPAA Eligible Products](https://www.twilio.com/docs/usage/security/hipaa-products)
- [Security at Twilio](https://www.twilio.com/security)

---

### Phase 2: Technical Implementation (Q1 2026)

**Infrastructure Hardening:**
- [ ] Enable Twilio HIPAA features (message encryption, audit logging)
- [ ] Configure Convex HIPAA settings (access controls, retention policies)
- [ ] Implement comprehensive audit logging for all PHI access
- [ ] Set up automated session timeouts (15 minutes industry standard)
- [ ] Enable MFA for all administrative accounts
- [ ] Configure HTTPS-only webhook endpoints

**Data Governance:**
- [ ] Define PHI data classification schema
- [ ] Implement data retention policies (per HIPAA requirements)
- [ ] Configure automated data deletion workflows
- [ ] Set up breach detection and notification procedures
- [ ] Document data flow diagrams for all PHI processing

---

### Phase 3: Policy & Documentation (Q1 2026)

**Required Policies:**
- [ ] HIPAA Security Rule compliance documentation
- [ ] Privacy Policy with HIPAA language
- [ ] Data Processing Agreement (DPA) for enterprise customers
- [ ] Breach Notification Procedures
- [ ] Access Control Policies
- [ ] Incident Response Plan
- [ ] Risk Assessment Documentation
- [ ] Employee Training Materials (if applicable)

**Compliance Artifacts:**
- [ ] Annual risk assessment (HIPAA Security Rule §164.308(a)(1)(ii)(A))
- [ ] Security policies and procedures documentation
- [ ] Business Associate Agreement templates for enterprise customers
- [ ] Audit log review procedures

---

### Phase 4: Third-Party Validation (Q2 2026)

**Security Audits:**
- [ ] Annual penetration testing (recommended for enterprise sales)
- [ ] Independent HIPAA compliance audit (optional but recommended)
- [ ] Vulnerability scanning and remediation
- [ ] SOC 2 Type II audit (inherited from Convex)

---

## What We Can Claim Now

### ✅ **CURRENT CLAIMS (Safe to Use)**

**For Marketing Copy:**
> "Built on enterprise-grade, SOC 2 Type II compliant infrastructure. Your data is encrypted at rest (AES-256) and in transit (TLS 1.3). We use HIPAA-compliant vendors and follow security best practices."

**For Privacy Page:**
> "GiveCare takes your privacy seriously. All data is:
> - Encrypted in transit (TLS 1.3) and at rest (AES-256)
> - Stored on SOC 2 Type II compliant infrastructure (Convex)
> - Processed by HIPAA-compliant AI systems (OpenAI, BAA signed)
> - Never sold or shared with third parties
>
> We are actively working toward full HIPAA compliance. Enterprise customers requiring HIPAA compliance should contact us at hello@givecareapp.com to discuss custom agreements and our compliance roadmap."

**For B2B Sales Decks:**
> **Security & Compliance:**
> - ✅ SOC 2 Type II compliant infrastructure
> - ✅ End-to-end encryption (TLS 1.3 + AES-256)
> - ✅ AI processing with OpenAI (BAA signed)
> - ✅ HIPAA-compliant vendors (Convex, Twilio)
> - 🚧 Full HIPAA compliance in progress (Q1 2026)
> - 🎯 Enterprise BAA availability: Q2 2026
>
> For healthcare organizations requiring HIPAA today, we can expedite compliance for enterprise partnerships.

---

### ❌ **DO NOT CLAIM (Until Compliance Complete)**

**Avoid these terms/claims:**
- ❌ "HIPAA-compliant platform" (not true until all BAAs signed)
- ❌ "HIPAA-certified" (HIPAA doesn't certify)
- ❌ "Protected Health Information (PHI) safeguarded" (not true without BAAs)
- ❌ "Medical-grade security" (vague, misleading)
- ❌ "Healthcare-grade compliance" (implies HIPAA without saying it)

**Why:**
- Legal liability: False HIPAA claims can result in $100–$50,000 per violation
- Trust damage: Healthcare partners will audit your compliance before partnerships
- Competitive disadvantage: Competitors can point out gaps if you overclaim

---

## Access Controls & Monitoring

### Production Access
- Multi-factor authentication (MFA) required for all admin accounts
- Principle of least privilege (access granted only as needed)
- Regular access audits and reviews
- Automated access revocation for offboarded team members

### Audit Logging
- All database queries logged (Convex built-in)
- API access logs retained for 90 days (standard tier)
- 7-year retention with Twilio HIPAA Account (once enabled)
- Automated anomaly detection for suspicious access patterns

### Intrusion Detection
- Automated vulnerability scanning (Convex platform-level)
- Real-time threat monitoring
- Incident response procedures documented

---

## Payment Security

**Stripe Integration:**
- PCI Service Provider Level 1 certified
- No card data stored on GiveCare servers
- Tokenized payment processing
- Fraud detection and prevention built-in

---

## Compliance Timeline & Budget

### Estimated Costs

| Component | One-Time Cost | Monthly Cost | Annual Cost |
|-----------|---------------|--------------|-------------|
| Convex Enterprise (estimate) | $0 | $250-1,000 | $3,000-12,000 |
| Twilio HIPAA Account | $0 | $2,000 | $24,000 |
| Legal review (Privacy Policy, DPA) | $1,000-3,000 | $0 | $0 |
| Third-party security audit (optional) | $5,000-15,000 | $0 | $5,000-15,000 |
| **TOTAL YEAR 1** | **$6,000-18,000** | **$2,250-3,000** | **$32,000-51,000** |

**Note:** Costs are estimates. Final pricing depends on Convex Enterprise plan requirements.

---

### Timeline Summary

| Phase | Duration | Target Completion |
|-------|----------|-------------------|
| **Phase 1:** BAA Execution (Convex + Twilio) | 4-6 weeks | January 2026 |
| **Phase 2:** Technical Implementation | 2-3 weeks | February 2026 |
| **Phase 3:** Policy & Documentation | 2 weeks | March 2026 |
| **Phase 4:** Third-Party Validation (optional) | 4-6 weeks | April 2026 |
| **HIPAA Compliance Achieved** | — | **Q1 2026** |

---

## Data Privacy & GDPR

### GDPR Compliance
- Convex infrastructure is GDPR-compliant
- User data subject rights supported:
  - Right to access (data export via API)
  - Right to deletion (account deletion functionality)
  - Right to portability (JSON export of user data)
  - Right to rectification (user profile updates)

### Data Retention
- Active user data: Retained while account is active
- Deleted accounts: 30-day soft delete, then permanent deletion
- Conversation history: 30-day retention (OpenAI sessions)
- Audit logs: 90 days (standard tier), 7 years (HIPAA tier)

---

## Incident Response

### Breach Notification
- Internal detection: 24-hour internal notification SLA
- Customer notification: Per HIPAA requirements (60 days)
- Regulatory notification: Per HIPAA Breach Notification Rule
- Incident response team: Ali Madad (primary), Convex Support (infrastructure)

### Contact
For security concerns or to report vulnerabilities:
- **Email:** security@givecareapp.com
- **Response Time:** 24-hour acknowledgment, 72-hour initial assessment

---

## Vulnerability Disclosure Policy

If you believe you've discovered a security vulnerability in GiveCare:
1. **Do not** publicly disclose the issue until we've had a chance to address it
2. Email security@givecareapp.com with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
3. We will respond within 24 hours with acknowledgment
4. We will provide a remediation timeline within 72 hours

---

## Enterprise Customer Requirements

### For Healthcare Organizations Requiring HIPAA

**Current Offering (2024-2025):**
- SOC 2 Type II compliant infrastructure
- Encryption at rest and in transit
- Secure architecture with HIPAA-compliant vendors
- Roadmap to full compliance (Q1 2026)

**Available Q1 2026:**
- Business Associate Agreement (BAA) execution
- HIPAA-compliant SMS messaging (Twilio HIPAA Account)
- HIPAA-compliant database (Convex BAA)
- Full audit logging and access controls
- Custom Data Processing Agreement (DPA)

**Contact:** hello@givecareapp.com for enterprise partnerships

---

## Frequently Asked Questions

### Is GiveCare HIPAA-compliant?
Not yet. We use HIPAA-compliant infrastructure (SOC 2 Type II, encrypted data, BAA with OpenAI), but we are still executing Business Associate Agreements with our database and SMS providers. Full HIPAA compliance is targeted for Q1 2026.

### Can I use GiveCare for protected health information (PHI)?
Not until Q1 2026 when all BAAs are executed. Currently, we recommend using GiveCare for wellness and support conversations that do not include identifiable health information (specific diagnoses, medications, treatment plans).

### Is my data encrypted?
Yes. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We use industry-standard encryption across all systems.

### Do you sell my data?
No. We never sell or share user data with third parties. Your conversations are private and used only to provide the GiveCare service.

### Can I delete my data?
Yes. You can request account deletion at any time. We will permanently delete your data within 30 days of your request.

### Who can access my conversations?
Only you and the GiveCare AI agents. No human staff can access your conversations unless you explicitly request support and provide consent. All access is logged.

### What happens if there's a data breach?
We have incident response procedures in place. If a breach occurs, we will notify affected users within the timeframes required by applicable laws (HIPAA, GDPR, state breach notification laws).

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-15 | Ali Madad | Initial security & compliance documentation |

---

## Next Actions

### Immediate (This Week)
- [ ] Contact Convex support to initiate BAA execution process
- [ ] Contact Twilio to confirm HIPAA Account pricing and timeline
- [ ] Review budget for $2k/month Twilio + Convex Enterprise costs

### Short-Term (Next 30 Days)
- [ ] Execute Convex BAA (pending legal review)
- [ ] Approve Twilio HIPAA Account upgrade
- [ ] Update Privacy Policy with current compliance status
- [ ] Draft enterprise BAA template for healthcare customers

### Long-Term (Q1-Q2 2026)
- [ ] Complete technical implementation (audit logging, access controls)
- [ ] Document HIPAA compliance policies and procedures
- [ ] Consider third-party security audit for enterprise sales
- [ ] Launch enterprise BAA offering for healthcare partners

---

**For questions about this document, contact:** Ali Madad (hello@givecareapp.com)

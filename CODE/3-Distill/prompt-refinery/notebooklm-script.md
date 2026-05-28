# NotebookLM Podcast Script — State EI Demo Segment

**Duration:** 90 seconds  
**Format:** Two-host conversational podcast  
**Source:** Google NotebookLM (notebooklm.google.com) → Audio Overview → Deep Dive Conversation

---

## Instructions

1. Go to https://notebooklm.google.com
2. Create a new notebook
3. Paste the script below as a source document
4. Click "Audio Overview" → "Deep Dive Conversation"
5. Download the generated MP3
6. Play the 90-second segment during Phase 3 of the interview demo

---

## Script Content

State Early Intervention Monitoring System — Moodle Modular Extension

This system demonstrates a proof-of-concept modular extension inside Moodle that allows state-level administrators to monitor early intervention program compliance under IDEA Part C. The system provides three core dashboard widgets: a real-time compliance tracker showing which programs meet federal 45-day evaluation and 30-day IFSP deadlines, a predictive training needs map that flags regions falling behind on personnel credentialing, and a secure parental consent tracking module.

The entire system is built with FERPA and NIST 800-53 compliance at its core. All data ingested through the REST API passes through an automated anonymization pipeline that strips names, exact birthdates, and case IDs before any information reaches a public-facing interface. The dashboard is mobile-responsive, built with Tailwind CSS and Chart.js, and can be accessed by scanning a QR code that creates a secure ngrok tunnel to the Moodle instance.

The system uses PostgreSQL row-level security for tenant isolation, AES-256 encryption for data at rest, and TLS 1.2+ for all data in transit. Every data access is logged in an immutable audit trail per FERPA 34 CFR 99.32 and NIST 800-53 AU-2 requirements.

The demo is seeded with realistic but synthetic data inspired by EDFacts, OSEP Fast Facts, and NCES Common Core of Data — six regions with varying compliance profiles that demonstrate how the system surfaces at-risk programs automatically.

---

## Suggested Intro for Interview Phase 3

> *"To show how we can scale professional development and make technical guidelines digestible for staff across the state, I used generative AI to convert our dense compliance manual into an interactive, two-person podcast format. Let's listen to how a regional coordinator would experience our Moodle onboarding system."*

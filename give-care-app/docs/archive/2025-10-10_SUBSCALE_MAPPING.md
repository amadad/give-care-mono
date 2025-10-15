# Subscale → Pressure Zone Mapping Diagram

```
ASSESSMENTS (4)                  SUBSCALES (22)                    PRESSURE ZONES (5)
═══════════════                  ══════════════                    ══════════════════

┌─────────────┐
│     EMA     │─────────────┬──► mood ────────────────────────┐
│  (5 items)  │             │                                  ├──► EMOTIONAL_WELLBEING
└─────────────┘             ├──► stress ──────────────────────┤
                            ├──► burden ─────────────────────┐│
                            │                                 ││
                            ├──► support ────────────────────┐││
                            │                                │││
                            └──► self_care ─────────────────┐│││
                                                             ││││
┌─────────────┐                                             ││││
│    CWBS     │─────────────┬──► activities ────────────────┼│││
│  (2 items)  │             │                               │││├──► TIME_MANAGEMENT
└─────────────┘             └──► needs ──────────────────────┘││
                                                              │││
┌─────────────┐                                              │││
│  REACH-II   │─────────────┬──► stress ───────────────────────┤
│  (7 items)  │             │                                  │
└─────────────┘             ├──► self_care ─────────────────┐  │
                            │                                │  │
                            ├──► social ─────────────────────┼──┼──► SOCIAL_SUPPORT
                            │                                │  │
                            ├──► efficacy ───────────────────┼──┘
                            │                                │
                            ├──► emotional ──────────────────┤
                            │                                │
                            ├──► physical ───────────────────┼─────► PHYSICAL_HEALTH
                            │                                │
                            └──► support ────────────────────┘

┌─────────────┐
│    SDOH     │─────────────┬──► financial ──────────────────┐
│  (8 items)  │             │                                 │
└─────────────┘             ├──► housing ─────────────────────┤
                            │                                 │
                            ├──► transportation ──────────────┤
                            │                                 ├──► FINANCIAL_CONCERNS
                            ├──► food ────────────────────────┤
                            │                                 │
                            ├──► legal ───────────────────────┘
                            │
                            ├──► social ──────────────────────┐
                            │                                  ├──► SOCIAL_SUPPORT
                            ├──► technology ───────────────────┘
                            │
                            └──► healthcare ──────────────────────► PHYSICAL_HEALTH
```

## Statistics
- **Total Assessments**: 4
- **Total Subscales**: 22 (unique names: 17, shared names: 5)
- **Total Pressure Zones**: 5
- **Average Subscales per Assessment**: 5.5
- **Average Subscales per Zone**: 4.4

## Shared Subscale Names
Some subscale names appear in multiple assessments:
- `stress`: EMA, REACH-II
- `self_care`: EMA, REACH-II
- `support`: EMA, REACH-II
- `social`: REACH-II, SDOH
- `physical`: REACH-II (unique, but similar to `self_care`)

## Zone Coverage
| Pressure Zone          | # Subscales | Assessments                  |
|------------------------|-------------|------------------------------|
| emotional_wellbeing    | 7           | EMA, REACH-II                |
| physical_health        | 5           | EMA, REACH-II, SDOH          |
| social_support         | 5           | EMA, REACH-II, SDOH          |
| financial_concerns     | 6           | SDOH                         |
| time_management        | 3           | EMA, CWBS                    |

## Clinical Rationale

### Emotional Wellbeing
Captures psychological distress, mood disturbances, and emotional burden - the most common pressure zone for caregivers.

### Physical Health
Tracks physical exhaustion, self-care neglect, and healthcare access - critical for preventing caregiver burnout.

### Social Support
Measures isolation, support network quality, and connection barriers - key protective factor.

### Financial Concerns
Aggregates financial stress, housing stability, food security, and legal/admin burden - social determinants of health.

### Time Management
Reflects caregiving task load and time pressure - practical stressor requiring respite services.

window.STORY_DATA = {
  title: "Where Climate Risk Is Rising Fastest in Kurdistan",
  subtitle: "What is changing, why it matters now, and which actions reduce risk first",
  audience: "For decision makers allocating climate adaptation resources in 2026-2029",
  decisionQuestion:
    "Which governorates should be prioritized this year to reduce avoidable losses in water, livelihoods, and emergency response?",
  uncertaintyNote:
    "CVI future values are scenario-based model outputs (RCP8.5), while hazard and livelihood indicators are measured or reported observations from assessment rounds.",
  governorates: [
    {
      name: "Duhok",
      cviCurrent: 0.1256,
      cviRcp85: 0.1702,
      cviChangePct: 35.5,
      implication:
        "Current CVI is low, but projected increase is steep and dust exposure is severe.",
      decision:
        "Prioritize early warning and hotspot surveillance before water stress accelerates.",
      evidence: [
        {
          metric: "CVI change (current to RCP8.5)",
          value: "+35.5%",
          evidenceType: "modeled projection",
          source: "S1"
        },
        {
          metric: "Locations reporting dust/sand storms",
          value: "100%",
          evidenceType: "measured assessment",
          source: "S2"
        }
      ]
    },
    {
      name: "Erbil",
      cviCurrent: 0.147,
      cviRcp85: 0.157,
      cviChangePct: 6.8,
      implication:
        "Heat, water reduction, and livelihood pressure are occurring at the same time.",
      decision:
        "Fund irrigation stress verification and livelihood buffering in the same planning cycle.",
      evidence: [
        {
          metric: "Locations with increased temperatures",
          value: "99%",
          evidenceType: "measured assessment",
          source: "S2"
        },
        {
          metric: "Locations with irrigation water reduction",
          value: "~67%",
          evidenceType: "measured assessment",
          source: "S2"
        },
        {
          metric: "Locations with livelihood abandonment",
          value: "33%",
          evidenceType: "measured assessment",
          source: "S2"
        }
      ]
    },
    {
      name: "Sulaymaniyah",
      cviCurrent: 0.1432,
      cviRcp85: 0.1631,
      cviChangePct: 13.9,
      implication:
        "Risk profile is mixed: strong heat and irrigation stress but non-uniform hazard patterns.",
      decision:
        "Separate infrastructure bottlenecks from climate drivers at subdistrict level before scaling interventions.",
      evidence: [
        {
          metric: "Locations with increased temperatures",
          value: "96%",
          evidenceType: "measured assessment",
          source: "S2"
        },
        {
          metric: "Locations with irrigation water reduction",
          value: "50%",
          evidenceType: "measured assessment",
          source: "S2"
        }
      ]
    },
    {
      name: "Halabja",
      cviCurrent: 0.1682,
      cviRcp85: 0.2698,
      cviChangePct: 60.4,
      implication:
        "This is the largest projected CVI escalation among the six governorates.",
      decision:
        "Move Halabja into first-wave deployment for integrated risk analytics and preparedness funding.",
      evidence: [
        {
          metric: "CVI change (current to RCP8.5)",
          value: "+60.4%",
          evidenceType: "modeled projection",
          source: "S1"
        }
      ]
    },
    {
      name: "Kirkuk",
      cviCurrent: 0.2483,
      cviRcp85: 0.2687,
      cviChangePct: 8.2,
      implication:
        "Moderate baseline with gradual upward trajectory.",
      decision:
        "Use anticipatory planning now to avoid expensive reactive spending later.",
      evidence: [
        {
          metric: "CVI change (current to RCP8.5)",
          value: "+8.2%",
          evidenceType: "modeled projection",
          source: "S1"
        }
      ]
    },
    {
      name: "Diyala",
      cviCurrent: 0.6048,
      cviRcp85: 0.6316,
      cviChangePct: 4.4,
      implication:
        "Highest current CVI in this six-governorate set.",
      decision:
        "Front-load preparedness investments and shorten hotspot response time this year.",
      evidence: [
        {
          metric: "Current CVI",
          value: "0.6048",
          evidenceType: "modeled baseline",
          source: "S1"
        }
      ]
    }
  ],
  scenarios: {
    withoutAction: [
      "Hotspots stay partially unmapped, slowing response prioritization.",
      "Irrigation stress signals remain weakly verified in the field.",
      "District planning remains uneven across governorates."
    ],
    withAction: [
      "Integrated risk profiles cover most subdistricts by year 3.",
      "Districts adopt geospatial risk layers in routine planning cycles.",
      "Field-verified alerts improve speed and confidence of response decisions."
    ]
  },
  roadmap: [
    {
      kpi: "Subdistricts with integrated risk profiles",
      baseline: 0,
      y1: 40,
      y2: 70,
      y3: 90,
      unit: "%",
      basis: "assumption target",
      source: "S4"
    },
    {
      kpi: "Unmapped high-risk hotspots",
      baseline: 100,
      y1: 80,
      y2: 60,
      y3: 40,
      unit: "index",
      basis: "assumption target",
      source: "S4"
    },
    {
      kpi: "District plans using geospatial risk layers",
      baseline: 0,
      y1: 35,
      y2: 65,
      y3: 85,
      unit: "%",
      basis: "assumption target",
      source: "S4"
    },
    {
      kpi: "Time to prioritize response hotspots",
      baseline: 100,
      y1: 80,
      y2: 65,
      y3: 50,
      unit: "index",
      basis: "assumption target",
      source: "S4"
    },
    {
      kpi: "Irrigation stress alerts with verified field follow-up",
      baseline: 0,
      y1: 50,
      y2: 75,
      y3: 90,
      unit: "%",
      basis: "assumption target",
      source: "S4"
    }
  ],
  sources: [
    {
      id: "S1",
      short: "UNDP CVI 2026",
      title: "UNDP Iraq Climatic Vulnerability Index (full report)",
      year: 2026,
      url: "https://www.undp.org/sites/g/files/zskgke326/files/2026-03/cvi-full-report-en_.pdf"
    },
    {
      id: "S2",
      short: "IOM KRI CVA 2024",
      title: "IOM Climate Vulnerability Assessment in the Kurdistan Region of Iraq",
      year: 2024,
      url: "https://iraqdtm.iom.int/files/Climate/2024624628127_CVA_KRI_v12.pdf"
    },
    {
      id: "S3",
      short: "KRG LAMA 2026",
      title: "Kurdistan Region Locally Appropriate Mitigation Actions Plan",
      year: 2026,
      url: "https://www.undp.org/sites/g/files/zskgke326/files/2026-02/krg_lama_english_final_12.1.2026.pdf"
    },
    {
      id: "S4",
      short: "Proposal KPI Model",
      title: "Proposal expected change KPI model (assumption-labeled)",
      year: 2026,
      url: "./data/kpi_targets.csv"
    }
  ],
  culturalPracticeNote:
    "Community-level interpretation and local language adaptation should be validated with governorate stakeholders before final policy adoption."
};

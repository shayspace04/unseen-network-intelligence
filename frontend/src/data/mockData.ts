import { 
  Scenario, 
  Investigation, 
  AgentInfo, 
  AgentMessage, 
  EvidenceItem, 
  CompetingHypothesis, 
  DiagnosticReport, 
  NetworkNodeData,
  DeviceTelemetry
} from '../types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'dhcp-starvation',
    name: 'Localized DHCP Pool Exhaustion',
    badge: 'Primary Benchmark',
    category: 'IPAM / L2-L3',
    description: '500 monitored devices across campus. Overall health registers at 98.8%, but 6 students in Engineering Wing B fail to establish IP bindings due to a rogue device exhausting the /24 dynamic pool.',
    monitoredDevices: 500,
    healthyDevices: 494,
    affectedDevices: 6,
    aggregateHealthPct: 98.8,
    affectedZone: 'Engineering Wing B — 2nd Floor',
    suspectedFault: 'DHCP Pool Exhaustion (Scope VLAN-142)',
    confidenceScore: 0.94,
    symptoms: [
      'DHCP Discover frames sent with zero DHCP Offer acknowledgments',
      'AP-ENG-04 signal strength optimal (-54 dBm) yet no IP routing',
      'Aggregate campus latency normal at 4.2ms, masking the localized failure'
    ],
    recommendedFix: 'Reclaim expired DHCP leases, increase VLAN-142 lease scope from /24 to /23, and quarantine MAC 00:1A:2B:3C:4D:5E.'
  },
  {
    id: 'wifi-degradation',
    name: 'Asymmetric Wi-Fi Co-Channel Contention',
    badge: 'RF Anomaly',
    category: '802.11 / Physical RF',
    description: 'Science Complex AP-12 experiences 28% frame retries and 42% CRC errors caused by an unmanaged mobile hotspot emitting on 5.180 GHz (Ch 36). 8 workstations affected while campus aggregate remains 98.7%.',
    monitoredDevices: 620,
    healthyDevices: 612,
    affectedDevices: 8,
    aggregateHealthPct: 98.7,
    affectedZone: 'Science Complex — Lab 401',
    suspectedFault: 'Co-Channel Contention & High Retry Count (AP-SCI-12)',
    confidenceScore: 0.89,
    symptoms: [
      'Layer 2 beacon retransmissions spike to 28.4%',
      'Downlink TCP goodput collapses below 350 Kbps',
      'Adjacent AP-SCI-11 on non-overlapping channel operates at 100% throughput'
    ],
    recommendedFix: 'Enable dynamic channel assignment (RRM), shift AP-SCI-12 to DFS Channel 52, and enforce rogue AP containment.'
  },
  {
    id: 'shared-link-congestion',
    name: 'Shared Uplink Microburst Bufferbloat',
    badge: 'Switching / QoS',
    category: 'L2 Switching',
    description: 'Dormitory Switch SW-DORM-03 suffers periodic buffer drops during high-volume research data staging. 12 workstations experience p99 packet loss while core aggregate indicates 98.5% uptime.',
    monitoredDevices: 850,
    healthyDevices: 838,
    affectedDevices: 12,
    aggregateHealthPct: 98.5,
    affectedZone: 'North Residence Hall — Block C',
    suspectedFault: 'Egress Buffer Exhaustion on 10G Trunk 04',
    confidenceScore: 0.92,
    symptoms: [
      'Egress queue drop counters escalating on interface Te1/0/4',
      'Average latency 6ms jumps abruptly to 480ms under 200ms burst windows',
      'Non-bursting peers on adjacent switch SW-DORM-02 completely unaffected'
    ],
    recommendedFix: 'Reconfigure weighted random early detection (WRED) queue thresholds and enable flow control on Te1/0/4.'
  },
  {
    id: 'dns-resolver-silent-drop',
    name: 'Secondary DNS Anycast Silent Drop',
    badge: 'Services / L7',
    category: 'DNS / Transport',
    description: 'Medical Research tablet endpoints experience silent UDP packet discard when querying secondary resolver 10.10.0.53 due to asymmetric BGP return route. 9 pathology tablets frozen.',
    monitoredDevices: 420,
    healthyDevices: 411,
    affectedDevices: 9,
    aggregateHealthPct: 97.8,
    affectedZone: 'Medical Research Wing — Pathology Imaging',
    suspectedFault: 'Asymmetric Return Route causing DNS Timeout',
    confidenceScore: 0.95,
    symptoms: [
      'UDP/53 queries to 10.10.0.53 experience 100% loss after 15-minute lease',
      'TCP fallback succeeds but creates 2.8s application render delay',
      'Direct IP HTTP fetches operate normally without packet degradation'
    ],
    recommendedFix: 'Withdraw faulty Anycast BGP prefix from Router R-MED-02 and balance traffic to primary DNS cluster.'
  },
  {
    id: 'multiple-simultaneous-faults',
    name: 'Multi-Fault Cascading Incident',
    badge: 'Complex Fault',
    category: 'Cascade (L2 + L3)',
    description: 'Intermittent fiber link flapping on Core Distribution combined with rogue DHCP server responding on VLAN-110. 18 devices failing across two distinct wings while global average reads 96.5%.',
    monitoredDevices: 520,
    healthyDevices: 502,
    affectedDevices: 18,
    aggregateHealthPct: 96.5,
    affectedZone: 'Engineering & Computing Labs',
    suspectedFault: 'Correlated Rogue Server + Transceiver Optical Degradation',
    confidenceScore: 0.86,
    symptoms: [
      'Dual fault signatures: conflicting default gateways (10.110.1.1 vs 10.110.1.254)',
      'CRC optical RX power on Core Link 2 below -22 dBm sensitivity threshold',
      'Bimodal latency distribution in affected cohort'
    ],
    recommendedFix: 'Activate DHCP Snooping with Option 82 on SW-ENG-DIST-01 and dispatch technician to clean LC optical patch.'
  },
  {
    id: 'healthy-baseline',
    name: 'Nominal Baseline (All Zones Healthy)',
    badge: 'Control Group',
    category: 'Healthy Benchmark',
    description: 'All 500 campus devices operating within strict SLA parameters. Zero pool saturation, low noise floor, zero packet drops.',
    monitoredDevices: 500,
    healthyDevices: 500,
    affectedDevices: 0,
    aggregateHealthPct: 100.0,
    affectedZone: 'Campus Wide (All Zones)',
    suspectedFault: 'None — Normal Operations',
    confidenceScore: 0.99,
    symptoms: [
      'Campus-wide mean latency: 3.8ms (Jitter: 0.4ms)',
      'DHCP scope utilization across all 18 VLANs: 64.2%',
      'Zero reported client association drops in past 48 hours'
    ],
    recommendedFix: 'No remedial action necessary. Baseline telemetry recorded.'
  },
  {
    id: 'ethernet-interface-fault',
    name: 'Data Center Compute Pod - Physical Interface Degradation & CRC Errors',
    badge: 'Physical L1/L2',
    category: 'Ethernet / PHY',
    description: '540 compute nodes monitored. Global health reads 98.1%, but 10 compute hosts connected to SW-ENG-EDGE-02 suffer physical link frame corruption with rising interface CRC error counters and 21% packet loss.',
    monitoredDevices: 540,
    healthyDevices: 530,
    affectedDevices: 10,
    aggregateHealthPct: 98.1,
    affectedZone: 'Data Center Compute Pod 3',
    suspectedFault: 'Symptom: Escalating interface CRC errors, frame alignment drops, and link flapping on SW-ENG-EDGE-02',
    confidenceScore: 0.94,
    symptoms: [
      'Interface error counters spiking: 380+ CRC/FCS frame errors per 60s sampling epoch',
      'Downlink packet loss 21.4% with physical link instability, while round-trip latency remains low (14ms)',
      'Adjacent ports on same switch SW-ENG-EDGE-02 report 0 interface errors and 0% loss'
    ],
    recommendedFix: 'Replace degraded Cat6A / SFP+ patch cable on SW-ENG-EDGE-02 Port 8; clean optical ferrule and reseat transceiver.'
  }
];

export const INITIAL_INVESTIGATIONS: Investigation[] = [
  {
    id: 'INV-2026-0841',
    title: 'The 98.8% Fallacy: 6 Disconnected Students in Engineering Wing B',
    zone: 'Engineering Wing B — 2nd Floor',
    affectedCount: 6,
    healthyCount: 494,
    monitoredCount: 500,
    aggregateHealthPct: 98.8,
    suspectedFault: 'DHCP Pool Exhaustion (Scope VLAN-142)',
    confidence: 0.94,
    status: 'investigating',
    timestamp: '2026-10-31 14:18:22',
    leadAgent: 'Adjudicator',
    summary: 'While executive dashboard displays 98.8% health, Population Observer isolated 6 student devices with zero IP leases despite valid Wi-Fi 6 authentication on AP-ENG-04.',
    primaryDependency: 'DHCP Server pool: 10.142.0.0/24 (Shared uplink: SW-ENG-CORE-02)',
    symptoms: [
      'Clients receive 0.0.0.0 / APIPA (169.254.x.x)',
      'Adjacent clients with existing leases show nominal 4ms latency',
      'DHCP pool allocation at 254/254 addresses'
    ],
    affectedSubnet: '10.142.0.0/24'
  },
  {
    id: 'INV-2026-0839',
    title: 'Science Complex Lab 401 Wi-Fi Degradation',
    zone: 'Science Complex — Lab 401',
    affectedCount: 8,
    healthyCount: 612,
    monitoredCount: 620,
    aggregateHealthPct: 98.7,
    suspectedFault: 'Co-Channel Contention & High Retry Count (AP-SCI-12)',
    confidence: 0.89,
    status: 'active',
    timestamp: '2026-10-31 13:42:05',
    leadAgent: 'Fault Investigator',
    summary: 'Localized 2.4/5GHz interference detected impacting 8 student devices connected to AP-SCI-12. Surrounding labs operate without anomaly.',
    primaryDependency: 'Access Point: AP-SCI-12 (Channel 36, 80MHz)',
    symptoms: [
      'Frame retransmit rate: 28.4% (Campus avg: 1.2%)',
      'TCP handshake latency: 320ms',
      'RSSI remains strong at -52 dBm'
    ],
    affectedSubnet: '10.120.4.0/24'
  },
  {
    id: 'INV-2026-0832',
    title: 'Residence Hall Switch SW-DORM-03 Microburst Latency',
    zone: 'North Residence Hall — Block C',
    affectedCount: 12,
    healthyCount: 838,
    monitoredCount: 850,
    aggregateHealthPct: 98.5,
    suspectedFault: 'Egress Buffer Exhaustion on 10G Trunk 04',
    confidence: 0.92,
    status: 'active',
    timestamp: '2026-10-31 11:15:30',
    leadAgent: 'Topology Investigator',
    summary: '12 devices in Block C suffer periodic connection drops during 200ms burst windows. Upstream aggregators hide the spike due to 60-second polling intervals.',
    primaryDependency: 'Trunk: SW-DORM-03 -> SW-CORE-NORTH (Port Te1/0/4)',
    symptoms: [
      'Tail latency p99 exceeds 480ms',
      'QoS tail drops detected on queue 3',
      'Downstream APs report normal RF health'
    ],
    affectedSubnet: '10.180.2.0/23'
  },
  {
    id: 'INV-2026-0824',
    title: 'Medical Research Secondary DNS Silently Dropping Requests',
    zone: 'Medical Research Wing — Pathology Imaging',
    affectedCount: 9,
    healthyCount: 411,
    monitoredCount: 420,
    aggregateHealthPct: 97.8,
    suspectedFault: 'Asymmetric Return Route causing DNS Timeout',
    confidence: 0.95,
    status: 'resolved',
    timestamp: '2026-10-31 09:02:11',
    leadAgent: 'Adjudicator',
    summary: 'Automated adjudication confirmed Anycast DNS node 10.10.0.53 failing to respond to 9 diagnostic tablets after TTL timeout.',
    primaryDependency: 'DNS Anycast Resolver 10.10.0.53 via Router R-MED-02',
    symptoms: [
      'DNS timeout threshold exceeded (4000ms)',
      'Fallback to secondary resolver successful',
      'Zero loss on direct TCP transactions'
    ],
    affectedSubnet: '10.10.8.0/24'
  }
];

export const AGENTS: AgentInfo[] = [
  {
    id: 'agent-pop-observer',
    name: 'Population Observer',
    role: 'Anomaly & Cluster Discovery',
    responsibility: 'Identifies anomalous micro-populations suffering network degradation while overall aggregate metrics report healthy averages.',
    status: 'active',
    latestFinding: 'Isolated cohort of 6 devices in Engineering Wing B with 100% IP negotiation failure despite 98.8% campus aggregate.',
    lastActive: 'Just now',
    confidenceScore: 0.98,
    iconName: 'Eye',
    agentTag: 'AGENT-POP-01',
    processedItems: 500
  },
  {
    id: 'agent-counterfactual',
    name: 'Counterfactual Agent',
    role: 'Cohort Differential Analysis',
    responsibility: 'Constructs twin-cohort comparisons. Asks: "What specific environmental or topological properties differentiate failing devices from healthy peers on the same floor?"',
    status: 'analyzing',
    latestFinding: 'Discovered that 494 healthy peers hold pre-existing DHCP leases, while all 6 failing devices attempted lease renewal within the last 18 minutes.',
    lastActive: '45s ago',
    confidenceScore: 0.95,
    iconName: 'GitCompare',
    agentTag: 'AGENT-CTF-02',
    processedItems: 42
  },
  {
    id: 'agent-topology',
    name: 'Topology Investigator',
    role: 'Dependency & Path Traversal',
    responsibility: 'Traverses L2/L3 dependency graphs, VLAN boundaries, switch ports, and upstream trunks shared uniquely by affected devices.',
    status: 'analyzing',
    latestFinding: 'All 6 affected devices converge on Access Point AP-ENG-04 -> Switch SW-ENG-EDGE-02 -> VLAN-142 DHCP Helper 10.142.0.1.',
    lastActive: '1m ago',
    confidenceScore: 0.93,
    iconName: 'Network',
    agentTag: 'AGENT-TOP-03',
    processedItems: 18
  },
  {
    id: 'agent-fault-investigator',
    name: 'Fault Investigator',
    role: 'Empirical Root-Cause Testing',
    responsibility: 'Falsifies candidate failure modes across physical RF, link negotiation, IPAM lease state, routing tables, and DNS health.',
    status: 'debating',
    latestFinding: 'Ruled out RF degradation (RSSI -54 dBm, SNR 32dB). Confirmed DHCP Discover broadcast sent without receiving DHCP Offer.',
    lastActive: '2m ago',
    confidenceScore: 0.91,
    iconName: 'AlertTriangle',
    agentTag: 'AGENT-FLT-04',
    processedItems: 6
  },
  {
    id: 'agent-adjudicator',
    name: 'Adjudicator',
    role: 'Consensus & Evidence Synthesis',
    responsibility: 'Aggregates findings, challenges unverified assumptions, computes joint confidence, and produces the finalized diagnostic report.',
    status: 'verified',
    latestFinding: 'Consensus reached: 94% confidence in DHCP scope starvation on VLAN-142. Competing RF interference hypothesis refuted.',
    lastActive: 'Just now',
    confidenceScore: 0.94,
    iconName: 'ShieldCheck',
    agentTag: 'AGENT-ADJ-05',
    processedItems: 5
  }
];

export const AGENT_MESSAGES: AgentMessage[] = [
  {
    id: 'msg-01',
    fromAgent: 'Population Observer',
    toAgent: 'Counterfactual Agent',
    type: 'hypothesis',
    timestamp: '14:18:24.102',
    topic: 'Anomalous Sub-Cohort Identified',
    payload: {
      alert: "POPULATION_ANOMALY_DETECTED",
      cohort_size: 6,
      total_monitored: 500,
      zone: "Engineering Wing B",
      anomaly_signature: "Zero IP traffic / APIPA assigned",
      aggregate_health: "98.8%"
    },
    verdict: 'supported'
  },
  {
    id: 'msg-02',
    fromAgent: 'Counterfactual Agent',
    toAgent: 'Topology Investigator',
    type: 'telemetry_challenge',
    timestamp: '14:18:25.420',
    topic: 'Cohort Differential Request',
    payload: {
      affected_devices: ["DEV-ENG-081", "DEV-ENG-082", "DEV-ENG-083", "DEV-ENG-084", "DEV-ENG-085", "DEV-ENG-086"],
      healthy_twins_sample: ["DEV-ENG-071", "DEV-ENG-072", "DEV-ENG-073"],
      differential_features: ["Lease timestamp: <20m ago for failing", "Existing valid lease: 494 healthy devices"]
    },
    verdict: 'supported'
  },
  {
    id: 'msg-03',
    fromAgent: 'Topology Investigator',
    toAgent: 'Fault Investigator',
    type: 'topology_query',
    timestamp: '14:18:27.810',
    topic: 'Path Convergence Map',
    payload: {
      shared_ap: "AP-ENG-04",
      shared_edge_switch: "SW-ENG-EDGE-02",
      vlan_tag: 142,
      dhcp_helper_ip: "10.142.0.1",
      upstream_core: "SW-ENG-CORE-02",
      path_redundancy: "Normal"
    },
    verdict: 'supported'
  },
  {
    id: 'msg-04',
    fromAgent: 'Fault Investigator',
    toAgent: 'Adjudicator',
    type: 'hypothesis',
    timestamp: '14:18:30.150',
    topic: 'Hypothesis A vs Hypothesis B',
    payload: {
      hypothesis_a: {
        title: "DHCP Pool Exhaustion (Scope VLAN-142)",
        probability: 0.94,
        evidence: "254 of 254 leases bound; incoming DISCOVER dropped"
      },
      hypothesis_b: {
        title: "Wi-Fi RF Channel Congestion",
        probability: 0.06,
        evidence: "RSSI is -54 dBm, SNR is 32dB (Refuted: RF is optimal)"
      }
    },
    verdict: 'supported'
  },
  {
    id: 'msg-05',
    fromAgent: 'Adjudicator',
    toAgent: 'Population Observer',
    type: 'adjudication',
    timestamp: '14:18:32.680',
    topic: 'Final Consensus Verdict',
    payload: {
      verdict: "PROBABLE_FAULT",
      root_cause: "DHCP Pool Exhaustion on VLAN-142",
      confidence: 0.94,
      affected_count: 6,
      healthy_count: 494,
      action: "Quarantine MAC 00:1A:2B:3C:4D:5E & Expand Scope to /23"
    },
    verdict: 'supported'
  }
];

export const SUPPORTING_EVIDENCE: EvidenceItem[] = [
  {
    id: 'ev-01',
    category: 'supporting',
    metric: 'DHCP Pool Allocation',
    observation: '254 out of 254 available leases in subnet 10.142.0.0/24 are active (100% capacity).',
    comparisonNote: 'Failing devices sent 4 consecutive DHCPDISCOVER broadcasts with 0 DHCPOFFER replies returned.',
    impactWeight: 'Critical (High)',
    sourceAgent: 'Fault Investigator',
    timestamp: '14:18:28'
  },
  {
    id: 'ev-02',
    category: 'supporting',
    metric: 'Lease Expiration Timeline',
    observation: 'All 6 affected devices attempted association between 14:02 and 14:15 after their prior 24hr lease expired.',
    comparisonNote: 'The 494 healthy devices hold active leases with an average of 14.2 hours remaining.',
    impactWeight: 'High',
    sourceAgent: 'Counterfactual Agent',
    timestamp: '14:18:26'
  },
  {
    id: 'ev-03',
    category: 'supporting',
    metric: 'VLAN-142 Gateway Ping',
    observation: 'Default gateway 10.142.0.1 responds with 1.2ms latency to all pre-assigned static devices.',
    comparisonNote: 'L3 routing engine is operating without packet loss; failure is strictly confined to IPAM negotiation.',
    impactWeight: 'Medium',
    sourceAgent: 'Topology Investigator',
    timestamp: '14:18:27'
  }
];

export const CONTRADICTING_EVIDENCE: EvidenceItem[] = [
  {
    id: 'ev-04',
    category: 'contradicting',
    metric: 'Wi-Fi 6 RSSI & SNR',
    observation: 'Measured RSSI is -54 dBm and SNR is 32 dB across all 6 failing laptops at AP-ENG-04.',
    comparisonNote: 'Refutes the hypothesis that physical wireless distance or antenna attenuation caused the disconnection.',
    impactWeight: 'Decisive (Refutation)',
    sourceAgent: 'Fault Investigator',
    timestamp: '14:18:29'
  },
  {
    id: 'ev-05',
    category: 'contradicting',
    metric: 'Uplink Trunk Bandwidth Utilization',
    observation: 'SW-ENG-EDGE-02 uplink to Core switch is at 18.4% capacity (816 Mbps / 10 Gbps).',
    comparisonNote: 'Refutes link congestion or throughput saturation as the bottleneck.',
    impactWeight: 'Decisive (Refutation)',
    sourceAgent: 'Topology Investigator',
    timestamp: '14:18:28'
  }
];

export const COMPETING_HYPOTHESES: CompetingHypothesis[] = [
  {
    id: 'hypo-01',
    title: 'DHCP Scope Exhaustion on VLAN-142',
    proposedBy: 'Fault Investigator',
    probability: 0.94,
    status: 'leading',
    supportingArgs: [
      'Pool table is 100% full (254/254 leases bound)',
      'All 6 affected devices show APIPA address (169.254.x.x)',
      'Zero DHCPOFFER frames captured on wire for affected MACs'
    ],
    counterArgs: [
      'None. Verified against IPAM live state database'
    ],
    adjudicationNote: 'Adjudicator verified high statistical correlation (p < 0.001) between lease request time and failure.'
  },
  {
    id: 'hypo-02',
    title: 'Wi-Fi RF Interference / Co-Channel Contention',
    proposedBy: 'Population Observer (Initial Triangulation)',
    probability: 0.04,
    status: 'refuted',
    supportingArgs: [
      'All 6 clients associate with the same physical Access Point (AP-ENG-04)'
    ],
    counterArgs: [
      'Signal quality is excellent (-54 dBm, SNR 32 dB)',
      '18 neighboring clients on same AP transfer at 140+ Mbps'
    ],
    adjudicationNote: 'Refuted by Fault Investigator after RF channel spectral analysis.'
  },
  {
    id: 'hypo-03',
    title: 'Upstream Switch Port Security / 802.1X Auth Drop',
    proposedBy: 'Topology Investigator',
    probability: 0.02,
    status: 'refuted',
    supportingArgs: [
      'Clients are all student personal devices'
    ],
    counterArgs: [
      'Radius authentication server logs show SUCCESS for all 6 EAP-TLS handshakes'
    ],
    adjudicationNote: 'Radius audit log confirms authentication succeeded before IP allocation step.'
  }
];

export const TWIN_COHORT_COMPARISON = [
  {
    metric: 'Monitored Population',
    affectedCohort: '6 Devices (1.2%)',
    healthyTwinCohort: '494 Devices (98.8%)',
    verdict: 'Extreme Localized Divergence'
  },
  {
    metric: 'Physical Access Point',
    affectedCohort: 'AP-ENG-04 (100%)',
    healthyTwinCohort: 'AP-ENG-04 (18 devices) + Campus (476 devices)',
    verdict: 'Shared AP is not defective'
  },
  {
    metric: 'Wireless Signal (RSSI)',
    affectedCohort: '-54 dBm (Excellent)',
    healthyTwinCohort: '-56 dBm (Normal)',
    verdict: 'RF layer identical'
  },
  {
    metric: '802.1X Association',
    affectedCohort: 'Authenticated (EAP-TLS)',
    healthyTwinCohort: 'Authenticated (EAP-TLS)',
    verdict: 'L2 Auth identical'
  },
  {
    metric: 'IPv4 Address Binding',
    affectedCohort: '169.254.0.0/16 (APIPA Failed)',
    healthyTwinCohort: '10.142.0.x (Valid DHCP Lease)',
    verdict: 'Smoking Gun (DHCP Starvation)'
  },
  {
    metric: 'Lease Acquired Time',
    affectedCohort: 'Last 18 mins (Request Rejected)',
    healthyTwinCohort: '> 4 hrs ago (Active Lease)',
    verdict: 'State differential verified'
  }
];

export const DIAGNOSTIC_REPORTS: DiagnosticReport[] = [
  {
    id: 'REP-2026-0841',
    incidentId: 'INV-2026-0841',
    title: 'Root Cause Adjudication: VLAN-142 Scope Saturation Masked by Aggregate Health',
    createdAt: '2026-10-31 14:19:00',
    leadAdjudicator: 'Agent Adjudicator (AGENT-ADJ-05)',
    confidenceLevel: 0.94,
    severity: 'Critical',
    zone: 'Engineering Wing B — 2nd Floor',
    executiveSummary: 'Executive overview registered 98.8% network health across 500 devices. UNSEEN isolated an invisible pocket of 6 disconnected devices in Engineering Wing B. Multi-agent debate ruled out RF noise and verified DHCP pool exhaustion on VLAN-142.',
    rootCauseAnalysis: 'Subnet 10.142.0.0/24 was provisioned with a 254-address scope. A non-compliant sensor (MAC 00:1A:2B:3C:4D:5E) repeatedly requested unique leases via MAC spoofing, filling the final 14 available IP slots. Subsequent student associations received no DHCPOFFER packets.',
    counterfactualDelta: 'Comparing 6 failing devices against 494 healthy peers isolated the variable: failing devices entered renewal window after pool saturation, while healthy peers retained unexpired leases.',
    telemetryEvidenceCount: 8,
    agentTranscriptsCount: 5,
    recommendedActions: [
      {
        action: 'Quarantine rogue MAC 00:1A:2B:3C:4D:5E via Port-Security ACL',
        urgency: 'immediate',
        estimatedResolution: '< 2 mins',
        targetSystem: 'SW-ENG-EDGE-02'
      },
      {
        action: 'Clear stale leases and expand DHCP pool to /23 subnet (510 hosts)',
        urgency: 'immediate',
        estimatedResolution: '< 5 mins',
        targetSystem: 'Infoblox / Kea IPAM'
      },
      {
        action: 'Configure DHCP Snooping Rate-Limiting on edge access ports',
        urgency: 'preventative',
        estimatedResolution: 'Within 24 hours',
        targetSystem: 'Engineering Core Switching'
      }
    ]
  },
  {
    id: 'REP-2026-0839',
    incidentId: 'INV-2026-0839',
    title: 'Adjudication Report: 5.180GHz Co-Channel RF Interference in Science Lab 401',
    createdAt: '2026-10-31 13:45:00',
    leadAdjudicator: 'Agent Adjudicator (AGENT-ADJ-05)',
    confidenceLevel: 0.89,
    severity: 'Major',
    zone: 'Science Complex — Lab 401',
    executiveSummary: '8 workstations experienced 28% frame loss. Automated agents localized the interference to a non-standard 80MHz channel deployment clashing with building automation radar test equipment.',
    rootCauseAnalysis: 'High retry counter exceeding threshold by 24x on AP-SCI-12 caused by co-channel contention on Channel 36.',
    counterfactualDelta: 'Adjacent Lab 402 on Channel 44 experienced 0.1% retry rate with identical hardware specifications.',
    telemetryEvidenceCount: 6,
    agentTranscriptsCount: 4,
    recommendedActions: [
      {
        action: 'Shift AP-SCI-12 channel allocation to UNII-2 DFS Channel 52',
        urgency: 'immediate',
        estimatedResolution: '< 1 min',
        targetSystem: 'Cisco DNA / Aruba Central'
      },
      {
        action: 'Reduce channel width from 80MHz to 40MHz in high-density lab zones',
        urgency: 'scheduled',
        estimatedResolution: 'During maintenance window',
        targetSystem: 'WLAN Controller'
      }
    ]
  }
];

export const CAMPUS_TOPOLOGY_NODES: Array<{ id: string; type: string; position: { x: number; y: number }; data: NetworkNodeData }> = [
  // Core Tier
  {
    id: 'core-router',
    type: 'networkNode',
    position: { x: 380, y: 30 },
    data: {
      id: 'core-router',
      label: 'Campus Core Gateway (R-CAMPUS-01)',
      type: 'router',
      status: 'healthy',
      zone: 'Data Center 1',
      ip: '10.0.0.1',
      throughput: '14.2 Gbps',
      packetLoss: '0.001%',
      connectedDevices: 500,
      details: {
        model: 'Cisco Catalyst 9600 Core',
        firmware: 'IOS-XE 17.9.4',
        uptime: '284 days',
        cpuLoad: '14%',
        memoryLoad: '38%',
        alarms: []
      }
    }
  },

  // Distribution Tier
  {
    id: 'dist-sw-eng',
    type: 'networkNode',
    position: { x: 160, y: 150 },
    data: {
      id: 'dist-sw-eng',
      label: 'Eng Distribution (SW-ENG-CORE-02)',
      type: 'switch',
      status: 'warning',
      zone: 'Engineering Quad',
      ip: '10.140.0.2',
      throughput: '2.4 Gbps',
      packetLoss: '0.02%',
      connectedDevices: 180,
      affectedCount: 6,
      details: {
        model: 'Aruba CX 8325 32-port 40G',
        firmware: 'AOS-CX 10.12',
        uptime: '142 days',
        cpuLoad: '28%',
        memoryLoad: '44%',
        alarms: ['DHCP Scope 10.142.0.0/24 capacity critical (100%)']
      }
    }
  },
  {
    id: 'dist-sw-sci',
    type: 'networkNode',
    position: { x: 600, y: 150 },
    data: {
      id: 'dist-sw-sci',
      label: 'Science Distribution (SW-SCI-CORE-01)',
      type: 'switch',
      status: 'healthy',
      zone: 'Science Complex',
      ip: '10.120.0.2',
      throughput: '3.1 Gbps',
      packetLoss: '0.00%',
      connectedDevices: 320,
      details: {
        model: 'Aruba CX 8325 32-port 40G',
        firmware: 'AOS-CX 10.12',
        uptime: '96 days',
        cpuLoad: '19%',
        memoryLoad: '36%',
        alarms: []
      }
    }
  },

  // Access Tier - Engineering
  {
    id: 'edge-sw-eng-02',
    type: 'networkNode',
    position: { x: 60, y: 280 },
    data: {
      id: 'edge-sw-eng-02',
      label: 'Edge Switch (SW-ENG-EDGE-02)',
      type: 'switch',
      status: 'warning',
      zone: 'Engineering Wing B',
      ip: '10.142.0.2',
      throughput: '680 Mbps',
      packetLoss: '0.05%',
      connectedDevices: 48,
      affectedCount: 6,
      details: {
        model: 'Catalyst 9300 48-port PoE+',
        firmware: 'IOS-XE 17.6',
        uptime: '81 days',
        cpuLoad: '22%',
        memoryLoad: '41%',
        alarms: ['DHCP NACK count high on port Gi1/0/14']
      }
    }
  },
  {
    id: 'ap-eng-04',
    type: 'networkNode',
    position: { x: 60, y: 400 },
    data: {
      id: 'ap-eng-04',
      label: 'Wi-Fi 6 AP (AP-ENG-04)',
      type: 'access-point',
      status: 'fault',
      zone: 'Engineering Wing B — 2nd Floor',
      ip: '10.142.0.45',
      throughput: '142 Mbps',
      packetLoss: '12.4%',
      connectedDevices: 24,
      affectedCount: 6,
      details: {
        model: 'Cisco Catalyst 9130AX Series',
        firmware: 'Capwap 17.9',
        uptime: '45 days',
        cpuLoad: '31%',
        memoryLoad: '52%',
        alarms: [
          'APIPA Fallback detected on 6 client stations',
          'DHCP Relay acknowledgment timeout'
        ]
      }
    }
  },

  // Access Tier - Science
  {
    id: 'ap-sci-08',
    type: 'networkNode',
    position: { x: 520, y: 280 },
    data: {
      id: 'ap-sci-08',
      label: 'Wi-Fi 6 AP (AP-SCI-08)',
      type: 'access-point',
      status: 'healthy',
      zone: 'Science Complex — 1st Floor',
      ip: '10.120.1.18',
      throughput: '210 Mbps',
      packetLoss: '0.00%',
      connectedDevices: 32,
      details: {
        model: 'Cisco Catalyst 9130AX Series',
        firmware: 'Capwap 17.9',
        uptime: '96 days',
        cpuLoad: '18%',
        memoryLoad: '42%',
        alarms: []
      }
    }
  },
  {
    id: 'ap-sci-12',
    type: 'networkNode',
    position: { x: 700, y: 280 },
    data: {
      id: 'ap-sci-12',
      label: 'Wi-Fi 6 AP (AP-SCI-12)',
      type: 'access-point',
      status: 'healthy',
      zone: 'Science Complex — Lab 401',
      ip: '10.120.4.22',
      throughput: '180 Mbps',
      packetLoss: '0.01%',
      connectedDevices: 28,
      details: {
        model: 'Cisco Catalyst 9130AX Series',
        firmware: 'Capwap 17.9',
        uptime: '96 days',
        cpuLoad: '19%',
        memoryLoad: '40%',
        alarms: []
      }
    }
  },

  // Service / VLAN Tier
  {
    id: 'vlan-142',
    type: 'networkNode',
    position: { x: 260, y: 280 },
    data: {
      id: 'vlan-142',
      label: 'VLAN 142 (Eng Student Pool /24)',
      type: 'vlan',
      status: 'fault',
      zone: 'Engineering Segment',
      ip: '10.142.0.0/24',
      throughput: '412 Mbps',
      packetLoss: '2.8%',
      connectedDevices: 254,
      affectedCount: 6,
      details: {
        model: 'Virtual Subnet Definition',
        firmware: 'L3 SVI',
        uptime: 'Continuous',
        cpuLoad: 'N/A',
        memoryLoad: 'N/A',
        alarms: ['Scope 100% full: 254/254 active leases']
      }
    }
  },

  // Affected Endpoints
  {
    id: 'dev-eng-failing',
    type: 'networkNode',
    position: { x: 60, y: 530 },
    data: {
      id: 'dev-eng-failing',
      label: '6 Affected Student Laptops',
      type: 'device',
      status: 'fault',
      zone: 'Engineering Wing B — Room 204',
      ip: '169.254.81.12 - 169.254.81.18 (APIPA)',
      throughput: '0 Kbps',
      packetLoss: '100.0%',
      affectedCount: 6,
      details: {
        model: 'MacBook Pro / Dell XPS Laptops',
        firmware: 'macOS 15.1 / Windows 11',
        uptime: 'Disconnected',
        alarms: [
          'No IPv4 Gateway lease obtained',
          'DHCP Discover timeout counter: 28'
        ]
      }
    }
  },

  // Healthy Endpoints
  {
    id: 'dev-eng-healthy',
    type: 'networkNode',
    position: { x: 260, y: 450 },
    data: {
      id: 'dev-eng-healthy',
      label: '494 Healthy Campus Devices',
      type: 'device',
      status: 'healthy',
      zone: 'Campus Wide',
      ip: '10.142.0.x / 10.120.x.x',
      throughput: '12.8 Gbps',
      packetLoss: '0.00%',
      connectedDevices: 494,
      details: {
        model: 'Mixed Endpoints (Laptops, Tablets, Workstations)',
        firmware: 'Various',
        uptime: 'Online',
        alarms: []
      }
    }
  }
];

export const CAMPUS_TOPOLOGY_EDGES = [
  { id: 'e-core-disteng', source: 'core-router', target: 'dist-sw-eng', animated: true, style: { stroke: '#64748B', strokeWidth: 2 } },
  { id: 'e-core-distsci', source: 'core-router', target: 'dist-sw-sci', animated: true, style: { stroke: '#64748B', strokeWidth: 2 } },
  { id: 'e-disteng-edge02', source: 'dist-sw-eng', target: 'edge-sw-eng-02', animated: true, style: { stroke: '#F59E0B', strokeWidth: 2 } },
  { id: 'e-disteng-vlan142', source: 'dist-sw-eng', target: 'vlan-142', animated: true, style: { stroke: '#EF4444', strokeWidth: 2 } },
  { id: 'e-edge02-ap04', source: 'edge-sw-eng-02', target: 'ap-eng-04', animated: true, style: { stroke: '#EF4444', strokeWidth: 2 } },
  { id: 'e-ap04-devfailing', source: 'ap-eng-04', target: 'dev-eng-failing', animated: true, style: { stroke: '#EF4444', strokeWidth: 2, strokeDasharray: '4 4' } },
  { id: 'e-distsci-ap08', source: 'dist-sw-sci', target: 'ap-sci-08', animated: true, style: { stroke: '#10B981', strokeWidth: 2 } },
  { id: 'e-distsci-ap12', source: 'dist-sw-sci', target: 'ap-sci-12', animated: true, style: { stroke: '#10B981', strokeWidth: 2 } },
  { id: 'e-disteng-devhealthy', source: 'dist-sw-eng', target: 'dev-eng-healthy', animated: false, style: { stroke: '#10B981', strokeWidth: 1.5 } }
];

export const SAMPLE_AFFECTED_DEVICES: DeviceTelemetry[] = [
  {
    deviceId: 'DEV-ENG-081',
    deviceType: 'student_laptop',
    ipAddress: '169.254.81.12 (APIPA)',
    macAddress: '3C:22:FB:4A:11:90',
    vlan: 'VLAN-142',
    connectedAP: 'AP-ENG-04',
    connectedSwitch: 'SW-ENG-EDGE-02',
    latencyMs: 0,
    packetLossPct: 100,
    dhcpLeaseState: 'unassigned',
    dnsResolutionMs: 0,
    signalStrengthDbm: -54,
    status: 'fault',
    lastSeen: '10s ago'
  },
  {
    deviceId: 'DEV-ENG-082',
    deviceType: 'student_laptop',
    ipAddress: '169.254.81.13 (APIPA)',
    macAddress: '58:B0:35:8C:3D:22',
    vlan: 'VLAN-142',
    connectedAP: 'AP-ENG-04',
    connectedSwitch: 'SW-ENG-EDGE-02',
    latencyMs: 0,
    packetLossPct: 100,
    dhcpLeaseState: 'unassigned',
    dnsResolutionMs: 0,
    signalStrengthDbm: -52,
    status: 'fault',
    lastSeen: '14s ago'
  },
  {
    deviceId: 'DEV-ENG-083',
    deviceType: 'student_laptop',
    ipAddress: '169.254.81.14 (APIPA)',
    macAddress: 'F0:18:98:C4:02:AA',
    vlan: 'VLAN-142',
    connectedAP: 'AP-ENG-04',
    connectedSwitch: 'SW-ENG-EDGE-02',
    latencyMs: 0,
    packetLossPct: 100,
    dhcpLeaseState: 'unassigned',
    dnsResolutionMs: 0,
    signalStrengthDbm: -55,
    status: 'fault',
    lastSeen: '25s ago'
  },
  {
    deviceId: 'DEV-ENG-084',
    deviceType: 'student_laptop',
    ipAddress: '169.254.81.15 (APIPA)',
    macAddress: '7A:91:E2:0F:55:18',
    vlan: 'VLAN-142',
    connectedAP: 'AP-ENG-04',
    connectedSwitch: 'SW-ENG-EDGE-02',
    latencyMs: 0,
    packetLossPct: 100,
    dhcpLeaseState: 'unassigned',
    dnsResolutionMs: 0,
    signalStrengthDbm: -53,
    status: 'fault',
    lastSeen: '40s ago'
  },
  {
    deviceId: 'DEV-ENG-085',
    deviceType: 'lab_workstation',
    ipAddress: '169.254.81.16 (APIPA)',
    macAddress: '04:D4:C4:39:7E:81',
    vlan: 'VLAN-142',
    connectedAP: 'AP-ENG-04',
    connectedSwitch: 'SW-ENG-EDGE-02',
    latencyMs: 0,
    packetLossPct: 100,
    dhcpLeaseState: 'unassigned',
    dnsResolutionMs: 0,
    signalStrengthDbm: -50,
    status: 'fault',
    lastSeen: '1m ago'
  },
  {
    deviceId: 'DEV-ENG-086',
    deviceType: 'student_laptop',
    ipAddress: '169.254.81.17 (APIPA)',
    macAddress: '9C:35:EB:12:4D:99',
    vlan: 'VLAN-142',
    connectedAP: 'AP-ENG-04',
    connectedSwitch: 'SW-ENG-EDGE-02',
    latencyMs: 0,
    packetLossPct: 100,
    dhcpLeaseState: 'unassigned',
    dnsResolutionMs: 0,
    signalStrengthDbm: -56,
    status: 'fault',
    lastSeen: '2m ago'
  }
];

export const HOURLY_HEALTH_TREND = [
  { time: '09:00', aggregateHealth: 99.4, failingCount: 0, avgLatency: 3.4 },
  { time: '10:00', aggregateHealth: 99.2, failingCount: 1, avgLatency: 3.6 },
  { time: '11:00', aggregateHealth: 99.1, failingCount: 2, avgLatency: 3.8 },
  { time: '12:00', aggregateHealth: 99.0, failingCount: 2, avgLatency: 4.0 },
  { time: '13:00', aggregateHealth: 98.9, failingCount: 4, avgLatency: 4.1 },
  { time: '14:00', aggregateHealth: 98.8, failingCount: 6, avgLatency: 4.2 },
];

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Network, 
  Activity, 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  Layers, 
  GitFork, 
  ArrowUpRight, 
  ChevronRight, 
  Menu, 
  X,
  Play,
  Share2,
  Database
} from 'lucide-react';

interface UnseenLandingPageProps {
  onNavigateToApp: (screen?: string) => void;
}

export const UnseenLandingPage: React.FC<UnseenLandingPageProps> = ({ onNavigateToApp }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'l2' | 'l3' | 'rf'>('all');

  // Three.js interactive 3D hero background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050508, 0.0018);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 30, 85);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create 3D Network Particle Lattice / Cybernetic Topology
    const nodeCount = 380;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(nodeCount * 3);
    const colors = new Float32Array(nodeCount * 3);

    const orangeColor = new THREE.Color(0xff4d00);
    const whiteColor = new THREE.Color(0xe6e6e6);
    const dimColor = new THREE.Color(0x3a3a44);

    for (let i = 0; i < nodeCount; i++) {
      const u = (Math.random() - 0.5) * 160;
      const v = (Math.random() - 0.5) * 45;
      const w = (Math.random() - 0.5) * 120;

      positions[i * 3] = u;
      positions[i * 3 + 1] = v;
      positions[i * 3 + 2] = w;

      // Restrained orange highlights for anomalous nodes (6 affected nodes)
      if (i < 6) {
        colors[i * 3] = orangeColor.r;
        colors[i * 3 + 1] = orangeColor.g;
        colors[i * 3 + 2] = orangeColor.b;
      } else if (Math.random() > 0.8) {
        colors[i * 3] = whiteColor.r;
        colors[i * 3 + 1] = whiteColor.g;
        colors[i * 3 + 2] = whiteColor.b;
      } else {
        colors[i * 3] = dimColor.r;
        colors[i * 3 + 1] = dimColor.g;
        colors[i * 3 + 2] = dimColor.b;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle Material
    const pMaterial = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    const particles = new THREE.Points(geometry, pMaterial);
    scene.add(particles);

    // Connecting Network Lines
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x22222a,
      transparent: true,
      opacity: 0.35,
    });

    const linePositions: number[] = [];
    for (let i = 0; i < nodeCount; i += 2) {
      for (let j = i + 1; j < Math.min(i + 6, nodeCount); j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 28) {
          linePositions.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
          linePositions.push(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
        }
      }
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Mouse Tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX - window.innerWidth / 2) * 0.05;
      mouseY = (e.clientY - window.innerHeight / 2) * 0.05;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      targetX += (mouseX - targetX) * 0.04;
      targetY += (mouseY - targetY) * 0.04;

      particles.rotation.y = elapsed * 0.02 + targetX * 0.005;
      particles.rotation.x = Math.sin(elapsed * 0.015) * 0.05 + targetY * 0.005;
      lines.rotation.y = particles.rotation.y;
      lines.rotation.x = particles.rotation.x;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      lineGeometry.dispose();
      pMaterial.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  const scenarios = [
    {
      id: 'dhcp-starvation',
      title: 'Engineering Wing B',
      layer: 'L3 DHCP / IPAM',
      symptom: '100% Lease Timeouts & APIPA Fallback',
      affected: '6 Workstations Isolated',
      desc: 'Silent pool exhaustion in VLAN-142 caused by continuous MAC rotation, starving legitimate client requests while core links report 99% nominal health.',
      badge: 'L3 FAULT'
    },
    {
      id: 'wifi-degradation',
      title: 'Science Complex Lab 401',
      layer: 'L1/L2 802.11 RF',
      symptom: '48% Frame Retries & Asymmetric RSSI',
      affected: '8 Devices Isolated',
      desc: 'Asymmetric co-channel contention and hidden node interference behind leaded glass partition, invisible to aggregate campus-wide AP telemetry.',
      badge: 'RF CONTENTION'
    },
    {
      id: 'shared-link-congestion',
      title: 'North Residence Hall',
      layer: 'L2/L3 Egress Queues',
      symptom: '380ms Latency Jitter & Egress Buffer Drops',
      affected: '12 Streaming Nodes',
      desc: 'High link utilization with severe queue drops on uplink core switch, driving microburst latency spikes for latency-sensitive traffic.',
      badge: 'BUFFERBLOAT'
    },
    {
      id: 'dns-resolver-silent-drop',
      title: 'Medical Research Wing',
      layer: 'L7 DNS Resolution',
      symptom: 'Intermittent Resolution Drops & Socket Timeouts',
      affected: '9 Endpoints Isolated',
      desc: 'Secondary DNS anycast route asymmetry silently discarding UDP datagrams without generating traditional ICMP port-unreachable notifications.',
      badge: 'L7 DNS'
    },
    {
      id: 'multiple-simultaneous-faults',
      title: 'Engineering & Computing Labs',
      layer: 'Dual Co-Occurring Anomalies',
      symptom: 'Simultaneous DHCP Exhaustion + Optical CRC',
      affected: '18 Devices Across 2 Wings',
      desc: 'Two independent concurrent faults adjudicated without conflation: Rogue DHCP lease hijacking in Wing A alongside optical degradation in Wing B.',
      badge: 'MULTI-FAULT'
    },
    {
      id: 'healthy-baseline',
      title: 'Campus Wide Baseline',
      layer: 'End-to-End Core Fabric',
      symptom: 'Zero SLA Violations & Nominal RTT (<4ms)',
      affected: '0 Anomalies Detected',
      desc: 'Nominal operational state verified through 5-agent counterfactual comparison, yielding consensus verdict of NO_FAULT_DETECTED across 500 endpoints.',
      badge: 'NOMINAL'
    }
  ];

  const agents = [
    {
      id: 'AGENT-POP-01',
      name: 'Population Observer',
      role: 'Micro-Population Anomaly Detection',
      desc: 'Unsupervised isolation of subtle sub-populations experiencing degraded quality of service when aggregate health reports 99% nominal operations.',
      accent: 'border-blue-500/30 text-blue-400'
    },
    {
      id: 'AGENT-CTF-02',
      name: 'Counterfactual Agent',
      role: 'Peer Twin Telemetry Differential',
      desc: 'Matches failing devices against healthy geometric twin peers across identical VLAN, switch, and vendor profiles to isolate differential metrics.',
      accent: 'border-emerald-500/30 text-emerald-400'
    },
    {
      id: 'AGENT-TOP-03',
      name: 'Topology Investigator',
      role: 'Dependency Graph Causal Tracing',
      desc: 'Traverses directed network dependency graphs to find shared points of failure, identifying upstream switch ports, transceivers, and gateways.',
      accent: 'border-purple-500/30 text-purple-400'
    },
    {
      id: 'AGENT-FLT-04',
      name: 'Fault Investigator',
      role: 'Hypothesis Scoring & Falsification',
      desc: 'Generates and rigorously tests competing network fault hypotheses against physical, link, and transport layer empirical telemetry evidence.',
      accent: 'border-amber-500/30 text-amber-400'
    },
    {
      id: 'AGENT-ADJ-05',
      name: 'Adjudicator',
      role: 'Consensus Verdict & Contract Generation',
      desc: 'Resolves multi-agent contradictions, calculates mathematical evidence confidence, and produces machine-readable diagnostic JSON contracts.',
      accent: 'border-[#ff4d00]/40 text-[#ff4d00]'
    }
  ];

  const capabilities = [
    {
      num: '01',
      title: 'Hidden Population Discovery',
      desc: 'Traditional monitoring averages metric distributions, disguising micro-cohort outages. UNSEEN segments telemetry to detect small failing clusters that aggregate dashboards miss.'
    },
    {
      num: '02',
      title: 'Counterfactual Comparison',
      desc: 'Pairs failing devices with healthy twins in the same zone. Isolates true causal signals from benign campus-wide background noise and environmental fluctuations.'
    },
    {
      num: '03',
      title: 'Topology Intelligence',
      desc: 'Performs deep topological dependency tracing across physical, logical, and virtual tiers to distinguish localized access defects from core infrastructure collapses.'
    },
    {
      num: '04',
      title: 'Evidence-Based Adjudication',
      desc: 'Synthesizes findings from all agents into a unified, mathematically weighted diagnosis. Outputs machine-readable JSON contracts with full falsification rationales.'
    }
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#050508] text-[#e6e6e6] font-sans overflow-x-hidden selection:bg-[#ff4d00] selection:text-black">
      {/* 3D WebGL Background Canvas */}
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-80"
      />

      {/* Subtle Grain Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }}
      />

      {/* Floating Top Navigation Pill */}
      <header className="fixed top-4 inset-x-0 z-50 flex justify-center px-4">
        <nav className="flex items-center justify-between w-full max-w-5xl px-5 py-2.5 rounded-full bg-[#0a0a0e]/80 backdrop-blur-md border border-white/10 shadow-2xl">
          <div className="flex items-center space-x-3">
            <span className="font-mono font-black text-sm tracking-widest text-white flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ff4d00] animate-pulse" />
              <span>UNSEEN<span className="text-[#ff4d00]">.</span></span>
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-500 uppercase tracking-wider pl-2 border-l border-white/10">
              SYS-001 / INTELLIGENCE
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-6 text-xs font-mono font-medium tracking-wide text-zinc-400">
            <a href="#hero" className="hover:text-white transition-colors">HOME</a>
            <a href="#scenarios" className="hover:text-white transition-colors">SCENARIOS</a>
            <a href="#capabilities" className="hover:text-white transition-colors">CAPABILITIES</a>
            <a href="#agents" className="hover:text-white transition-colors">AGENTS</a>
            <a href="#lab" className="hover:text-white transition-colors">LAB</a>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigateToApp()}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-white text-black font-mono text-xs font-bold hover:bg-[#ff4d00] hover:text-black transition-all active:scale-95 shadow-lg"
            >
              <span>OPEN CONSOLE</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="fixed top-16 inset-x-4 z-50 p-4 rounded-2xl bg-[#0a0a0e] border border-white/10 md:hidden flex flex-col space-y-3 font-mono text-xs">
          <a href="#hero" onClick={() => setMobileMenuOpen(false)} className="py-2 text-zinc-300 hover:text-white">HOME</a>
          <a href="#scenarios" onClick={() => setMobileMenuOpen(false)} className="py-2 text-zinc-300 hover:text-white">SCENARIOS</a>
          <a href="#capabilities" onClick={() => setMobileMenuOpen(false)} className="py-2 text-zinc-300 hover:text-white">CAPABILITIES</a>
          <a href="#agents" onClick={() => setMobileMenuOpen(false)} className="py-2 text-zinc-300 hover:text-white">AGENTS</a>
          <a href="#lab" onClick={() => setMobileMenuOpen(false)} className="py-2 text-zinc-300 hover:text-white">SCENARIO LAB</a>
          <button
            onClick={() => { setMobileMenuOpen(false); onNavigateToApp(); }}
            className="w-full py-2.5 rounded-lg bg-[#ff4d00] text-black font-bold text-center mt-2"
          >
            OPEN UNSEEN CONSOLE
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="relative z-10 pt-28 pb-32">
        {/* ========================================================================= */}
        {/* SECTION 1: HERO */}
        {/* ========================================================================= */}
        <section id="hero" className="max-w-6xl mx-auto px-6 pt-12 pb-24 text-center md:text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-white/[0.04] border border-white/10 text-xs font-mono text-zinc-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d00]" />
            <span>NETWORK INTELLIGENCE / INVESTIGATION SYSTEM 001</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.08] mb-6 font-sans">
            A network can be 99% healthy and still fail someone.
          </h1>

          <p className="text-lg sm:text-2xl text-zinc-400 font-light max-w-2xl leading-relaxed mb-4">
            Because an average cannot tell the whole story.
          </p>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed mb-8">
            UNSEEN finds the network failures hidden inside apparently healthy infrastructure. Five specialized agents investigate affected populations, compare healthy peers, trace shared dependencies, and produce evidence-backed diagnoses.
          </p>

          {/* Primary & Secondary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
            <button
              onClick={() => onNavigateToApp()}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#ff4d00] text-black font-mono text-xs font-bold tracking-wider uppercase hover:bg-white transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>EXPLORE THE INVESTIGATION</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateToApp()}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10 font-mono text-xs font-medium tracking-wider uppercase transition-all flex items-center justify-center space-x-2"
            >
              <span>OPEN UNSEEN CONSOLE</span>
              <ArrowUpRight className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          {/* Restrained Status Readout Display (Simulated Benchmark Data) */}
          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md max-w-4xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <span className="text-[11px] font-mono text-zinc-400 tracking-wider uppercase flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>TELEMETRY COHORT MONITORING</span>
              </span>
              <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                SIMULATED BENCHMARK DATA
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-mono">
              <div>
                <span className="text-[11px] text-zinc-500 uppercase block">Monitored Devices</span>
                <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">500</span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-500 uppercase block">Aggregate Health</span>
                <span className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">98.8%</span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-500 uppercase block">Affected Devices</span>
                <span className="text-2xl sm:text-3xl font-bold text-[#ff4d00] tracking-tight">6</span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-500 uppercase block">Specialized Agents</span>
                <span className="text-2xl sm:text-3xl font-bold text-blue-400 tracking-tight">5 ACTIVE</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: SCENARIOS */}
        {/* ========================================================================= */}
        <section id="scenarios" className="max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
          <div className="mb-12">
            <div className="text-xs font-mono text-[#ff4d00] uppercase tracking-wider mb-2">SECTION 02 — INCIDENT PROFILES</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Failures hidden in plain sight.
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-2xl">
              Different symptoms. Different network layers. One unified autonomous investigation system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenarios.map((sc, i) => (
              <div 
                key={sc.id}
                className="relative p-6 rounded-2xl bg-[#09090d]/80 border border-white/10 hover:border-white/25 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] border border-white/10 text-zinc-300">
                      {sc.badge}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">0{i+1}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-[#ff4d00] transition-colors mb-1">
                    {sc.title}
                  </h3>
                  <div className="text-xs font-mono text-zinc-400 mb-3">{sc.layer}</div>

                  <div className="p-2.5 rounded-lg bg-black/50 border border-white/5 font-mono text-[11px] text-rose-300/90 mb-3">
                    {sc.symptom}
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    {sc.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-500">{sc.affected}</span>
                  <button
                    onClick={() => onNavigateToApp('scenario-lab')}
                    className="text-xs font-mono font-bold text-white hover:text-[#ff4d00] flex items-center space-x-1"
                  >
                    <span>Inspect</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: CAPABILITIES */}
        {/* ========================================================================= */}
        <section id="capabilities" className="max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
          <div className="mb-12">
            <div className="text-xs font-mono text-[#ff4d00] uppercase tracking-wider mb-2">SECTION 03 — INVESTIGATION ENGINE</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              From isolated alerts to an explanation.
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-2xl">
              Four specialized capabilities bridge the gap between fragmented metrics and deterministic root causes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {capabilities.map((cap) => (
              <div 
                key={cap.num}
                className="p-8 rounded-2xl bg-[#09090d]/60 border border-white/10 relative overflow-hidden"
              >
                <div className="text-4xl font-mono font-black text-white/10 mb-4">{cap.num}</div>
                <h3 className="text-xl font-bold text-white mb-2">{cap.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: AGENTS */}
        {/* ========================================================================= */}
        <section id="agents" className="max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
          <div className="mb-12">
            <div className="text-xs font-mono text-[#ff4d00] uppercase tracking-wider mb-2">SECTION 04 — AUTONOMOUS SQUAD</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              The investigation is collaborative.
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-2xl">
              Five specialized AI agents communicate through validated Pydantic message contracts in a strictly causal pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((ag) => (
              <div 
                key={ag.id}
                className={`p-6 rounded-2xl bg-[#09090d]/80 border ${ag.accent.split(' ')[0]} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-zinc-400">{ag.id}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{ag.name}</h3>
                  <div className="text-xs font-mono text-zinc-400 mb-3">{ag.role}</div>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">{ag.desc}</p>
                </div>
                <div className="pt-3 border-t border-white/5 font-mono text-[10px] text-zinc-500 uppercase">
                  ACTIVE SQUAD MEMBER
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5: SCENARIO LABORATORY */}
        {/* ========================================================================= */}
        <section id="lab" className="max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#0a0a0f] to-[#040406] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="text-xs font-mono text-[#ff4d00] uppercase tracking-wider mb-2">INTERACTIVE BENCHMARK</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                Put the network under investigation.
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Test the engine against all six reproducible failure modes, or upload external telemetry to observe autonomous multi-agent hypothesis falsification and contract output.
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onNavigateToApp('scenario-lab')}
                  className="px-6 py-3 rounded-xl bg-white text-black font-mono text-xs font-bold hover:bg-[#ff4d00] transition-all flex items-center space-x-2"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>EXPLORE THE SCENARIO LAB</span>
                </button>
              </div>
            </div>

            <div className="w-full md:w-80 p-5 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs space-y-3">
              <div className="text-zinc-500 uppercase text-[10px] pb-2 border-b border-white/10">Active Test Matrix</div>
              <div className="flex justify-between text-zinc-400"><span>Nominal Baseline</span><span className="text-emerald-400">Active</span></div>
              <div className="flex justify-between text-zinc-400"><span>DHCP Exhaustion</span><span className="text-amber-400">Ready</span></div>
              <div className="flex justify-between text-zinc-400"><span>RF Contention</span><span className="text-amber-400">Ready</span></div>
              <div className="flex justify-between text-zinc-400"><span>Queue Bufferbloat</span><span className="text-amber-400">Ready</span></div>
              <div className="flex justify-between text-zinc-400"><span>DNS Resolution Drop</span><span className="text-amber-400">Ready</span></div>
              <div className="flex justify-between text-zinc-400"><span>Dual Cascade Anomaly</span><span className="text-amber-400">Ready</span></div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 6: CLOSING / CONSOLE LAUNCH */}
        {/* ========================================================================= */}
        <section className="max-w-6xl mx-auto px-6 py-24 text-center border-t border-white/5">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="inline-block p-3 rounded-2xl bg-white/[0.03] border border-white/10 mb-2">
              <Network className="w-8 h-8 text-[#ff4d00]" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
              THE DASHBOARD IS GREEN. ARE ALL ITS DEVICES?
            </h2>

            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Investigate beyond the average. Find the failures hidden in plain sight.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onNavigateToApp()}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#ff4d00] text-black font-mono text-xs font-bold tracking-wider uppercase hover:bg-white transition-all shadow-2xl active:scale-95 flex items-center justify-center space-x-2"
              >
                <span>LAUNCH UNSEEN</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigateToApp('agents')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10 font-mono text-xs font-medium tracking-wider uppercase transition-all flex items-center justify-center space-x-2"
              >
                <span>EXPLORE THE AGENT ARCHITECTURE</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Bottom Utility Dock */}
      <footer className="fixed bottom-4 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center space-x-4 px-5 py-2 rounded-full bg-[#0a0a0e]/90 backdrop-blur-md border border-white/10 shadow-2xl font-mono text-[11px] text-zinc-400">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-bold">UNSEEN ENGINE</span>
          </div>
          <span className="text-zinc-600">|</span>
          <span className="hidden sm:inline">FIVE AGENTS AVAILABLE</span>
          <span className="hidden sm:inline text-zinc-600">|</span>
          <span className="text-zinc-300">SIMULATION MODE</span>
          <span className="text-zinc-600">|</span>
          <button 
            onClick={() => onNavigateToApp()}
            className="text-white hover:text-[#ff4d00] font-bold transition-colors"
          >
            OPEN CONSOLE &rarr;
          </button>
        </div>
      </footer>
    </div>
  );
};

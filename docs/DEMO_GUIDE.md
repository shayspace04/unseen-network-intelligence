# UNSEEN — 5-Minute Hackathon Presentation & Demo Script

> **NetCoop AI Hackathon Live Demonstration Walkthrough**  
> *Target Duration: 4 minutes 30 seconds (leaving 30 seconds buffer for judge Q&A).*

---

## Demo Overview & Timetable

| Act / Stage | Timestamp | Screen / Mode | Key Talking Point / Focus |
| :--- | :--- | :--- | :--- |
| **Hook & Intro** | 0:00 - 0:45 | Public Landing Page (`/`) | The Aggregate Masking Problem; 3D Topology Hero. |
| **Act 1: The Illusion** | 0:45 - 1:30 | Presentation Act 1 (`/app`) | 93.3% aggregate fleet health masking complete local outage. |
| **Act 2: Micro-Cohort** | 1:30 - 2:15 | Presentation Act 2 | AG-01 detection and AG-02 Counterfactual Twin contrast. |
| **Act 3: Topology** | 2:15 - 3:00 | Presentation Act 3 | AG-03 NetworkX LCA tree traversal isolating choke point. |
| **Act 4: Evidence Room**| 3:00 - 3:45 | Presentation Act 4 | AG-04 Falsification matrix eliminating alternative causes. |
| **Act 5: The Verdict** | 3:45 - 4:30 | Presentation Act 5 & Console | AG-05 Consensus verdict, canonical NetCoop JSON export. |

---

## Phase 1: The Hook & Landing Page (0:00 - 0:45)

1. **Open Browser** to `http://localhost:5173/`.
2. **Presenter Script**:
   > *"Good morning judges. Every network engineer knows this nightmare: a department head calls saying nobody in Wing B can work, but the network monitoring dashboard is glowing all green with a 98% health score. This is what we call the Aggregate Masking Problem: because an average cannot tell the whole story."*
   > *"We built UNSEEN, an agentic AI network intelligence and fault investigation platform that deploys a collaborative swarm of five specialized agents to uncover and solve these hidden network failures."*
3. **Action**:
   - Scroll briefly through the tactile monochrome landing page.
   - Point out the 3D interactive particle-and-node canvas rendered in Three.js.
   - Click the prominent **OPEN CONSOLE** button in the hero section or floating dock.

---

## Phase 2: Enter Presentation Mode (0:45 - 1:30)

1. **Arrive at Console** (`http://localhost:5173/app`).
2. **Action**:
   - Click **Enter Presentation** in the top navigation bar.
   - Ensure the scenario selector is set to **Engineering Wing B — DHCP Starvation**.
3. **Presenter Script (Act 1 — The Aggregate Illusion)**:
   > *"Notice Act 1. Across 120 endpoints on the campus, overall health is 93.3%. Traditional thresholds wouldn't fire an alert. But 14 students in Engineering Wing B have 100% packet loss. They are completely disconnected, yet hidden in the average."*

---

## Phase 3: Act 2 — Micro-Cohort Isolation (1:30 - 2:15)

1. **Action**: Click **Next Stage** or press `Right Arrow`.
2. **Presenter Script (Act 2)**:
   > *"Our first two agents step in. Agent AG-01, the Population Observer, analyzes distribution curves rather than means, isolating the exact 14 failing endpoints. Next, AG-02, the Counterfactual Twin, runs a differential experiment: it pairs the failing laptops with identical laptops in adjacent Wing A running the exact same OS and hardware. Notice the delta: Wing A has 0% loss and valid DHCP leases. This proves the issue is environmental, not an endpoint OS bug."*

---

## Phase 4: Act 3 — Topology & Choke Points (2:15 - 3:00)

1. **Action**: Click **Next Stage** to enter Act 3.
2. **Presenter Script (Act 3)**:
   > *"Now AG-03, the Topology Pathfinder, traverses our campus directed graph using NetworkX. Tracing upstream hops, it calculates the Lowest Common Ancestor. It discovers that every single failing laptop connects through access switch SW-ACCESS-ENG-B on VLAN 142. The upstream core and distribution layers are completely healthy. We've isolated the physical choke point in seconds."*

---

## Phase 5: Act 4 — Evidence Room & Falsification (3:00 - 3:45)

1. **Action**: Click **Next Stage** to enter Act 4.
2. **Presenter Script (Act 4)**:
   > *"Instead of guessing, AG-04, the Fault Evaluator, sets up a competing hypothesis falsification matrix across Layer 1 through Layer 7. It evaluates three theories:*
   > *1. Access switch hardware failure? Refuted — switch CPU and memory are nominal.*
   > *2. Wi-Fi RF interference? Refuted — signal strength is strong at -54 dBm.*
   > *3. DHCP Scope Starvation? Supported — 100% of affected devices report expired leases and APIPA 169.254 fallbacks."*

---

## Phase 6: Act 5 — Verdict & JSON Export (3:45 - 4:30)

1. **Action**: Click **Next Stage** to enter Act 5.
2. **Presenter Script (Act 5)**:
   > *"Finally, AG-05, the Adjudicator, synthesizes the consensus verdict. It computes an evidence-based confidence score of 0.94 using our multi-pillar heuristic formula. It outputs the exact root cause: DHCP Scope Exhaustion on VLAN 142, alongside three actionable remediation steps."*
3. **Demonstrate JSON Contract**:
   - Scroll to the bottom of Act 5.
   - Click **Copy JSON** to copy the NetCoop AI canonical diagnostic report.
   - Point out that this report strictly complies with the hackathon's required JSON schema, validating field types, alternative causes, and evidence sources.

---

## Phase 7: Interactive Console Deep Dive (Optional / Judge Q&A)

1. Press `Escape` to exit Presentation Mode.
2. **Agent Activity**: Open the **Agents** tab. Show judges that each turn has a real, versioned `schema_version: "1.0.0"` JSON message persisted in SQLite that can be inspected with one click.
3. **Topology Map**: Open the **Topology** tab. Show the interactive `@xyflow/react` graph with animated packet streams and colored status nodes.
4. **Scenario Switch**: Select **Multiple Simultaneous Faults** or **Normal Operation** from the scenario dropdown to demonstrate that UNSEEN accurately handles dual independent failures without cross-contamination, as well as a zero-fault nominal baseline with zero false positives.

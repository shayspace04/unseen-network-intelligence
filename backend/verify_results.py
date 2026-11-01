import urllib.request
import json

scenarios = [
    ("dhcp-starvation", "DHCP Pool Scope Exhaustion (VLAN Scope)"),
    ("wifi-degradation", "Asymmetric Wi-Fi Co-Channel Contention & Hidden Node"),
    ("shared-link-congestion", "Shared Uplink Microburst Bufferbloat & Egress Drops"),
    ("dns-resolver-silent-drop", "Secondary DNS Anycast Route Asymmetry / Silent Drop"),
    ("multiple-simultaneous-faults", "Multi-Fault Cascading Incident (Correlated Independent Anomalies)"),
    ("healthy-baseline", "None (Baseline Nominal)")
]

print("="*100)
print(f"{'SCENARIO ID':<28} | {'GROUND TRUTH':<32} | {'DIAGNOSED FAULT':<32} | {'CONF':<6} | {'STATUS'}")
print("="*100)

for sc_id, expected_gt in scenarios:
    req = urllib.request.Request(
        'http://localhost:8000/api/investigations',
        data=json.dumps({'scenario_id': sc_id}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        inv = json.loads(resp.read().decode())
        inc_id = inv.get("incident_id") or inv.get("id")
        
    with urllib.request.urlopen(f'http://localhost:8000/api/investigations/{inc_id}') as i_resp:
        inv_details = json.loads(i_resp.read().decode())
        
    fault = inv_details.get("suspected_fault")
    conf = inv_details.get("confidence")
    status = inv_details.get("status")
    
    # Check match
    match = "MATCH [PASS]" if (expected_gt.lower() in fault.lower() or ("none" in expected_gt.lower() and "nominal" in fault.lower())) else "MISMATCH [FAIL]"
    print(f"{sc_id:<28} | {expected_gt:<32} | {fault:<32} | {conf:<6.2f} | {status} - {match}")

print("="*100)

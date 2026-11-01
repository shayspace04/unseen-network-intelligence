"""
UNSEEN Graph Builder - NetworkX Topology Representation & Path Traversal
"""

import networkx as nx
from typing import List, Dict, Any, Optional, Set
from ..models.schemas import NetworkNode, NetworkEdge

def build_network_graph(nodes: List[NetworkNode], edges: List[NetworkEdge]) -> nx.DiGraph:
    """
    Constructs a directed NetworkX graph from topology nodes and edges.
    Edges point downstream: Core -> Distribution -> Access/Edge -> AP -> Devices.
    """
    G = nx.DiGraph()

    for node in nodes:
        G.add_node(
            node.id,
            label=node.data.label,
            type=node.data.type,
            status=node.data.status,
            zone=node.data.zone,
            ip=node.data.ip,
            affected_count=node.data.affectedCount or 0
        )

    for edge in edges:
        G.add_edge(edge.source, edge.target, id=edge.id)

    return G

def find_upstream_ancestors(G: nx.DiGraph, target_node: str) -> List[str]:
    """
    Returns all upstream ancestors (nodes that have paths leading to target_node).
    """
    if target_node not in G:
        return []
    ancestors = nx.ancestors(G, target_node)
    return list(ancestors)

def find_lowest_common_dependency(G: nx.DiGraph, device_nodes: List[str]) -> Optional[Dict[str, Any]]:
    """
    Finds the lowest common ancestor / convergence node serving the specified target nodes.
    """
    valid_nodes = [n for n in device_nodes if n in G]
    if not valid_nodes:
        return None

    if len(valid_nodes) == 1:
        first_node = valid_nodes[0]
        preds = list(G.predecessors(first_node))
        upstream_info = G.nodes[preds[0]].get("label", preds[0]) if preds else "Campus Core"
        return {
            "node_id": first_node,
            "label": G.nodes[first_node].get("label", first_node),
            "type": G.nodes[first_node].get("type", "unknown"),
            "zone": G.nodes[first_node].get("zone", "unknown"),
            "ip": G.nodes[first_node].get("ip", "unknown"),
            "upstream": upstream_info
        }

    # Intersection of all ancestors for valid nodes
    ancestor_sets: List[Set[str]] = [nx.ancestors(G, node) for node in valid_nodes]
    common_ancestors = set.intersection(*ancestor_sets) if ancestor_sets else set()

    if not common_ancestors:
        first_node = valid_nodes[0]
        return {
            "node_id": first_node,
            "label": G.nodes[first_node].get("label", first_node),
            "type": G.nodes[first_node].get("type", "unknown"),
            "zone": G.nodes[first_node].get("zone", "unknown"),
            "ip": G.nodes[first_node].get("ip", "unknown")
        }

    # Find the deepest common ancestor (maximum shortest path length from root)
    roots = [n for n in G.nodes if G.in_degree(n) == 0]
    root = roots[0] if roots else list(common_ancestors)[0]

    deepest_node = None
    max_depth = -1

    for cand in common_ancestors:
        try:
            depth = nx.shortest_path_length(G, root, cand)
            if depth > max_depth:
                max_depth = depth
                deepest_node = cand
        except nx.NetworkXNoPath:
            continue

    if not deepest_node:
        deepest_node = list(common_ancestors)[0]

    return {
        "node_id": deepest_node,
        "label": G.nodes[deepest_node].get("label", deepest_node),
        "type": G.nodes[deepest_node].get("type", "unknown"),
        "zone": G.nodes[deepest_node].get("zone", "unknown"),
        "ip": G.nodes[deepest_node].get("ip", "unknown")
    }

def compute_downstream_blast_radius(G: nx.DiGraph, node_id: str) -> List[str]:
    """
    Computes all downstream devices and nodes impacted if node_id fails.
    """
    if node_id not in G:
        return []
    return list(nx.descendants(G, node_id))

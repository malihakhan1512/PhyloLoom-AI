from __future__ import annotations
import re
from typing import Any, Optional

_NEGATIVE_BRANCH_RE = re.compile(r":-\s*(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?")

def format_branch_length(length: Optional[float]) -> str:
    if length is None:
        return ""
    try:
        clamped = max(0.0, float(length))
    except (TypeError, ValueError):
        return ""
    return f":{clamped:.6f}"

def _get_children(node: Any):
    if isinstance(node, dict):
        return node.get("children") or node.get("clades") or []
    return getattr(node, "clades", None) or getattr(node, "children", None) or []

def _get_name(node: Any) -> str:
    name = (node.get("name") or node.get("label") or "") if isinstance(node, dict) else (getattr(node, "name", "") or getattr(node, "label", "") or "")
    return str(name).replace(" ", "_").replace("(", "").replace(")", "").replace(":", "").replace(";", "")

def _get_length(node: Any):
    return node.get("branch_length", node.get("length")) if isinstance(node, dict) else getattr(node, "branch_length", getattr(node, "length", None))

def _set_length(node: Any, value: float):
    if isinstance(node, dict):
        node["branch_length" if "branch_length" in node else "length"] = value
    elif hasattr(node, "branch_length"):
        node.branch_length = value
    elif hasattr(node, "length"):
        node.length = value

def clamp_tree_branches(node: Any):
    length = _get_length(node)
    if length is not None:
        try: _set_length(node, max(0.0, float(length)))
        except: _set_length(node, 0.0)
    for child in _get_children(node):
        clamp_tree_branches(child)
    return node

def to_newick(node: Any, is_root: bool = True) -> str:
    children = _get_children(node)
    name = _get_name(node)
    length_str = "" if is_root else format_branch_length(_get_length(node))
    if children:
        inner = ",".join(to_newick(c, is_root=False) for c in children)
        result = f"({inner}){name}{length_str}"
    else:
        result = f"{name}{length_str}"
    return result + ";" if is_root else result

tree_to_newick = to_newick

def sanitize_newick(newick: str) -> str:
    if not newick: return newick
    return _NEGATIVE_BRANCH_RE.sub(":0.000000", newick)

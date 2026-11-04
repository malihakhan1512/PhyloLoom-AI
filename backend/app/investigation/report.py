import html
import json

from .provenance import canonical_sha256, utc_now_iso

MAX_REPORT_BYTES = 2_000_000

LIMITATIONS = [
    "PhyloLoom AI is a research-support tool, not a clinical diagnostic system.",
    "Computed descriptor differences are not pathogenicity, benignity, fitness, adaptation, or stability predictions.",
    "Candidate recurrent substitutions are descriptive flags only; they are not proof of convergence or positive selection.",
    "Exploratory trees are not definitive evolutionary histories; branch support is unavailable unless explicitly reported.",
    "Anything labelled HYPOTHESIS is untested until a pre-stated test is executed and reported.",
    "Items labelled unavailable were not computed and are never represented as zero.",
]


def _extract_timeline(obj, path="report", out=None):
    if out is None:
        out = []
    if isinstance(obj, dict):
        for key, value in obj.items():
            if key in {"created_at", "retrieved_at", "generated_at", "timestamp"} and isinstance(value, str):
                out.append({"event": key, "path": path, "time": value})
            else:
                _extract_timeline(value, f"{path}.{key}", out)
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            _extract_timeline(item, f"{path}[{i}]", out)
    return out


def build_report_bundle(title: str, sections: dict) -> dict:
    payload = json.dumps(sections, default=str)
    if len(payload.encode("utf-8")) > MAX_REPORT_BYTES:
        raise ValueError("Report sections exceed the 2 MB export limit.")

    generated = utc_now_iso()
    core = {"title": title, "sections": sections}
    bundle = {
        "schema_version": "phyloloom.investigation-report/0.1.0",
        "title": title,
        "generated_at": generated,
        "bundle_sha256": canonical_sha256(core),
        "evidence_labels": ["COMPUTED", "MODEL_PREDICTION", "CURATED_ASSERTION", "LITERATURE", "HYPOTHESIS", "DEMO"],
        "limitations": LIMITATIONS,
        "sections": sections,
    }
    bundle["provenance_timeline"] = _extract_timeline(sections) + [
        {"event": "report_generated_at", "path": "report", "time": generated}
    ]
    return bundle


def render_html_report(bundle: dict) -> str:
    title = html.escape(bundle.get("title", "PhyloLoom Investigation Report"))
    generated = html.escape(bundle.get("generated_at", ""))
    sha = html.escape(bundle.get("bundle_sha256", ""))
    limitations = "".join(f"<li>{html.escape(x)}</li>" for x in bundle.get("limitations", []))
    timeline_rows = "".join(
        "<tr>"
        f"<td>{html.escape(str(e.get('time', '')))}</td>"
        f"<td>{html.escape(str(e.get('event', '')))}</td>"
        f"<td><code>{html.escape(str(e.get('path', '')))}</code></td>"
        "</tr>"
        for e in bundle.get("provenance_timeline", [])
    ) or "<tr><td colspan='3'>Timeline unavailable — no timestamps were present in the submitted sections.</td></tr>"

    pretty = html.escape(json.dumps(bundle.get("sections", {}), indent=2, default=str))

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<style>
body {{ font-family: system-ui, sans-serif; margin: 2rem; color: #0f172a; line-height: 1.5; }}
code, pre {{ font-family: ui-monospace, monospace; }}
pre {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; overflow: auto; }}
table {{ border-collapse: collapse; width: 100%; }}
th, td {{ border: 1px solid #e2e8f0; padding: 0.4rem; text-align: left; font-size: 0.9rem; }}
.badge {{ background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 1rem; }}
</style>
</head>
<body>
<h1>{title}</h1>
<p>Generated: {generated}<br>
Bundle SHA-256: <code>{sha}</code></p>

<div class="badge">
<strong>Research-support report.</strong> This document records computed observations, curated-source metadata,
model outputs where labelled, and untested hypotheses. It is not a clinical report and makes no diagnostic claim.
</div>

<h2>Limitations</h2>
<ul>{limitations}</ul>

<h2>Evidence and Provenance Timeline</h2>
<table>
<thead><tr><th>Time (UTC)</th><th>Event</th><th>Source path</th></tr></thead>
<tbody>{timeline_rows}</tbody>
</table>

<h2>Full Machine-Readable Sections</h2>
<p>The JSON below is the exact section payload hashed into this report bundle.</p>
<pre>{pretty}</pre>

</body>
</html>
"""
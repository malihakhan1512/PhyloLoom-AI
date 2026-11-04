import pytest

from app.investigation.report import build_report_bundle, render_html_report


def test_bundle_has_checksum_and_limitations():
    bundle = build_report_bundle("Test", {"demo": {"classification": "DEMO"}})
    assert bundle["bundle_sha256"]
    assert bundle["schema_version"].startswith("phyloloom.investigation-report")
    assert any("not a clinical" in x for x in bundle["limitations"])


def test_bundle_checksum_changes_with_content():
    a = build_report_bundle("Test", {"x": 1})
    b = build_report_bundle("Test", {"x": 2})
    assert a["bundle_sha256"] != b["bundle_sha256"]


def test_timeline_extracts_timestamps():
    bundle = build_report_bundle(
        "Test",
        {"reference": {"retrieved_at": "2026-01-01T00:00:00+00:00", "accession": "P68871"}},
    )
    events = {(e["event"], e["time"]) for e in bundle["provenance_timeline"]}
    assert ("retrieved_at", "2026-01-01T00:00:00+00:00") in events
    assert any(e["event"] == "report_generated_at" for e in bundle["provenance_timeline"])


def test_html_report_escapes_user_content():
    bundle = build_report_bundle("Test", {"note": "<script>alert(1)</script>"})
    html_text = render_html_report(bundle)
    assert "<script>alert(1)</script>" not in html_text
    assert "&lt;script&gt;" in html_text


def test_oversized_report_rejected():
    with pytest.raises(ValueError):
        build_report_bundle("Test", {"blob": "x" * 2_100_000})


def test_report_endpoint_returns_bundle():
    from fastapi.testclient import TestClient
    from app import main

    client = TestClient(main.app)
    response = client.post(
        "/api/investigation/report",
        json={"title": "API Test", "sections": {"x": {"classification": "COMPUTED"}}},
    )
    assert response.status_code == 200
    assert response.json()["bundle_sha256"]


def test_report_html_endpoint_returns_html():
    from fastapi.testclient import TestClient
    from app import main

    client = TestClient(main.app)
    response = client.post(
        "/api/investigation/report/html",
        json={"title": "API Test", "sections": {"x": {"classification": "COMPUTED"}}},
    )
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "PhyloLoom" in response.text
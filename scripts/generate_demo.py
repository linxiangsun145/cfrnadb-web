"""Generate deterministic synthetic UI fixtures. Never reads research data."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULES = [
    {"id": "sncrna", "name": "Small RNA", "short": "SNC", "description": "Browse illustrative short RNA annotations and abundance channels.", "category": "RNA peaks and small RNAs", "channels": [
        {"id": "snc_count", "name": "Count", "unit": "simulated assigned reads"},
        {"id": "snc_rpm", "name": "RPM", "unit": "simulated reads per million"}]},
    {"id": "promoter", "name": "Alternative promoter", "short": "PRO", "description": "Explore illustrative promoter features and separate measurement channels.", "category": "Human RNA extensions", "channels": [
        {"id": "promoter_count", "name": "Estimated count", "unit": "simulated estimated count"},
        {"id": "promoter_tpm", "name": "TPM", "unit": "simulated transcripts per million"}]},
    {"id": "cfrnapro", "name": "RNA coverage", "short": "COV", "description": "Inspect covered bases, mean coverage, and KL as distinct measurements.", "category": "Human RNA extensions", "channels": [
        {"id": "covered_bases", "name": "Covered bases", "unit": "simulated covered alignment bases"},
        {"id": "mean_coverage", "name": "Mean coverage", "unit": "simulated coverage"},
        {"id": "kl", "name": "KL", "unit": "dimensionless simulated score"}]},
    {"id": "cfpeak", "name": "RNA peaks", "short": "PEAK", "description": "Discover illustrative peak features with explicit feature revisions.", "category": "RNA peaks and small RNAs", "channels": [
        {"id": "peak_count", "name": "Weighted count", "unit": "simulated EM-weighted count"},
        {"id": "peak_rpm", "name": "RPM", "unit": "simulated weighted counts per million"}]},
]
STUDIES = [{"id": "DEMO-STUDY-%02d" % (i + 1), "name": "Synthetic study %s" % letter,
            "description": "Fictional collection for website testing; no biological study is represented.", "data_kind": "synthetic"}
           for i, letter in enumerate("ABC")]
samples = []
for i in range(24):
    samples.append({"id": "DEMO-%03d" % (i + 1), "study_id": STUDIES[i // 8]["id"], "group": "Demo group " + "ABC"[i % 3],
                    "biofluid": "Plasma" if i % 2 == 0 else "Serum", "subject_id": "DEMO-SUBJECT-%03d" % (i + 1),
                    "biosample_id": "DEMO-BIOSAMPLE-%03d" % (i + 1), "library_id": "DEMO-LIBRARY-%03d" % (i + 1),
                    "sequencing_run_id": "DEMO-RUN-%03d" % (i + 1), "library_type": "Simulated total RNA library",
                    "data_kind": "synthetic", "identity_status": "Synthetic identities defined by fixture"})
features, measurements = [], []
genes = ["VIM", "ACTB", "GAPDH", "MALAT1", "B2M", "RPLP0", "HBB", "ALB", "APOE", "FN1", "KRT18", "NEAT1"]
small_names = ["miR-21-5p", "miR-16-5p", "let-7a-5p", "miR-122-5p", "tRNA-Gly fragment", "tRNA-Glu fragment", "tRNA-Ala fragment", "tRNA-Val fragment", "snoRNA example 01", "snoRNA example 02", "rRNA fragment 01", "rRNA fragment 02"]
for mi, mod in enumerate(MODULES):
    for fi in range(12):
        fid = "DEMO-%s-%03d" % (mod["short"], fi + 1)
        if mod["id"] == "sncrna":
            name, kind = small_names[fi], ("miRNA" if fi < 4 else "tRNA fragment" if fi < 8 else "snoRNA" if fi < 10 else "rRNA fragment")
        else:
            name = genes[fi] + (" promoter example" if mod["id"] == "promoter" else " coverage example" if mod["id"] == "cfrnapro" else " peak example")
            kind = "Promoter" if mod["id"] == "promoter" else "Coverage feature" if mod["id"] == "cfrnapro" else "RNA peak"
        feature = {"id": fid, "revision_id": fid + ".v1", "name": name, "module_id": mod["id"], "type": kind,
                   "gene_label": genes[fi] if mod["id"] != "sncrna" else None, "reference_id": "DEMO_REFERENCE_v1",
                   "coordinates": None, "data_kind": "synthetic", "annotation_note": "Illustrative label only; no curated reference mapping or measured biological finding.",
                   "primary_channel_id": mod["channels"][0]["id"], "channel_ids": [c["id"] for c in mod["channels"]]}
        features.append(feature)
        for si, sample in enumerate(samples):
            token = (fi * 13 + si * 7 + mi * 3) % 53
            state = "not_measured" if token == 1 else "failed" if token == 2 else "low_depth" if token in (3, 4) else "observed"
            base = ((fi + 3) * (si + 7) * (mi + 2) * 17) % 5400
            base = 0 if token in (0, 5, 6) else base + 10
            for ci, channel in enumerate(mod["channels"]):
                if channel["id"] == "kl": value = round((base % 140) / 100, 3)
                elif channel["id"] == "mean_coverage": value = round(base / 280, 3)
                elif channel["id"] == "covered_bases": value = base * 31
                elif channel["id"] == "peak_count": value = round(base * 0.83, 2)
                elif ci: value = round(base / (7 + si % 5), 3)
                else: value = base
                measurements.append({"feature_id": fid, "feature_revision_id": feature["revision_id"], "sample_id": sample["id"],
                                     "channel_id": channel["id"], "unit": channel["unit"], "value": value if state == "observed" else None,
                                     "state": state, "data_kind": "synthetic"})
release = {"release_id": "cfrnadb-demo-20261026", "version": "demo-0.1.0", "data_kind": "synthetic", "release_date": "2026-10-26",
           "description": "Synthetic fixtures for interface development. No real samples, clinical metadata, or research measurements.",
           "reference_note": "DEMO_REFERENCE_v1 is a fixture marker, not a biological reference assembly. Coordinates are deliberately unspecified.",
           "state_definitions": {"observed": "A simulated measurement is available. Zero is a valid observed value.",
                                 "not_measured": "This feature/channel was not measured in this simulated sample.",
                                 "failed": "A simulated processing failure; no measurement is available.",
                                 "low_depth": "A simulated depth threshold was not met; the displayed measurement is unavailable."},
           "modules": MODULES, "studies": STUDIES, "samples": samples, "features": features, "measurements": measurements}
target = ROOT / "data" / "demo-release.json"
target.parent.mkdir(exist_ok=True)
payload = (json.dumps(release, ensure_ascii=False, separators=(",", ":")) + "\n").encode()
target.write_bytes(payload)
manifest = {"release_id": release["release_id"], "version": release["version"], "data_kind": "synthetic", "release_date": release["release_date"],
            "description": release["description"], "counts": {"studies": len(STUDIES), "samples": len(samples), "features": len(features), "measurements": len(measurements)},
            "files": [{"path": "data/demo-release.json", "bytes": len(payload), "sha256": hashlib.sha256(payload).hexdigest()}],
            "measurement_states": release["state_definitions"], "reference_note": release["reference_note"]}
(ROOT / "data" / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print(json.dumps(manifest["counts"]))

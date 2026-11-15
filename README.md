# cfRNAdb open resource

Anonymous bilingual portal: https://cfrnadb-web-hcha.vercel.app/

Public scope: four GSE133684 derived feature views (expression, coverage, promoter activity and promoter gene usage), 401 source labels; HRA000210 study-level directory only. No HRA per-label measurements or clinical metadata. ASE is excluded pending review of third-party variant annotation redistribution terms.

Three source-bound resource examples include exact values, missing states, source/reference hashes, plotting code, pinned dependencies, SVG/PDF figures and reproduction ZIPs. They demonstrate resource reuse; patient/library independence and diagnostic validation are not established. KRAS has only four paired measured labels.

Historical AS/editing/Mutation/fusion run-specific QC artifacts remain unavailable; the portal distinguishes technical integrity, reported QC and historical run reconstruction.

The frontend is static Vercel hosting. Anonymous read-only API requests use an isolated PostgreSQL projection via HTTPS; the private API and its database are separate. Arbitrary live queries depend on the Mac, Windows gateway and connecting network. The homepage, released catalogue, Methods, metadata exports, quality audit, full downloads, worked cases and TP53/EPCAM/KRAS snapshots are served statically and remain accessible during query-service interruption. Retained immutable source releases support migration.

Source study: GSE133684, PMID 31562239, DOI 10.1136/gutjnl-2019-318860. Interface workflows reference cfOmics, exoRBase 3.0 and EVAtlas. Cite the original data and release. Third-party data remain subject to applicable source terms; this repository does not assert a blanket third-party data license.

All twelve channels across the four open views have frozen, checksum-verified complete ZIPs distributed by static hosting. The download catalog is public-downloads.json.

Presentation update 2026-11-15: an independent audit scanned all 283,144,095 cells in the 12 frozen channel matrices. KL is 96.17% NA; promoter activity usage is 29.53% NA. No imputation was applied. Rebuilding the source gene links reproduced 235,171 links, with 18,868 source gene IDs shared across all four views. These are technical and annotation coverage checks, not independent biological validation.

See the portal Quality, Methods, Related resources and Release pages. `/resource-audit/resource-audit.zip` contains exact inputs, scripts, tested dependency versions, statistics, figures and checksums. `/release/manifest.json` attests approved presentation snapshots. Original channel ZIPs and matrix values are unchanged.

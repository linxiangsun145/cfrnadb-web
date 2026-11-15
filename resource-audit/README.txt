cfRNAdb public-2026.11.14 / independent resource audit 2026-11-15

Scope: GSE133684 only, 401 SRR source analysis labels, four views, 12 channels.
The 401 labels comprise 284 PDAC and 117 healthy source labels, not a verified
independent-donor census. The source table's 100 CP labels are outside the
delivered processed release; they are not classified as QC failures.

Python 3.11 or later. Exact tested dependencies are in requirements.txt.
1. pip install -r requirements.txt
2. Download the twelve named ZIPs from the cfRNAdb Downloads page into bundles/.
   Retain each original job-ID filename from input-bundles.json. Or explicitly
   opt in to approximately 515 MB of downloads with --download on step 3.
3. python audit_public_matrices.py --catalog input-catalog.json --manifest input-bundles.json --bundle-root bundles --output reproduced
4. python audit_gene_coverage.py --catalog input-catalog.json --manifest input-bundles.json --bundle-root bundles --output reproduced
5. python plot_resource_audit.py --input reproduced

All 283,144,095 matrix cells were scanned; ZIP SHA-256, declared matrix hashes,
units, source and measurement manifest hashes, row/column counts and metadata
axes were crosschecked. NA is distinct from observed zero. Negative and
non-finite observations are checked separately. No source matrices were edited.
Floating-point parsing is used only for descriptive counts, never to rewrite
exported precision. Timestamp/runtime fields vary between reproductions.

KL is 96.17% NA, including 40,035 all-NA feature rows. The source missingness
state is unavailable_low_coverage. This audit does not reconstruct its threshold.
Promoter activity usage is 29.53% NA, including 2,294 all-NA feature rows.
Zero fractions use all cells as denominator. Per-source tables preserve groups.
No clinical effect, diagnostic accuracy, independent molecular validation or
historical advanced-run reconstruction is established by these statistics.

The mapping audit independently rebuilds 235,171 exact source-declared Ensembl
gene links. Original version IDs and reference hashes remain in the link table.
194 feature rows remain unmapped rather than being guessed. Across the four
views, 18,868 canonical source gene IDs are shared. Pairwise version sets were
also checked (zero disjoint source-version sets among shared gene IDs).

Gene links are not coordinate liftover or reference-sequence verification.
HRA000210 per-label data and the ASE matrix are not present. Original advanced
AS/editing/mutation/fusion QC files are still pending; current configuration and
this new audit do not substitute for historical run evidence.

Figures use separate channel units and descriptive availability only; SVG/PDF
and 300-dpi PNG files are included. Source data/citation and reuse context:
GSE133684; PMID 31562239; DOI 10.1136/gutjnl-2019-318860.
https://www.ncbi.nlm.nih.gov/geo/info/disclaimer.html
https://cfrnadb-web-hcha.vercel.app/
Record the cfRNAdb release, channel/unit, source references, SHA-256 and access
date when reusing. No new blanket licence or rights to controlled/third-party
data are conferred by this package.

SHA-256 checksums.json covers every payload file except checksums.json itself
and resource-audit.zip. Full channel matrices are separate unchanged downloads.

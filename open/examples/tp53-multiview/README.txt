cfRNAdb public resource example: tp53-multiview
Source: GSE133684, PMID 31562239, DOI 10.1136/gutjnl-2019-318860.
Reproduce: python -m pip install -r requirements.txt
python reproduce.py --data data.json --output reproduced

Exact data and mapping provenance are in data.json; all included and missing source values are in values.tsv. Source IDs are joined explicitly. NA is not zero. Promoter source IDs are selected lexically, not by group effects. Boxplot whiskers span observed ranges.
Descriptive example only. Patient/library independence is unconfirmed. Shared reads, protocol and study batch can affect patterns. No diagnostic validation is claimed.
Reuse is subject to source attribution and applicable source/annotation terms. No new blanket license is asserted for third-party data.

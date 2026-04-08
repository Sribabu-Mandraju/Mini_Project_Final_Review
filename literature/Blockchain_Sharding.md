## 5. Increasing the Efficiency of Disaster Relief Assistance based on Blockchain Technology with Blockchain Sharding

**Author:** Inayatulloh
**Published:** ICISS 2025, IEEE — Bina Nusantara University, Jakarta, Indonesia
<https://ieeexplore.ieee.org/document/11076247>

### Summary

Building on prior work in blockchain-based disaster aid distribution, this paper identifies a key limitation of standard peer-to-peer blockchain validation: it becomes **inefficient at scale**, particularly when aid distribution spans multiple regions or countries. To address this, the author proposes a novel **blockchain sharding model** implemented with **Hyperledger Fabric**.

**Sharding Concept:** The blockchain is divided into smaller partitions called "shards," each processing transactions from a specific geographic region in parallel. This reduces individual node workload, decreases latency, and dramatically increases transaction throughput.

**Proposed Model:**

- Three regional blockchains (Region A, B, C) operate independently with their own participants, smart contracts, and transactions (e.g., TrAidA01–TrAidA03).
- After regional validation, shards A, B, and C are integrated into a **Global Disaster Relief Assistance Blockchain Network**.
- Participants include government officers, disaster distribution agencies, village heads, society/beneficiaries, and donors — each with specific roles and validation authority.

**System Design:** Includes use case diagrams, class diagrams (7 classes), donor/village UI designs, and simulation results using Hyperledger Fabric on Ubuntu 18.04.

**Limitations:** The current research is limited to system design and simulation in a controlled environment; real-world deployment with live actors and performance benchmarking is identified as future work.

**Conclusion:** Blockchain sharding significantly enhances the efficiency of peer-to-peer validation in large-scale, geographically distributed disaster relief systems, making blockchain a more viable solution for global humanitarian operations.

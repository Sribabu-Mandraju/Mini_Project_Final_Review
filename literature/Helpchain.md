## 3. Helpchain: A Blockchain Based Disaster Management System

**Authors:** Berke Parıldar, Doruk Sayın, Furkan Zeki Türkzeybek, Onur Küçüköz, Yusuf Murat Erten
**Published:** IISEC 2023, IEEE — Izmir University of Economics, Türkiye
<https://ieeexplore.ieee.org/document/10391032>

### Summary

Motivated by coordination failures observed during Turkey's devastating earthquake of February 6, 2023, this paper presents **Helpchain** — a blockchain-based disaster management system designed to help relief agencies identify and locate victims quickly.

The system consists of three components: a **mobile application** for individual users, a **blockchain network** (Sepolia Ethereum Testnet) for storing user data, and a **desktop application** for disaster relief organizations.

**System Features:**

- Users register via the mobile app (built with Flutter/Dart) by providing name, address, and national ID. A smart contract is automatically deployed per user on registration.
- During a disaster, users can update their status to one of three options: **"In Distress"**, **"Need Help"**, or **"Safe"**. Each status update also records the user's current GPS location.
- Relief organizations use the desktop app (built with .NET WPF) to filter and view users by status, enabling prioritized and efficient rescue operations.
- A Node.js RESTful API bridges blockchain data with the desktop application, using Web3.js for blockchain interaction.

**Limitations & Future Work:** Device-to-device communication for infrastructure-failed scenarios and inter-organizational data sharing on smart contracts are identified as areas for future development.

**Conclusion:** Helpchain demonstrates a working prototype that uses blockchain's decentralized and immutable properties to improve victim identification and rescue coordination in disaster zones.

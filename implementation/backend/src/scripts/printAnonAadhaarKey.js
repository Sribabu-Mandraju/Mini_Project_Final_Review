import { productionPublicKeyHash, testPublicKeyHash } from "@anon-aadhaar/core";

async function main() {
  console.log("Anon Aadhaar productionPublicKeyHash:");
  console.log(productionPublicKeyHash);

  console.log("\nAnon Aadhaar testPublicKeyHash:");
  console.log(testPublicKeyHash);
}

main().catch((error) => {
  console.error("Error while printing Anon Aadhaar public key hashes:", error);
  process.exitCode = 1;
});

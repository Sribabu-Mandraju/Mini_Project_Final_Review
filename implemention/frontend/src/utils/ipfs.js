const PINATA_JSON_ENDPOINT = "https://api.pinata.cloud/pinning/pinJSONToIPFS";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

export async function uploadMetadataToIpfs({ descriptionText, imageUrl }) {
  const jwt = import.meta.env.VITE_PINATA_JWT || "";

  if (!jwt) {
    throw new Error("VITE_PINATA_JWT is not set in environment");
  }

  if (!descriptionText?.trim()) {
    throw new Error("Description is required for IPFS metadata upload");
  }

  if (!imageUrl?.trim()) {
    throw new Error("Image URL is required for IPFS metadata upload");
  }

  const payload = {
    description: descriptionText.trim(),
    image: imageUrl.trim(),
  };

  const response = await fetch(PINATA_JSON_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to upload metadata to IPFS");
  }

  const data = await response.json();

  if (!data?.IpfsHash) {
    throw new Error("Invalid IPFS response");
  }

  return `ipfs://${data.IpfsHash}`;
}

/**
 * Fetch metadata from IPFS URI
 * @param {string} ipfsUri - IPFS URI (e.g., "ipfs://Qm...")
 * @returns {Promise<{description: string, image: string}>}
 */
export async function fetchIpfsMetadata(ipfsUri) {
  if (!ipfsUri || !ipfsUri.startsWith("ipfs://")) {
    throw new Error("Invalid IPFS URI");
  }

  const hash = ipfsUri.replace("ipfs://", "");
  const url = `${PINATA_GATEWAY}${hash}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch IPFS metadata: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      description: data.description || "",
      image: data.image || "",
    };
  } catch (error) {
    console.error("Error fetching IPFS metadata:", error);
    throw error;
  }
}

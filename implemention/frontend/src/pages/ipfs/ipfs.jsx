import { useState } from "react";

import { uploadImage } from "../../cloudinary";
import { uploadMetadataToIpfs } from "../../utils/ipfs";

const IpfsPage = () => {
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [cloudinaryUrl, setCloudinaryUrl] = useState("");
  const [ipfsPayloadUri, setIpfsPayloadUri] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [cloudinaryError, setCloudinaryError] = useState("");

  const handleImageUploadToCloudinary = async () => {
    if (!imageFile) {
      setCloudinaryError("Please choose an image file first.");
      return;
    }

    setIsUploadingImage(true);
    setCloudinaryError("");
    setCloudinaryUrl("");

    try {
      const response = await uploadImage(imageFile);
      setCloudinaryUrl(response.secure_url);
    } catch (err) {
      setCloudinaryError(err.message || "Cloudinary upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setIpfsPayloadUri("");

    try {
      if (!description.trim()) {
        throw new Error("Description is required");
      }
      if (!cloudinaryUrl) {
        throw new Error("Please upload image to Cloudinary first");
      }

      const uri = await uploadMetadataToIpfs({
        descriptionText: description.trim(),
        imageUrl: cloudinaryUrl,
      });
      setIpfsPayloadUri(uri);

      // eslint-disable-next-line no-console
      console.log("IPFS payload URI:", uri);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "1.5rem" }}>
      <h2>Upload Description + Cloudinary URL to IPFS</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.25rem" }}>
            Description
          </label>
          <textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            style={{
              width: "100%",
              padding: "0.5rem",
              color: "#000",
              backgroundColor: "#fff",
              border: "1px solid #cbd5f5",
              borderRadius: "4px",
            }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.25rem" }}>
            Image File
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            style={{
              width: "100%",
              padding: "0.5rem",
              color: "#000",
              backgroundColor: "#fff",
              border: "1px solid #cbd5f5",
              borderRadius: "4px",
            }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <button
            type="button"
            onClick={handleImageUploadToCloudinary}
            disabled={isUploadingImage}
            style={{ marginRight: "0.5rem" }}
          >
            {isUploadingImage
              ? "Uploading image..."
              : "Upload Image to Cloudinary"}
          </button>
        </div>

        {cloudinaryError && (
          <p style={{ color: "red", marginTop: "0.5rem" }}>
            Cloudinary Error: {cloudinaryError}
          </p>
        )}

        {cloudinaryUrl && (
          <p style={{ marginTop: "0.5rem", color: "green" }}>
            <strong>Cloudinary URL:</strong> {cloudinaryUrl}
          </p>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Uploading metadata to IPFS..."
            : "Upload metadata to IPFS"}
        </button>
      </form>

      {error && (
        <p style={{ color: "red", marginTop: "1rem" }}>Error: {error}</p>
      )}

      {ipfsPayloadUri && (
        <p style={{ marginTop: "1rem" }}>
          <strong>Metadata IPFS URI:</strong> {ipfsPayloadUri}
        </p>
      )}
    </div>
  );
};

export default IpfsPage;

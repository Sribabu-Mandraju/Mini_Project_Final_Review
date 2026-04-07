/**
 * Cloudinary upload utility (frontend).
 * Uses unsigned upload – do NOT put api_secret in frontend.
 * Create an "Unsigned" upload preset in Cloudinary: Settings → Upload → Add upload preset.
 * Set VITE_CLOUDINARY_UPLOAD_PRESET in .env to that preset name.
 */

const CLOUD_NAME = "dbv5szwtp";
const API_KEY = "392375895116741";

const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Upload an image file to Cloudinary (unsigned).
 * @param {File} file - Image file to upload
 * @returns {Promise<object>} Cloudinary JSON response (public_id, secure_url, etc.)
 */
export async function uploadImage(file) {
  if (!file || !(file instanceof File)) {
    throw new Error("Valid image file is required");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed for Cloudinary upload");
  }

  if (!UPLOAD_PRESET) {
    throw new Error(
      "VITE_CLOUDINARY_UPLOAD_PRESET is not set. Create an unsigned upload preset in Cloudinary dashboard and add it to .env",
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    let message = `Upload failed (${response.status})`;
    try {
      const json = JSON.parse(text);
      message = json.error?.message || text || message;
    } catch {
      message = text || message;
    }
    throw new Error(message);
  }

  const data = await response.json();
  if (!data?.secure_url) {
    throw new Error("Cloudinary upload did not return a secure_url");
  }
  return data;
}

export { CLOUD_NAME, API_KEY, UPLOAD_URL };

import { genUploader } from "uploadthing/client";

// Create an uploader instance
const uploadFilesClient = genUploader();

export async function uploadFiles({ endpoint, files }) {
  if (!files || files.length === 0) return [];

  try {
    // Call the uploader instance
    const res = await uploadFilesClient({ endpoint, files });
    return res;
  } catch (error) {
    console.error("UploadThing upload error:", error);
    return [];
  }
}

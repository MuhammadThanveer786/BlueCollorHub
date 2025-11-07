"use client";

import { UploadButton } from "@uploadthing/react";
import "@uploadthing/react/styles.css";

export default function FileUploader() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold">Upload Files</h2>

      {/* For Images */}
      <UploadButton
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          console.log("Image uploaded:", res);
          alert("Upload Completed!");
        }}
        onUploadError={(error) => {
          alert(`ERROR! ${error.message}`);
        }}
      />

      {/* For Videos */}
      <UploadButton
        endpoint="videoUploader"
        onClientUploadComplete={(res) => {
          console.log("Video uploaded:", res);
        }}
        onUploadError={(error) => {
          alert(`Upload failed: ${error.message}`);
        }}
      />
    </div>
  );
}
"use client";

import { useState } from "react";
import { UploadButton } from "@uploadthing/react";
import "@uploadthing/react/styles.css";
import { toast } from "sonner";
import axios from "axios";

export default function CreatePostForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [files, setFiles] = useState([]); // uploaded files
  const [saving, setSaving] = useState(false);

  const removeFile = (index) => setFiles(files.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!title || !description || files.length === 0) {
      toast.error("Title, description, and media are required!");
      return;
    }

    setSaving(true);
    try {
      const body = {
        title,
        description,
        images: mediaType === "image" ? files.map((f) => f.url) : [],
        video: mediaType === "video" ? files[0]?.url : null,
      };

      // console.log(body);
      const { data } = await axios.post("/api/post", body);

      if (data.success) {
        toast.success("Post created successfully!");
        setTitle("");
        setDescription("");
        setFiles([]);
        setMediaType("image");
      } else {
        toast.error(data.message || "Failed to create post.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error while creating post.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg border border-gray-300 mt-6">
      <h2 className="text-xl font-bold mb-4 text-black text-center">Create New Post</h2>

      {/* Title */}
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-3 border-b border-black mb-4 focus:outline-none"
      />

      {/* Description */}
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-3 border-b border-black h-24 resize-none mb-4 focus:outline-none"
      />

      {/* Media Type Selector */}
      <select
        value={mediaType}
        onChange={(e) => {
          setMediaType(e.target.value);
          setFiles([]);
        }}
        className="w-full p-3 border-b border-black mb-4 focus:outline-none"
      >
        <option value="image">Image</option>
        <option value="video">Video</option>
      </select>

      {/* Upload Button */}
      <UploadButton
        endpoint={mediaType === "image" ? "imageUploader" : "videoUploader"}
        onClientUploadComplete={(res) => {
          if (res?.length) {
            if (mediaType === "image") {
              setFiles((prev) => [...prev, ...res]);
            } else {
              setFiles([res[0]]);
            }
            toast.success("File uploaded successfully!");
          }
        }}
        onUploadError={(error) => toast.error(`Upload failed: ${error.message}`)}
        multiple={mediaType === "image"}
      >
        <button className="w-full py-2 mb-4 bg-black text-white rounded-md hover:bg-gray-800 transition">
          Upload {mediaType}
        </button>
      </UploadButton>

      {/* Display Uploaded Files */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm gap-2"
            >
              <span className="truncate max-w-xs">{file.name || file.url}</span>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="text-red-500 font-bold"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-2 rounded-md text-white font-semibold transition ${
          saving ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"
        }`}
      >
        {saving ? "Saving..." : "Create Post"}
      </button>
    </div>
  );
}

// app/api/uploadthing/core.js
import { createUploadthing } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "10MB" } })
    .onUploadComplete(async ({ file }) => {
      console.log("Image uploaded:", file.url);
    }),

  videoUploader: f({ video: { maxFileSize: "100MB" } })
    .onUploadComplete(async ({ file }) => {
      console.log("Video uploaded:", file.url);
    }),

  // NEW: Chat media uploader
  chatMedia: f({ image: { maxFileSize: "10MB" }, video: { maxFileSize: "100MB" } })
    .onUploadComplete(async ({ file }) => {
      console.log("Chat media uploaded:", file.url);
      // TODO: save file.url to MongoDB message document
    }),
};

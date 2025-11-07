import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    emailVerified: { type: Date },
    image: { type: String },
    profilePic: { type: String, default: null },
    password: { type: String },
    title: { type: String, default: null },
    skills: { type: [String], default: [] },
    skillCategories: { type: [String], default: [] },
    phone: { type: String, default: null },
    whatsappNo: { type: String, default: null },
    coverImage: { type: String, default: null },

    // --- UPDATED/ADDED FIELDS ---
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    
    // These fields were missing, causing the error:
    connectionRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    connectionRequestsReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // --- END UPDATED/ADDED FIELDS ---

    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
      state: { type: String, default: null },
      district: { type: String, default: null },
      town: { type: String, default: null },
    },
  },
  { timestamps: true }
);

userSchema.index({ location: "2dsphere" });

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
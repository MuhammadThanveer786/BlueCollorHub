"use client";
import { UploadButton } from "@uploadthing/react";
import "@uploadthing/react/styles.css";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import categoriesWithSkills from "@/data/categoriesWithSkills";
import southStatesWithDistricts from "@/data/southStatesWithDistricts";

export default function EditProfileModal({ user, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    title: user.title || "",
    phone: user.phone || "",
    skillCategory: user.skillCategories?.[0] || "", // take first if exists
    skill: user.skills?.[0] || "", // take first if exists
    state: user.location?.state || "",
    district: user.location?.district || "",
    town: user.location?.town || "",
    profilePic: user.profilePic || "",
    coverImage: user.coverImage || "",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "skillCategory" ? { skill: "" } : {}), // reset skill when category changes
      ...(name === "state" ? { district: "", town: "" } : {}), // reset district/town when state changes
      ...(name === "district" ? { town: "" } : {}), // reset town when district changes
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        title: formData.title,
        phone: formData.phone,
        profilePic: formData.profilePic,
        coverImage: formData.coverImage,
        skillCategories: formData.skillCategory ? [formData.skillCategory] : [],
        skills: formData.skill ? [formData.skill] : [],
        location: {
          type: "Point",
          coordinates: [0, 0], // later you can update with real geocoding
          state: formData.state || null,
          district: formData.district || null,
          town: formData.town || null,
        },
      };

      const { data } = await axios.patch(`/api/user/${user._id}`, payload);
      onSave(data.user || payload);
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error("Error updating profile. Try again!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[rgba(0,0,0,0.35)] flex items-start justify-center z-50 p-4 overflow-auto"
      onClick={onCancel}
    >
      <div
        className="bg-white w-full max-w-4xl p-8 rounded-xl shadow-2xl mt-12 relative animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">
          Edit Profile
        </h2>

        {/* Cover Image */}
        <div className="mb-6">
          <label className="block font-semibold mb-2 text-gray-700">
            Cover Image
          </label>
          <div className="relative group rounded-lg overflow-hidden">
            <img
              src={formData.coverImage || "/cover.jpg"}
              alt="Cover"
              className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-50 transition cursor-pointer">
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  if (res && res[0])
                    setFormData((prev) => ({
                      ...prev,
                      coverImage: res[0].url,
                    }));
                }}
                onUploadError={(error) =>
                  toast.error(`Upload failed: ${error.message}`)
                }
              >
                <Pencil className="w-6 h-6 text-white" />
              </UploadButton>
            </div>
          </div>
        </div>

        {/* Profile Picture & Username */}
        <div className="flex items-center mb-8 space-x-6">
          <div className="relative w-32 h-32 group rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
            <img
              src={formData.profilePic || "/profile.jpg"}
              alt="Profile"
              className="w-32 h-32 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-50 transition cursor-pointer rounded-full">
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  if (res && res[0])
                    setFormData((prev) => ({
                      ...prev,
                      profilePic: res[0].url,
                    }));
                }}
                onUploadError={(error) =>
                  toast.error(`Upload failed: ${error.message}`)
                }
              >
                <Pencil className="w-5 h-5 text-white" />
              </UploadButton>
            </div>
          </div>

          {/* Username Field */}
          <div className="flex-1">
            <label className="block font-semibold mb-1 text-gray-700">
              Username
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border-b border-gray-300 px-0 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Other Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bio */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Bio</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border-b border-gray-300 px-0 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">
              Mobile Number
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border-b border-gray-300 px-0 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Skill Category */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">
              Skill Category
            </label>
            <select
              name="skillCategory"
              value={formData.skillCategory}
              onChange={handleChange}
              className="w-full border-b border-gray-300 px-0 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select a category</option>
              {Object.keys(categoriesWithSkills).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Skill */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Skill</label>
            <select
              name="skill"
              value={formData.skill}
              onChange={handleChange}
              disabled={!formData.skillCategory}
              className="w-full border-b border-gray-300 px-0 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select a skill</option>
              {formData.skillCategory &&
                categoriesWithSkills[formData.skillCategory]?.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
            </select>
          </div>

          {/* State */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">State</label>
            <select
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full border-b border-gray-300 px-0 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select a state</option>
              {Object.keys(southStatesWithDistricts).map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">District</label>
            <select
              name="district"
              value={formData.district}
              onChange={handleChange}
              disabled={!formData.state}
              className="w-full border-b border-gray-300 px-0 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select a district</option>
              {formData.state &&
                southStatesWithDistricts[formData.state]?.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
            </select>
          </div>

          {/* Town */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Town</label>
            <input
              type="text"
              name="town"
              value={formData.town}
              onChange={handleChange}
              disabled={!formData.district}
              className="w-full border-b border-gray-300 px-0 py-2 focus:outline-none focus:border-indigo-500"
              placeholder="Enter town/village"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end mt-8 space-x-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold transition ${
              saving ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-700"
            }`}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

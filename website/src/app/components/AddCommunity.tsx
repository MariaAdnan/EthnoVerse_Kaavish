// src/app/components/AddCommunity.tsx

import { motion } from "motion/react";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { createCommunity } from "../../services/communities";
import { useEffect } from "react";
import { uploadToCloudinary } from "../../lib/cloudinary";


interface AddCommunityProps {
  onNavigate: (view: string) => void;
}

export function AddCommunity({ onNavigate }: AddCommunityProps) {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    language: "",
    shortDescription: "",
    longDescription: "",
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    let coverImageUrl: string | null = null;

    // 1️⃣ Upload cover image if exists
    if (coverFile) {
      const uploadResult = await uploadToCloudinary(coverFile);
      coverImageUrl = uploadResult.url;
    }

    // 2️⃣ Create community with cover_image
    const { error } = await createCommunity({
      name: formData.name,
      location: formData.location,
      language: formData.language,
      short_description: formData.shortDescription,
      long_description: formData.longDescription,
      cover_image: coverImageUrl,
    });

    if (error) throw error;

    alert("Community created successfully");
    onNavigate("admin");
  } catch (err: any) {
    console.error("CREATE COMMUNITY ERROR:", err);
    alert(err.message || "Failed to create community");
  }
};


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-8">
      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-3xl"
      >
        {/* Header */}
        <div className="mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-7xl text-[#F5F1E8] mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            REGISTER COMMUNITY
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-[#F5F1E8] text-sm"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            ETHNOGRAPHIC DATA ENTRY SYSTEM
          </motion.p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Name Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <label
              htmlFor="name"
              className="block text-xs text-[#F5F1E8] mb-3 tracking-wider opacity-60"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              NAME
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Kolhi, Bheel"
              className="w-full bg-transparent border-b-2 border-[#F5F1E8]/20 text-[#F5F1E8] pb-3 focus:border-[#CC7722] focus:outline-none transition-colors placeholder:text-[#F5F1E8]/30"
              style={{ fontFamily: "'Space Mono', monospace" }}
            />
          </motion.div>

          {/* Location Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <label
              htmlFor="location"
              className="block text-xs text-[#F5F1E8] mb-3 tracking-wider opacity-60"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              LOCATION
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              placeholder="e.g., Tharparkar, Umerkot"
              className="w-full bg-transparent border-b-2 border-[#F5F1E8]/20 text-[#F5F1E8] pb-3 focus:border-[#CC7722] focus:outline-none transition-colors placeholder:text-[#F5F1E8]/30"
              style={{ fontFamily: "'Space Mono', monospace" }}
            />
          </motion.div>

          {/* Language Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <label
              htmlFor="language"
              className="block text-xs text-[#F5F1E8] mb-3 tracking-wider opacity-60"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              LANGUAGE
            </label>
            <input
              type="text"
              id="language"
              name="language"
              value={formData.language}
              onChange={handleChange}
              required
              placeholder="e.g., Dhatki, Sindhi"
              className="w-full bg-transparent border-b-2 border-[#F5F1E8]/20 text-[#F5F1E8] pb-3 focus:border-[#CC7722] focus:outline-none transition-colors placeholder:text-[#F5F1E8]/30"
              style={{ fontFamily: "'Space Mono', monospace" }}
            />
          </motion.div>

          {/* Short Description Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            <label
              htmlFor="shortDescription"
              className="block text-xs text-[#F5F1E8] mb-3 tracking-wider opacity-60"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              SHORT DESCRIPTION
              <span className="ml-2 opacity-40">(Max 150 characters)</span>
            </label>
            <input
              type="text"
              id="shortDescription"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              required
              maxLength={150}
              placeholder="A brief introduction to the community..."
              className="w-full bg-transparent border-b-2 border-[#F5F1E8]/20 text-[#F5F1E8] pb-3 focus:border-[#CC7722] focus:outline-none transition-colors placeholder:text-[#F5F1E8]/30"
              style={{ fontFamily: "'Space Mono', monospace" }}
            />
            <div className="mt-2 text-xs text-[#F5F1E8]/40 text-right" style={{ fontFamily: "'Space Mono', monospace" }}>
              {formData.shortDescription.length}/150
            </div>
          </motion.div>

          {/* Long Description Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <label
              htmlFor="longDescription"
              className="block text-xs text-[#F5F1E8] mb-3 tracking-wider opacity-60"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              LONG DESCRIPTION
            </label>
            <textarea
              id="longDescription"
              name="longDescription"
              value={formData.longDescription}
              onChange={handleChange}
              required
              rows={8}
              placeholder="Detailed ethnographic information about the community, their traditions, cultural practices, and historical context..."
              className="w-full bg-transparent border-2 border-[#F5F1E8]/20 text-[#F5F1E8] p-4 focus:border-[#CC7722] focus:outline-none transition-colors resize-none placeholder:text-[#F5F1E8]/30"
              style={{ fontFamily: "'Space Mono', monospace" }}
            />
          </motion.div>
          {/* Cover Image Upload */}
<motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.6, delay: 0.5 }}
>
  <label
    className="block text-xs text-[#F5F1E8] mb-3 tracking-wider opacity-60"
    style={{ fontFamily: "'Space Mono', monospace" }}
  >
    COVER IMAGE
  </label>

  <div className="border-2 border-dashed border-[#F5F1E8]/30 p-6 text-center hover:border-[#CC7722] transition-colors">
    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        if (e.target.files?.[0]) {
          setCoverFile(e.target.files[0]);
        }
      }}
      className="hidden"
      id="cover-upload"
    />

    <label htmlFor="cover-upload" className="cursor-pointer">
      {coverFile ? (
        <p className="text-sm text-[#F5F1E8]">
          Selected: {coverFile.name}
        </p>
      ) : (
        <p className="text-sm text-[#F5F1E8]/60">
          Click to upload cover image (JPG / PNG)
        </p>
      )}
    </label>
  </div>
</motion.div>


          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="flex justify-end pt-8"
          >
            <button
              type="submit"
              className="bg-[#CC7722] text-[#F5F1E8] px-12 py-5 hover:bg-[#CC7722]/90 transition-all border-2 border-[#CC7722] hover:border-[#F5F1E8] group flex items-center gap-3"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              CREATE ARCHIVE
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </form>
      </motion.div>

      {/* Back Navigation */}
      <div className="fixed top-8 left-8 z-50">
        <button
          onClick={() => onNavigate('admin')}
          className="text-[#F5F1E8] hover:text-[#CC7722] transition-colors"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          <span className="text-sm">← ADMIN</span>
        </button>
      </div>
    </div>
  );
}

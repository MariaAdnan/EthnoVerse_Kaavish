// src/app/components/AddCommunity.tsx

import { motion } from "motion/react";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createCommunity } from "../../services/communities";
import { uploadToCloudinary } from "../../lib/cloudinary";
import { resizeImage, validateUploadFile } from "../../lib/files";
import { errorMessage } from "../../lib/validation";


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
  const [isSubmitting, setIsSubmitting] = useState(false);
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (isSubmitting) return;

  try {
    setIsSubmitting(true);
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
      picture_cloudinary_url: coverImageUrl,
    });

    if (error) throw error;

    toast.success("Community created successfully.");
    onNavigate("admin");
  } catch (err: unknown) {
    console.error("CREATE COMMUNITY ERROR:", err);
    toast.error(errorMessage(err, "Failed to create community."));
  } finally {
    setIsSubmitting(false);
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
    <div className="min-h-screen bg-ink flex items-center justify-center p-8">
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
            className="text-6xl md:text-7xl text-paper mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            REGISTER COMMUNITY
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-paper text-sm"
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
              className="block text-xs text-paper mb-3 tracking-wider opacity-80"
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
              className="w-full bg-transparent border-b-2 border-paper/20 text-paper pb-3 focus:border-accent focus:outline-none transition-colors placeholder:text-paper/30"
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
              className="block text-xs text-paper mb-3 tracking-wider opacity-80"
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
              className="w-full bg-transparent border-b-2 border-paper/20 text-paper pb-3 focus:border-accent focus:outline-none transition-colors placeholder:text-paper/30"
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
              className="block text-xs text-paper mb-3 tracking-wider opacity-80"
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
              className="w-full bg-transparent border-b-2 border-paper/20 text-paper pb-3 focus:border-accent focus:outline-none transition-colors placeholder:text-paper/30"
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
              className="block text-xs text-paper mb-3 tracking-wider opacity-80"
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
              className="w-full bg-transparent border-b-2 border-paper/20 text-paper pb-3 focus:border-accent focus:outline-none transition-colors placeholder:text-paper/30"
              style={{ fontFamily: "'Space Mono', monospace" }}
            />
            <div className="mt-2 text-xs text-paper/40 text-right" style={{ fontFamily: "'Space Mono', monospace" }}>
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
              className="block text-xs text-paper mb-3 tracking-wider opacity-80"
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
              className="w-full bg-transparent border-2 border-paper/20 text-paper p-4 focus:border-accent focus:outline-none transition-colors resize-none placeholder:text-paper/30"
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
    className="block text-xs text-paper mb-3 tracking-wider opacity-80"
    style={{ fontFamily: "'Space Mono', monospace" }}
  >
    COVER IMAGE
  </label>

  <div className="border-2 border-dashed border-paper/30 p-6 text-center hover:border-accent transition-colors">
    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        if (e.target.files?.[0]) {
          const selected = e.target.files[0];
          void (async () => {
            try {
              validateUploadFile(selected, "image");
              setCoverFile(await resizeImage(selected));
            } catch (error) {
              setCoverFile(null);
              toast.error(errorMessage(error, "Invalid cover image."));
            }
          })();
        }
      }}
      className="hidden"
      id="cover-upload"
    />

    <label htmlFor="cover-upload" className="cursor-pointer">
      {coverFile ? (
        <p className="text-sm text-paper">
          Selected: {coverFile.name}
        </p>
      ) : (
        <p className="text-sm text-paper/60">
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
              disabled={isSubmitting}
              className="bg-accent text-paper px-12 py-5 hover:bg-accent/90 transition-all border-2 border-accent hover:border-paper group flex items-center gap-3 disabled:cursor-wait disabled:opacity-80"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {isSubmitting ? "CREATING…" : "CREATE ARCHIVE"}
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              ) : (
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              )}
            </button>
          </motion.div>
        </form>
      </motion.div>

      {/* Back Navigation */}
      <div className="fixed top-8 left-8 z-50">
        <button
          onClick={() => onNavigate('admin')}
          className="text-paper hover:text-accent transition-colors"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          <span className="text-sm">← ADMIN</span>
        </button>
      </div>
    </div>
  );
}

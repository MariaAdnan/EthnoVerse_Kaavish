export const BUILT_IN_TOUR_COMMUNITY_ID =
  import.meta.env.VITE_BUILT_IN_TOUR_COMMUNITY_ID?.trim() ||
  "2c0e586a-3685-4135-8107-b442cdd22d73";

export const COMMUNITY_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1677153224313-7b009d1b33e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

export const OFFLINE_COMMUNITY = {
  community_id: "offline-preview",
  name: "Archive unavailable",
  location: "Local preview",
  language: "",
  short_description:
    "Live community records could not be loaded. Reconnect to view verified archive data.",
  long_description: "",
  picture_cloudinary_url: COMMUNITY_PLACEHOLDER_IMAGE,
  created_at: "",
};

// Netlify Scheduled Function: Supabase free-tier projects pause after 7 days
// without database activity. Reading one row every 2 days keeps EthnoVerse's
// database awake for as long as the site is deployed, with no commits needed.
// Uses the same public URL and publishable key the website ships to browsers.
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || "https://dstropmznqaadsyhojvb.supabase.co").trim();
const SUPABASE_KEY = (
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_Xi4CoXyQFxJ30oFH1J_waA_LyedCOqx"
).trim();

export default async () => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/communities?select=community_id&limit=1`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    signal: AbortSignal.timeout(20_000),
  });
  const message = `Supabase keep-alive: HTTP ${response.status}`;
  if (!response.ok) {
    console.error(`${message}. If the project is paused, resume it in the Supabase dashboard.`);
    return new Response(message, { status: 502 });
  }
  console.log(message);
  return new Response(message);
};

export const config = {
  schedule: "17 6 */2 * *",
};

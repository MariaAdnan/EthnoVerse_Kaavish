export const BASE_URL = "http://localhost:5000/api";  // Change to your real backend

export async function apiGet(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  return res.json();
}

export async function apiPost(endpoint, data) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
export async function apiUpload(endpoint, formData) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}
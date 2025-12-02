// test.js
const fetch = require("node-fetch"); // <-- node-fetch import
(async () => {
  const fetch = (await import("node-fetch")).default;

  try {
    const res = await fetch("http://localhost:5000/communities"); // your backend URL
    const data = await res.json();
    console.log("Backend returned:", data);
  } catch (err) {
    console.error("Error connecting to backend:", err);
  }
})();

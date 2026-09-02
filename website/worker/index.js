function assetRequest(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = "";
  return new Request(url, request);
}

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || !["GET", "HEAD"].includes(request.method)) {
      return response;
    }

    const { pathname } = new URL(request.url);
    const finalSegment = pathname.split("/").pop() ?? "";
    if (finalSegment.includes(".")) return response;

    return env.ASSETS.fetch(assetRequest(request, "/index.html"));
  },
};

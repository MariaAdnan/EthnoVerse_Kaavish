const modalDownloadEndpoint = import.meta.env.VITE_MODAL_DOWNLOAD_URL?.replace(/\/$/, "");

export function getModelDownloadUrl(objectName: string) {
  if (!modalDownloadEndpoint) return null;
  return `${modalDownloadEndpoint}?object_name=${encodeURIComponent(objectName)}`;
}

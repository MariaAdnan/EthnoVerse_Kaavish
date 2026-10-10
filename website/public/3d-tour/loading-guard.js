// Runs as a classic script before index.js, so it still works if the 3D libraries
// fail to download or the device cannot render 3D. index.js sets
// window.ethnoverseTourStarted once it runs.
(() => {
  const params = new URLSearchParams(window.location.search);
  const community = params.get('community') || '';

  // Where to send visitors who cannot (or prefer not to) use the 3D tour. Only
  // same-site paths and the EthnoVerse site are accepted, never arbitrary URLs.
  const requested = params.get('archiveUrl') || '';
  const isSafePath = /^\/(?!\/)[\w\-/.%]*$/.test(requested);
  const archiveUrl = isSafePath
    ? requested
    : `https://ethnoverse.netlify.app/communities/${encodeURIComponent(community)}/all`;
  for (const link of document.querySelectorAll('.archive-fallback')) {
    link.href = archiveUrl;
  }

  const showFailure = (message) => {
    const title = document.getElementById('loadingTitle');
    const text = document.getElementById('loadingMessage');
    const actions = document.getElementById('loadingActions');
    if (title) title.textContent = 'The virtual space could not load';
    if (text) text.textContent = message;
    if (actions) actions.hidden = false;
    document.getElementById('loadingOverlay')?.classList.add('failed');
  };

  const NO_WEBGL_MESSAGE = 'This device or browser cannot display 3D graphics. You can still browse every object, photograph and oral history in the archive.';
  const LOAD_FAILED_MESSAGE = 'The 3D scene did not start. Check your connection and try again, or browse the archive without 3D.';

  // ?preview=fallback or ?preview=error shows that screen without needing a broken
  // device or connection, for checking the fallback. index.js does not start.
  const preview = params.get('preview');
  const canvas = document.createElement('canvas');
  const supportsWebGL = Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  if (preview === 'fallback' || !supportsWebGL) {
    window.ethnoverseStopTour = true;
    showFailure(NO_WEBGL_MESSAGE);
    document.getElementById('retryButton')?.setAttribute('hidden', '');
  } else if (preview === 'error') {
    window.ethnoverseStopTour = true;
    showFailure(LOAD_FAILED_MESSAGE);
  }

  window.setTimeout(() => {
    if (window.ethnoverseTourStarted || window.ethnoverseStopTour) return;
    showFailure(LOAD_FAILED_MESSAGE);
  }, 20000);

  document.getElementById('retryButton')?.addEventListener('click', () => window.location.reload());
})();

/// <reference types="vite/client" />

declare module "*.js" {
  export function initKolhiTour(
    container: HTMLDivElement
  ): () => void;
}
interface Window {
  initKolhiTour?: (container: HTMLDivElement) => () => void;
}

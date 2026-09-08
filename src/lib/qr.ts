import { renderSVG } from "uqr";

export function qrSvg(text: string) {
  return renderSVG(text, {
    whiteColor: "#0a0706",
    blackColor: "#d4af37",
    border: 2,
  });
}

export function qrDataUrl(text: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg(text))}`;
}

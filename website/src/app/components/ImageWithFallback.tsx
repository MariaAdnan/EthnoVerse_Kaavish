import { useState, type ImgHTMLAttributes } from "react";

const ERROR_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

export function ImageWithFallback(
  props: ImgHTMLAttributes<HTMLImageElement>,
) {
  const [didError, setDidError] = useState(false);
  const { src, alt = "", style, className, ...rest } = props;

  if (!didError) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        {...rest}
        onError={() => setDidError(true)}
      />
    );
  }

  return (
    <div
      className={`inline-block bg-muted text-center align-middle ${className ?? ""}`}
      style={style}
      role="img"
      aria-label={alt || "Image unavailable"}
    >
      <div className="flex h-full w-full items-center justify-center">
        <img src={ERROR_IMAGE} alt="" aria-hidden="true" />
      </div>
    </div>
  );
}

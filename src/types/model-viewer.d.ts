/* eslint-disable @typescript-eslint/no-empty-object-type */
declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      src?: string;
      alt?: string;
      poster?: string;
      "auto-rotate"?: boolean | string;
      "camera-controls"?: boolean | string;
      "shadow-intensity"?: string;
      "shadow-softness"?: string;
      exposure?: string;
      "environment-image"?: string;
      ar?: boolean | string;
      "ar-modes"?: string;
      loading?: "auto" | "lazy" | "eager";
      reveal?: "auto" | "interaction" | "manual";
      onLoad?: () => void;
      onError?: () => void;
    };
  }
}

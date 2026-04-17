import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
          background:
            "linear-gradient(145deg, #fff7f1 0%, #eb6a42 48%, #1a5d58 100%)",
          color: "#fffaf6",
          fontSize: 66,
          fontWeight: 700,
          letterSpacing: "-0.08em",
        }}
      >
        LT
      </div>
    ),
    size,
  );
}

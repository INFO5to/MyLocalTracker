import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(145deg, #f8f0e8 0%, #eb6a42 42%, #1a5d58 100%)",
          color: "#fff7f1",
          fontSize: 176,
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

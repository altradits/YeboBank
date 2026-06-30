"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

interface Props {
  onScan: (value: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tick = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code    = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: "dontInvert" });
    if (code?.data) {
      onScan(code.data);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [onScan]);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => { rafRef.current = requestAnimationFrame(tick); });
        }
      })
      .catch(() => setError("Camera access denied. Paste the invoice or Lightning address manually."));
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [tick]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(0,0,0,.85)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{ position: "relative", width: "min(92vw, 360px)", aspectRatio: "1" }}
        onClick={(e) => e.stopPropagation()}
      >
        {error ? (
          <div style={{
            width: "100%", aspectRatio: "1",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--ivory)", borderRadius: "var(--r-md)", padding: 24, textAlign: "center",
          }}>
            <p className="note" style={{ color: "var(--terra-text)" }}>{error}</p>
          </div>
        ) : (
          <>
            {/* live viewfinder */}
            <video
              ref={videoRef}
              muted
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--r-md)", display: "block" }}
            />
            {/* corner guides */}
            {[
              { top: 0,    left: 0,    borderTop: "3px solid var(--gold)", borderLeft: "3px solid var(--gold)" },
              { top: 0,    right: 0,   borderTop: "3px solid var(--gold)", borderRight: "3px solid var(--gold)" },
              { bottom: 0, left: 0,    borderBottom: "3px solid var(--gold)", borderLeft: "3px solid var(--gold)" },
              { bottom: 0, right: 0,   borderBottom: "3px solid var(--gold)", borderRight: "3px solid var(--gold)" },
            ].map((s, i) => (
              <div key={i} style={{ position: "absolute", width: 24, height: 24, borderRadius: 2, ...s }} />
            ))}
          </>
        )}
        {/* hidden canvas — only used for jsQR pixel reads */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      <p style={{ color: "rgba(255,255,255,.7)", fontSize: 13, textAlign: "center" }}>
        Point the camera at a Lightning invoice QR
      </p>
      <button
        onClick={onClose}
        style={{
          background: "none", border: "1px solid rgba(255,255,255,.3)",
          color: "white", padding: "8px 20px", borderRadius: "var(--r-sm)",
          cursor: "pointer", fontSize: 14,
        }}
      >
        Cancel
      </button>
    </div>
  );
}

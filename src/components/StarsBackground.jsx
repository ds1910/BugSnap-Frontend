// src/components/StarsBackground.jsx
import { useEffect, useRef } from "react";

const StarsBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let dpr = Math.max(window.devicePixelRatio || 1, 1);
    let width = window.innerWidth;
    let height = window.innerHeight;

    // initialize canvas size (handles DPR)
    const setCanvasSize = () => {
      dpr = Math.max(window.devicePixelRatio || 1, 1);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale drawing to DPR
    };

    setCanvasSize();

    // Create stars
    const createStars = (count) =>
      Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5,
        dx: (Math.random() - 0.5) * 0.25,
        dy: (Math.random() - 0.5) * 0.25,
        opacity: Math.random() * 0.8 + 0.2,
      }));

    let stars = createStars(200);

    // When resizing preserve relative positions (scale by new/old)
    const handleResize = () => {
      const oldW = width;
      const oldH = height;
      setCanvasSize();
      const sx = width / Math.max(oldW, 1);
      const sy = height / Math.max(oldH, 1);
      stars = stars.map((s) => ({
        ...s,
        x: Math.min(Math.max(s.x * sx, 0), width),
        y: Math.min(Math.max(s.y * sy, 0), height),
      }));
    };

    window.addEventListener("resize", handleResize);

    // Draw & animate
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        ctx.fillStyle = `rgba(255,255,255,${star.opacity.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();

        // move
        star.x += star.dx;
        star.y += star.dy;

        // wrap edges
        if (star.x < -2) star.x = width + 2;
        if (star.x > width + 2) star.x = -2;
        if (star.y < -2) star.y = height + 2;
        if (star.y > height + 2) star.y = -2;

        // twinkle
        star.opacity += (Math.random() - 0.5) * 0.04;
        if (star.opacity < 0.15) star.opacity = 0.15;
        if (star.opacity > 1) star.opacity = 1;
      }
    };

    let rafId;
    const animate = () => {
      draw();
      rafId = requestAnimationFrame(animate);
    };
    animate();

    // cleanup
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // pointer-events-none ensures background doesn't block UI interaction
  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-screen h-screen z-0 pointer-events-none bg-black"
    />
  );
};

export default StarsBackground;

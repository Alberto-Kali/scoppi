"use client";

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { useTheme } from "next-themes";

// Register GSAP plugins
gsap.registerPlugin(MotionPathPlugin);

export function DashboardLoader() {
  const loaderRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!loaderRef.current || !pathRef.current) return;

    const svg = loaderRef.current.querySelector('svg');
    const circles = loaderRef.current.querySelectorAll('.loader-circle');
    const text = loaderRef.current.querySelector('.loader-text');
    const primaryColor = theme === 'dark' ? '#3b82f6' : '#2563eb';

    // Clear any existing animations
    gsap.killTweensOf([circles, text]);

    // Set initial styles
    gsap.set(circles, {
      scale: 0,
      opacity: 0,
      fill: primaryColor,
    });

    gsap.set(text, {
      opacity: 0,
      y: 20,
    });

    // Create timeline
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });

    // Animation for each circle following the path
    circles.forEach((circle, i) => {
      tl.to(circle, {
        motionPath: {
          path: pathRef.current!,
          align: pathRef.current!,
          alignOrigin: [0.5, 0.5],
          start: 0.1 + (i * 0.1),
          end: 0.9 - (i * 0.05),
        },
        opacity: 1,
        scale: 1,
        duration: 1.5,
        ease: "power1.inOut",
        fill: primaryColor,
      }, i * 0.2);

      tl.to(circle, {
        scale: 0,
        opacity: 0,
        duration: 0.5,
        ease: "power1.out",
      }, `+=${0.5 - i * 0.05}`);
    });

    // Text animation
    tl.to(text, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "back.out(1.7)",
    }, 0.5);

    // Pulse animation for text
    tl.to(text, {
      scale: 1.05,
      duration: 0.5,
      repeat: 1,
      yoyo: true,
      ease: "sine.inOut",
    }, "+=0.5");

    return () => {
      tl.kill();
    };
  }, [theme]);

  return (
    <div 
      ref={loaderRef}
      className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50"
    >
      <svg 
        width="200" 
        height="200" 
        viewBox="0 0 200 200" 
        className="w-40 h-40 md:w-48 md:h-48"
      >
        <path
          ref={pathRef}
          d="M20,100 Q100,20 180,100 Q100,180 20,100"
          fill="none"
          stroke="none"
          strokeWidth="2"
        />
        {[...Array(5)].map((_, i) => (
          <circle
            key={i}
            className="loader-circle"
            cx="0"
            cy="0"
            r="8"
            fill="currentColor"
          />
        ))}
      </svg>
      <div className="loader-text mt-6 text-center">
        <h3 className="text-xl font-semibold mb-2">Загрузка данных</h3>
        <p className="text-muted-foreground">Пожалуйста, подождите...</p>
      </div>
    </div>
  );
}
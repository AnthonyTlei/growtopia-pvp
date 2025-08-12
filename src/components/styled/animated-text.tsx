"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface AnimatedTextProps {
  text: string;
  className?: string;
  withParticles?: boolean;
}

export default function AnimatedText({
  text,
  className,
  withParticles = true,
}: AnimatedTextProps) {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setShowText(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className={cn("relative inline-block", className)}>
      {text.split("").map((char, i) => {
        if (char === " ") {
          return (
            <span key={i} className="inline-block w-1">
              &nbsp;
            </span>
          );
        }
        return (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={showText ? { opacity: 1, y: 0 } : {}}
            transition={{
              delay: i * 0.05,
              duration: 0.3,
              ease: "easeOut",
            }}
            className="relative inline-block"
          >
            {char}
            {withParticles && (
              <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <Glitter />
              </span>
            )}
          </motion.span>
        );
      })}
    </div>
  );
}

function Glitter() {
  return (
    <motion.span
      className="bg-secondary block h-1 w-1 rounded-full opacity-60"
      initial={{
        scale: 0,
        x: 0,
        y: 0,
        opacity: 1,
      }}
      animate={{
        scale: [0, 1.2, 0],
        x: [0, getRandom(-10, 10)],
        y: [0, getRandom(-20, 0)],
        opacity: [1, 0],
      }}
      transition={{
        duration: 0.6,
        ease: "easeOut",
        repeat: Infinity,
        repeatDelay: 2,
      }}
    />
  );
}

function getRandom(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

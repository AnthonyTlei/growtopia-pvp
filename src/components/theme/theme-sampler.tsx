"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { useState } from "react";

export default function ThemeSampler() {
  const { setTheme, theme } = useTheme();
  const [isDark, setIsDark] = useState(theme === "dark");

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setTheme(newTheme);
    setIsDark(!isDark);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <Card className="w-full max-w-md shadow-2xl rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <h1 className="text-2xl font-bold">🌟 Website Theme Preview</h1>
          <p className="text-muted-foreground">
            This shows how your palette feels in both modes.
          </p>
          <Button variant="default">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="destructive">Destructive</Button>
          <div className="flex items-center gap-2 pt-4">
            <Switch checked={isDark} onCheckedChange={toggleTheme} />
            <span className="text-sm">Toggle Dark Mode</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

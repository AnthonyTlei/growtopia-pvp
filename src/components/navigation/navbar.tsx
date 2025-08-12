"use server";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import AnimatedText from "../styled/animated-text";
import { Button } from "../ui/button";
import Image from "next/image";

import logo from "@/assets/logo/logo.png";

export default async function Navbar() {
  return (
    <nav className="flex w-full items-center justify-center rounded-none border bg-transparent px-2 py-2 shadow-lg md:w-[75%] md:rounded-3xl md:px-8 lg:w-[50%]">
      <div className="flex w-full items-center justify-between">
        <Link href="/">
          <div className="flex items-center justify-center gap-2 p-0">
            <Image
              src={logo}
              alt="logo"
              width={400}
              height={400}
              className="aspect-square size-10 rounded-full object-cover"
            />
            <AnimatedText
              text="Growtopia PvP"
              className="text-primary text-md font-semibold hidden md:flex"
              withParticles
            />
          </div>
        </Link>
        <div className="flex gap-4 justify-center items-center">
          <Link href={`/`}>
            <span className="text-sm md:text-base font-light">Matches</span>
          </Link>
          <Link href={`/`}>
            <span className="text-sm md:text-base font-light">Leaderboard</span>
          </Link>
        </div>
        <Link href={`/`}>
          <Avatar className="size-10">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </Link>
        {/* TODO: Swap between Avatar/Login based on user auth */}
        {/* <Link href={`/`}>
          <Button
            variant={"outline"}
            className="text-primary text-sm border-primary"
          >
            Login
          </Button>
        </Link> */}
      </div>
    </nav>
  );
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Separator } from "../ui/separator";
import Image from "next/image";

import GoogleSignInButton from "./google-sign-in-button";

import logo from "@/assets/logo/logo.png";

export default async function SignInCard() {
  return (
    <Card className="flex h-full w-full items-center justify-center sm:h-fit sm:w-[75%] md:w-[60%] lg:w-[30%]">
      <CardHeader className="flex w-full flex-col items-center justify-center gap-4">
        <div className="flex flex-col gap-2 justify-center items-center mb-12">
          <Image
            src={logo}
            alt="logo"
            width={400}
            height={400}
            className="aspect-square size-24 rounded-lg object-cover"
          />
          <CardTitle>Sign In</CardTitle>
        </div>
        <CardDescription>Sign in with Google to get started.</CardDescription>
      </CardHeader>
      <CardContent className="flex w-full flex-col items-center justify-center gap-4">
        <Separator />
        <GoogleSignInButton />
      </CardContent>
    </Card>
  );
}

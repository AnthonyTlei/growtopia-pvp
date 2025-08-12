import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

import { getUser } from "@/lib/auth-utils";
import { signOut } from "@/auth";
import { LogOut } from "lucide-react";

export default async function UserButton() {
  const user = await getUser();
  return (
    <div className="flex justify-center items-center gap-2">
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label="Open user menu">
              <Avatar className="size-9 rounded-full">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback>
                  {user.name?.[0] ?? "U"}
                  {user.name?.[1] ?? ""}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem asChild>
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <Button
                  variant={"ghost"}
                  className="w-full flex justify-center items-center"
                  type="submit"
                >
                  <LogOut /> Sign Out
                </Button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {!user && (
        <Link href={`/signin`}>
          <Button
            variant={"outline"}
            className="text-primary text-sm border-primary"
          >
            Login
          </Button>
        </Link>
      )}
    </div>
  );
}

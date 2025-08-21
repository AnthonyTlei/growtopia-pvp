import Link from "next/link";
import { getUser } from "@/lib/auth-utils";
import { signOut } from "@/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { LogOut, User as UserIcon, Flag } from "lucide-react";

export default async function UserButton() {
  const user = await getUser();

  return (
    <div className="flex items-center gap-2">
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Open user menu"
              className="rounded-full outline-none ring-0 transition hover:opacity-90"
            >
              <Avatar className="size-9 rounded-full">
                <AvatarImage
                  src={user.image ?? undefined}
                  alt={user.name ?? "User"}
                />
                <AvatarFallback>
                  {(user.name?.[0] ?? "U").toUpperCase()}
                  {(user.name?.[1] ?? "").toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            {/* Header */}
            <DropdownMenuLabel className="text-xs">
              <div className="flex items-center gap-2">
                <Avatar className="size-7 rounded-full">
                  <AvatarImage
                    src={user.image ?? undefined}
                    alt={user.name ?? "User"}
                  />
                  <AvatarFallback className="text-[10px]">
                    {(user.name?.[0] ?? "U").toUpperCase()}
                    {(user.name?.[1] ?? "").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium leading-tight">
                    {user.name ?? "User"}
                  </div>
                  {user.email && (
                    <div className="truncate text-[11px] text-muted-foreground">
                      {user.email}
                    </div>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Links */}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="text-sm py-2">
                <Link href="/profile" className="flex items-center">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-sm py-2">
                <Link href="/reports" className="flex items-center">
                  <Flag className="mr-2 h-4 w-4" />
                  Reports
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Sign out (server action) */}
            <DropdownMenuItem
              asChild
              className="text-sm py-2 text-red-600 focus:text-red-700"
            >
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <button
                  type="submit"
                  className="w-full flex items-center"
                  aria-label="Sign out"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link href="/signin">
          <Button
            variant="outline"
            className="text-primary text-sm border-primary"
          >
            Login
          </Button>
        </Link>
      )}
    </div>
  );
}

import { signIn } from "@/auth";
import { Button } from "../ui/button";
import { FcGoogle } from "react-icons/fc";

export default function GoogleSignInButton() {
  return (
    <div className="w-full">
      <form
        className="w-fulls"
        action={async () => {
          "use server";
          await signIn("google");
        }}
      >
        <Button type="submit" className="w-full">
          <FcGoogle /> Google
        </Button>
      </form>
    </div>
  );
}

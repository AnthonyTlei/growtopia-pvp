import SignInCard from "@/components/auth/sign-in-card";
import { getUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const user = await getUser();
  if (user) {
    redirect("/");
  }
  return (
    <main className="flex h-screen w-full flex-col items-center justify-center gap-4">
      <section className="flex h-full w-full items-center justify-center">
        <SignInCard />
      </section>
    </main>
  );
}

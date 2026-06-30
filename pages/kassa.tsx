import { Loader } from "@mantine/core";
import { useSupabase } from "../contexts/SupabaseContext";
import { useRouter } from "next/router";
import { useEffect } from "react";
import KassaList from "../components/KassaList";

export default function KassaPage() {
  const { user, isLoading } = useSupabase();
  const router = useRouter();

  // Redirect to home if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader size="xl" color="primary-color" />
      </div>
    );
  }

  // Also show loading while redirecting or if no user
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader size="xl" color="primary-color" />
      </div>
    );
  }

  const isAdmin = user.admin || (user.allowed_posts != null && user.allowed_posts.trim().length > 0);

  return <KassaList adminMode={isAdmin} currentUser={user} />;
}

import { Loader } from "@mantine/core";
import { useSupabase } from "../contexts/SupabaseContext";
import { useRouter } from "next/router";
import { useEffect } from "react";
import ContractList from "../components/ContractList";
import { canCreateContract } from "../utils/permissions";

export default function ContractsPage() {
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

  if (!canCreateContract(user.post)) {
    return (
      <div className="p-8 text-xl text-center">
        Access Denied - You don't have permission to view contracts
      </div>
    );
  }

  const isAdmin =
    user.admin || (user.allowed_posts != null && user.allowed_posts.trim().length > 0);

  return <ContractList adminMode={isAdmin} currentUser={user} />;
}

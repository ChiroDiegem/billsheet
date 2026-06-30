import { Loader } from "@mantine/core";
import { useSupabase } from "../contexts/SupabaseContext";
import { useRouter } from "next/router";
import { useEffect } from "react";
import BillList from "../components/BillList";
import { canCreateKassa } from "../utils/permissions";

export default function MyBills() {
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

  if (!canCreateKassa(user.post)) {
    return (
      <div className="p-8 text-xl text-center">
        Access Denied - You don't have permission to view kassa's
      </div>
    );
  }

  // Only render BillList if user is authenticated
  return <BillList adminMode={false} currentUser={user} />;
}

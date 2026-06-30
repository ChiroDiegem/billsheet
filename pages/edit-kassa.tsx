import { useRouter } from "next/router";
import { useState, FormEvent } from "react";
import { useUser } from "../contexts/SupabaseContext";
import { IKassa } from "../types";
import { Button, Checkbox, Loader, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createAdminClient } from "../lib/supabase";

export default function EditKassa({ kassa }: { kassa: IKassa }) {
  const user = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(kassa.booked);
  const [openedBy, setOpenedBy] = useState(kassa.opened_by);
  const [closedBy, setClosedBy] = useState(kassa.closed_by || "");

  if (!user?.admin) {
    return <p className="p-8 text-xl text-center">Access Denied</p>;
  }

  const updateKassa = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/updateKassa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: kassa.id,
          opened_by: openedBy,
          closed_by: closedBy || null,
          booked,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update kassa");
      }

      notifications.show({
        title: "Succes",
        message: "Kassa succesvol bijgewerkt",
        color: "green",
      });

      router.push("/kassa");
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to update kassa",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!kassa) {
    return <Loader size="xl" />;
  }

  return (
    <div className="flex justify-center align-center border-2 border-primary-color rounded-lg p-4 sm:p-10">
      <form
        className="flex align-center flex-col w-full max-w-md space-y-2"
        onSubmit={updateKassa}
      >
        <h1 className="text-3xl font-bold border-b-4 border-primary-color m-6">
          Bewerk Kassa
        </h1>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-1">
          <p className="text-sm text-gray-600">
            <strong>Geopend door:</strong> {kassa.opened_by}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Categorie:</strong> {kassa.category} / {kassa.sub_category}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Opening:</strong> € {(kassa.opening_total / 100).toFixed(2)}
          </p>
          {kassa.closing_total !== null && (
            <p className="text-sm text-gray-600">
              <strong>Sluiting:</strong> € {(kassa.closing_total / 100).toFixed(2)}
            </p>
          )}
          <p className="text-sm text-gray-600">
            <strong>Status:</strong> {kassa.is_open ? "Open" : "Gesloten"}
          </p>
        </div>

        <TextInput
          label="Geopend door"
          value={openedBy}
          onChange={(e) => setOpenedBy(e.currentTarget.value)}
        />
        <TextInput
          label="Gesloten door"
          value={closedBy}
          onChange={(e) => setClosedBy(e.currentTarget.value)}
        />

        <Checkbox
          label="Ingeboekt"
          checked={booked}
          onChange={(e) => setBooked(e.currentTarget.checked)}
        />

        <Button
          color="primary-color.5"
          className="bg-primary-color h-[2em] mt-4"
          type="submit"
          loading={loading}
        >
          Kassa Bijwerken
        </Button>
      </form>
    </div>
  );
}

export async function getServerSideProps(context: any) {
  const { id } = context.query;

  try {
    const supabase = createAdminClient();

    if (id) {
      const { data, error } = await supabase
        .from("kassa")
        .select()
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching kassa:", error);
        return { notFound: true };
      }

      return { props: { kassa: data } };
    }

    return { notFound: true };
  } catch (error) {
    console.error("Edit kassa page error:", error);
    return { notFound: true };
  }
}

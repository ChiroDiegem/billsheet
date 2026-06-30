import { useRouter } from "next/router";
import { useState, FormEvent } from "react";
import { useUser } from "../contexts/SupabaseContext";
import { IContract } from "../types";
import { Button, TextInput, Select, NumberInput, Checkbox, Loader } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { categorie } from "../utils/constants";
import { DatePickerInput } from "@mantine/dates";
import { createAdminClient } from "../lib/supabase";

export default function EditContract({ contract }: { contract: IContract }) {
  const user = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [nameValue, setNameValue] = useState(contract.name);
  const [categoryValue, setCategoryValue] = useState(contract.category);
  const [dateValue, setDateValue] = useState<Date | null>(
    contract.date ? new Date(contract.date) : null,
  );
  const [descValue, setDescValue] = useState(contract.desc);
  const [securityDepositValue, setSecurityDepositValue] = useState<number | undefined>(
    contract.security_deposit / 100,
  );
  const [rentValue, setRentValue] = useState<number | undefined>(
    contract.rent / 100,
  );

  const [securityDepositReceived, setSecurityDepositReceived] = useState(
    contract.security_deposit_received,
  );
  const [rentReceived, setRentReceived] = useState(contract.rent_received);
  const [depositReturned, setDepositReturned] = useState(contract.deposit_returned);
  const [booked, setBooked] = useState(contract.booked);

  if (!user?.admin && user?.allowed_posts == null) {
    return <p>Access Denied</p>;
  }

  if (contract.booked) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6 w-full max-w-md">
          <p className="text-yellow-700">
            Dit contract is al ingeboekt en kan niet worden bewerkt.
          </p>
        </div>
        <Button
          onClick={() => router.push("/contract")}
          color="primary-color.5"
          className="bg-primary-color h-[2em]"
        >
          Terug naar Contracten
        </Button>
      </div>
    );
  }

  function formatDate(dateValue: string | number | Date) {
    const date = new Date(dateValue);
    return (
      date.getFullYear() +
      "-" +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      "-" +
      ("0" + date.getDate()).slice(-2)
    );
  }

  const updateContract = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const contractData = {
        id: contract.id,
        name: nameValue,
        category: categoryValue,
        date: formatDate(dateValue || new Date()),
        desc: descValue,
        security_deposit: Math.round((securityDepositValue || 0) * 100),
        rent: Math.round((rentValue || 0) * 100),
        security_deposit_received: securityDepositReceived,
        rent_received: rentReceived,
        deposit_returned: depositReturned,
        booked: booked,
      };

      const response = await fetch("/api/updateContract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contractData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update contract");
      }

      notifications.show({
        title: "Succes",
        message: "Contract succesvol bijgewerkt",
      });

      router.push("/contract");
    } catch (error: any) {
      console.error("Error updating contract:", error);
      notifications.show({
        title: "Error",
        message: error.message || "Failed to update contract",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!contract) {
    return <Loader size="xl" />;
  }

  return (
    <div className="flex justify-center align-center border-2 border-primary-color rounded-lg p-4 sm:p-10">
      <form
        className="flex align-center flex-col w-full max-w-md space-y-2"
        onSubmit={updateContract}
      >
        <h1 className="text-3xl font-bold border-b-4 border-primary-color m-6">
          Bewerk Contract
        </h1>
        <TextInput
          label="Naam"
          required
          value={nameValue}
          onChange={(e) => setNameValue(e.currentTarget.value)}
        />
        <Select
          label="Categorie"
          data={categorie}
          required
          value={categoryValue}
          onChange={(value) => setCategoryValue(value || "")}
        />
        <DatePickerInput
          label="Datum Contract"
          required
          value={dateValue}
          onChange={setDateValue}
        />
        <TextInput
          label="Omschrijving"
          value={descValue}
          onChange={(e) => setDescValue(e.currentTarget.value)}
        />
        <NumberInput
          label="Waarborg (€)"
          required
          value={securityDepositValue}
          onChange={(val) => setSecurityDepositValue(val === "" ? 0 : val)}
          inputMode="decimal"
          min={0}
          precision={2}
          decimalSeparator=","
          placeholder="0.00"
        />
        <NumberInput
          label="Huur (€)"
          required
          value={rentValue}
          onChange={(val) => setRentValue(val === "" ? 0 : val)}
          inputMode="decimal"
          min={0}
          precision={2}
          decimalSeparator=","
          placeholder="0.00"
        />

        {/* Status checkboxes */}
        <div className="mt-4 space-y-2">
          <Checkbox
            label="Waarborg ontvangen"
            checked={securityDepositReceived}
            onChange={(e) => setSecurityDepositReceived(e.currentTarget.checked)}
          />
          <Checkbox
            label="Huur ontvangen"
            checked={rentReceived}
            onChange={(e) => setRentReceived(e.currentTarget.checked)}
          />
          <Checkbox
            label="Waarborg terugbetaald"
            checked={depositReturned}
            onChange={(e) => setDepositReturned(e.currentTarget.checked)}
          />
          <Checkbox
            label="Ingeboekt"
            checked={booked}
            onChange={(e) => setBooked(e.currentTarget.checked)}
          />
        </div>

        <Button
          color="primary-color.5"
          className="bg-primary-color h-[2em] mt-4"
          type="submit"
          loading={loading}
        >
          Contract Bijwerken
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
        .from("contracts")
        .select()
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching contract:", error);
        return {
          notFound: true,
        };
      }

      return {
        props: { contract: data },
      };
    }

    return { notFound: true };
  } catch (error) {
    console.error("Edit contract page error:", error);
    return { notFound: true };
  }
}

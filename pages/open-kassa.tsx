import {
  Alert,
  Button,
  Paper,
  Box,
  NumberInput,
  Select,
  TextInput,
  Loader,
  Text,
  Divider,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { isNotEmpty, useForm } from "@mantine/form";
import { useSupabase, useSupabaseClient } from "../contexts/SupabaseContext";
import { useState } from "react";
import { useRouter } from "next/router";
import { categorie, DENOMINATIONS } from "../utils/constants";

type CoinCounts = Record<string, number>;

function calculateTotal(counts: CoinCounts): number {
  let total = 0;
  for (const denom of DENOMINATIONS) {
    const count = counts[denom.key] || 0;
    total += count * denom.value;
  }
  return total;
}

function countsToCents(counts: CoinCounts): number {
  return Math.round(calculateTotal(counts) * 100);
}

function emptyCounts(): CoinCounts {
  const counts: CoinCounts = {};
  for (const denom of DENOMINATIONS) {
    counts[denom.key] = 0;
  }
  return counts;
}

export default function OpenKassa() {
  const supabase = useSupabaseClient();
  const { user, isLoading } = useSupabase();
  const router = useRouter();

  const [errorAlert, setErrorAlert] = useState("");
  const [successAlert, setSuccessAlert] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form: any = useForm({
    initialValues: {
      date: new Date(),
      category: categorie[0] || "",
      subCategory: "",
      counts: emptyCounts(),
      manualTotal: undefined as number | undefined,
    },
    validate: {
      date: isNotEmpty("Dit veld is verplicht"),
      category: isNotEmpty("Dit veld is verplicht"),
      subCategory: isNotEmpty("Dit veld is verplicht"),
      counts: (value, values) =>
        countsToCents(value) === 0 &&
        (values.manualTotal === undefined || values.manualTotal === 0)
          ? "Het openingsbedrag moet groter zijn dan 0"
          : null,
    },
  });

  const counts = form.values.counts as CoinCounts;
  const manualTotal = form.values.manualTotal;
  const calculatedTotal = countsToCents(counts);
  const effectiveTotal =
    manualTotal !== undefined ? Math.round(manualTotal * 100) : calculatedTotal;

  function updateCount(key: string, value: number | "") {
    form.setFieldValue("counts", {
      ...counts,
      [key]: value === "" ? 0 : value,
    });
  }

  function formatDate(timestamp: number) {
    const date = new Date(timestamp);
    return (
      date.getFullYear() +
      "-" +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      "-" +
      ("0" + date.getDate()).slice(-2)
    );
  }

  async function handleSubmit(values: typeof form.values) {
    const validated = form.validate();

    if (validated.hasErrors) {
      setErrorAlert(
        validated.errors.counts?.toString() ||
          "Controleer de verplichte velden",
      );
      return;
    }

    setSubmitting(true);
    setErrorAlert("");

    try {
      const { error } = await supabase.from("kassa").insert({
        uid: user!.id,
        opened_by: user!.name || "",
        date: formatDate(values.date),
        category: values.category,
        sub_category: values.subCategory,
        opening_amount: values.counts as any,
        opening_total: effectiveTotal,
        is_open: true,
        booked: false,
      });

      if (error) {
        setErrorAlert(error.message);
      } else {
        setSuccessAlert(true);
        setTimeout(() => router.push("/kassa"), 1500);
      }
    } catch (error: any) {
      setErrorAlert(error.message || "Er is een fout opgetreden");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col w-full px-4 py-6 md:py-10 md:px-6">
        <div className="w-full max-w-xl mx-auto">
          <Paper shadow="xs" radius="md">
            <Box
              className="p-4 sm:p-6 md:p-8 flex justify-center items-center"
              style={{ minHeight: "300px" }}
            >
              <Loader size="xl" color="primary-color" />
            </Box>
          </Paper>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full px-4 py-6 md:py-10 md:px-6">
      <div className="w-full max-w-xl mx-auto">
        <Paper shadow="xs" radius="md">
          <Box className="p-4 sm:p-6 md:p-8">
            <form className="w-full" onSubmit={form.onSubmit(handleSubmit)}>
              <h1 className="text-2xl md:text-3xl font-bold border-b-4 border-primary-color mb-6 pb-2">
                Kassa Openen
              </h1>

              <div className="flex flex-col space-y-4">
                {/* Date, Category & Subcategory */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DatePickerInput
                    label="Datum"
                    withAsterisk
                    {...form.getInputProps("date")}
                    className="w-full"
                  />
                  <Select
                    label="Categorie"
                    data={categorie}
                    withAsterisk
                    {...form.getInputProps("category")}
                    className="w-full"
                  />
                  <TextInput
                    label="Subcategorie"
                    withAsterisk
                    {...form.getInputProps("subCategory")}
                    className="w-full"
                  />
                </div>

                <Divider
                  label="Openingsbedrag - Munt/Biljet telling"
                  labelPosition="center"
                />

                {/* Coin count grid */}
                <div className="flex flex-col gap-2 self-center">
                  {DENOMINATIONS.map((denom) => {
                    const count = counts[denom.key] || 0;
                    const subtotal = count * denom.value;
                    return (
                      <div
                        key={denom.key}
                        className="grid grid-cols-[60px_minmax(60px,80px)_72px] items-center gap-1"
                      >
                        <Text size="sm" weight={600}>
                          {denom.label}
                        </Text>
                        <NumberInput
                          value={count}
                          onChange={(val) =>
                            updateCount(denom.key, val === "" ? "" : val)
                          }
                          min={0}
                          inputMode="numeric"
                          hideControls
                          className="w-20"
                        />
                        <Text size="sm" color="dimmed" align="right">
                          € {subtotal.toFixed(2)}
                        </Text>
                      </div>
                    );
                  })}
                  {form.errors.counts && (
                    <Text size="sm" color="red">
                      {form.errors.counts}
                    </Text>
                  )}
                </div>

                {/* Totals */}
                <div className="bg-gray-100 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <Text weight={700}>Berekend totaal:</Text>
                    <Text weight={700}>
                      € {(calculatedTotal / 100).toFixed(2)}
                    </Text>
                  </div>
                  <Divider />
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Text size="sm">Of voer handmatig totaal in:</Text>
                    <NumberInput
                      value={manualTotal}
                      onChange={(val) =>
                        form.setFieldValue(
                          "manualTotal",
                          val === "" ? undefined : val,
                        )
                      }
                      precision={2}
                      decimalSeparator=","
                      placeholder="0.00"
                      className="w-full sm:w-32"
                    />
                  </div>
                  {manualTotal !== undefined &&
                    calculatedTotal !== Math.round(manualTotal * 100) && (
                      <Text size="sm" color="orange">
                        Let op: het handmatige totaal (€{" "}
                        {(manualTotal || 0).toFixed(2)}) wijkt af van het
                        berekende totaal (€ {(calculatedTotal / 100).toFixed(2)}
                        )
                      </Text>
                    )}
                  <div className="flex justify-between items-center">
                    <Text weight={700} size="lg">
                      Gebruikt totaal:
                    </Text>
                    <Text weight={700} size="lg" color="primary-color">
                      € {(effectiveTotal / 100).toFixed(2)}
                    </Text>
                  </div>
                </div>

                {/* Alerts */}
                {successAlert && (
                  <Alert title="Succesvol!" color="green" className="mt-4">
                    Kassa succesvol geopend! Je wordt doorgestuurd...
                  </Alert>
                )}
                {errorAlert && (
                  <Alert title="Error" color="red" className="mt-4">
                    {errorAlert}
                  </Alert>
                )}

                {/* Submit */}
                <Button
                  color="primary-color"
                  type="submit"
                  fullWidth
                  size="md"
                  className="mt-6"
                  loading={submitting}
                >
                  {submitting ? <Loader size="sm" /> : "Kassa Openen"}
                </Button>
              </div>
            </form>
          </Box>
        </Paper>
      </div>
    </div>
  );
}

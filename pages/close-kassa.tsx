import { useRouter } from "next/router";
import { useState } from "react";
import {
  Button,
  Paper,
  Box,
  NumberInput,
  Text,
  Divider,
  Group,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { IKassa } from "../types";
import { createAdminClient } from "../lib/supabase";
import { DENOMINATIONS } from "../utils/constants";

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

export default function CloseKassa({ kassa }: { kassa: IKassa }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [counts, setCounts] = useState<CoinCounts>(emptyCounts);
  const [manualTotal, setManualTotal] = useState<number | undefined>(undefined);
  const [closeDate, setCloseDate] = useState<Date>(new Date());

  const calculatedTotal = countsToCents(counts);
  const effectiveTotal =
    manualTotal !== undefined ? Math.round(manualTotal * 100) : calculatedTotal;
  const difference = effectiveTotal - kassa.opening_total;

  if (!kassa.is_open) {
    return (
      <div className="flex flex-col w-full px-4 py-6 md:py-10 md:px-6">
        <div className="w-full max-w-xl mx-auto">
          <Paper shadow="xs" radius="md">
            <Box className="p-4 sm:p-6 md:p-8">
              <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
                <p className="text-yellow-700">Deze kassa is al gesloten.</p>
              </div>
              <Button
                onClick={() => router.push("/kassa")}
                color="primary-color.5"
                className="bg-primary-color h-[2em]"
              >
                Terug naar Kassa's
              </Button>
            </Box>
          </Paper>
        </div>
      </div>
    );
  }

  function updateCount(key: string, value: number | "") {
    setCounts((prev) => ({ ...prev, [key]: value === "" ? 0 : value }));
  }

  function formatDate(date: Date) {
    return (
      date.getFullYear() +
      "-" +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      "-" +
      ("0" + date.getDate()).slice(-2)
    );
  }

  async function handleSubmit() {
    if (
      calculatedTotal === 0 &&
      (manualTotal === undefined || manualTotal === 0)
    ) {
      notifications.show({
        title: "Error",
        message: "Het sluitingsbedrag moet groter zijn dan 0",
        color: "red",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/closeKassa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: kassa.id,
          closing_amount: counts,
          closing_total: effectiveTotal,
          closed_at: formatDate(closeDate),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Sluiten mislukt");
      }

      notifications.show({
        title: "Succes",
        message: "Kassa succesvol gesloten",
        color: "green",
      });

      router.push("/kassa");
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Kassa sluiten mislukt",
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col w-full px-4 py-6 md:py-10 md:px-6">
      <div className="w-full max-w-xl mx-auto">
        <Paper shadow="xs" radius="md">
          <Box className="p-4 sm:p-6 md:p-8">
            <form
              className="w-full"
              onSubmit={(event) => {
                event.preventDefault();
                handleSubmit();
              }}
            >
              <h1 className="text-2xl md:text-3xl font-bold border-b-4 border-primary-color mb-6 pb-2">
                Kassa Sluiten
              </h1>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <Text size="sm" color="dimmed">
                  Geopend door: {kassa.opened_by}
                </Text>
                <Text size="sm" color="dimmed">
                  Categorie: {kassa.category} / {kassa.sub_category}
                </Text>
                <Text size="sm" weight={600}>
                  Openingsbedrag: € {(kassa.opening_total / 100).toFixed(2)}
                </Text>
              </div>

              <DatePickerInput
                label="Sluitingsdatum"
                value={closeDate}
                onChange={(date: any) => date && setCloseDate(date)}
                withAsterisk
                className="mb-4 w-full"
              />

              <Text size="sm" color="dimmed" className="mb-4">
                Gebruik het openingsbedrag als referentie en tel hieronder het
                sluitingsbedrag.
              </Text>

              <Divider
                label="Sluitingsbedrag - Munt/Biljet telling"
                labelPosition="center"
              />

              {/* Closing count grid */}
              <div className="flex flex-col gap-2 mt-4 self-center">
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
              </div>

              {/* Totals */}
              <div className="bg-gray-100 p-3 rounded-lg space-y-2 mt-4">
                <div className="flex justify-between items-center">
                  <Text weight={700}>Berekend sluitingstotaal:</Text>
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
                      setManualTotal(val === "" ? undefined : val)
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
                    Let op: het handmatige totaal wijkt af van het berekende totaal
                  </Text>
                )}
                <Divider />
                <div className="flex justify-between items-center gap-4">
                  <Text weight={700} size="lg">
                    Gebruikt totaal:
                  </Text>
                  <Text weight={700} size="lg" color="primary-color">
                    € {(effectiveTotal / 100).toFixed(2)}
                  </Text>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <Text weight={700} size="lg">
                    Verschil:
                  </Text>
                  <Text
                    weight={700}
                    size="lg"
                    color={difference >= 0 ? "green" : "red"}
                  >
                    € {(difference / 100).toFixed(2)}
                    {difference >= 0 ? " (positief)" : " (negatief)"}
                  </Text>
                </div>
              </div>

              {/* Submit */}
              <Group position="right" className="mt-6">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.push("/kassa")}
                >
                  Annuleren
                </Button>
                <Button
                  color="primary-color"
                  type="submit"
                  size="md"
                  loading={submitting}
                >
                  Kassa Sluiten
                </Button>
              </Group>
            </form>
          </Box>
        </Paper>
      </div>
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
    console.error("Close kassa page error:", error);
    return { notFound: true };
  }
}

import {
  Badge,
  Button,
  Card,
  Checkbox,
  Group,
  Text,
  Box,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import { useState } from "react";
import { AiFillEdit } from "react-icons/ai";
import { IKassa } from "../types";

interface IKassaListItem {
  kassa: IKassa;
  onUpdate?: () => void;
  adminMode?: boolean;
  isMobile?: boolean;
}

function formatAmount(amount: number | null) {
  if (amount === null || amount === undefined) return "-";
  return `€ ${(amount / 100).toFixed(2)}`;
}

export default function KassaListItem({
  kassa,
  onUpdate,
  adminMode = false,
  isMobile = false,
}: IKassaListItem) {
  const [booked, setBooked] = useState(kassa.booked);

  async function updateStatus(field: keyof IKassa, value: boolean) {
    if (!adminMode) return;

    try {
      const response = await fetch("/api/updateKassa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: kassa.id, [field]: value }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Status bijwerken mislukt");
      }

      if (onUpdate) onUpdate();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Status bijwerken mislukt",
        color: "red",
      });
      throw error;
    }
  }

  async function handleBookedChange(e: any) {
    const value = e.target.checked;
    setBooked(value);
    try {
      await updateStatus("booked", value);
    } catch {
      setBooked(!value);
    }
  }

  const StatusBadge = () => (
    <Badge color={kassa.is_open ? "green" : "gray"} variant="filled">
      {kassa.is_open ? "Open" : "Gesloten"}
    </Badge>
  );

  const actionButtons = (
    <div className="flex justify-end gap-2">
      {kassa.is_open && (
        <Link href={`/close-kassa?id=${kassa.id}`}>
          <Button color="primary-color" compact>
            Sluit kassa
          </Button>
        </Link>
      )}
      {adminMode &&
        (!booked ? (
          <Link
            href={`/edit-kassa?id=${kassa.id}`}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md hover:bg-gray-200"
          >
            <AiFillEdit size={16} />
          </Link>
        ) : (
          <Tooltip
            label="Ingeboekte kassa's kunnen niet worden bewerkt"
            position="top"
            withArrow
          >
            <button
              disabled
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md bg-gray-200 text-gray-400 cursor-not-allowed"
            >
              <AiFillEdit size={16} />
            </button>
          </Tooltip>
        ))}
    </div>
  );

  if (isMobile) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
        <Card.Section withBorder inheritPadding py="xs">
          <div className="flex flex-col gap-1">
            <Text weight={700} lineClamp={2}>
              {kassa.opened_by || "-"}
            </Text>
            <div className="flex items-center justify-between mt-1">
              <Text size="sm" color="dimmed">
                {kassa.created_at
                  ? new Date(kassa.created_at).toLocaleDateString("nl-BE")
                  : "-"}
              </Text>
              <StatusBadge />
            </div>
          </div>
        </Card.Section>

        <Box py="md">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Text size="sm" color="dimmed">
                Categorie
              </Text>
              <Text size="sm">{kassa.category || "-"}</Text>
            </div>
            <div>
              <Text size="sm" color="dimmed">
                Subcategorie
              </Text>
              <Text size="sm">{kassa.sub_category || "-"}</Text>
            </div>
            <div>
              <Text size="sm" color="dimmed">
                Opening
              </Text>
              <Text size="sm" weight={600}>
                {formatAmount(kassa.opening_total)}
              </Text>
            </div>
            <div>
              <Text size="sm" color="dimmed">
                Sluiting
              </Text>
              <Text size="sm" weight={600}>
                {formatAmount(kassa.closing_total)}
              </Text>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {adminMode ? (
              <Checkbox
                checked={booked}
                onChange={handleBookedChange}
                label="Ingeboekt"
              />
            ) : (
              <Badge color={booked ? "green" : "yellow"} variant="filled">
                {booked ? "Ingeboekt" : "Niet ingeboekt"}
              </Badge>
            )}
          </div>
        </Box>

        <Card.Section withBorder inheritPadding py="xs">
          {actionButtons}
        </Card.Section>
      </Card>
    );
  }

  return (
    <tr>
      <td className="pr-4 break-words" style={{ maxWidth: "180px" }}>
        {kassa.opened_by || "-"}
      </td>
      <td>{kassa.category}</td>
      <td>{kassa.sub_category}</td>
      <td>{formatAmount(kassa.opening_total)}</td>
      <td>{formatAmount(kassa.closing_total)}</td>
      <td>
        <StatusBadge />
      </td>
      <td>
        {adminMode ? (
          <Checkbox checked={booked} onChange={handleBookedChange} />
        ) : (
          <Badge color={booked ? "green" : "yellow"} variant="filled">
            {booked ? "Ingeboekt" : "Open"}
          </Badge>
        )}
      </td>
      <td>{actionButtons}</td>
    </tr>
  );
}

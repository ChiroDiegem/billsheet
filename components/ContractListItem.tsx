import {
  Badge,
  Button,
  Card,
  Checkbox,
  Group,
  Modal,
  Text,
  Box,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import { useState } from "react";
import {
  AiFillEdit,
  AiOutlineDelete,
  AiOutlineDownload,
  AiOutlineMail,
} from "react-icons/ai";
import { useSupabaseClient } from "../contexts/SupabaseContext";
import { IContract } from "../types";

interface IContractListItem {
  contract: IContract;
  onDelete?: () => void;
  adminMode?: boolean;
  isMobile?: boolean;
}

export default function ContractListItem({
  contract,
  onDelete,
  adminMode = false,
  isMobile = false,
}: IContractListItem) {
  const supabase = useSupabaseClient();
  const [securityDepositReceived, setSecurityDepositReceived] = useState(
    contract.security_deposit_received,
  );
  const [rentReceived, setRentReceived] = useState(contract.rent_received);
  const [depositReturned, setDepositReturned] = useState(
    contract.deposit_returned,
  );
  const [booked, setBooked] = useState(contract.booked);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const editDisabled = booked;

  function getFileUrl() {
    return supabase.storage.from("bill_images").getPublicUrl(contract.file).data
      .publicUrl;
  }

  function openFile() {
    const url = getFileUrl();
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  async function updateStatus(field: keyof IContract, value: boolean) {
    if (!adminMode) return;

    try {
      const response = await fetch("/api/updateContract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contract.id, [field]: value }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Status bijwerken mislukt");
      }
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Status bijwerken mislukt",
        color: "red",
      });
      throw error;
    }
  }

  async function handleSecurityDepositChange(e: any) {
    const value = e.target.checked;
    setSecurityDepositReceived(value);
    try {
      await updateStatus("security_deposit_received", value);
    } catch {
      setSecurityDepositReceived(!value);
    }
  }

  async function handleRentChange(e: any) {
    const value = e.target.checked;
    setRentReceived(value);
    try {
      await updateStatus("rent_received", value);
    } catch {
      setRentReceived(!value);
    }
  }

  async function handleDepositReturnedChange(e: any) {
    const value = e.target.checked;
    setDepositReturned(value);
    try {
      await updateStatus("deposit_returned", value);
    } catch {
      setDepositReturned(!value);
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

  async function handleDelete() {
    if (!adminMode) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/deleteContract?id=${contract.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Verwijderen mislukt");
      }

      notifications.show({
        title: "Succes",
        message: "Contract succesvol verwijderd",
        color: "green",
      });

      if (onDelete) onDelete();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Contract verwijderen mislukt",
        color: "red",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  }

  const StatusBadge = ({
    active,
    doneLabel,
    pendingLabel,
  }: {
    active: boolean;
    doneLabel: string;
    pendingLabel: string;
  }) => (
    <Badge color={active ? "green" : "yellow"} variant="filled">
      {active ? doneLabel : pendingLabel}
    </Badge>
  );

  const actionButtons = (
    <div className="flex justify-end gap-2">
      {!editDisabled ? (
        <Link
          href={`/edit-contract?id=${contract.id}`}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md hover:bg-gray-200"
        >
          <AiFillEdit size={16} />
        </Link>
      ) : (
        <Tooltip
          label="Ingeboekte contracten kunnen niet worden bewerkt"
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
      )}
      <button
        onClick={openFile}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        <AiOutlineDownload size={16} />
      </button>
      <button
        onClick={() =>
          notifications.show({
            title: "Info",
            message: "E-mail versturen is nog niet geactiveerd",
          })
        }
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800"
      >
        <AiOutlineMail size={16} />
      </button>
      {adminMode && (
        <button
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
        >
          <AiOutlineDelete size={16} />
        </button>
      )}
    </div>
  );

  const deleteModal = (
    <Modal
      opened={showDeleteModal}
      onClose={() => setShowDeleteModal(false)}
      title="Contract verwijderen"
      centered
    >
      <div>
        <p className="mb-4">Ben je zeker dat je dit contract wil verwijderen?</p>
        <p className="mb-4 font-bold">{contract.name}</p>
        <p className="mb-6 text-red-600">Deze actie kan niet ongedaan worden.</p>
        <Group position="right">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            Annuleren
          </Button>
          <Button color="red" onClick={handleDelete} loading={isDeleting}>
            Verwijderen
          </Button>
        </Group>
      </div>
    </Modal>
  );

  if (isMobile) {
    return (
      <>
        <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
          <Card.Section withBorder inheritPadding py="xs">
            <div className="flex flex-col gap-1">
              <Text weight={700} lineClamp={2}>
                {contract.name}
              </Text>
              <div className="flex items-center justify-between mt-1">
                <Text size="sm" color="dimmed">
                  {contract.date || "-"}
                </Text>
                <StatusBadge
                  active={booked}
                  doneLabel="Ingeboekt"
                  pendingLabel="Niet ingeboekt"
                />
              </div>
            </div>
          </Card.Section>

          <Box py="md">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Text size="sm" color="dimmed">
                  Categorie
                </Text>
                <Text size="sm">{contract.category || "-"}</Text>
              </div>
              <div>
                <Text size="sm" color="dimmed">
                  Huur
                </Text>
                <Text size="sm" weight={600}>
                  € {(contract.rent / 100).toFixed(2)}
                </Text>
              </div>
              <div>
                <Text size="sm" color="dimmed">
                  Waarborg
                </Text>
                <Text size="sm" weight={600}>
                  € {(contract.security_deposit / 100).toFixed(2)}
                </Text>
              </div>
              <div>
                <Text size="sm" color="dimmed">
                  Omschrijving
                </Text>
                <Text size="sm">{contract.desc || "-"}</Text>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {adminMode ? (
                <>
                  <Checkbox
                    checked={securityDepositReceived}
                    onChange={handleSecurityDepositChange}
                    label="Waarborg ontvangen"
                  />
                  <Checkbox
                    checked={rentReceived}
                    onChange={handleRentChange}
                    label="Huur ontvangen"
                  />
                  <Checkbox
                    checked={depositReturned}
                    onChange={handleDepositReturnedChange}
                    label="Waarborg terugbetaald"
                  />
                  <Checkbox
                    checked={booked}
                    onChange={handleBookedChange}
                    label="Ingeboekt"
                  />
                </>
              ) : (
                <Group spacing={6}>
                  <StatusBadge
                    active={securityDepositReceived}
                    doneLabel="Waarborg ontvangen"
                    pendingLabel="Waarborg open"
                  />
                  <StatusBadge
                    active={rentReceived}
                    doneLabel="Huur ontvangen"
                    pendingLabel="Huur open"
                  />
                  <StatusBadge
                    active={depositReturned}
                    doneLabel="Waarborg terug"
                    pendingLabel="Waarborg niet terug"
                  />
                </Group>
              )}
            </div>
          </Box>

          <Card.Section withBorder inheritPadding py="xs">
            {actionButtons}
          </Card.Section>
        </Card>
        {deleteModal}
      </>
    );
  }

  return (
    <tr>
      <td className="pr-4 break-words" style={{ maxWidth: "220px" }}>
        {contract.name}
      </td>
      <td>{contract.category}</td>
      <td>{contract.date}</td>
      <td>{contract.desc}</td>
      <td>€ {(contract.security_deposit / 100).toFixed(2)}</td>
      <td>€ {(contract.rent / 100).toFixed(2)}</td>
      <td>
        {adminMode ? (
          <Checkbox
            checked={securityDepositReceived}
            onChange={handleSecurityDepositChange}
          />
        ) : (
          <StatusBadge
            active={securityDepositReceived}
            doneLabel="Ontvangen"
            pendingLabel="Open"
          />
        )}
      </td>
      <td>
        {adminMode ? (
          <Checkbox checked={rentReceived} onChange={handleRentChange} />
        ) : (
          <StatusBadge
            active={rentReceived}
            doneLabel="Ontvangen"
            pendingLabel="Open"
          />
        )}
      </td>
      <td>
        {adminMode ? (
          <Checkbox
            checked={depositReturned}
            onChange={handleDepositReturnedChange}
          />
        ) : (
          <StatusBadge
            active={depositReturned}
            doneLabel="Terugbetaald"
            pendingLabel="Open"
          />
        )}
      </td>
      <td>
        {adminMode ? (
          <Checkbox checked={booked} onChange={handleBookedChange} />
        ) : (
          <StatusBadge
            active={booked}
            doneLabel="Ingeboekt"
            pendingLabel="Open"
          />
        )}
      </td>
      <td>{actionButtons}</td>
      {deleteModal}
    </tr>
  );
}

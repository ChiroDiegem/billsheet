import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Group,
  Loader,
  MediaQuery,
  Pagination,
  Select,
  Table,
  TextInput,
} from "@mantine/core";
import Link from "next/link";
import Fuse from "fuse.js";
import {
  AiOutlineClear,
  AiOutlineFilter,
  AiOutlineSearch,
} from "react-icons/ai";
import { BiChevronDown, BiChevronUp } from "react-icons/bi";
import { FiCalendar } from "react-icons/fi";
import { IContract, Profile } from "../types";
import ContractListItem from "./ContractListItem";

interface IContractList {
  adminMode?: boolean;
  currentUser: Profile;
}

interface FilterState {
  searchText: string;
  category: string;
  dateRange: [Date | null, Date | null];
  name: string;
}

export default function ContractList({
  adminMode = false,
  currentUser,
}: IContractList) {
  const [contracts, setContracts] = useState<IContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchText: "",
    category: "",
    dateRange: [null, null],
    name: "",
  });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const endpoint = adminMode
        ? "/api/getContracts"
        : "/api/getUserContracts";
      const response = await fetch(endpoint);

      if (!response.ok) {
        console.error("Error fetching contracts:", await response.text());
        setContracts([]);
      } else {
        const data = await response.json();
        const fetchedContracts = data.contracts || [];
        setContracts(fetchedContracts);

        if (fetchedContracts.length > 0) {
          setUniqueCategories(
            Array.from(
              new Set(
                fetchedContracts
                  .map((contract: IContract) => contract.category)
                  .filter(Boolean),
              ),
            ),
          );
        }
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [adminMode]);

  useEffect(() => {
    const active: string[] = [];
    if (filters.searchText) active.push("Zoeken");
    if (filters.category) active.push("Categorie");
    if (filters.dateRange[0] || filters.dateRange[1]) active.push("Datum");
    if (filters.name) active.push("Naam");
    setActiveFilters(active);
  }, [filters]);

  useEffect(() => {
    setStartDateInput(formatDate(filters.dateRange[0]));
    setEndDateInput(formatDate(filters.dateRange[1]));
  }, [filters.dateRange]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      searchText: "",
      category: "",
      dateRange: [null, null],
      name: "",
    });
    setCurrentPage(1);
  };

  const clearSingleFilter = (filterType: string) => {
    switch (filterType) {
      case "Zoeken":
        updateFilter("searchText", "");
        break;
      case "Categorie":
        updateFilter("category", "");
        break;
      case "Datum":
        updateFilter("dateRange", [null, null]);
        break;
      case "Naam":
        updateFilter("name", "");
        break;
      default:
        break;
    }
  };

  const getFuzzySearchResults = (data: IContract[]) => {
    if (!filters.searchText) return data;

    const fuse = new Fuse(data, {
      keys: ["name", "category", "desc", "date", "rent", "security_deposit"],
      threshold: 0.4,
      includeScore: true,
    });

    return fuse.search(filters.searchText).map((item) => item.item);
  };

  const getFilteredContracts = () => {
    let result = [...contracts];

    if (filters.dateRange[0]) {
      const startDate = filters.dateRange[0];
      result = result.filter((contract) => {
        if (!contract.date) return false;
        return new Date(contract.date) >= startDate;
      });
    }

    if (filters.dateRange[1]) {
      const endDate = filters.dateRange[1];
      result = result.filter((contract) => {
        if (!contract.date) return false;
        return new Date(contract.date) <= endDate;
      });
    }

    if (filters.category) {
      result = result.filter(
        (contract) => contract.category === filters.category,
      );
    }

    if (filters.name) {
      result = result.filter((contract) =>
        contract.name.toLowerCase().includes(filters.name.toLowerCase()),
      );
    }

    if (filters.searchText) {
      result = getFuzzySearchResults(result);
    }

    return result;
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    if (!dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) return null;

    const [day, month, year] = dateString.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
  };

  const filteredContracts = getFilteredContracts();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentContracts = filteredContracts.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);

  if (loading && contracts.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader size="xl" color="primary-color" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 md:py-10 md:px-6">
      <Group position="apart" align="flex-end" mb="md">
        <h1 className="text-2xl lg:text-3xl font-bold border-b-8 border-primary-color">
          {adminMode ? "Contracten" : "Mijn contracten"}
        </h1>
        <Link href="/contract/new">
          <Button color="primary-color">Nieuw contract</Button>
        </Link>
      </Group>

      <div className="mb-6 mt-4">
        <Group position="apart" align="flex-end" mb={10} spacing="sm">
          <Group
            spacing={10}
            style={{ width: "100%", flexDirection: "column" }}
            className="lg:flex-row"
          >
            <TextInput
              placeholder="Zoeken in alle velden"
              value={filters.searchText}
              onChange={(e) => updateFilter("searchText", e.target.value)}
              icon={<AiOutlineSearch size={16} />}
              style={{ width: "100%" }}
            />
            <Group spacing={8} position="right" style={{ width: "100%" }}>
              <Button
                variant="subtle"
                leftIcon={<AiOutlineFilter size={16} />}
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                rightIcon={
                  showAdvancedSearch ? (
                    <BiChevronUp size={16} />
                  ) : (
                    <BiChevronDown size={16} />
                  )
                }
                compact
              >
                Filters
              </Button>
              {activeFilters.length > 0 && (
                <Button
                  variant="subtle"
                  color="red"
                  leftIcon={<AiOutlineClear size={16} />}
                  onClick={clearFilters}
                  compact
                >
                  Wissen
                </Button>
              )}
            </Group>
          </Group>
        </Group>

        {activeFilters.length > 0 && (
          <Group spacing={6} mb={10}>
            {activeFilters.map((filter) => (
              <Chip
                key={filter}
                size="xs"
                checked={true}
                onClick={() => clearSingleFilter(filter)}
                variant="filled"
                color="blue"
                styles={{
                  label: {
                    cursor: "pointer",
                    "&:hover": { textDecoration: "line-through" },
                  },
                }}
              >
                {filter} x
              </Chip>
            ))}
          </Group>
        )}

        <Collapse in={showAdvancedSearch}>
          <Box
            p={15}
            sx={(theme) => ({
              backgroundColor:
                theme.colorScheme === "dark"
                  ? theme.colors.dark[6]
                  : theme.colors.gray[0],
              borderRadius: theme.radius.md,
            })}
          >
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="w-full space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <TextInput
                    label="Startdatum"
                    placeholder="DD/MM/YYYY"
                    value={startDateInput}
                    onChange={(e) => {
                      setStartDateInput(e.target.value);
                      const date = parseDate(e.target.value);
                      if (date || e.target.value === "") {
                        updateFilter("dateRange", [
                          date,
                          filters.dateRange[1],
                        ]);
                      }
                    }}
                    rightSection={<FiCalendar size={16} color="gray" />}
                    style={{ width: "100%" }}
                  />
                  <TextInput
                    label="Einddatum"
                    placeholder="DD/MM/YYYY"
                    value={endDateInput}
                    onChange={(e) => {
                      setEndDateInput(e.target.value);
                      const date = parseDate(e.target.value);
                      if (date || e.target.value === "") {
                        updateFilter("dateRange", [
                          filters.dateRange[0],
                          date,
                        ]);
                      }
                    }}
                    rightSection={<FiCalendar size={16} color="gray" />}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
              <div className="w-full space-y-4">
                <TextInput
                  label="Naam"
                  placeholder="Filter op naam"
                  value={filters.name}
                  onChange={(e) => updateFilter("name", e.target.value)}
                  style={{ width: "100%" }}
                />
                <Select
                  label="Categorie"
                  placeholder="Alle categorieen"
                  data={uniqueCategories.map((category) => ({
                    value: category,
                    label: category,
                  }))}
                  value={filters.category}
                  onChange={(val) => updateFilter("category", val || "")}
                  clearable
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </Box>
        </Collapse>
      </div>

      {contracts.length > 0 ? (
        <>
          <MediaQuery smallerThan="md" styles={{ display: "none" }}>
            <Table className="min-w-full">
              <thead className="border-b-4 border-primary-color">
                <tr>
                  <td className="pr-4">
                    <b>Naam</b>
                  </td>
                  <td className="pr-4">
                    <b>Categorie</b>
                  </td>
                  <td className="pr-4">
                    <b>Datum</b>
                  </td>
                  <td className="pr-4">
                    <b>Omschrijving</b>
                  </td>
                  <td className="pr-4">
                    <b>Waarborg</b>
                  </td>
                  <td className="pr-4">
                    <b>Huur</b>
                  </td>
                  <td className="pr-4">
                    <b>Waarborg ontvangen</b>
                  </td>
                  <td className="pr-4">
                    <b>Huur ontvangen</b>
                  </td>
                  <td className="pr-4">
                    <b>Waarborg terug</b>
                  </td>
                  <td className="pr-4">
                    <b>Ingeboekt</b>
                  </td>
                  <td>
                    <b>Acties</b>
                  </td>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-color">
                {currentContracts.map((contract) => (
                  <ContractListItem
                    key={contract.id}
                    contract={contract}
                    onDelete={fetchContracts}
                    adminMode={adminMode}
                    isMobile={false}
                  />
                ))}
              </tbody>
            </Table>
          </MediaQuery>

          <MediaQuery largerThan="md" styles={{ display: "none" }}>
            <div className="space-y-4">
              {currentContracts.map((contract) => (
                <ContractListItem
                  key={contract.id}
                  contract={contract}
                  onDelete={fetchContracts}
                  adminMode={adminMode}
                  isMobile={true}
                />
              ))}
            </div>
          </MediaQuery>

          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                total={totalPages}
                value={currentPage}
                onChange={setCurrentPage}
                color="yellow"
                radius="md"
                size="sm"
              />
            </div>
          )}

          {filteredContracts.length > 0 ? (
            <div className="mt-3 text-gray-600 text-center text-sm">
              {indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, filteredContracts.length)} van{" "}
              {filteredContracts.length} contracten
            </div>
          ) : (
            <div className="mt-3 text-gray-600 text-center">
              Geen contracten gevonden met deze filters
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-xl text-gray-600">Geen contracten gevonden</h3>
        </div>
      )}
    </div>
  );
}

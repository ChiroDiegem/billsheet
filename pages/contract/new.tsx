import {
  Alert,
  Button,
  FileInput,
  NumberInput,
  Paper,
  Box,
  Select,
  TextInput,
  Loader,
} from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { useSupabase, useSupabaseClient } from "../../contexts/SupabaseContext";
import { useEffect, useState } from "react";
import { v4 } from "uuid";
import { useRouter } from "next/router";
import { categorie } from "../../utils/constants";

export default function NewContract() {
  const supabase = useSupabaseClient();
  const { user, isLoading } = useSupabase();
  const router = useRouter();

  const [errorAlert, setErrorAlert] = useState("");
  const [successAlert, setSuccessAlert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialValuesSet, setInitialValuesSet] = useState(false);

  const form: any = useForm({
    initialValues: {
      name: "",
      category: "",
      desc: "",
      securityDeposit: "",
      rent: "",
      file: undefined,
    },
    validate: {
      name: isNotEmpty("Dit veld is verplicht"),
      category: isNotEmpty("Dit veld is verplicht"),
      file: (value: File | undefined) =>
        value === undefined
          ? "Dit veld is verplicht"
          : !isAllowedExtension(value.name)
            ? "Enkel .pdf, .jpg, .jpeg en .png bestanden zijn toegelaten"
            : null,
    },
  });

  useEffect(() => {
    if (user && !isLoading && !initialValuesSet) {
      form.setFieldValue("name", user.name || "");
      form.setFieldValue("category", categorie[0]);
      setInitialValuesSet(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, initialValuesSet]);

  function isAllowedExtension(name: string) {
    const lowerName = name.toLowerCase();
    return (
      lowerName.endsWith("pdf") ||
      lowerName.endsWith("jpg") ||
      lowerName.endsWith("jpeg") ||
      lowerName.endsWith("png")
    );
  }

  async function sendContract() {
    const validated = form.validate();

    if (validated && validated.hasErrors) {
      return;
    }

    setLoading(true);
    const values = form.values;
    const path = await uploadFile(values.file);

    if (!path) {
      setLoading(false);
      return;
    }

    if (user == null) {
      setErrorAlert("Je bent niet ingelogd");
      setSuccessAlert(false);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from("contracts").insert({
        name: values.name,
        category: values.category,
        desc: values.desc || "",
        file: path,
        security_deposit: Math.round(parseFloat(String(values.securityDeposit).replace(",", ".")) * 100) || 0,
        rent: Math.round(parseFloat(String(values.rent).replace(",", ".")) * 100) || 0,
        uid: user.id,
      });

      if (!error) {
        setSuccessAlert(true);
        setErrorAlert("");
        setTimeout(() => router.push("/contract"), 1500);
      } else {
        setErrorAlert(error.message);
        setSuccessAlert(false);
      }
    } catch (error: any) {
      setErrorAlert(error.message || "Er is een fout opgetreden");
      setSuccessAlert(false);
    } finally {
      setLoading(false);
    }
  }

  async function uploadFile(file: File) {
    if (!file) return null;

    try {
      const uuid = v4();
      const extension = file.name.split(".").at(-1);
      const fileName = uuid + "." + extension;
      const { data, error } = await supabase.storage
        .from("bill_images")
        .upload(fileName, file);

      if (error) {
        console.error("Error uploading file:", error);
        setErrorAlert("Fout bij uploaden van bestand: " + error.message);
        return null;
      } else {
        return fileName;
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      setErrorAlert("Fout bij uploaden van bestand");
      return null;
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col w-full px-4 py-6 md:py-10 md:px-6">
        <div className="w-full max-w-3xl mx-auto">
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
      <div className="w-full max-w-3xl mx-auto">
        <Paper shadow="xs" radius="md">
          <Box className="p-4 sm:p-6 md:p-8">
            <form
              className="w-full"
              onSubmit={(event) => {
                event.preventDefault();
                sendContract();
              }}
            >
              <h1 className="text-2xl md:text-3xl font-bold border-b-4 border-primary-color mb-6 pb-2">
                Nieuw Contract
              </h1>

              <div className="flex flex-col space-y-4">
                {/* First row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextInput
                    label="Naam"
                    withAsterisk
                    {...form.getInputProps("name")}
                    className="w-full"
                  />
                  <Select
                    label="Categorie"
                    data={categorie}
                    withAsterisk
                    {...form.getInputProps("category")}
                    className="w-full"
                  />
                </div>

                {/* Description */}
                <TextInput
                  label="Omschrijving"
                  {...form.getInputProps("desc")}
                  className="w-full"
                />

                {/* Amounts row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <NumberInput
                    label="Waarborg (€)"
                    inputMode="decimal"
                    min={0}
                    precision={2}
                    decimalSeparator=","
                    placeholder="0.00"
                    {...form.getInputProps("securityDeposit")}
                    className="w-full"
                  />
                  <NumberInput
                    label="Huur (€)"
                    inputMode="decimal"
                    min={0}
                    precision={2}
                    decimalSeparator=","
                    placeholder="0.00"
                    {...form.getInputProps("rent")}
                    className="w-full"
                  />
                </div>

                {/* File input */}
                <FileInput
                  placeholder="Selecteer bestand"
                  label="Contract bestand (PDF of afbeelding)"
                  withAsterisk
                  {...form.getInputProps("file")}
                  className="w-full"
                />

                {/* Alerts */}
                {successAlert && (
                  <Alert title="Succesvol!" color="green" className="mt-4">
                    Contract succesvol ingediend! Je wordt doorgestuurd...
                  </Alert>
                )}

                {errorAlert && (
                  <Alert title="Error" color="red" className="mt-4">
                    {errorAlert}
                  </Alert>
                )}

                {/* Submit button */}
                <Button
                  color="primary-color"
                  type="submit"
                  fullWidth
                  size="md"
                  className="mt-6"
                  loading={loading}
                >
                  {loading ? <Loader size="sm" /> : "Verzenden"}
                </Button>
              </div>
            </form>
          </Box>
        </Paper>
      </div>
    </div>
  );
}

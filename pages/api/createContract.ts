import { NextApiRequest, NextApiResponse } from "next";
import { readFile } from "fs/promises";
import { v4 } from "uuid";
import { createAdminClient } from "../../lib/supabase";
import { requireAuth } from "../../lib/authMiddleware";

export const config = {
  api: {
    bodyParser: false,
  },
};

const multiparty = require("multiparty");

function getFirst(value: any) {
  return Array.isArray(value) ? value[0] : value;
}

function toNumber(value: any) {
  const first = getFirst(value);
  return typeof first === "number" ? first : Number(first || 0);
}

function parseMultipart(req: NextApiRequest): Promise<{
  fields: Record<string, any>;
  files: Record<string, any>;
}> {
  const form = new multiparty.Form();

  return new Promise((resolve, reject) => {
    form.parse(req, (error: Error, fields: any, files: any) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({ fields, files });
    });
  });
}

async function uploadContractFile(file: any) {
  const uploadedFile = Array.isArray(file) ? file[0] : file;
  if (!uploadedFile) return null;

  const originalName = uploadedFile.originalFilename || uploadedFile.filename;
  const extension = originalName?.split(".").at(-1) || "pdf";
  const fileName = `${v4()}.${extension}`;
  const fileBuffer = await readFile(uploadedFile.path);
  const supabase = createAdminClient();

  const { error } = await supabase.storage
    .from("bill_images")
    .upload(fileName, fileBuffer, {
      contentType: uploadedFile.headers?.["content-type"],
    });

  if (error) {
    throw error;
  }

  return fileName;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user, authorized } = await requireAuth(req, res);
  if (!authorized || !user) return;

  try {
    const supabase = createAdminClient();
    const contentType = req.headers["content-type"] || "";
    let values: Record<string, any> = {};
    let filePath: string | null = "";

    if (contentType.includes("multipart/form-data")) {
      const { fields, files } = await parseMultipart(req);
      values = fields;
      filePath = await uploadContractFile(files.file);
    } else {
      return res.status(400).json({ error: "Multipart form data required" });
    }

    if (!filePath) {
      return res.status(400).json({ error: "Bestand is verplicht" });
    }

    const { data, error } = await supabase
      .from("contracts")
      .insert({
        name: getFirst(values.name) || user.name || "",
        category: getFirst(values.category) || "",
        date: getFirst(values.date) || "",
        desc: getFirst(values.desc) || "",
        file: filePath,
        security_deposit: toNumber(values.security_deposit),
        rent: toNumber(values.rent),
        uid: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Create contract error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: "OK", data });
  } catch (error: any) {
    console.error("Create contract error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Unexpected server error" });
  }
}

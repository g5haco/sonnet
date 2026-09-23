import { expect, test } from "vitest";
import { extractText } from "./extract";

// A one-page PDF saying "Midterm Oct 14"; pdf.js tolerates the missing xref table.
const PDF = `%PDF-1.4
1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj
2 0 obj <</Type/Pages/Kids[3 0 R]/Count 1>> endobj
3 0 obj <</Type/Page/Parent 2 0 R/MediaBox[0 0 300 100]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>> endobj
4 0 obj <</Length 44>> stream
BT /F1 12 Tf 20 50 Td (Midterm Oct 14) Tj ET
endstream endobj
5 0 obj <</Type/Font/Subtype/Type1/BaseFont/Helvetica>> endobj
trailer <</Root 1 0 R>>
%%EOF`;

test("extracts text from PDFs and text files, skips other types", async () => {
  expect(await extractText(new TextEncoder().encode(PDF), "application/pdf")).toContain("Midterm Oct 14");
  expect(await extractText(new TextEncoder().encode("Week 1:   intro\n\n\n\nWeek 2"), "text/plain")).toBe(
    "Week 1: intro\n\nWeek 2",
  );
  expect(await extractText(new Uint8Array([1, 2]), "image/png")).toBeNull();
});

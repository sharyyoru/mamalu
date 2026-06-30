import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type CreditNoteLineItem = {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
};

export type CreditNotePdfData = {
  credit_note_number: string;
  source_type: "service_booking" | "product_order";
  source_reference: string;
  original_invoice_number?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  line_items: CreditNoteLineItem[];
  subtotal_amount: number;
  vat_amount: number;
  total_credit_amount: number;
  created_at: string;
};

const formatMoney = (value: number) =>
  `AED ${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

export function downloadTaxCreditNotePdf(creditNote: CreditNotePdfData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFillColor(255, 140, 107);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Mamalu Kitchen", margin, 17);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Dubai, UAE | TRN 100465610200001", pageWidth - margin, 13, { align: "right" });
  doc.text("www.mamalukitchen.com", pageWidth - margin, 19, { align: "right" });

  doc.setTextColor(34, 34, 34);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("TAX CREDIT NOTE", margin, 43);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Credit Note No: ${creditNote.credit_note_number}`, pageWidth - margin, 38, { align: "right" });
  doc.text(`Date: ${formatDate(creditNote.created_at)}`, pageWidth - margin, 44, { align: "right" });
  doc.text(`Old ${creditNote.source_type === "service_booking" ? "Booking" : "Order"}: ${creditNote.source_reference}`, pageWidth - margin, 50, { align: "right" });
  doc.text(`Old Invoice: ${creditNote.original_invoice_number || "N/A"}`, pageWidth - margin, 56, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.text("Credit To", margin, 60);
  doc.setFont("helvetica", "normal");
  doc.text(creditNote.customer_name || "Customer", margin, 67);
  doc.text(creditNote.customer_email || "", margin, 73);
  if (creditNote.customer_phone) doc.text(creditNote.customer_phone, margin, 79);

  doc.setFont("helvetica", "bold");
  doc.text("Credit Details", pageWidth - margin, 67, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(`Total Credit: ${formatMoney(creditNote.total_credit_amount)}`, pageWidth - margin, 73, { align: "right" });
  doc.text(`VAT Inclusive: ${formatMoney(creditNote.vat_amount)}`, pageWidth - margin, 79, { align: "right" });

  autoTable(doc, {
    startY: 90,
    head: [["Description", "Tax", "Qty", "Rate", "Amount"]],
    body: creditNote.line_items.map((item) => [
      item.description,
      "SR Standard Rated (DXB)",
      String(item.quantity || 1),
      formatMoney(item.rate),
      formatMoney(item.amount),
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [255, 140, 107], textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 58 },
      1: { cellWidth: 42 },
      2: { halign: "right", cellWidth: 16 },
      3: { halign: "right", cellWidth: 32 },
      4: { halign: "right", cellWidth: 32 },
    },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 110;
  const totalsX = pageWidth - 78;
  const valuesX = pageWidth - margin;
  const rows = [
    ["Subtotal / Net Amount", creditNote.subtotal_amount],
    ["VAT 5%", creditNote.vat_amount],
    ["Total", creditNote.total_credit_amount],
    ["Total Credit", creditNote.total_credit_amount],
  ] as const;

  let y = finalY + 12;
  rows.forEach(([label, value], index) => {
    doc.setFont("helvetica", index >= 2 ? "bold" : "normal");
    doc.text(label, totalsX, y);
    doc.text(formatMoney(value), valuesX, y, { align: "right" });
    y += 7;
  });

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("VAT Summary", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.text(`Standard Rated Sales (DXB): ${formatMoney(creditNote.subtotal_amount)}`, margin, y);
  y += 6;
  doc.text(`VAT Amount: ${formatMoney(creditNote.vat_amount)}`, margin, y);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("This tax credit note credits the full paid total of the original transaction.", margin, 282);

  doc.save(`tax-credit-note-${creditNote.credit_note_number}.pdf`);
}

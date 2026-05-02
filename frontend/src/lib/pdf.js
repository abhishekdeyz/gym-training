import React from "react";
import jsPDF from "jspdf";
import { formatCurrency, formatDate } from "@/lib/format";

export function generateInvoicePDF({ payment, gym }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const left = 18;
  const right = 192;

  // Teal header
  doc.setFillColor(1, 105, 111);
  doc.rect(0, 0, 210, 36, "F");
  doc.setTextColor(255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(gym?.name || "GymPro", left, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(gym?.address || "", left, 25);
  doc.text(`Phone: ${gym?.phone || ""}${gym?.gstNumber ? `   GSTIN: ${gym.gstNumber}` : ""}`, left, 31);

  doc.setTextColor(40, 37, 29);
  let y = 50;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT RECEIPT", left, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice: ${payment.invoiceNo}`, left, y);
  doc.text(`Date: ${formatDate(payment.paidAt)}`, right - 50, y);
  y += 4;
  doc.setDrawColor(220);
  doc.line(left, y, right, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("Billed To:", left, y);
  doc.setFont("helvetica", "normal");
  y += 6;
  doc.text(payment.memberName || "", left, y);
  y += 5;
  doc.text(`Phone: ${payment.memberPhone || ""}`, left, y);
  y += 10;
  doc.line(left, y, right, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("Description", left, y);
  doc.text("Amount", right - 30, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(payment.description || "Membership Fee", left, y);
  doc.text(formatCurrency(payment.amount), right - 30, y);
  y += 8;
  doc.line(left, y, right, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL:", left, y);
  doc.text(formatCurrency(payment.amount), right - 30, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Method: ${payment.method}`, left, y);
  doc.text(`Status: ${payment.status}`, right - 30, y);
  y += 14;
  doc.line(left, y, right, y);
  y += 10;
  doc.setFont("helvetica", "italic");
  doc.text(`Shukriya ${gym?.name || "GymPro"} choose karne ke liye!`, left, y);
  y += 6;
  doc.text("Keep pushing! 💪", left, y);

  doc.save(`${payment.invoiceNo}.pdf`);
}

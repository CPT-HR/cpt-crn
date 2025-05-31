import { jsPDF } from "jspdf";
import "../../src/fonts/Manrope-Regular-normal.js";

interface Material {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}
interface WorkItem {
  id: string;
  text: string;
}
interface WorkOrder {
  id: string;
  clientCompanyName: string;
  clientCompanyAddress: string;
  clientOib: string;
  clientFirstName: string;
  clientLastName: string;
  clientMobile: string;
  clientEmail: string;
  orderForCustomer: boolean;
  customerCompanyName: string;
  customerCompanyAddress: string;
  customerOib: string;
  customerFirstName: string;
  customerLastName: string;
  customerMobile: string;
  customerEmail: string;
  description: WorkItem[];
  foundCondition: WorkItem[];
  performedWork: WorkItem[];
  technicianComment: WorkItem[];
  materials: Material[];
  date: string;
  arrivalTime: string;
  completionTime: string;
  calculatedHours: string;
  fieldTrip: boolean;
  distance: string;
  technicianSignature: string;
  technicianName: string;
  customerSignature: string;
  customerSignerName: string;
  signatureMetadata?: {
    timestamp?: string;
    coordinates?: { latitude: number; longitude: number };
    address?: string;
  };
}

export const generatePDF = async (workOrder: WorkOrder): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.setFont("Manrope-Regular", "normal");

      // HEADER
      pdf.setFontSize(16);
      pdf.text("RADNI NALOG", 105, 22, { align: "center" });

      pdf.setFontSize(12);
      pdf.text(`Broj: ${workOrder.id}`, 15, 32);
      pdf.text(`Datum: ${workOrder.date}`, 170, 32, { align: "right" });

      // PODACI O NARUČITELJU / KORISNIKU
      pdf.setFontSize(14);
      pdf.text("PODACI O NARUČITELJU", 15, 45);
      pdf.text("PODACI O KORISNIKU", 110, 45);

      pdf.setFontSize(12);
      let yRow = 53;
      const labelGap = 6.8;

      const leftX = 15;
      const rightX = 110;

      // Naručitelj
      pdf.text("Ime tvrtke:", leftX, yRow);
      pdf.text(workOrder.clientCompanyName, leftX + 30, yRow);
      pdf.text("Ime tvrtke:", rightX, yRow);
      pdf.text(workOrder.customerCompanyName || "-", rightX + 32, yRow);
      yRow += labelGap;

      pdf.text("Adresa tvrtke:", leftX, yRow);
      pdf.text(workOrder.clientCompanyAddress, leftX + 30, yRow);
      pdf.text("Adresa tvrtke:", rightX, yRow);
      pdf.text(workOrder.customerCompanyAddress || "-", rightX + 32, yRow);
      yRow += labelGap;

      pdf.text("OIB:", leftX, yRow);
      pdf.text(workOrder.clientOib, leftX + 30, yRow);
      pdf.text("OIB:", rightX, yRow);
      pdf.text(workOrder.customerOib || "-", rightX + 32, yRow);
      yRow += labelGap;

      pdf.text("Ime i prezime:", leftX, yRow);
      pdf.text(`${workOrder.clientFirstName} ${workOrder.clientLastName}`, leftX + 30, yRow);
      pdf.text("Ime i prezime:", rightX, yRow);
      pdf.text(`${workOrder.customerFirstName || ""} ${workOrder.customerLastName || ""}`.trim() || "-", rightX + 32, yRow);
      yRow += labelGap;

      pdf.text("Mobitel:", leftX, yRow);
      pdf.text(workOrder.clientMobile, leftX + 30, yRow);
      pdf.text("Mobitel:", rightX, yRow);
      pdf.text(workOrder.customerMobile || "-", rightX + 32, yRow);
      yRow += labelGap;

      pdf.text("Email:", leftX, yRow);
      pdf.text(workOrder.clientEmail, leftX + 30, yRow);
      pdf.text("Email:", rightX, yRow);
      pdf.text(workOrder.customerEmail || "-", rightX + 32, yRow);
      yRow += labelGap + 5;

      // SEKCIJE
      const section = (label: string, items: WorkItem[]) => {
        pdf.setFontSize(14);
        pdf.text(label, leftX, yRow);
        yRow += 7.5;
        pdf.setFontSize(12);
        const filtered = items.filter(x => x.text.trim());
        if (filtered.length > 0) {
          filtered.forEach(item => {
            const lines = pdf.splitTextToSize("• " + item.text, 180);
            pdf.text(lines, leftX + 3, yRow);
            yRow += lines.length * 6.2;
          });
        } else {
          pdf.text("• (nije uneseno)", leftX + 3, yRow);
          yRow += 6.2;
        }
        yRow += 4.5;
      };

      section("OPIS KVARA/PROBLEMA:", workOrder.description);
      section("ZATEČENO STANJE:", workOrder.foundCondition);
      section("IZVRŠENI RADOVI:", workOrder.performedWork);
      if (workOrder.technicianComment?.some(x => x.text.trim())) {
        section("KOMENTAR TEHNIČARA:", workOrder.technicianComment);
      }

      // UTROŠENI MATERIJAL – kao lista
      pdf.setFontSize(14);
      pdf.text("UTROŠENI MATERIJAL:", leftX, yRow);
      yRow += 7.5;
      pdf.setFontSize(12);
      if (workOrder.materials && workOrder.materials.length > 0) {
        workOrder.materials.forEach((mat, i) => {
          pdf.text(`${i+1}. ${mat.name} – ${mat.quantity} ${mat.unit}`, leftX + 3, yRow);
          yRow += 6.2;
        });
      } else {
        pdf.text("• (nije uneseno)", leftX + 3, yRow);
        yRow += 6.2;
      }
      yRow += 7;

      // VRIJEME I PUT - side by side, uredno
      pdf.setFontSize(14);
      pdf.text("VRIJEME:", leftX, yRow);
      pdf.text("PUT:", rightX, yRow);
      yRow += 7.5;
      pdf.setFontSize(12);
      pdf.text(`Datum: ${workOrder.date}`, leftX + 3, yRow);
      pdf.text(`Izlazak na teren: ${workOrder.fieldTrip ? "DA" : "NE"}`, rightX + 3, yRow);
      yRow += 6.2;
      pdf.text(`Vrijeme dolaska: ${workOrder.arrivalTime}`, leftX + 3, yRow);
      if (workOrder.fieldTrip)
        pdf.text(`Prijeđena udaljenost: ${workOrder.distance} km`, rightX + 3, yRow);
      yRow += 6.2;
      pdf.text(`Vrijeme završetka: ${workOrder.completionTime}`, leftX + 3, yRow);
      yRow += 6.2;
      pdf.text(`Obračunsko vrijeme: ${workOrder.calculatedHours}`, leftX + 3, yRow);
      yRow += 12;

      // POTPISI (bez naslova)
      pdf.setFontSize(12);
      pdf.text("Potpis tehničara:", leftX + 3, yRow);
      pdf.text("Potpis klijenta:", rightX + 3, yRow);

      // Signatures as images
      let ySign = yRow + 2;
      if (workOrder.technicianSignature) {
        const techImg = new Image();
        techImg.src = workOrder.technicianSignature;
        techImg.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = techImg.width;
          canvas.height = techImg.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(techImg, 0, 0);
            pdf.addImage(canvas.toDataURL("image/png"), "PNG", leftX + 3, ySign, 40, 20);
            pdf.text(workOrder.technicianName, leftX + 3, ySign + 25);

            if (workOrder.customerSignature) {
              const custImg = new Image();
              custImg.src = workOrder.customerSignature;
              custImg.onload = () => {
                const custCanvas = document.createElement("canvas");
                custCanvas.width = custImg.width;
                custCanvas.height = custImg.height;
                const custCtx = custCanvas.getContext("2d");
                if (custCtx) {
                  custCtx.drawImage(custImg, 0, 0);
                  pdf.addImage(custCanvas.toDataURL("image/png"), "PNG", rightX + 3, ySign, 40, 20);
                  pdf.text(workOrder.customerSignerName, rightX + 3, ySign + 25);

                  // Meta
                  if (workOrder.signatureMetadata) {
                    pdf.setFontSize(9);
                    let metaY = ySign + 31;
                    pdf.text(`Datum i vrijeme: ${workOrder.signatureMetadata.timestamp || ""}`, rightX + 3, metaY);
                    metaY += 5;
                    if (workOrder.signatureMetadata.coordinates) {
                      const { latitude, longitude } = workOrder.signatureMetadata.coordinates;
                      pdf.text(`Koordinate: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, rightX + 3, metaY);
                      metaY += 5;
                    }
                    if (workOrder.signatureMetadata.address) {
                      const addressLines = pdf.splitTextToSize(
                        `Adresa: ${workOrder.signatureMetadata.address}`,
                        60
                      );
                      pdf.text(addressLines, rightX + 3, metaY);
                    }
                  }
                  pdf.save(`Radni_nalog_${workOrder.id.replace("/", "-")}.pdf`);
                  resolve();
                }
              };
              custImg.onerror = () => {
                pdf.save(`Radni_nalog_${workOrder.id.replace("/", "-")}.pdf`);
                resolve();
              };
            } else {
              pdf.save(`Radni_nalog_${workOrder.id.replace("/", "-")}.pdf`);
              resolve();
            }
          }
        };
        techImg.onerror = () => {
          pdf.save(`Radni_nalog_${workOrder.id.replace("/", "-")}.pdf`);
          resolve();
        };
      } else {
        pdf.save(`Radni_nalog_${workOrder.id.replace("/", "-")}.pdf`);
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
};

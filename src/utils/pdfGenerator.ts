import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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
      pdf.setFontSize(20);
      pdf.text("RADNI NALOG", 105, 22, { align: "center" });
      pdf.setFontSize(11);
      pdf.text(`Broj: ${workOrder.id}`, 15, 32);
      pdf.text(`Datum: ${workOrder.date}`, 170, 32, { align: "right" });

      // NARUČITELJ & KORISNIK - side by side
      const client = [
        ["Ime tvrtke", workOrder.clientCompanyName],
        ["Adresa tvrtke", workOrder.clientCompanyAddress],
        ["OIB", workOrder.clientOib],
        ["Ime i prezime", `${workOrder.clientFirstName} ${workOrder.clientLastName}`],
        ["Mobitel", workOrder.clientMobile],
        ["Email", workOrder.clientEmail],
      ];
      const customer = workOrder.orderForCustomer
        ? [
            ["Ime tvrtke", workOrder.customerCompanyName],
            ["Adresa tvrtke", workOrder.customerCompanyAddress],
            ["OIB", workOrder.customerOib],
            ["Ime i prezime", `${workOrder.customerFirstName} ${workOrder.customerLastName}`],
            ["Mobitel", workOrder.customerMobile],
            ["Email", workOrder.customerEmail],
          ]
        : [["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""]];

      autoTable(pdf, {
        startY: 38,
        styles: { font: "Manrope-Regular", fontSize: 9, cellPadding: 1.8, overflow: 'linebreak' },
        headStyles: { fillColor: [241,245,249], textColor: 30, fontStyle: "normal" },
        columnStyles: { 0: { cellWidth: 36 }, 1: { cellWidth: 56 }, 2: { cellWidth: 36 }, 3: { cellWidth: 56 } },
        head: [["PODACI O NARUČITELJU", "", "PODACI O KORISNIKU", ""]],
        body: client.map((row, i) => [row[0]+":", row[1], customer[i][0] ? customer[i][0]+":" : "", customer[i][1] || ""])
      });

      let y = (pdf as any).lastAutoTable.finalY + 5;

      // Helper
      const section = (label: string, items: WorkItem[]) => {
        pdf.setFontSize(11);
        pdf.text(label, 15, y);
        y += 5.5;
        pdf.setFontSize(9.5);
        const filtered = items.filter(x => x.text.trim());
        if (filtered.length > 0) {
          filtered.forEach(item => {
            const lines = pdf.splitTextToSize("• " + item.text, 180);
            pdf.text(lines, 18, y);
            y += lines.length * 4.5;
          });
        } else {
          pdf.text("• (nije uneseno)", 18, y);
          y += 4.5;
        }
        y += 3.5;
      };

      section("OPIS KVARA/PROBLEMA:", workOrder.description);
      section("ZATEČENO STANJE:", workOrder.foundCondition);
      section("IZVRŠENI RADOVI:", workOrder.performedWork);
      if (workOrder.technicianComment?.some(x => x.text.trim())) {
        section("KOMENTAR TEHNIČARA:", workOrder.technicianComment);
      }

      // UTROŠENI MATERIJAL – kao lista
      pdf.setFontSize(11);
      pdf.text("UTROŠENI MATERIJAL:", 15, y);
      y += 5.5;
      pdf.setFontSize(9.5);
      if (workOrder.materials && workOrder.materials.length > 0) {
        workOrder.materials.forEach((mat, i) => {
          pdf.text(`${i+1}. ${mat.name} – ${mat.quantity} ${mat.unit}`, 18, y);
          y += 4.5;
        });
      } else {
        pdf.text("• (nije uneseno)", 18, y);
        y += 4.5;
      }
      y += 5.5;

      // VRIJEME I PUT - side by side
      pdf.setFontSize(11);
      pdf.text("VRIJEME:", 15, y);
      pdf.text("PUT:", 120, y);
      y += 5.2;
      pdf.setFontSize(9.5);
      pdf.text(`Datum: ${workOrder.date}`, 18, y);
      pdf.text(`Izlazak na teren: ${workOrder.fieldTrip ? "DA" : "NE"}`, 123, y);
      y += 4.5;
      pdf.text(`Vrijeme dolaska: ${workOrder.arrivalTime}`, 18, y);
      if (workOrder.fieldTrip)
        pdf.text(`Prijeđena udaljenost: ${workOrder.distance} km`, 123, y);
      y += 4.5;
      pdf.text(`Vrijeme završetka: ${workOrder.completionTime}`, 18, y);
      y += 4.5;
      pdf.text(`Obračunsko vrijeme: ${workOrder.calculatedHours}`, 18, y);
      y += 7;

      // POTPISI
      pdf.setFontSize(11);
      pdf.text("Potpis tehničara:", 18, y);
      pdf.text("Potpis klijenta:", 115, y);

      // Signatures as images
      let ySign = y + 2;
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
            pdf.addImage(canvas.toDataURL("image/png"), "PNG", 18, ySign, 40, 20);
            pdf.text(workOrder.technicianName, 18, ySign + 25);

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
                  pdf.addImage(custCanvas.toDataURL("image/png"), "PNG", 115, ySign, 40, 20);
                  pdf.text(workOrder.customerSignerName, 115, ySign + 25);

                  // Meta
                  if (workOrder.signatureMetadata) {
                    pdf.setFontSize(7);
                    let metaY = ySign + 31;
                    pdf.text(`Datum i vrijeme: ${workOrder.signatureMetadata.timestamp || ""}`, 115, metaY);
                    metaY += 3;
                    if (workOrder.signatureMetadata.coordinates) {
                      const { latitude, longitude } = workOrder.signatureMetadata.coordinates;
                      pdf.text(`Koordinate: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, 115, metaY);
                      metaY += 3;
                    }
                    if (workOrder.signatureMetadata.address) {
                      const addressLines = pdf.splitTextToSize(
                        `Adresa: ${workOrder.signatureMetadata.address}`,
                        60
                      );
                      pdf.text(addressLines, 115, metaY);
                    }
                    pdf.setFontSize(9.5);
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

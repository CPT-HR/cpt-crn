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

      const leftX = 15;
      const rightX = 110;
      let yRow = 32;
      const pageHeight = 297;
      const marginBottom = 18;

      // --- HEADER ---
      pdf.setFontSize(10);
      pdf.text("Centar pametne tehnologije d.o.o.", leftX, 14);
      pdf.text("Kovači 78c, Velika Mlaka", leftX, 19);
      pdf.text("OIB: 75343882245", leftX, 24);
      pdf.text("info@pametnatehnologija.hr", 115, 14);
      pdf.text("+385 1 6525 100", 115, 19);

      // Naslov i broj naloga (desno poravnanje)
      pdf.setFontSize(14);
      pdf.text("RADNI NALOG", leftX, 29, { align: "left" });
      pdf.setFontSize(11);
      pdf.text(`Broj: ${workOrder.id}`, 200 - leftX, 29, { align: "right" });

      // Datum naloga (desno)
      pdf.setFontSize(9);
      pdf.text(`Datum: ${workOrder.date}`, 200 - leftX, 35, { align: "right" });

      yRow = 40;

      // Helper za page break
      const pageBreak = (delta: number = 8) => {
        if (yRow > pageHeight - marginBottom - 25) {
          footer();
          pdf.addPage();
          header();
          yRow = 40 + delta;
        }
      };

      // HEADER draw function for multipage
      function header() {
        pdf.setFontSize(10);
        pdf.text("Centar pametne tehnologije d.o.o.", leftX, 14);
        pdf.text("Kovači 78c, Velika Mlaka", leftX, 19);
        pdf.text("OIB: 75343882245", leftX, 24);
        pdf.text("info@pametnatehnologija.hr", 115, 14);
        pdf.text("+385 1 6525 100", 115, 19);
        pdf.setFontSize(14);
        pdf.text("RADNI NALOG", leftX, 29, { align: "left" });
        pdf.setFontSize(11);
        pdf.text(`Broj: ${workOrder.id}`, 200 - leftX, 29, { align: "right" });
        pdf.setFontSize(9);
        pdf.text(`Datum: ${workOrder.date}`, 200 - leftX, 35, { align: "right" });
      }

      // FOOTER draw function
      function footer() {
        pdf.setFontSize(7);
        pdf.setTextColor(100);
        pdf.text(
          "Centar pametne tehnologije d.o.o. | Kovači 78c 10010 Velika Mlaka | OIB: 75343882245 | pametnatehnologija.hr",
          105,
          pageHeight - 12,
          { align: "center" }
        );
        pdf.text(
          "Trgovački sud u Zagrebu MBS:081428675 | Direktor: Dario Azinović | Temeljni kapital 20.000 kn uplaćen u cijelosti | HR9224020061101084560 kod Erste&Steiermärkische Bank d.d. Rijeka",
          105,
          pageHeight - 7,
          { align: "center" }
        );
        pdf.setTextColor(0);
      }

      // --- PODACI O NARUČITELJU / KORISNIKU ---
      pdf.setFontSize(11);
      pdf.text("PODACI O NARUČITELJU", leftX, yRow);
      pdf.text("PODACI O KORISNIKU", rightX, yRow);
      yRow += 6.5;
      pageBreak();

      pdf.setFontSize(9);
      const labelGap = 5.2;

      const writePair = (label: string, left: string, right: string, rightVal: string) => {
        pdf.text(label, leftX, yRow);
        pdf.text(left || "-", leftX + 28, yRow);
        pdf.text(label, rightX, yRow);
        pdf.text(rightVal || "-", rightX + 28, yRow);
        yRow += labelGap;
        pageBreak();
      };

      writePair("Ime tvrtke:", workOrder.clientCompanyName, "Ime tvrtke:", workOrder.customerCompanyName || "");
      writePair("Adresa tvrtke:", workOrder.clientCompanyAddress, "Adresa tvrtke:", workOrder.customerCompanyAddress || "");
      writePair("OIB:", workOrder.clientOib, "OIB:", workOrder.customerOib || "");
      writePair("Ime i prezime:", `${workOrder.clientFirstName} ${workOrder.clientLastName}`, "Ime i prezime:", `${workOrder.customerFirstName || ""} ${workOrder.customerLastName || ""}`.trim());
      writePair("Mobitel:", workOrder.clientMobile, "Mobitel:", workOrder.customerMobile || "");
      writePair("Email:", workOrder.clientEmail, "Email:", workOrder.customerEmail || "");
      yRow += 4;
      pageBreak();

      // --- VRIJEME I PUT ---
      pdf.setFontSize(9);
      pdf.text(`Datum: ${workOrder.date}`, leftX + 3, yRow);
      pdf.text(`Izlazak na teren: ${workOrder.fieldTrip ? "DA" : "NE"}`, rightX + 3, yRow);
      yRow += 5;
      pageBreak();

      pdf.text(`Vrijeme dolaska: ${workOrder.arrivalTime}`, leftX + 3, yRow);
      if (workOrder.fieldTrip)
        pdf.text(`Prijeđena udaljenost: ${workOrder.distance} km`, rightX + 3, yRow);
      yRow += 5;
      pageBreak();

      pdf.text(`Vrijeme završetka: ${workOrder.completionTime}`, leftX + 3, yRow);
      yRow += 5;
      pageBreak();

      pdf.text(`Obračunsko vrijeme: ${workOrder.calculatedHours}`, leftX + 3, yRow);
      yRow += 8;
      pageBreak();

      // --- SEKCIJE ---
      const section = (label: string, items: WorkItem[]) => {
        pdf.setFontSize(11);
        pdf.text(label, leftX, yRow);
        yRow += 5.5;
        pdf.setFontSize(9);
        const filtered = items.filter(x => x.text.trim());
        if (filtered.length > 0) {
          filtered.forEach(item => {
            const lines = pdf.splitTextToSize("• " + item.text, 180);
            pdf.text(lines, leftX + 3, yRow);
            yRow += lines.length * 5.5;
            pageBreak();
          });
        } else {
          pdf.text("• (nije uneseno)", leftX + 3, yRow);
          yRow += 5.5;
          pageBreak();
        }
        yRow += 2.5;
        pageBreak();
      };

      section("OPIS KVARA/PROBLEMA:", workOrder.description);
      section("ZATEČENO STANJE:", workOrder.foundCondition);
      section("IZVRŠENI RADOVI:", workOrder.performedWork);
      if (workOrder.technicianComment?.some(x => x.text.trim())) {
        section("KOMENTAR TEHNIČARA:", workOrder.technicianComment);
      }

      // --- UTROŠENI MATERIJAL ---
      pdf.setFontSize(11);
      pdf.text("UTROŠENI MATERIJAL:", leftX, yRow);
      yRow += 5.5;
      pdf.setFontSize(9);
      if (workOrder.materials && workOrder.materials.length > 0) {
        workOrder.materials.forEach((mat, i) => {
          pdf.text(`${i+1}. ${mat.name} – ${mat.quantity} ${mat.unit}`, leftX + 3, yRow);
          yRow += 5.5;
          pageBreak();
        });
      } else {
        pdf.text("• (nije uneseno)", leftX + 3, yRow);
        yRow += 5.5;
        pageBreak();
      }
      yRow += 10;

      // --- POTPISI ---
      pdf.setFontSize(9);
      pdf.text("Potpis tehničara:", leftX + 3, yRow);
      pdf.text("Potpis klijenta:", rightX + 3, yRow);

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
            pdf.addImage(canvas.toDataURL("image/png"), "PNG", leftX + 3, ySign, 36, 16);
            pdf.text(workOrder.technicianName, leftX + 3, ySign + 20);

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
                  pdf.addImage(custCanvas.toDataURL("image/png"), "PNG", rightX + 3, ySign, 36, 16);
                  pdf.text(workOrder.customerSignerName, rightX + 3, ySign + 20);

                  if (workOrder.signatureMetadata) {
                    pdf.setFontSize(7);
                    let metaY = ySign + 25;
                    pdf.text(`Datum i vrijeme: ${workOrder.signatureMetadata.timestamp || ""}`, rightX + 3, metaY);
                    metaY += 4.5;
                    if (workOrder.signatureMetadata.coordinates) {
                      const { latitude, longitude } = workOrder.signatureMetadata.coordinates;
                      pdf.text(`Koordinate: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, rightX + 3, metaY);
                      metaY += 4.5;
                    }
                    if (workOrder.signatureMetadata.address) {
                      const addressLines = pdf.splitTextToSize(
                        `Adresa: ${workOrder.signatureMetadata.address}`,
                        60
                      );
                      pdf.text(addressLines, rightX + 3, metaY);
                    }
                  }
                  footer();
                  pdf.save(`Radni_nalog_${workOrder.id.replace("/", "-")}.pdf`);
                  resolve();
                }
              };
              custImg.onerror = () => {
                footer();
                pdf.save(`Radni_nalog_${workOrder.id.replace("/", "-")}.pdf`);
                resolve();
              };
            } else {
              footer();
              pdf.save(`Radni_nalog_${workOrder.id.replace("/", "-")}.pdf`);
              resolve();
            }
          }
        };
        techImg.onerror = () => {
          footer();
          pdf.save(`Radni_nalog_${workOrder.id.replace("/", "-")}.pdf`);
          resolve();
        };
      } else {
        footer();
        pdf.save(`Radni_nalog_${workOrder.id.replace("/", "-")}.pdf`);
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
};

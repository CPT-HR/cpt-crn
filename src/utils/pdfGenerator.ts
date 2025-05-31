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
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.setFont("Manrope-Regular", "normal");
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 18;
      let y = 18;

      // HEADER
      pdf.setFontSize(11);
      pdf.text("Centar pametne tehnologije d.o.o.", margin, y);
      pdf.text("Kovači 78c, Velika Mlaka", margin, y + 5);
      pdf.text("OIB: 75343882245", margin, y + 10);
      pdf.text("info@pametnatehnologija.hr", pageWidth - margin - 65, y);
      pdf.text("+385 1 6525 100", pageWidth - margin - 65, y + 5);

      // Title & Nalog broj
      pdf.setFontSize(16);
      pdf.text("RADNI NALOG", margin, y + 22);
      pdf.setFontSize(11);
      pdf.text(`Broj: ${workOrder.id}`, pageWidth - margin, y + 22, { align: "right" });
      pdf.text(`Datum: ${workOrder.date}`, pageWidth - margin, y + 28, { align: "right" });

      y += 35;

      // NARUČITELJ
      pdf.setFontSize(12);
      pdf.setTextColor(32, 32, 32);
      pdf.text("PODACI O NARUČITELJU", margin, y);
      y += 5.5;
      pdf.setFontSize(9.3);
      pdf.text(`Ime tvrtke: ${workOrder.clientCompanyName}`, margin, y);
      y += 5;
      pdf.text(`Adresa: ${workOrder.clientCompanyAddress}`, margin, y);
      y += 5;
      pdf.text(`OIB: ${workOrder.clientOib}`, margin, y);
      y += 5;
      pdf.text(`Ime i prezime: ${workOrder.clientFirstName} ${workOrder.clientLastName}`, margin, y);
      y += 5;
      pdf.text(`Mobitel: ${workOrder.clientMobile}`, margin, y);
      y += 5;
      pdf.text(`Email: ${workOrder.clientEmail}`, margin, y);

      if (workOrder.orderForCustomer) {
        y += 8;
        pdf.setFontSize(12);
        pdf.text("PODACI O KORISNIKU", margin, y);
        y += 5.5;
        pdf.setFontSize(9.3);
        pdf.text(`Ime tvrtke: ${workOrder.customerCompanyName}`, margin, y);
        y += 5;
        pdf.text(`Adresa: ${workOrder.customerCompanyAddress}`, margin, y);
        y += 5;
        pdf.text(`OIB: ${workOrder.customerOib}`, margin, y);
        y += 5;
        pdf.text(`Ime i prezime: ${workOrder.customerFirstName} ${workOrder.customerLastName}`, margin, y);
        y += 5;
        pdf.text(`Mobitel: ${workOrder.customerMobile}`, margin, y);
        y += 5;
        pdf.text(`Email: ${workOrder.customerEmail}`, margin, y);
      }

      y += 11;
      pdf.setLineWidth(0.35);
      pdf.setDrawColor(120, 120, 120);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 4;

      // Osnovni podaci o nalogu
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      pdf.text(
        `Vrijeme dolaska: ${workOrder.arrivalTime}   |   Vrijeme završetka: ${workOrder.completionTime}   |   Obračunsko vrijeme: ${workOrder.calculatedHours}`,
        margin,
        y
      );
      y += 6;
      pdf.text(
        `Izlazak na teren: ${workOrder.fieldTrip ? "DA" : "NE"}   |   Prijeđena udaljenost: ${workOrder.distance ? workOrder.distance + " km" : "-"}`,
        margin,
        y
      );
      pdf.setTextColor(32, 32, 32);

      y += 11;

      // OPIS KVARA
      pdf.setFontSize(12);
      pdf.text("OPIS KVARA / PROBLEMA", margin, y);
      y += 5.3;
      pdf.setFontSize(9.2);
      if (workOrder.description.length > 0 && workOrder.description.some(x => x.text.trim())) {
        workOrder.description.forEach((item, idx) => {
          if (item.text.trim()) {
            pdf.text(`${idx + 1}. ${item.text}`, margin, y);
            y += 5;
          }
        });
      } else {
        pdf.text("Nije uneseno.", margin, y);
        y += 5;
      }

      y += 7.3;

      // ZATEČENO STANJE
      pdf.setFontSize(12);
      pdf.text("ZATEČENO STANJE", margin, y);
      y += 5.3;
      pdf.setFontSize(9.2);
      if (workOrder.foundCondition.length > 0 && workOrder.foundCondition.some(x => x.text.trim())) {
        workOrder.foundCondition.forEach((item, idx) => {
          if (item.text.trim()) {
            pdf.text(`${idx + 1}. ${item.text}`, margin, y);
            y += 5;
          }
        });
      } else {
        pdf.text("Nije uneseno.", margin, y);
        y += 5;
      }

      y += 7.3;

      // IZVRŠENI RADOVI
      pdf.setFontSize(12);
      pdf.text("IZVRŠENI RADOVI", margin, y);
      y += 5.3;
      pdf.setFontSize(9.2);
      if (workOrder.performedWork.length > 0 && workOrder.performedWork.some(x => x.text.trim())) {
        workOrder.performedWork.forEach((item, idx) => {
          if (item.text.trim()) {
            pdf.text(`${idx + 1}. ${item.text}`, margin, y);
            y += 5;
          }
        });
      } else {
        pdf.text("Nije uneseno.", margin, y);
        y += 5;
      }

      y += 7.3;

      // KOMENTAR TEHNIČARA
      pdf.setFontSize(12);
      pdf.text("KOMENTAR TEHNIČARA", margin, y);
      y += 5.3;
      pdf.setFontSize(9.2);
      if (workOrder.technicianComment.length > 0 && workOrder.technicianComment.some(x => x.text.trim())) {
        workOrder.technicianComment.forEach((item, idx) => {
          if (item.text.trim()) {
            pdf.text(`${idx + 1}. ${item.text}`, margin, y);
            y += 5;
          }
        });
      } else {
        pdf.text("Nije uneseno.", margin, y);
        y += 5;
      }

      y += 7.3;

      // UTROŠENI MATERIJAL (TABLICA)
      pdf.setFontSize(12);
      pdf.text("UTROŠENI MATERIJAL", margin, y);
      y += 5.3;
      pdf.setFontSize(9.2);

      // Table header
      pdf.setFillColor(230, 230, 230);
      pdf.rect(margin, y - 4, pageWidth - 2 * margin, 6.5, "F");
      pdf.setTextColor(32, 32, 32);
      pdf.text("Rb.", margin + 2, y);
      pdf.text("Naziv materijala", margin + 14, y);
      pdf.text("Količina", pageWidth - margin - 35, y);
      pdf.text("Jedinica", pageWidth - margin - 10, y);

      y += 6.1;

      pdf.setTextColor(40, 40, 40);
      if (workOrder.materials && workOrder.materials.length > 0) {
        workOrder.materials.forEach((mat, idx) => {
          pdf.text(`${idx + 1}.`, margin + 2, y);
          pdf.text(mat.name, margin + 14, y);
          pdf.text(mat.quantity, pageWidth - margin - 35, y);
          pdf.text(mat.unit, pageWidth - margin - 10, y);
          y += 5;
        });
      } else {
        pdf.text("Nije uneseno.", margin + 2, y);
        y += 5;
      }

      y += 13;

      // POTPISI
      pdf.setFontSize(9.3);
      pdf.text("Potpis tehničara:", margin, y);
      pdf.text("Potpis klijenta:", pageWidth / 2 + 10, y);

      y += 2;
      pdf.line(margin, y + 7, margin + 40, y + 7);
      pdf.line(pageWidth / 2 + 10, y + 7, pageWidth / 2 + 50, y + 7);

      pdf.text(workOrder.technicianName || "", margin, y + 13);
      pdf.text(workOrder.customerSignerName || "", pageWidth / 2 + 10, y + 13);

      // FOOTER
      const drawFooter = () => {
        pdf.setFontSize(7.2);
        pdf.setTextColor(100);
        pdf.text(
          "Centar pametne tehnologije d.o.o. | Kovači 78c 10010 Velika Mlaka | OIB: 75343882245 | pametnatehnologija.hr",
          pageWidth / 2,
          pageHeight - 12,
          { align: "center" }
        );
        pdf.text(
          "Trgovački sud u Zagrebu MBS:081428675 | Direktor: Dario Azinović | Temeljni kapital 20.000 kn uplaćen u cijelosti | HR9224020061101084560 kod Erste&Steiermärkische Bank d.d. Rijeka",
          pageWidth / 2,
          pageHeight - 7,
          { align: "center" }
        );
        pdf.setTextColor(0);
      };

      drawFooter();

      pdf.save(`Radni_nalog_${workOrder.id.replace("/", "-")}.pdf`);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

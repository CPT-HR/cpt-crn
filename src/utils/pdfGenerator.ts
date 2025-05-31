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
      const margin = 17;
      let y = 18;

      // HEADER
      pdf.setFontSize(10);
      pdf.text("Centar pametne tehnologije d.o.o.", margin, y);
      pdf.text("Kovači 78c, Velika Mlaka", margin, y + 5);
      pdf.text("OIB: 75343882245", margin, y + 10);
      pdf.text("info@pametnatehnologija.hr", pageWidth - margin - 60, y);
      pdf.text("+385 1 6525 100", pageWidth - margin - 60, y + 5);

      // Title & Nalog broj
      pdf.setFontSize(15);
      pdf.text("RADNI NALOG", margin, y + 19);
      pdf.setFontSize(10);
      pdf.text(`Broj: ${workOrder.id}`, pageWidth - margin, y + 19, { align: "right" });
      pdf.text(`Datum: ${workOrder.date}`, pageWidth - margin, y + 25, { align: "right" });

      y += 30;

      // NARUČITELJ
      pdf.setFontSize(12);
      pdf.text("PODACI O NARUČITELJU", margin, y);
      y += 6;
      pdf.setFontSize(9);
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
        y += 6;
        pdf.setFontSize(9);
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

      y += 10;
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 4;

      // Osnovni podaci o nalogu
      pdf.setFontSize(10);
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

      y += 10;

      // OPIS KVARA
      pdf.setFontSize(12);
      pdf.text("OPIS KVARA / PROBLEMA", margin, y);
      y += 6;
      pdf.setFontSize(9);
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

      y += 7;

      // ZATEČENO STANJE
      pdf.setFontSize(12);
      pdf.text("ZATEČENO STANJE", margin, y);
      y += 6;
      pdf.setFontSize(9);
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

      y += 7;

      // IZVRŠENI RADOVI
      pdf.setFontSize(12);
      pdf.text("IZVRŠENI RADOVI", margin, y);
      y += 6;
      pdf.setFontSize(9);
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

      y += 7;

      // KOMENTAR TEHNIČARA
      pdf.setFontSize(12);
      pdf.text("KOMENTAR TEHNIČARA", margin, y);
      y += 6;
      pdf.setFontSize(9);
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

      y += 7;

      // UTROŠENI MATERIJAL (TABLICA)
      pdf.setFontSize(12);
      pdf.text("UTROŠENI MATERIJAL", margin, y);
      y += 6;
      pdf.setFontSize(9);

      // Table header
      pdf.setFillColor(220, 220, 220);
      pdf.rect(margin, y - 4, pageWidth - 2 * margin, 7, "F");
      pdf.text("Rb.", margin + 2, y);
      pdf.text("Naziv materijala", margin + 14, y);
      pdf.text("Količina", pageWidth - margin - 35, y);
      pdf.text("Jedinica", pageWidth - margin - 10, y);

      y += 6;

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

      y += 12;

      // POTPISI
      pdf.setFontSize(9);
      pdf.text("Potpis tehničara:", margin, y);
      pdf.text("Potpis klijenta:", pageWidth / 2 + 10, y);

      // Crte za potpise
      y += 2;
      pdf.line(margin, y + 7, margin + 40, y + 7);
      pdf.line(pageWidth / 2 + 10, y + 7, pageWidth / 2 + 50, y + 7);

      // Imena ispod potpisa
      pdf.text(workOrder.technicianName || "", margin, y + 13);
      pdf.text(workOrder.customerSignerName || "", pageWidth / 2 + 10, y + 13);

      // FOOTER
      const drawFooter = () => {
        pdf.setFontSize(7);
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

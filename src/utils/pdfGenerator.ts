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
      const usableHeight = pageHeight - margin - 30;
      let y = margin;

      // Zaglavlje
      function drawHeader() {
        pdf.setFont("Manrope-Regular", "normal");
        pdf.setFontSize(11);
        pdf.text("Centar pametne tehnologije d.o.o.", margin, margin);
        pdf.text("Kovači 78c, Velika Mlaka", margin, margin + 5);
        pdf.text("OIB: 75343882245", margin, margin + 10);
        pdf.text("info@pametnatehnologija.hr", pageWidth - margin - 65, margin);
        pdf.text("+385 1 6525 100", pageWidth - margin - 65, margin + 5);

        pdf.setFontSize(16);
        pdf.text(
          `RADNI NALOG  Broj: ${workOrder.id}`,
          pageWidth / 2,
          margin + 22,
          { align: "center" }
        );
      }
      // Footer
      function drawFooter() {
        pdf.setFont("Manrope-Regular", "normal");
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
      }

      // Provjera prelaska na novu stranicu
      function maybeAddPage(nextBlockHeight: number) {
        if (y + nextBlockHeight > usableHeight) {
          drawFooter();
          pdf.addPage();
          drawHeader();
          y = margin + 30;
        }
      }

      // Početak dokumenta
      drawHeader();
      y += 35;

      // PODACI O NARUČITELJU I KORISNIKU
      pdf.setFontSize(12);
      pdf.setTextColor(32, 32, 32);
      pdf.text("PODACI O NARUČITELJU", margin, y);
      if (workOrder.orderForCustomer) {
        pdf.text("PODACI O KORISNIKU", pageWidth / 2 + 2, y);
      }
      y += 5.5;
      pdf.setFontSize(9.3);

      let yL = y, yR = y;
      const colL = margin;
      const colR = pageWidth / 2 + 2;
      pdf.text(`Ime tvrtke: ${workOrder.clientCompanyName}`, colL, yL);
      if (workOrder.orderForCustomer) pdf.text(`Ime tvrtke: ${workOrder.customerCompanyName}`, colR, yR);
      yL += 5; yR += 5;
      pdf.text(`Adresa: ${workOrder.clientCompanyAddress}`, colL, yL);
      if (workOrder.orderForCustomer) pdf.text(`Adresa: ${workOrder.customerCompanyAddress}`, colR, yR);
      yL += 5; yR += 5;
      pdf.text(`OIB: ${workOrder.clientOib}`, colL, yL);
      if (workOrder.orderForCustomer) pdf.text(`OIB: ${workOrder.customerOib}`, colR, yR);
      yL += 5; yR += 5;
      pdf.text(`Ime i prezime: ${workOrder.clientFirstName} ${workOrder.clientLastName}`, colL, yL);
      if (workOrder.orderForCustomer) pdf.text(`Ime i prezime: ${workOrder.customerFirstName} ${workOrder.customerLastName}`, colR, yR);
      yL += 5; yR += 5;
      pdf.text(`Mobitel: ${workOrder.clientMobile}`, colL, yL);
      if (workOrder.orderForCustomer) pdf.text(`Mobitel: ${workOrder.customerMobile}`, colR, yR);
      yL += 5; yR += 5;
      pdf.text(`Email: ${workOrder.clientEmail}`, colL, yL);
      if (workOrder.orderForCustomer) pdf.text(`Email: ${workOrder.customerEmail}`, colR, yR);

      y = Math.max(yL, yR) + 10;

      pdf.setLineWidth(0.35);
      pdf.setDrawColor(120, 120, 120);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 4;

      // Osnovni podaci o nalogu -- DATUM INLINE
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);

      maybeAddPage(12);
      let datumTekst = `Datum: ${workOrder.date}   |   Vrijeme dolaska: ${workOrder.arrivalTime}   |   Vrijeme završetka: ${workOrder.completionTime}   |   Obračunsko vrijeme: ${workOrder.calculatedHours}`;
      pdf.text(datumTekst, margin, y);
      y += 6;
      pdf.text(
        `Izlazak na teren: ${workOrder.fieldTrip ? "DA" : "NE"}   |   Prijeđena udaljenost: ${workOrder.distance ? workOrder.distance + " km" : "-"}`,
        margin,
        y
      );
      pdf.setTextColor(32, 32, 32);

      y += 11;

      // Sekcije: (provjera mjesta za svaku)
      function section(title: string, arr: WorkItem[], blockMinHeight = 13) {
        let est = blockMinHeight + arr.length * 6;
        maybeAddPage(est);
        pdf.setFontSize(12);
        pdf.text(title, margin, y);
        y += 5.3;
        pdf.setFontSize(9.2);
        if (arr.length > 0 && arr.some(x => x.text.trim())) {
          arr.forEach((item, idx) => {
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
      }

      // OPIS KVARA / ZATEČENO STANJE / IZVRŠENI RADOVI / KOMENTAR TEHNIČARA / UTROŠENI MATERIJAL
      section("OPIS KVARA / PROBLEMA", workOrder.description);
      section("ZATEČENO STANJE", workOrder.foundCondition);
      section("IZVRŠENI RADOVI", workOrder.performedWork);
      section("KOMENTAR TEHNIČARA", workOrder.technicianComment);

      // UTROŠENI MATERIJAL (provjera mjesta)
      let matBlockHeight = 16 + workOrder.materials.length * 6;
      maybeAddPage(matBlockHeight);
      pdf.setFontSize(12);
      pdf.text("UTROŠENI MATERIJAL", margin, y);
      y += 5.3;
      pdf.setFontSize(9.2);
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
          maybeAddPage(7);
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

      // POTPISI - SLIKE, IMENA I METAPODACI
      maybeAddPage(38);
      pdf.setFontSize(9.3);
      pdf.text("Potpis tehničara:", margin, y);
      pdf.text("Potpis klijenta:", pageWidth / 2 + 10, y);

      // Prikaz bitmap potpisa, ime ispod slike
      const drawSignature = (
        imgSrc: string,
        x: number,
        y: number,
        name: string,
        meta: boolean,
        metadata?: WorkOrder["signatureMetadata"],
        cb?: () => void
      ) => {
        if (!imgSrc) {
          if (cb) cb();
          return;
        }
        const img = new Image();
        img.src = imgSrc;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imgData = canvas.toDataURL("image/png");
            pdf.addImage(imgData, "PNG", x, y + 3, 40, 18);
          }
          pdf.text(name || "", x, y + 25);

          // Metapodaci (SAMO ako meta==true, tj. SAMO ispod klijenta)
          if (meta && metadata) {
            pdf.setFontSize(7.2);
            let metaY = y + 29;
            if (metadata.timestamp) {
              pdf.text(`Datum i vrijeme: ${metadata.timestamp}`, x, metaY);
              metaY += 3;
            }
            if (metadata.coordinates) {
              pdf.text(
                `Koordinate: ${metadata.coordinates.latitude?.toFixed(6)}, ${metadata.coordinates.longitude?.toFixed(6)}`,
                x,
                metaY
              );
              metaY += 3;
            }
            if (metadata.address) {
              const addressLines = pdf.splitTextToSize(`Adresa: ${metadata.address}`, 40);
              pdf.text(addressLines, x, metaY);
            }
            pdf.setFontSize(9.3);
          }
          if (cb) cb();
        };
        img.onerror = () => {
          pdf.text(name || "", x, y + 25);
          if (cb) cb();
        };
      };

      let signaturesDone = 0;
      const tryFinish = () => {
        signaturesDone++;
        if (signaturesDone === 2) {
          drawFooter();
          pdf.save(`Radni_nalog_${workOrder.id.replace("/", "-")}.pdf`);
          resolve();
        }
      };

      drawSignature(
        workOrder.technicianSignature,
        margin,
        y,
        workOrder.technicianName,
        false,
        undefined,
        tryFinish
      );
      drawSignature(
        workOrder.customerSignature,
        pageWidth / 2 + 10,
        y,
        workOrder.customerSignerName,
        true,
        workOrder.signatureMetadata,
        tryFinish
      );
    } catch (error) {
      reject(error);
    }
  });
};

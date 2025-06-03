import { jsPDF } from "jspdf";
import "../../src/fonts/Manrope-Regular-normal.js";
import { WorkOrder, Material, WorkItem } from '@/types/workOrder';

export const generatePDF = async (workOrder: WorkOrder): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.setFont("Manrope-Regular", "normal");
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 18;
      const footerMargin = 15; // minimalna zona za pisače
      const usableHeight = pageHeight - margin - footerMargin - 5;
      let y = margin;
      let pageNumber = 1;
      let totalPages = 1;

      function drawFirstHeader() {
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
          margin + 32,
          { align: "center" }
        );
      }

      function drawSmallHeader() {
        pdf.setFontSize(8.7);
        pdf.text(
          `RADNI NALOG Broj: ${workOrder.id}`,
          pageWidth - margin,
          margin + 2,
          { align: "right" }
        );
      }

      function drawFooter(currPage: number, allPages: number) {
        pdf.setFont("Manrope-Regular", "normal");
        pdf.setFontSize(6.1);
        pdf.setTextColor(100);

        const line1 = "Centar pametne tehnologije d.o.o. | Kovači 78c 10010 Velika Mlaka | OIB: 75343882245 | pametnatehnologija.hr";
        const line2 = "Trgovački sud u Zagrebu MBS:081428675 | Direktor: Dario Azinović | Temeljni kapital 20.000 kn uplaćen u cijelosti | HR9224020061101084560 kod Erste&Steiermärkische Bank d.d. Rijeka";

        const yFooter1 = pageHeight - footerMargin;
        const yFooter2 = pageHeight - footerMargin + 3.5;
        const yFooterPage = pageHeight - 5.3;

        pdf.text(line1, pageWidth / 2, yFooter1, { align: "center" });
        pdf.text(line2, pageWidth / 2, yFooter2, { align: "center" });
        pdf.text(
          `Stranica ${currPage}/${allPages}`,
          pageWidth - margin,
          yFooterPage,
          { align: "right" }
        );
        pdf.setTextColor(0);
      }

      function maybeAddPage(nextBlockHeight: number, headerFnc?: () => void) {
        if (y + nextBlockHeight > usableHeight) {
          pdf.addPage();
          y = margin + 24;
          pageNumber++;
          headerFnc ? headerFnc() : drawSmallHeader();
        }
      }

      // Start
      drawFirstHeader();
      y += 46;

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

      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);

      maybeAddPage(12, drawSmallHeader);
      let datumTekst = `Datum: ${workOrder.date}   |   Vrijeme dolaska: ${workOrder.arrivalTime}   |   Vrijeme završetka: ${workOrder.completionTime}   |   Obračunsko vrijeme: ${workOrder.calculatedHours}`;
      pdf.text(datumTekst, margin, y);
      y += 6;
      pdf.text(
        `Izlazak na teren: ${workOrder.fieldTrip ? "DA" : "NE"}   |   Udaljenost: ${workOrder.distance ? workOrder.distance + " km" : "-"}`,
        margin,
        y
      );
      pdf.setTextColor(32, 32, 32);

      y += 11;

      function section(title: string, arr: WorkItem[], blockMinHeight = 13) {
        let est = blockMinHeight + arr.length * 6;
        maybeAddPage(est, drawSmallHeader);
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

      section("OPIS KVARA / PROBLEMA", workOrder.description);
      section("ZATEČENO STANJE", workOrder.foundCondition);
      section("IZVRŠENI RADOVI", workOrder.performedWork);
      section("KOMENTAR TEHNIČARA", workOrder.technicianComment);

      let matBlockHeight = 16 + workOrder.materials.length * 6;
      maybeAddPage(matBlockHeight, drawSmallHeader);
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
          maybeAddPage(7, drawSmallHeader);
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

      maybeAddPage(38, drawSmallHeader);
      pdf.setFontSize(9.3);
      pdf.text("Potpis tehničara:", margin, y);
      pdf.text("Potpis klijenta:", pageWidth / 2 + 10, y);

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
          if (meta && metadata) {
            pdf.setFontSize(6.1);
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
          totalPages = (pdf as any).internal.getNumberOfPages();
          for (let p = 1; p <= totalPages; p++) {
            pdf.setPage(p);
            drawFooter(p, totalPages);
            if (p > 1) {
              drawSmallHeader();
            }
          }
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

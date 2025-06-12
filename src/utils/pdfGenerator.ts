
import { jsPDF } from "jspdf";
import "../../src/fonts/Manrope-Regular-normal.js";
import { WorkOrder, Material, WorkItem } from '@/types/workOrder';
import { formatTimeToHHMM } from './workOrderParsers';

export const generatePDF = async (workOrder: WorkOrder): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Enable compression for smaller file size
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm", 
        format: "a4",
        compress: true
      });
      
      pdf.setFont("Manrope-Regular", "normal");
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15; // Reduced from 18
      const footerMargin = 15;
      const usableHeight = pageHeight - margin - footerMargin - 5;
      let y = margin;
      let pageNumber = 1;
      let totalPages = 1;

      // Helper function to calculate text height including line wrapping
      function getTextHeight(text: string, fontSize: number, maxWidth: number): number {
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, maxWidth);
        return lines.length * (fontSize * 0.352778); // Convert pt to mm
      }

      // Helper function to calculate section height
      function calculateSectionHeight(title: string, items: WorkItem[], includeTable = false): number {
        let height = 0;
        
        // Title height
        height += getTextHeight(title, 12, pageWidth - 2 * margin) + 3; // Reduced spacing
        
        if (includeTable) {
          // Table header
          height += 6;
          // Table rows
          height += Math.max(1, items.length) * 4; // Reduced row height
          height += 8; // Bottom spacing
        } else {
          // Regular items
          if (items.length > 0 && items.some(x => x.text.trim())) {
            items.forEach(item => {
              if (item.text.trim()) {
                const itemText = `${items.indexOf(item) + 1}. ${item.text}`;
                height += getTextHeight(itemText, 9.2, pageWidth - 2 * margin - 5) + 1; // Reduced spacing
              }
            });
          } else {
            height += getTextHeight("Nije uneseno.", 9.2, pageWidth - 2 * margin) + 1;
          }
          height += 4; // Bottom spacing - reduced from 7.3
        }
        
        return height;
      }

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
          margin + 25, // Reduced from 32
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

      function smartPageBreak(nextBlockHeight: number, headerFnc?: () => void) {
        if (y + nextBlockHeight > usableHeight) {
          pdf.addPage();
          y = margin + (headerFnc === drawSmallHeader ? 20 : 24); // Reduced header space
          pageNumber++;
          headerFnc ? headerFnc() : drawSmallHeader();
        }
      }

      // Start
      drawFirstHeader();
      y += 35; // Reduced from 46

      // Client/Customer info section
      const clientInfoHeight = calculateClientInfoHeight();
      smartPageBreak(clientInfoHeight, drawSmallHeader);
      
      pdf.setFontSize(12);
      pdf.setTextColor(32, 32, 32);
      pdf.text("PODACI O NARUČITELJU", margin, y);
      if (workOrder.orderForCustomer) {
        pdf.text("PODACI O KORISNIKU", pageWidth / 2 + 2, y);
      }
      y += 4; // Reduced spacing
      pdf.setFontSize(9.3);

      let yL = y, yR = y;
      const colL = margin;
      const colR = pageWidth / 2 + 2;
      
      pdf.text(`Ime tvrtke: ${workOrder.clientCompanyName}`, colL, yL);
      if (workOrder.orderForCustomer) pdf.text(`Ime tvrtke: ${workOrder.customerCompanyName}`, colR, yR);
      yL += 4; yR += 4; // Reduced from 5
      pdf.text(`Adresa: ${workOrder.clientCompanyAddress}`, colL, yL);
      if (workOrder.orderForCustomer) pdf.text(`Adresa: ${workOrder.customerCompanyAddress}`, colR, yR);
      yL += 4; yR += 4;
      pdf.text(`OIB: ${workOrder.clientOib}`, colL, yL);
      if (workOrder.orderForCustomer) pdf.text(`OIB: ${workOrder.customerOib}`, colR, yR);
      yL += 4; yR += 4;
      pdf.text(`Ime i prezime: ${workOrder.clientFirstName} ${workOrder.clientLastName}`, colL, yL);
      if (workOrder.orderForCustomer) pdf.text(`Ime i prezime: ${workOrder.customerFirstName} ${workOrder.customerLastName}`, colR, yR);
      yL += 4; yR += 4;
      pdf.text(`Mobitel: ${workOrder.clientMobile}`, colL, yL);
      if (workOrder.orderForCustomer) pdf.text(`Mobitel: ${workOrder.customerMobile}`, colR, yR);
      yL += 4; yR += 4;
      pdf.text(`Email: ${workOrder.clientEmail}`, colL, yL);
      if (workOrder.orderForCustomer) pdf.text(`Email: ${workOrder.customerEmail}`, colR, yR);

      y = Math.max(yL, yR) + 6; // Reduced from 10

      pdf.setLineWidth(0.35);
      pdf.setDrawColor(120, 120, 120);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 3; // Reduced from 4

      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);

      const dateTimeHeight = 12;
      smartPageBreak(dateTimeHeight, drawSmallHeader);
      
      const formattedArrivalTime = formatTimeToHHMM(workOrder.arrivalTime);
      const formattedCompletionTime = formatTimeToHHMM(workOrder.completionTime);
      let datumTekst = `Datum: ${workOrder.date}   |   Vrijeme dolaska: ${formattedArrivalTime}   |   Vrijeme završetka: ${formattedCompletionTime}   |   Obračunsko vrijeme: ${workOrder.calculatedHours}`;
      pdf.text(datumTekst, margin, y);
      y += 5; // Reduced from 6
      pdf.text(
        `Izlazak na teren: ${workOrder.fieldTrip ? "DA" : "NE"}   |   Udaljenost: ${workOrder.distance ? workOrder.distance + " km" : "-"}`,
        margin,
        y
      );
      pdf.setTextColor(32, 32, 32);

      y += 8; // Reduced from 11

      function calculateClientInfoHeight(): number {
        let height = 12; // Title
        height += 6 * 4; // 6 lines with reduced spacing
        height += 6; // Bottom margin
        height += 3; // Line
        height += 12; // Date/time section
        return height;
      }

      function section(title: string, arr: WorkItem[], blockMinHeight = 10) {
        const sectionHeight = calculateSectionHeight(title, arr);
        smartPageBreak(sectionHeight, drawSmallHeader);
        
        pdf.setFontSize(12);
        pdf.text(title, margin, y);
        y += 4; // Reduced spacing
        pdf.setFontSize(9.2);
        
        if (arr.length > 0 && arr.some(x => x.text.trim())) {
          arr.forEach((item, idx) => {
            if (item.text.trim()) {
              const itemText = `${idx + 1}. ${item.text}`;
              const lines = pdf.splitTextToSize(itemText, pageWidth - 2 * margin - 5);
              
              // Check if we need a page break for this item
              const itemHeight = lines.length * 3.5;
              smartPageBreak(itemHeight + 2, drawSmallHeader);
              
              pdf.text(lines, margin, y);
              y += itemHeight;
            }
          });
        } else {
          pdf.text("Nije uneseno.", margin, y);
          y += 3.5;
        }
        y += 4; // Reduced bottom spacing
      }

      section("OPIS KVARA / PROBLEMA", workOrder.description);
      section("ZATEČENO STANJE", workOrder.foundCondition);
      section("IZVRŠENI RADOVI", workOrder.performedWork);
      section("KOMENTAR TEHNIČARA", workOrder.technicianComment);

      // Materials section with optimized table
      let matBlockHeight = calculateSectionHeight("UTROŠENI MATERIJAL", [], true);
      if (workOrder.materials && workOrder.materials.length > 0) {
        matBlockHeight += workOrder.materials.length * 4;
      }
      
      smartPageBreak(matBlockHeight, drawSmallHeader);
      pdf.setFontSize(12);
      pdf.text("UTROŠENI MATERIJAL", margin, y);
      y += 4;
      pdf.setFontSize(9.2);
      pdf.setFillColor(230, 230, 230);
      pdf.rect(margin, y - 3, pageWidth - 2 * margin, 5.5, "F"); // Reduced table header height
      pdf.setTextColor(32, 32, 32);
      pdf.text("Rb.", margin + 2, y);
      pdf.text("Naziv materijala", margin + 14, y);
      pdf.text("Količina", pageWidth - margin - 35, y);
      pdf.text("Jedinica", pageWidth - margin - 10, y);
      y += 5; // Reduced from 6.1
      pdf.setTextColor(40, 40, 40);
      
      if (workOrder.materials && workOrder.materials.length > 0) {
        workOrder.materials.forEach((mat, idx) => {
          smartPageBreak(5, drawSmallHeader);
          pdf.text(`${idx + 1}.`, margin + 2, y);
          
          // Handle long material names with text wrapping
          const materialName = mat.name;
          const maxNameWidth = pageWidth - margin - 65;
          const nameLines = pdf.splitTextToSize(materialName, maxNameWidth);
          pdf.text(nameLines, margin + 14, y);
          
          pdf.text(mat.quantity, pageWidth - margin - 35, y);
          pdf.text(mat.unit, pageWidth - margin - 10, y);
          y += Math.max(4, nameLines.length * 3.5); // Dynamic height based on text wrapping
        });
      } else {
        pdf.text("Nije uneseno.", margin + 2, y);
        y += 4;
      }
      y += 8; // Reduced from 13

      // Signatures section with compression
      const signatureHeight = 20; // Reduced from 38
      smartPageBreak(signatureHeight, drawSmallHeader);
      
      pdf.setFontSize(9.3);
      pdf.text("Potpis tehničara:", margin, y);
      pdf.text("Potpis klijenta:", pageWidth / 2 + 10, y);

      const compressSignature = (imgSrc: string): Promise<string> => {
        return new Promise((resolve) => {
          if (!imgSrc) {
            resolve('');
            return;
          }
          
          const img = new Image();
          img.src = imgSrc;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            
            // Limit maximum dimensions for compression
            const maxWidth = 300;
            const maxHeight = 150;
            
            let { width, height } = img;
            
            // Scale down if too large
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width *= ratio;
              height *= ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext("2d");
            if (ctx) {
              // Fill with white background
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              
              // Convert to JPEG with compression
              const compressedData = canvas.toDataURL("image/jpeg", 0.7);
              resolve(compressedData);
            } else {
              resolve(imgSrc);
            }
          };
          img.onerror = () => resolve(imgSrc);
        });
      };

      const drawSignature = async (
        imgSrc: string,
        x: number,
        y: number,
        name: string,
        meta: boolean,
        metadata?: WorkOrder["signatureMetadata"]
      ): Promise<void> => {
        if (!imgSrc) return;
        
        try {
          const compressedSrc = await compressSignature(imgSrc);
          if (compressedSrc) {
            // Reduced signature dimensions
            pdf.addImage(compressedSrc, "JPEG", x, y + 2, 35, 12); // Reduced from 40x18
          }
        } catch (error) {
          console.error('Error adding signature:', error);
        }
        
        pdf.text(name || "", x, y + 17); // Adjusted position
        
        if (meta && metadata) {
          pdf.setFontSize(6.1);
          let metaY = y + 20;
          if (metadata.timestamp) {
            pdf.text(`Datum i vrijeme: ${metadata.timestamp}`, x, metaY);
            metaY += 2.5;
          }
          if (metadata.coordinates) {
            pdf.text(
              `Koordinate: ${metadata.coordinates.latitude?.toFixed(6)}, ${metadata.coordinates.longitude?.toFixed(6)}`,
              x,
              metaY
            );
            metaY += 2.5;
          }
          if (metadata.address) {
            const addressLines = pdf.splitTextToSize(`Adresa: ${metadata.address}`, 35);
            pdf.text(addressLines, x, metaY);
          }
          pdf.setFontSize(9.3);
        }
      };

      // Draw signatures with compression
      await Promise.all([
        drawSignature(
          workOrder.technicianSignature,
          margin,
          y,
          workOrder.technicianName,
          false,
          undefined
        ),
        drawSignature(
          workOrder.customerSignature,
          pageWidth / 2 + 10,
          y,
          workOrder.customerSignerName,
          true,
          workOrder.signatureMetadata
        )
      ]);

      // Add footers to all pages
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
      
    } catch (error) {
      reject(error);
    }
  });
};

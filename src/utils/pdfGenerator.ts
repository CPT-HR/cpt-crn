import { jsPDF } from "jspdf";
import "../../src/fonts/Manrope-Regular-normal.js";
import { WorkOrder, Material, WorkItem } from '@/types/workOrder';
import { formatTimeToHHMM } from './workOrderParsers';

export const generatePDF = async (workOrder: WorkOrder): Promise<void> => {
  return new Promise(async (resolve, reject) => {
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
      const margin = 15;
      // Fixed: Much more space available - footer only needs ~12mm
      const usableHeight = pageHeight - margin - 12;
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
        
        // Title height with spacing above and below
        height += getTextHeight(title, 12, pageWidth - 2 * margin) + 6; // 4mm above + 2mm below title (reduced from 8)
        
        if (includeTable) {
          // Table header
          height += 6;
          // Table rows - more accurate calculation
          const materialCount = Math.max(1, items.length);
          height += materialCount * 4;
          height += 8; // Bottom spacing between sections - increased from 4
        } else {
          // Regular items
          if (items.length > 0 && items.some(x => x.text.trim())) {
            items.forEach(item => {
              if (item.text.trim()) {
                height += getTextHeight(item.text, 9.2, pageWidth - 2 * margin - 5) + 1;
              }
            });
          } else {
            height += getTextHeight("Nije uneseno.", 9.2, pageWidth - 2 * margin) + 1;
          }
          height += 8; // Bottom spacing between sections - increased from 4
        }
        
        return height;
      }

      // Special function to calculate materials table height more accurately
      function calculateMaterialsTableHeight(materials: Material[]): number {
        let height = 0;
        
        // Title with spacing
        height += getTextHeight("UTROŠENI MATERIJAL", 12, pageWidth - 2 * margin) + 6; // reduced from 8
        
        // Table header
        height += 6;
        
        // Table rows - account for text wrapping in material names
        if (materials && materials.length > 0) {
          materials.forEach(material => {
            const nameHeight = getTextHeight(material.name, 9.2, pageWidth - margin - 65);
            height += Math.max(4, nameHeight + 1);
          });
        } else {
          height += 4; // "Nije uneseno" row
        }
        
        height += 8; // Bottom spacing between sections - increased from 4
        return height;
      }

      // Helper function to check if section has content
      function hasContent(items: WorkItem[]): boolean {
        return items.length > 0 && items.some(item => item.text.trim().length > 0);
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
          margin + 25,
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

        const yFooter1 = pageHeight - 10;
        const yFooter2 = pageHeight - 6.5;
        const yFooterPage = pageHeight - 3.5;

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
        // Reduced buffer for more accurate page breaks
        const buffer = 2; // Reduced from 5mm
        if (y + nextBlockHeight + buffer > usableHeight) {
          pdf.addPage();
          y = margin + (headerFnc === drawSmallHeader ? 20 : 24);
          pageNumber++;
          headerFnc ? headerFnc() : drawSmallHeader();
        }
      }

      // Start
      drawFirstHeader();
      y += 35;

      // Client/Customer info section
      const clientInfoHeight = calculateClientInfoHeight();
      smartPageBreak(clientInfoHeight, drawSmallHeader);
      
      pdf.setFontSize(12);
      pdf.setTextColor(32, 32, 32);
      pdf.text("PODACI O NARUČITELJU", margin, y);
      if (workOrder.orderForCustomer) {
        pdf.text("PODACI O KORISNIKU", pageWidth / 2 + 2, y);
      }
      y += 8;
      pdf.setFontSize(9.3);

      let yL = y, yR = y;
      const colL = margin;
      const colR = pageWidth / 2 + 2;
      
      pdf.text(`Ime tvrtke: ${workOrder.clientCompanyName}`, colL, yL);
      if (workOrder.orderForCustomer) pdf.text(`Ime tvrtke: ${workOrder.customerCompanyName}`, colR, yR);
      yL += 4; yR += 4;
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

      y = Math.max(yL, yR) + 6;

      pdf.setLineWidth(0.35);
      pdf.setDrawColor(120, 120, 120);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 3;

      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);

      const dateTimeHeight = 13;
      smartPageBreak(dateTimeHeight, drawSmallHeader);
      
      const formattedArrivalTime = formatTimeToHHMM(workOrder.arrivalTime);
      const formattedCompletionTime = formatTimeToHHMM(workOrder.completionTime);
      let datumTekst = `Datum: ${workOrder.date}   |   Vrijeme dolaska: ${formattedArrivalTime}   |   Vrijeme završetka: ${formattedCompletionTime}   |   Obračunsko vrijeme: ${workOrder.calculatedHours}`;
      pdf.text(datumTekst, margin, y);
      y += 5;
      pdf.text(
        `Izlazak na teren: ${workOrder.fieldTrip ? "DA" : "NE"}   |   Udaljenost: ${workOrder.distance ? workOrder.distance + " km" : "-"}`,
        margin,
        y
      );
      
      // Add separator line below date/time section
      y += 3;
      pdf.setLineWidth(0.35);
      pdf.setDrawColor(120, 120, 120);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 3;
      
      pdf.setTextColor(32, 32, 32);

      y += 8;

      function calculateClientInfoHeight(): number {
        let height = 16;
        height += 6 * 4;
        height += 6;
        height += 3;
        height += 13;
        return height;
      }

      function section(title: string, arr: WorkItem[], blockMinHeight = 10) {
        const sectionHeight = calculateSectionHeight(title, arr);
        smartPageBreak(sectionHeight, drawSmallHeader);
        
        pdf.setFontSize(12);
        pdf.text(title, margin, y);
        y += 6; // Reduced from 8 to 6
        pdf.setFontSize(9.2);
        
        if (arr.length > 0 && arr.some(x => x.text.trim())) {
          arr.forEach((item, idx) => {
            if (item.text.trim()) {
              const itemText = item.text;
              const lines = pdf.splitTextToSize(itemText, pageWidth - 2 * margin - 5);
              
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
        y += 8; // Bottom spacing between sections - increased from 4
      }

      // Mandatory sections - always display
      section("OPIS KVARA / PROBLEMA", workOrder.description);
      
      // Conditional sections - only display if they have content
      if (hasContent(workOrder.foundCondition)) {
        section("ZATEČENO STANJE", workOrder.foundCondition);
      }
      
      section("IZVRŠENI RADOVI", workOrder.performedWork);
      
      if (hasContent(workOrder.technicianComment)) {
        section("KOMENTAR TEHNIČARA", workOrder.technicianComment);
      }

      // Materials section with better height calculation
      const matBlockHeight = calculateMaterialsTableHeight(workOrder.materials || []);
      
      smartPageBreak(matBlockHeight, drawSmallHeader);
      pdf.setFontSize(12);
      pdf.text("UTROŠENI MATERIJAL", margin, y);
      y += 6; // Reduced from 8 to 6
      pdf.setFontSize(9.2);
      pdf.setFillColor(230, 230, 230);
      pdf.rect(margin, y - 3, pageWidth - 2 * margin, 5.5, "F");
      pdf.setTextColor(32, 32, 32);
      pdf.text("Rb.", margin + 2, y);
      pdf.text("Naziv materijala", margin + 14, y);
      pdf.text("Količina", pageWidth - margin - 35, y);
      pdf.text("Jedinica", pageWidth - margin - 10, y);
      y += 5;
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
          y += Math.max(4, nameLines.length * 3.5);
        });
      } else {
        pdf.text("Nije uneseno.", margin + 2, y);
        y += 4;
      }
      y += 8; // Bottom spacing between sections - increased from 4

      // Signatures section with compression
      const signatureHeight = 20;
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
            pdf.addImage(compressedSrc, "JPEG", x, y + 2, 35, 12);
          }
        } catch (error) {
          console.error('Error adding signature:', error);
        }
        
        pdf.text(name || "", x, y + 17);
        
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

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

      // Header
      pdf.setFontSize(18);
      pdf.text("RADNI NALOG", 105, 18, { align: "center" });
      pdf.setFontSize(12);
      pdf.text(`Broj: ${workOrder.id}`, 105, 26, { align: "center" });
      pdf.text(`Datum: ${workOrder.date}`, 105, 33, { align: "center" });

      // Podaci o naručitelju i korisniku (side-by-side)
      const clientRows = [
        ["Ime tvrtke:", workOrder.clientCompanyName],
        ["Adresa tvrtke:", workOrder.clientCompanyAddress],
        ["OIB:", workOrder.clientOib],
        ["Ime i prezime:", `${workOrder.clientFirstName} ${workOrder.clientLastName}`],
        ["Mobitel:", workOrder.clientMobile],
        ["Email:", workOrder.clientEmail]
      ];
      const customerRows = workOrder.orderForCustomer
        ? [
            ["Ime tvrtke:", workOrder.customerCompanyName],
            ["Adresa tvrtke:", workOrder.customerCompanyAddress],
            ["OIB:", workOrder.customerOib],
            ["Ime i prezime:", `${workOrder.customerFirstName} ${workOrder.customerLastName}`],
            ["Mobitel:", workOrder.customerMobile],
            ["Email:", workOrder.customerEmail]
          ]
        : [["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""]];

      autoTable(pdf, {
        startY: 40,
        styles: { font: "Manrope-Regular", fontSize: 9, cellPadding: 1.2 },
        headStyles: { fillColor: [240,240,240], textColor: 10, fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 44 },
          2: { cellWidth: 40 },
          3: { cellWidth: 44 },
        },
        head: [
          ["PODACI O NARUČITELJU", "", "PODACI O KORISNIKU", ""]
        ],
        body: clientRows.map((row, i) => [
          row[0], row[1],
          customerRows[i][0], customerRows[i][1]
        ])
      });

      let yOffset = (pdf as any).lastAutoTable.finalY + 5;

      // Helper section printer
      const addSection = (title: string, items: WorkItem[]) => {
        pdf.setFontSize(11);
        pdf.text(title, 20, yOffset);
        yOffset += 6;
        pdf.setFontSize(10);
        const filtered = items.filter(item => item.text.trim());
        if (filtered.length > 0) {
          filtered.forEach(item => {
            const lines = pdf.splitTextToSize(`• ${item.text}`, 170);
            pdf.text(lines, 20, yOffset);
            yOffset += lines.length * 5.4;
          });
        } else {
          pdf.text("• (nije uneseno)", 20, yOffset);
          yOffset += 5.4;
        }
        yOffset += 3;
      };

      addSection("OPIS KVARA/PROBLEMA:", workOrder.description);
      addSection("ZATEČENO STANJE:", workOrder.foundCondition);
      addSection("IZVRŠENI RADOVI:", workOrder.performedWork);
      if (workOrder.technicianComment?.some(item => item.text.trim())) {
        addSection("KOMENTAR TEHNIČARA:", workOrder.technicianComment);
      }

      // UTROŠENI MATERIJAL (bez tablice, kao lista)
      pdf.setFontSize(11);
      pdf.text("UTROŠENI MATERIJAL:", 20, yOffset);
      yOffset += 6;
      pdf.setFontSize(10);
      if (workOrder.materials && workOrder.materials.length > 0) {
        workOrder.materials.forEach((mat, i) => {
          const text = `${i + 1}. ${mat.name} – ${mat.quantity} ${mat.unit}`;
          pdf.text(text, 25, yOffset);
          yOffset += 5.4;
        });
      } else {
        pdf.text("• (nije uneseno)", 25, yOffset);
        yOffset += 5.4;
      }
      yOffset += 6;

      // VRIJEME
      pdf.setFontSize(11);
      pdf.text("VRIJEME:", 20, yOffset);
      yOffset += 6;
      pdf.setFontSize(10);
      pdf.text(`Datum: ${workOrder.date}`, 22, yOffset);
      yOffset += 5;
      pdf.text(`Vrijeme dolaska: ${workOrder.arrivalTime}`, 22, yOffset);
      yOffset += 5;
      pdf.text(`Vrijeme završetka: ${workOrder.completionTime}`, 22, yOffset);
      yOffset += 5;
      pdf.text(`Obračunsko vrijeme: ${workOrder.calculatedHours}`, 22, yOffset);
      yOffset += 8;

      // PUT
      pdf.setFontSize(11);
      pdf.text("PUT:", 20, yOffset);
      yOffset += 6;
      pdf.setFontSize(10);
      pdf.text(`Izlazak na teren: ${workOrder.fieldTrip ? "DA" : "NE"}`, 22, yOffset);
      yOffset += 5;
      if (workOrder.fieldTrip) {
        pdf.text(`Prijeđena udaljenost: ${workOrder.distance} km`, 22, yOffset);
        yOffset += 5;
      }
      yOffset += 8;

      // POTPISI (samo oznake)
      pdf.setFontSize(11);
      pdf.text("POTPISI:", 20, yOffset);
      yOffset += 6;
      pdf.setFontSize(10);
      pdf.text("Potpis tehničara:", 20, yOffset);
      pdf.text("Potpis klijenta:", 110, yOffset);

      // (Potpisi - slike i metapodaci)
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
            const imgData = canvas.toDataURL("image/png");
            pdf.addImage(imgData, "PNG", 20, yOffset + 2, 40, 20);
            pdf.text(workOrder.technicianName, 20, yOffset + 27);

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
                  const custImgData = custCanvas.toDataURL("image/png");
                  pdf.addImage(custImgData, "PNG", 110, yOffset + 2, 40, 20);
                  pdf.text(workOrder.customerSignerName, 110, yOffset + 27);

                  if (workOrder.signatureMetadata) {
                    pdf.setFontSize(6);
                    let metaY = yOffset + 32;
                    pdf.text(`Datum i vrijeme: ${workOrder.signatureMetadata.timestamp || ""}`, 110, metaY);
                    metaY += 3;
                    if (workOrder.signatureMetadata.coordinates) {
                      const { latitude, longitude } = workOrder.signatureMetadata.coordinates;
                      pdf.text(`Koordinate: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, 110, metaY);
                      metaY += 3;
                    }
                    if (workOrder.signatureMetadata.address) {
                      const addressLines = pdf.splitTextToSize(`Adresa: ${workOrder.signatureMetadata.address}`, 80);
                      pdf.text(addressLines, 110, metaY);
                    }
                    pdf.setFontSize(10);
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

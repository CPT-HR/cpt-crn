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

      pdf.setFontSize(18);
      pdf.text("RADNI NALOG", 105, 20, { align: "center" });
      pdf.setFontSize(12);
      pdf.text(`Broj: ${workOrder.id}`, 105, 27, { align: "center" });
      pdf.text(`Datum: ${workOrder.date}`, 105, 32, { align: "center" });

      pdf.setFontSize(11);
      pdf.text("PODACI O NARUČITELJU:", 20, 45);
      pdf.setFontSize(10);
      pdf.text(`Ime tvrtke: ${workOrder.clientCompanyName}`, 20, 52);
      pdf.text(`Adresa tvrtke: ${workOrder.clientCompanyAddress}`, 20, 59);
      pdf.text(`OIB: ${workOrder.clientOib}`, 20, 66);
      pdf.text(
        `Ime i prezime: ${workOrder.clientFirstName} ${workOrder.clientLastName}`,
        20,
        73
      );
      pdf.text(`Mobitel: ${workOrder.clientMobile}`, 20, 80);
      pdf.text(`Email: ${workOrder.clientEmail}`, 20, 87);

      let yOffset = 95;
      if (workOrder.orderForCustomer) {
        pdf.setFontSize(11);
        pdf.text("PODACI O KORISNIKU:", 20, yOffset);
        pdf.setFontSize(10);
        yOffset += 7;
        pdf.text(`Ime tvrtke: ${workOrder.customerCompanyName}`, 20, yOffset);
        yOffset += 7;
        pdf.text(`Adresa tvrtke: ${workOrder.customerCompanyAddress}`, 20, yOffset);
        yOffset += 7;
        pdf.text(`OIB: ${workOrder.customerOib}`, 20, yOffset);
        yOffset += 7;
        pdf.text(
          `Ime i prezime: ${workOrder.customerFirstName} ${workOrder.customerLastName}`,
          20,
          yOffset
        );
        yOffset += 7;
        pdf.text(`Mobitel: ${workOrder.customerMobile}`, 20, yOffset);
        yOffset += 7;
        pdf.text(`Email: ${workOrder.customerEmail}`, 20, yOffset);
        yOffset += 12;
      } else {
        yOffset += 5;
      }

      const addWorkItemsSection = (title: string, items: WorkItem[]) => {
        pdf.setFontSize(11);
        pdf.text(title, 20, yOffset);
        pdf.setFontSize(10);
        yOffset += 7;
        const filteredItems = items.filter((item) => item.text.trim());
        if (filteredItems.length > 0) {
          filteredItems.forEach((item) => {
            const itemLines = pdf.splitTextToSize(`• ${item.text}`, 170);
            pdf.text(itemLines, 20, yOffset);
            yOffset += itemLines.length * 6;
          });
        } else {
          pdf.text("• (nije uneseno)", 20, yOffset);
          yOffset += 6;
        }
        yOffset += 6;
      };

      addWorkItemsSection("OPIS KVARA/PROBLEMA:", workOrder.description);
      addWorkItemsSection("ZATEČENO STANJE:", workOrder.foundCondition);
      addWorkItemsSection("IZVRŠENI RADOVI:", workOrder.performedWork);

      if (workOrder.technicianComment?.some((item) => item.text.trim())) {
        addWorkItemsSection("KOMENTAR TEHNIČARA:", workOrder.technicianComment);
      }

      pdf.setFontSize(11);
      pdf.text("UTROŠENI MATERIJAL:", 20, yOffset);
      pdf.setFontSize(10);
      yOffset += 7;

      if (workOrder.materials && workOrder.materials.length > 0) {
        workOrder.materials.forEach((mat, i) => {
          const text = `${i + 1}. ${mat.name} – ${mat.quantity} ${mat.unit}`;
          pdf.text(text, 25, yOffset);
          yOffset += 6;
        });
      } else {
        pdf.text("• (nije uneseno)", 25, yOffset);
        yOffset += 6;
      }
      yOffset += 10;

      pdf.setFontSize(11);
      pdf.text("VRIJEME:", 20, yOffset);
      pdf.setFontSize(10);
      yOffset += 7;
      pdf.text(`Datum: ${workOrder.date}`, 20, yOffset);
      yOffset += 6;
      pdf.text(`Vrijeme dolaska: ${workOrder.arrivalTime}`, 20, yOffset);
      yOffset += 6;
      pdf.text(`Vrijeme završetka: ${workOrder.completionTime}`, 20, yOffset);
      yOffset += 6;
      pdf.text(`Obračunsko vrijeme: ${workOrder.calculatedHours}`, 20, yOffset);
      yOffset += 10;

      pdf.setFontSize(11);
      pdf.text("PUT:", 20, yOffset);
      pdf.setFontSize(10);
      yOffset += 7;
      pdf.text(`Izlazak na teren: ${workOrder.fieldTrip ? "DA" : "NE"}`, 20, yOffset);
      yOffset += 6;
      if (workOrder.fieldTrip) {
        pdf.text(`Prijeđena udaljenost: ${workOrder.distance} km`, 20, yOffset);
        yOffset += 7;
      }
      yOffset += 10;

      if (yOffset > 220) {
        pdf.addPage();
        yOffset = 20;
      }

      pdf.setFontSize(11);
      pdf.text("POTPISI:", 20, yOffset);
      pdf.setFontSize(10);
      yOffset += 7;
      pdf.text("Potpis tehničara:", 20, yOffset);
      pdf.text("Potpis klijenta:", 110, yOffset);

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
            pdf.text(workOrder.technicianName, 20, yOffset + 30);

            pdf.text("Potpis klijenta:", 110, yOffset);
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
                  pdf.text(workOrder.customerSignerName, 110, yOffset + 25);

                  if (workOrder.signatureMetadata) {
                    pdf.setFontSize(6);
                    let metaY = yOffset + 30;
                    pdf.text(
                      `Datum i vrijeme: ${workOrder.signatureMetadata.timestamp}`,
                      110,
                      metaY
                    );
                    metaY += 3;
                    if (workOrder.signatureMetadata.coordinates) {
                      const { latitude, longitude } =
                        workOrder.signatureMetadata.coordinates;
                      pdf.text(
                        `Koordinate: ${latitude.toFixed(6)}, ${longitude.toFixed(
                          6
                        )}`,
                        110,
                        metaY
                      );
                      metaY += 3;
                    }
                    if (workOrder.signatureMetadata.address) {
                      const addressLines = pdf.splitTextToSize(
                        `Adresa: ${workOrder.signatureMetadata.address}`,
                        80
                      );
                      pdf.text(addressLines, 110, metaY);
                    }
                    pdf.setFontSize(10);
                  }
                  pdf.save(
                    `Radni_nalog_${workOrder.id.replace("/", "-")}.pdf`
                  );
                  resolve();
                }
              };
              custImg.onerror = () => {
                pdf.save(
                  `Radni_nalog_${workOrder.id.replace("/", "-")}.pdf`
                );
                resolve();
              };
            } else {
              pdf.save(
                `Radni_nalog_${workOrder.id.replace("/", "-")}.pdf`
              );
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

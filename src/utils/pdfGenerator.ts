import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
      pdf.setFont('helvetica');
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RADNI NALOG', 105, 18, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Broj: ${workOrder.id}`, 105, 25, { align: 'center' });
      pdf.text(`Datum: ${workOrder.date}`, 105, 31, { align: 'center' });

      // PODACI O NARUČITELJU I KORISNIKU – tablica 2 kolone
      let clientData = [
        ['Ime tvrtke:', workOrder.clientCompanyName],
        ['Adresa tvrtke:', workOrder.clientCompanyAddress],
        ['OIB:', workOrder.clientOib],
        ['Ime i prezime:', `${workOrder.clientFirstName} ${workOrder.clientLastName}`],
        ['Mobitel:', workOrder.clientMobile],
        ['Email:', workOrder.clientEmail],
      ];

      let customerData = workOrder.orderForCustomer ? [
        ['Ime tvrtke:', workOrder.customerCompanyName],
        ['Adresa tvrtke:', workOrder.customerCompanyAddress],
        ['OIB:', workOrder.customerOib],
        ['Ime i prezime:', `${workOrder.customerFirstName} ${workOrder.customerLastName}`],
        ['Mobitel:', workOrder.customerMobile],
        ['Email:', workOrder.customerEmail],
      ] : [];

      autoTable(pdf, {
        startY: 38,
        head: [['PODACI O NARUČITELJU', 'PODACI O KORISNIKU']],
        body: clientData.map((row, i) => [
          `${row[0]} ${row[1]}`,
          customerData[i] ? `${customerData[i][0]} ${customerData[i][1]}` : ''
        ]),
        theme: 'plain',
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 1 },
        headStyles: { fillColor: [220, 220, 220], fontStyle: 'bold', halign: 'center' },
        columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 90 } },
      });

      let yOffset = pdf.lastAutoTable.finalY + 5;

      // OPIS KVARA/PROBLEMA
      pdf.setFont('helvetica', 'bold');
      pdf.text('OPIS KVARA/PROBLEMA:', 20, yOffset);
      pdf.setFont('helvetica', 'normal');
      yOffset += 6;
      if (workOrder.description?.length > 0) {
        workOrder.description.forEach(item => {
          if (item.text.trim()) {
            const lines = pdf.splitTextToSize(`• ${item.text}`, 170);
            pdf.text(lines, 20, yOffset);
            yOffset += lines.length * 6;
          }
        });
      } else {
        pdf.text('• (nije uneseno)', 20, yOffset);
        yOffset += 6;
      }
      yOffset += 4;

      // ZATEČENO STANJE
      pdf.setFont('helvetica', 'bold');
      pdf.text('ZATEČENO STANJE:', 20, yOffset);
      pdf.setFont('helvetica', 'normal');
      yOffset += 6;
      if (workOrder.foundCondition?.length > 0) {
        workOrder.foundCondition.forEach(item => {
          if (item.text.trim()) {
            const lines = pdf.splitTextToSize(`• ${item.text}`, 170);
            pdf.text(lines, 20, yOffset);
            yOffset += lines.length * 6;
          }
        });
      } else {
        pdf.text('• (nije uneseno)', 20, yOffset);
        yOffset += 6;
      }
      yOffset += 4;

      // IZVRŠENI RADOVI
      pdf.setFont('helvetica', 'bold');
      pdf.text('IZVRŠENI RADOVI:', 20, yOffset);
      pdf.setFont('helvetica', 'normal');
      yOffset += 6;
      if (workOrder.performedWork?.length > 0) {
        workOrder.performedWork.forEach(item => {
          if (item.text.trim()) {
            const lines = pdf.splitTextToSize(`• ${item.text}`, 170);
            pdf.text(lines, 20, yOffset);
            yOffset += lines.length * 6;
          }
        });
      } else {
        pdf.text('• (nije uneseno)', 20, yOffset);
        yOffset += 6;
      }
      yOffset += 4;

      // KOMENTAR TEHNIČARA
      if (workOrder.technicianComment?.some(item => item.text.trim())) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('KOMENTAR TEHNIČARA:', 20, yOffset);
        pdf.setFont('helvetica', 'normal');
        yOffset += 6;
        workOrder.technicianComment.forEach(item => {
          if (item.text.trim()) {
            const lines = pdf.splitTextToSize(`• ${item.text}`, 170);
            pdf.text(lines, 20, yOffset);
            yOffset += lines.length * 6;
          }
        });
        yOffset += 4;
      }

      // MATERIJALI (TABLICA)
      if (workOrder.materials && workOrder.materials.length > 0) {
        autoTable(pdf, {
          startY: yOffset,
          head: [['Rb.', 'Naziv materijala', 'Količina', 'Jedinica']],
          body: workOrder.materials.map((mat, i) => [
            i + 1, mat.name, mat.quantity, mat.unit
          ]),
          theme: 'grid',
          styles: { font: 'helvetica', fontSize: 9, cellPadding: 1 },
          headStyles: { fillColor: [220, 220, 220], fontStyle: 'bold', halign: 'center' },
          columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 85 }, 2: { cellWidth: 25 }, 3: { cellWidth: 25 } }
        });
        yOffset = pdf.lastAutoTable.finalY + 5;
      }

      // VRIJEME
      pdf.setFont('helvetica', 'bold');
      pdf.text('VRIJEME:', 20, yOffset);
      pdf.setFont('helvetica', 'normal');
      yOffset += 6;
      pdf.text(`Datum: ${workOrder.date}`, 20, yOffset);
      yOffset += 6;
      pdf.text(`Vrijeme dolaska: ${workOrder.arrivalTime}`, 20, yOffset);
      yOffset += 6;
      pdf.text(`Vrijeme završetka: ${workOrder.completionTime}`, 20, yOffset);
      yOffset += 6;
      pdf.text(`Obračunsko vrijeme: ${workOrder.calculatedHours}`, 20, yOffset);
      yOffset += 8;

      // PUT
      pdf.setFont('helvetica', 'bold');
      pdf.text('PUT:', 20, yOffset);
      pdf.setFont('helvetica', 'normal');
      yOffset += 6;
      if (workOrder.fieldTrip) {
        pdf.text('Izlazak na teren: DA', 20, yOffset);
        yOffset += 6;
        pdf.text(`Prijeđena udaljenost: ${workOrder.distance} km`, 20, yOffset);
      } else {
        pdf.text('Izlazak na teren: NE', 20, yOffset);
      }
      yOffset += 12;

      // POTPISI
      if (yOffset > 220) {
        pdf.addPage();
        yOffset = 20;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.text('POTPISI:', 20, yOffset);
      pdf.setFont('helvetica', 'normal');
      yOffset += 7;

      // Potpis tehničara
      pdf.text('Potpis tehničara:', 20, yOffset);
      if (workOrder.technicianSignature) {
        const techImg = new Image();
        techImg.src = workOrder.technicianSignature;
        techImg.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = techImg.width;
          canvas.height = techImg.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(techImg, 0, 0);
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 20, yOffset + 2, 40, 20);
            pdf.text(workOrder.technicianName, 20, yOffset + 30);

            // Potpis klijenta
            pdf.text('Potpis klijenta:', 110, yOffset);
            if (workOrder.customerSignature) {
              const custImg = new Image();
              custImg.src = workOrder.customerSignature;
              custImg.onload = () => {
                const custCanvas = document.createElement('canvas');
                custCanvas.width = custImg.width;
                custCanvas.height = custImg.height;
                const custCtx = custCanvas.getContext('2d');
                if (custCtx) {
                  custCtx.drawImage(custImg, 0, 0);
                  const custImgData = custCanvas.toDataURL('image/png');
                  pdf.addImage(custImgData, 'PNG', 110, yOffset + 2, 40, 20);
                  pdf.text(workOrder.customerSignerName, 110, yOffset + 25);

                  // signature metadata
                  if (workOrder.signatureMetadata) {
                    pdf.setFontSize(6);
                    let metaY = yOffset + 30;
                    if (workOrder.signatureMetadata.timestamp) {
                      pdf.text(`Datum i vrijeme: ${workOrder.signatureMetadata.timestamp}`, 110, metaY);
                      metaY += 3;
                    }
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
                  pdf.save(`Radni_nalog_${workOrder.id.replace('/', '-')}.pdf`);
                  resolve();
                }
              };
              custImg.onerror = (err) => {
                pdf.save(`Radni_nalog_${workOrder.id.replace('/', '-')}.pdf`);
                resolve();
              };
            } else {
              pdf.save(`Radni_nalog_${workOrder.id.replace('/', '-')}.pdf`);
              resolve();
            }
          }
        };
        techImg.onerror = (err) => {
          pdf.save(`Radni_nalog_${workOrder.id.replace('/', '-')}.pdf`);
          resolve();
        };
      } else {
        pdf.save(`Radni_nalog_${workOrder.id.replace('/', '-')}.pdf`);
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
};

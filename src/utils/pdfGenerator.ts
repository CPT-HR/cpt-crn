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

      // HEADER
      pdf.setFont('times', 'bold');
      pdf.setFontSize(20);
      pdf.text('RADNI NALOG', 105, 20, { align: 'center' });

      pdf.setFontSize(12);
      pdf.text(`Broj: ${workOrder.id}`, 20, 30);
      pdf.text(`Datum: ${workOrder.date}`, 150, 30);

      pdf.setLineWidth(0.5);
      pdf.line(20, 34, 190, 34);

      // NARUČITELJ I KORISNIK - DVIJE KOLONE
      pdf.setFont('times', 'bold');
      pdf.setFontSize(12);
      pdf.text('PODACI O NARUČITELJU', 20, 42);
      if (workOrder.orderForCustomer) {
        pdf.text('PODACI O KORISNIKU', 110, 42);
      }

      pdf.setFont('times', 'normal');
      pdf.setFontSize(10);

      const clientY = 48;
      let customerY = 48;
      const rowH = 6;

      pdf.text(`Ime tvrtke: ${workOrder.clientCompanyName}`, 20, clientY);
      pdf.text(`Ime i prezime: ${workOrder.clientFirstName} ${workOrder.clientLastName}`, 20, clientY + rowH);
      pdf.text(`Adresa: ${workOrder.clientCompanyAddress}`, 20, clientY + rowH * 2);
      pdf.text(`OIB: ${workOrder.clientOib}`, 20, clientY + rowH * 3);
      pdf.text(`Mobitel: ${workOrder.clientMobile}`, 20, clientY + rowH * 4);
      pdf.text(`Email: ${workOrder.clientEmail}`, 20, clientY + rowH * 5);

      if (workOrder.orderForCustomer) {
        pdf.text(`Ime tvrtke: ${workOrder.customerCompanyName}`, 110, customerY);
        pdf.text(`Ime i prezime: ${workOrder.customerFirstName} ${workOrder.customerLastName}`, 110, customerY + rowH);
        pdf.text(`Adresa: ${workOrder.customerCompanyAddress}`, 110, customerY + rowH * 2);
        pdf.text(`OIB: ${workOrder.customerOib}`, 110, customerY + rowH * 3);
        pdf.text(`Mobitel: ${workOrder.customerMobile}`, 110, customerY + rowH * 4);
        pdf.text(`Email: ${workOrder.customerEmail}`, 110, customerY + rowH * 5);
      }

      let yOffset = clientY + rowH * 6 + 6;

      pdf.setLineWidth(0.2);
      pdf.line(20, yOffset, 190, yOffset);
      yOffset += 7;

      // SEKCIONALNI HEADER
      const section = (label: string) => {
        pdf.setFont('times', 'bold');
        pdf.setFontSize(11);
        pdf.text(label, 20, yOffset);
        yOffset += 6;
        pdf.setFont('times', 'normal');
        pdf.setFontSize(10);
      };

      // OPIS KVARA/PROBLEMA
      section('OPIS KVARA/PROBLEMA:');
      if (workOrder.description?.length > 0 && workOrder.description.some(item => item.text.trim())) {
        workOrder.description.forEach(item => {
          if (item.text.trim()) {
            const lines = pdf.splitTextToSize(`• ${item.text}`, 170);
            pdf.text(lines, 22, yOffset);
            yOffset += lines.length * 5;
          }
        });
      } else {
        pdf.text('• (nije uneseno)', 22, yOffset);
        yOffset += 6;
      }
      yOffset += 2;

      // ZATEČENO STANJE
      section('ZATEČENO STANJE:');
      if (workOrder.foundCondition?.length > 0 && workOrder.foundCondition.some(item => item.text.trim())) {
        workOrder.foundCondition.forEach(item => {
          if (item.text.trim()) {
            const lines = pdf.splitTextToSize(`• ${item.text}`, 170);
            pdf.text(lines, 22, yOffset);
            yOffset += lines.length * 5;
          }
        });
      } else {
        pdf.text('• (nije uneseno)', 22, yOffset);
        yOffset += 6;
      }
      yOffset += 2;

      // IZVRŠENI RADOVI
      section('IZVRŠENI RADOVI:');
      if (workOrder.performedWork?.length > 0 && workOrder.performedWork.some(item => item.text.trim())) {
        workOrder.performedWork.forEach(item => {
          if (item.text.trim()) {
            const lines = pdf.splitTextToSize(`• ${item.text}`, 170);
            pdf.text(lines, 22, yOffset);
            yOffset += lines.length * 5;
          }
        });
      } else {
        pdf.text('• (nije uneseno)', 22, yOffset);
        yOffset += 6;
      }
      yOffset += 2;

      // KOMENTAR TEHNIČARA
      if (workOrder.technicianComment?.some(item => item.text.trim())) {
        section('KOMENTAR TEHNIČARA:');
        workOrder.technicianComment.forEach(item => {
          if (item.text.trim()) {
            const lines = pdf.splitTextToSize(`• ${item.text}`, 170);
            pdf.text(lines, 22, yOffset);
            yOffset += lines.length * 5;
          }
        });
        yOffset += 2;
      }

      // MATERIJALI (TABLICA)
      if (workOrder.materials && workOrder.materials.length > 0) {
        pdf.setFont('times', 'bold');
        pdf.setFontSize(11);
        pdf.text('UTROŠENI MATERIJAL:', 20, yOffset);
        yOffset += 3;
        autoTable(pdf, {
          startY: yOffset,
          head: [['Rb.', 'Naziv materijala', 'Količina', 'Jedinica']],
          body: workOrder.materials.map((mat, i) => [
            i + 1, mat.name, mat.quantity, mat.unit
          ]),
          theme: 'grid',
          styles: { font: 'times', fontSize: 9, cellPadding: 1 },
          headStyles: { fillColor: [220, 220, 220], fontStyle: 'bold', halign: 'center' },
          columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 90 }, 2: { cellWidth: 30 }, 3: { cellWidth: 30 } }
        });
        // @ts-ignore
        yOffset = (pdf as any).lastAutoTable.finalY + 7;
      }

      // VRIJEME
      section('VRIJEME:');
      pdf.text(`Datum: ${workOrder.date}`, 22, yOffset);
      yOffset += 5;
      pdf.text(`Vrijeme dolaska: ${workOrder.arrivalTime}`, 22, yOffset);
      yOffset += 5;
      pdf.text(`Vrijeme završetka: ${workOrder.completionTime}`, 22, yOffset);
      yOffset += 5;
      pdf.text(`Obračunsko vrijeme: ${workOrder.calculatedHours}`, 22, yOffset);
      yOffset += 7;

      // PUT
      section('PUT:');
      pdf.text(`Izlazak na teren: ${workOrder.fieldTrip ? 'DA' : 'NE'}`, 22, yOffset);
      yOffset += 5;
      if (workOrder.fieldTrip) {
        pdf.text(`Prijeđena udaljenost: ${workOrder.distance} km`, 22, yOffset);
        yOffset += 7;
      }
      yOffset += 4;

      // Novi page ako nema mjesta za potpise
      if (yOffset > 230) {
        pdf.addPage();
        yOffset = 20;
      }

      // POTPISI
      pdf.setFont('times', 'bold');
      pdf.setFontSize(11);
      pdf.text('POTPISI:', 20, yOffset);
      yOffset += 8;
      pdf.setFont('times', 'normal');
      pdf.setFontSize(10);
      pdf.text('Potpis tehničara:', 20, yOffset);
      pdf.text('Potpis klijenta:', 110, yOffset);

      // Dodaj potpise ako postoje
      const addSignature = (
        signatureData: string,
        x: number,
        y: number,
        name: string,
        meta?: WorkOrder['signatureMetadata']
      ) => {
        if (!signatureData) return;
        const img = new Image();
        img.src = signatureData;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', x, y + 2, 50, 22);
            pdf.text(name, x, y + 28);

            // Signature metadata (opcionalno)
            if (meta) {
              pdf.setFontSize(6);
              let metaY = y + 33;
              if (meta.timestamp) {
                pdf.text(`Datum i vrijeme: ${meta.timestamp}`, x, metaY);
                metaY += 3;
              }
              if (meta.coordinates) {
                const { latitude, longitude } = meta.coordinates;
                pdf.text(`Koordinate: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, x, metaY);
                metaY += 3;
              }
              if (meta.address) {
                const addressLines = pdf.splitTextToSize(`Adresa: ${meta.address}`, 70);
                pdf.text(addressLines, x, metaY);
              }
              pdf.setFontSize(10);
            }
          }
          pdf.save(`Radni_nalog_${workOrder.id.replace('/', '-')}.pdf`);
          resolve();
        };
        img.onerror = () => {
          pdf.save(`Radni_nalog_${workOrder.id.replace('/', '-')}.pdf`);
          resolve();
        };
      };

      let signatureY = yOffset + 6;
      addSignature(workOrder.technicianSignature, 20, signatureY, workOrder.technicianName);
      addSignature(
        workOrder.customerSignature,
        110,
        signatureY,
        workOrder.customerSignerName,
        workOrder.signatureMetadata
      );

      // Ako nema slika potpisa, samo odmah spremi PDF
      if (!workOrder.technicianSignature && !workOrder.customerSignature) {
        pdf.save(`Radni_nalog_${workOrder.id.replace('/', '-')}.pdf`);
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
};

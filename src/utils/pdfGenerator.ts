
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { SignatureMetadata } from '@/components/SignaturePad';

interface Material {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

interface WorkOrder {
  id: string;
  customerName: string;
  customerAddress: string;
  customerContact: string;
  clientName: string;
  clientAddress: string;
  clientContact: string;
  description: string;
  performedWork: string;
  materials: Material[];
  hours: string;
  distance: string;
  technicianSignature: string;
  technicianName: string;
  customerSignature: string;
  signatureMetadata?: SignatureMetadata;
  date: string;
}

export const generatePDF = async (workOrder: WorkOrder): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Create new PDF with A4 dimensions
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Set font
      pdf.setFont('helvetica');

      // Add header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RADNI NALOG', 105, 20, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Broj: ${workOrder.id}`, 105, 27, { align: 'center' });
      pdf.text(`Datum: ${new Date(workOrder.date).toLocaleDateString('hr-HR')}`, 105, 32, { align: 'center' });
      
      // Reset font
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);

      // Add client info (naručitelj)
      pdf.setFont('helvetica', 'bold');
      pdf.text('PODACI O NARUČITELJU:', 20, 45);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Naziv: ${workOrder.clientName}`, 20, 52);
      pdf.text(`Adresa: ${workOrder.clientAddress}`, 20, 59);
      pdf.text(`Kontakt: ${workOrder.clientContact}`, 20, 66);

      // Add customer info (korisnik/lokacija)
      pdf.setFont('helvetica', 'bold');
      pdf.text('PODACI O KORISNIKU (LOKACIJA):', 20, 78);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Naziv: ${workOrder.customerName}`, 20, 85);
      pdf.text(`Adresa: ${workOrder.customerAddress}`, 20, 92);
      pdf.text(`Kontakt: ${workOrder.customerContact}`, 20, 99);

      // Add service details
      pdf.setFont('helvetica', 'bold');
      pdf.text('OPIS KVARA/PROBLEMA:', 20, 111);
      pdf.setFont('helvetica', 'normal');
      
      const descriptionLines = pdf.splitTextToSize(workOrder.description, 170);
      pdf.text(descriptionLines, 20, 118);
      
      let yOffset = 118 + (descriptionLines.length * 6);

      pdf.setFont('helvetica', 'bold');
      pdf.text('IZVRŠENI RADOVI:', 20, yOffset);
      pdf.setFont('helvetica', 'normal');
      
      const workLines = pdf.splitTextToSize(workOrder.performedWork, 170);
      pdf.text(workLines, 20, yOffset + 7);
      
      yOffset += (workLines.length * 6) + 15;

      // Add materials
      pdf.setFont('helvetica', 'bold');
      pdf.text('UTROŠENI MATERIJAL:', 20, yOffset);
      pdf.setFont('helvetica', 'normal');
      
      yOffset += 7;
      
      // Materials table headers
      pdf.setFont('helvetica', 'bold');
      pdf.text('Rb.', 20, yOffset);
      pdf.text('Naziv materijala', 35, yOffset);
      pdf.text('Količina', 140, yOffset);
      pdf.text('Jedinica', 165, yOffset);
      pdf.setFont('helvetica', 'normal');
      
      yOffset += 5;
      pdf.line(20, yOffset, 190, yOffset); // Horizontal line
      
      yOffset += 7;
      
      // Materials table rows
      workOrder.materials.forEach((material, index) => {
        if (material.name) {
          pdf.text((index + 1).toString() + '.', 20, yOffset);
          
          const materialNameLines = pdf.splitTextToSize(material.name, 100);
          pdf.text(materialNameLines, 35, yOffset);
          
          pdf.text(material.quantity, 140, yOffset);
          pdf.text(material.unit, 165, yOffset);
          
          yOffset += Math.max(materialNameLines.length * 6, 7);
          
          // Add new page if needed
          if (yOffset > 270) {
            pdf.addPage();
            yOffset = 20;
          }
        }
      });
      
      yOffset += 10;
      
      // Add time and distance
      pdf.text(`Utrošeno vrijeme: ${workOrder.hours} sati`, 20, yOffset);
      yOffset += 7;
      pdf.text(`Prijeđena udaljenost: ${workOrder.distance} km`, 20, yOffset);
      
      yOffset += 15;
      
      // Check if we need a new page for signatures
      if (yOffset > 220) {
        pdf.addPage();
        yOffset = 20;
      }
      
      // Add signatures
      pdf.setFont('helvetica', 'bold');
      pdf.text('POTPISI:', 20, yOffset);
      pdf.setFont('helvetica', 'normal');
      
      yOffset += 7;
      
      // Technician signature
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
            
            // Customer signature
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
                  
                  // Add signature metadata
                  if (workOrder.signatureMetadata) {
                    pdf.setFontSize(6);
                    let metaY = yOffset + 25;
                    
                    // Add timestamp
                    pdf.text(`Datum i vrijeme: ${workOrder.signatureMetadata.timestamp}`, 110, metaY);
                    metaY += 3;
                    
                    // Add coordinates if available
                    if (workOrder.signatureMetadata.coordinates) {
                      const { latitude, longitude } = workOrder.signatureMetadata.coordinates;
                      pdf.text(`Koordinate: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, 110, metaY);
                      metaY += 3;
                    }
                    
                    // Add address if available
                    if (workOrder.signatureMetadata.address) {
                      const addressLines = pdf.splitTextToSize(`Adresa: ${workOrder.signatureMetadata.address}`, 80);
                      pdf.text(addressLines, 110, metaY);
                    }
                    
                    // Reset font size
                    pdf.setFontSize(10);
                  }
                  
                  // Save the PDF
                  pdf.save(`Radni_nalog_${workOrder.id.replace('/', '-')}.pdf`);
                  resolve();
                }
              };
              
              custImg.onerror = (err) => {
                console.error('Error loading customer signature image:', err);
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
          console.error('Error loading technician signature image:', err);
          pdf.save(`Radni_nalog_${workOrder.id.replace('/', '-')}.pdf`);
          resolve();
        };
      } else {
        pdf.save(`Radni_nalog_${workOrder.id.replace('/', '-')}.pdf`);
        resolve();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
};

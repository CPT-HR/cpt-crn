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
  description: string;
  foundCondition: string;
  performedWork: string;
  technicianComment: string;
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
      pdf.text(`Ime tvrtke: ${workOrder.clientCompanyName}`, 20, 52);
      pdf.text(`Adresa tvrtke: ${workOrder.clientCompanyAddress}`, 20, 59);
      pdf.text(`OIB: ${workOrder.clientOib}`, 20, 66);
      pdf.text(`Ime i prezime: ${workOrder.clientFirstName} ${workOrder.clientLastName}`, 20, 73);
      pdf.text(`Mobitel: ${workOrder.clientMobile}`, 20, 80);
      pdf.text(`Email: ${workOrder.clientEmail}`, 20, 87);

      let yOffset = 95;

      // Add customer info if it's different
      if (workOrder.orderForCustomer) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('PODACI O KORISNIKU:', 20, yOffset);
        pdf.setFont('helvetica', 'normal');
        yOffset += 7;
        pdf.text(`Ime tvrtke: ${workOrder.customerCompanyName}`, 20, yOffset);
        yOffset += 7;
        pdf.text(`Adresa tvrtke: ${workOrder.customerCompanyAddress}`, 20, yOffset);
        yOffset += 7;
        pdf.text(`OIB: ${workOrder.customerOib}`, 20, yOffset);
        yOffset += 7;
        pdf.text(`Ime i prezime: ${workOrder.customerFirstName} ${workOrder.customerLastName}`, 20, yOffset);
        yOffset += 7;
        pdf.text(`Mobitel: ${workOrder.customerMobile}`, 20, yOffset);
        yOffset += 7;
        pdf.text(`Email: ${workOrder.customerEmail}`, 20, yOffset);
        yOffset += 12;
      } else {
        yOffset += 5;
      }

      // Add service details with new fields
      pdf.setFont('helvetica', 'bold');
      pdf.text('OPIS KVARA/PROBLEMA:', 20, yOffset);
      pdf.setFont('helvetica', 'normal');
      yOffset += 7;
      
      const descriptionLines = pdf.splitTextToSize(workOrder.description, 170);
      pdf.text(descriptionLines, 20, yOffset);
      
      yOffset += (descriptionLines.length * 6) + 8;

      pdf.setFont('helvetica', 'bold');
      pdf.text('ZATEČENO STANJE:', 20, yOffset);
      pdf.setFont('helvetica', 'normal');
      yOffset += 7;
      
      const foundConditionLines = pdf.splitTextToSize(workOrder.foundCondition, 170);
      pdf.text(foundConditionLines, 20, yOffset);
      
      yOffset += (foundConditionLines.length * 6) + 8;

      pdf.setFont('helvetica', 'bold');
      pdf.text('IZVRŠENI RADOVI:', 20, yOffset);
      pdf.setFont('helvetica', 'normal');
      yOffset += 7;
      
      const workLines = pdf.splitTextToSize(workOrder.performedWork, 170);
      pdf.text(workLines, 20, yOffset);
      
      yOffset += (workLines.length * 6) + 8;

      if (workOrder.technicianComment && workOrder.technicianComment.trim()) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('KOMENTAR TEHNIČARA:', 20, yOffset);
        pdf.setFont('helvetica', 'normal');
        yOffset += 7;
        
        const commentLines = pdf.splitTextToSize(workOrder.technicianComment, 170);
        pdf.text(commentLines, 20, yOffset);
        
        yOffset += (commentLines.length * 6) + 15;
      } else {
        yOffset += 7;
      }

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

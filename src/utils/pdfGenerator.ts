
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  location: string;
  description: string;
  performedWork: string;
  materials: Material[];
  hours: string;
  distance: string;
  technicianSignature: string;
  customerSignature: string;
  technicianName: string;
  date: string;
}

export const generatePDF = async (workOrder: WorkOrder): Promise<void> => {
  // Create a temporary div to render the work order
  const element = document.createElement('div');
  element.className = 'hidden';
  document.body.appendChild(element);

  // Format the date
  const formattedDate = new Date(workOrder.date).toLocaleDateString('hr-HR');

  // Generate the HTML structure
  element.innerHTML = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h1 style="margin: 0; font-size: 24px;">Radni nalog: ${workOrder.id}</h1>
          <p style="margin: 5px 0;">Datum: ${formattedDate}</p>
        </div>
        <div style="text-align: right;">
          <img src="https://via.placeholder.com/150x60?text=LOGO" alt="Company Logo" style="max-height: 60px;" />
        </div>
      </div>

      <div style="border: 1px solid #ccc; padding: 15px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; font-size: 16px;">Podaci o klijentu</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 30%; padding: 5px 0;"><strong>Naziv:</strong></td>
            <td style="padding: 5px 0;">${workOrder.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Adresa:</strong></td>
            <td style="padding: 5px 0;">${workOrder.customerAddress}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Kontakt:</strong></td>
            <td style="padding: 5px 0;">${workOrder.customerContact}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Lokacija objekta:</strong></td>
            <td style="padding: 5px 0;">${workOrder.location}</td>
          </tr>
        </table>
      </div>

      <div style="border: 1px solid #ccc; padding: 15px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; font-size: 16px;">Opis radova</h2>
        <div style="margin-bottom: 15px;">
          <h3 style="margin: 5px 0; font-size: 14px;">Opis kvara/problema:</h3>
          <p style="margin: 5px 0; white-space: pre-line;">${workOrder.description}</p>
        </div>
        <div>
          <h3 style="margin: 5px 0; font-size: 14px;">Izvršeni radovi:</h3>
          <p style="margin: 5px 0; white-space: pre-line;">${workOrder.performedWork}</p>
        </div>
      </div>

      <div style="border: 1px solid #ccc; padding: 15px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; font-size: 16px;">Utrošeni materijal</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #f2f2f2;">
            <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Naziv</th>
            <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Količina</th>
            <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Jedinica</th>
          </tr>
          ${workOrder.materials.map(material => 
            material.name ? 
            `<tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${material.name}</td>
              <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">${material.quantity}</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${material.unit}</td>
            </tr>` : ''
          ).join('')}
        </table>
      </div>

      <div style="border: 1px solid #ccc; padding: 15px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; font-size: 16px;">Vrijeme i put</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 30%; padding: 5px 0;"><strong>Utrošeno vrijeme:</strong></td>
            <td style="padding: 5px 0;">${workOrder.hours} sati</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Prijeđena udaljenost:</strong></td>
            <td style="padding: 5px 0;">${workOrder.distance} km</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 20px; display: flex; justify-content: space-between;">
        <div style="width: 45%; text-align: center;">
          <h3 style="margin: 5px 0; font-size: 14px;">Potpis tehničara</h3>
          <div style="border: 1px solid #ccc; height: 100px; display: flex; align-items: center; justify-content: center;">
            <img src="${workOrder.technicianSignature}" style="max-height: 80px; max-width: 90%;" />
          </div>
          <p style="margin: 5px 0;">${workOrder.technicianName}</p>
        </div>
        <div style="width: 45%; text-align: center;">
          <h3 style="margin: 5px 0; font-size: 14px;">Potpis klijenta</h3>
          <div style="border: 1px solid #ccc; height: 100px; display: flex; align-items: center; justify-content: center;">
            <img src="${workOrder.customerSignature}" style="max-height: 80px; max-width: 90%;" />
          </div>
          <p style="margin: 5px 0;">${workOrder.customerName}</p>
        </div>
      </div>
    </div>
  `;

  try {
    // Convert the HTML to a canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });
    
    // Create a PDF from the canvas
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add new pages if the content doesn't fit on one page
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Save the PDF
    pdf.save(`Radni_nalog_${workOrder.id.replace('/', '-')}.pdf`);
  } finally {
    // Clean up
    document.body.removeChild(element);
  }
};

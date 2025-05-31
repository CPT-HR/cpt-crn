// src/types/jspdf.d.ts
import 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    internal: {
      getNumberOfPages: () => number;
    } & jsPDF['internal'];
  }
}

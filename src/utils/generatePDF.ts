import { jsPDF } from 'jspdf';

export function generateRoadmapPDF() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  const addText = (text: string, size: number, isBold = false, align: 'right' | 'center' | 'left' = 'right', color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);

    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    const lines = doc.splitTextToSize(text, pageWidth - (margin * 2));
    lines.forEach((line: string) => {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      if (align === 'center') {
        const textWidth = doc.getTextWidth(line);
        doc.text(line, (pageWidth - textWidth) / 2, y);
      } else if (align === 'right') {
        const textWidth = doc.getTextWidth(line);
        doc.text(line, pageWidth - margin - textWidth, y);
      } else {
        doc.text(line, margin, y);
      }
      y += 7;
    });
  };

  const addSpace = (spaces = 1) => {
    y += 7 * spaces;
  };

  doc.setFillColor(34, 139, 34);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  const title = 'Rawad Project Roadmap';
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, 20);

  y = 40;
  doc.setTextColor(0, 0, 0);

  addText('Fan Loyalty Program', 16, true, 'center');
  addSpace(2);

  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 5, pageWidth - (margin * 2), 10, 'F');
  addText('Overview', 14, true);
  addSpace();
  addText('A comprehensive platform for managing fan loyalty programs in the Saudi Professional League and King\'s Cup, allowing fans to earn points by attending matches and redeem them for exclusive rewards.', 11, false, 'left');
  addSpace(2);

  doc.setFillColor(34, 139, 34);
  doc.rect(margin, y - 5, pageWidth - (margin * 2), 10, 'F');
  doc.setTextColor(255, 255, 255);
  addText('Phase 1: Foundation (Completed)', 14, true, 'left', [255, 255, 255]);
  doc.setTextColor(0, 0, 0);
  addSpace();

  const phase1Items = [
    '1. Infrastructure',
    '   - Supabase database setup',
    '   - Authentication system',
    '   - Core tables',
    '   - Row Level Security',
    '   - Added 18 Saudi clubs',
    '',
    '2. Match System',
    '   - Roshn League schedule',
    '   - King\'s Cup schedule',
    '   - 10 complete rounds',
    '',
    '3. Attendance System',
    '   - 3 verification methods (GPS, QR, NFC)',
    '   - Automatic points calculation',
    '   - Attendance rewards',
    '',
    '4. Points & Transactions',
    '   - Points history page',
    '   - Detailed statistics',
    '   - Advanced filters',
    '',
    '5. Referral System',
    '   - Unique referral code',
    '   - Progressive rewards',
    '   - Referral status tracking',
    '',
    '6. Level System',
    '   - 5 progressive levels',
    '   - 6 achievements',
    '   - Multiplier system',
    '',
    '7. Admin System',
    '   - Admin dashboard',
    '   - Comprehensive management',
    '   - Attendance verification'
  ];

  phase1Items.forEach(item => {
    addText(item, 10, false, 'left');
  });

  addSpace(2);

  doc.setFillColor(255, 165, 0);
  doc.rect(margin, y - 5, pageWidth - (margin * 2), 10, 'F');
  doc.setTextColor(255, 255, 255);
  addText('Phase 2: Enhancements (In Progress)', 14, true, 'left', [255, 255, 255]);
  doc.setTextColor(0, 0, 0);
  addSpace();

  const phase2Items = [
    '1. Notification System',
    '   - In-app notifications',
    '   - Match notifications',
    '   - Offer notifications',
    '',
    '2. Admin Improvements',
    '   - Analytics dashboard',
    '   - Charts and graphs',
    '   - Custom reports',
    '',
    '3. Advanced Rewards',
    '   - Multiple categories',
    '   - Booking system',
    '   - QR codes for redemption'
  ];

  phase2Items.forEach(item => {
    addText(item, 10, false, 'left');
  });

  addSpace(2);

  doc.setFillColor(70, 130, 180);
  doc.rect(margin, y - 5, pageWidth - (margin * 2), 10, 'F');
  doc.setTextColor(255, 255, 255);
  addText('Technologies Used', 14, true, 'left', [255, 255, 255]);
  doc.setTextColor(0, 0, 0);
  addSpace();

  const techItems = [
    'Frontend: React 18, TypeScript, Vite, Tailwind CSS',
    'Backend: Supabase, PostgreSQL, Edge Functions',
    'DevOps: Git, npm, ESLint'
  ];

  techItems.forEach(item => {
    addText(item, 10, false, 'left');
  });

  addSpace(2);

  doc.setFillColor(240, 240, 240);
  doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);

  const footer1 = 'Last Updated: February 23, 2026';
  const footer2 = 'Version: 1.0.0';
  const footer3 = 'Status: Ready for Beta';

  doc.text(footer1, margin, pageHeight - 15);
  doc.text(footer2, margin, pageHeight - 10);
  doc.text(footer3, margin, pageHeight - 5);

  doc.save('roadmap-rawad.pdf');
}

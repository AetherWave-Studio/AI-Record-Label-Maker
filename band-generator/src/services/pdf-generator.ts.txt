import { EnhancedBandData, ArtistData } from "../core/types.js";
import PDFDocument from "pdfkit";
import { Readable } from "stream";

/**
 * Generate a comprehensive PDF profile for a virtual band
 * Returns a buffer that can be sent as a download or saved to disk
 */
export async function generateBandProfilePDF(
  bandData: EnhancedBandData,
  imageUrl?: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `${bandData.bandName} - Complete Profile`,
          Author: 'AetherWave Studio',
          Subject: 'Virtual Band Profile',
          Keywords: `${bandData.genre}, ${bandData.bandName}, virtual band`,
          CreationDate: new Date()
        }
      });

      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Color palette
      const colors = {
        primary: bandData.colorPalette?.highlight || '#00ffff',
        dark: '#1a1a1a',
        light: '#f0f0f0',
        accent: bandData.colorPalette?.background || '#2a2a2a'
      };

      // HEADER SECTION
      doc.fillColor(colors.primary)
         .fontSize(32)
         .font('Helvetica-Bold')
         .text(bandData.bandName, { align: 'center' });

      doc.moveDown(0.5);

      // Subtitle with genre
      doc.fillColor('#666666')
         .fontSize(16)
         .font('Helvetica')
         .text(bandData.genre, { align: 'center' });

      // Motto/Philosophy in styled box
      doc.moveDown(1);
      const mottoY = doc.y;
      doc.rect(50, mottoY, doc.page.width - 100, 60)
         .fillAndStroke(colors.accent, colors.primary);

      doc.fillColor('#ffffff')
         .fontSize(14)
         .font('Helvetica-Oblique')
         .text(`"${bandData.philosophy}"`, 60, mottoY + 20, {
           width: doc.page.width - 120,
           align: 'center'
         });

      doc.moveDown(3);

      // BAND IDENTITY
      addSection(doc, 'Band Identity', colors.primary);
      doc.fillColor('#333333')
         .fontSize(11)
         .font('Helvetica')
         .text(bandData.band_identity, { align: 'left' });

      doc.moveDown(0.5);

      // Motto
      doc.fillColor('#666666')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Motto: ', { continued: true })
         .font('Helvetica')
         .text(bandData.band_motto);

      doc.moveDown(1.5);

      // ORIGIN STORY
      addSection(doc, 'Origin Story', colors.primary);
      doc.fillColor('#333333')
         .fontSize(10)
         .font('Helvetica')
         .text(bandData.world_building.origin_story || 'Origin story not available.', {
           align: 'justify'
         });

      doc.moveDown(1.5);

      // BAND CONCEPT
      addSection(doc, 'Band Concept', colors.primary);
      doc.fillColor('#333333')
         .fontSize(10)
         .font('Helvetica')
         .text(bandData.bandConcept, { align: 'justify' });

      doc.moveDown(1.5);

      // BAND MEMBERS
      if (bandData.members && bandData.members.length > 0) {
        addSection(doc, `Band Members (${bandData.members.length})`, colors.primary);

        bandData.members.forEach((member, index) => {
          if (index > 0) doc.moveDown(0.8);

          // Member name and role in colored box
          const memberY = doc.y;
          doc.roundedRect(50, memberY, doc.page.width - 100, 25, 5)
             .fillAndStroke('#f8fafc', '#60a5fa');

          doc.fillColor('#1e40af')
             .fontSize(12)
             .font('Helvetica-Bold')
             .text(member.name, 60, memberY + 8, { continued: true })
             .fillColor('#666666')
             .fontSize(10)
             .font('Helvetica')
             .text(` - ${member.role}`);

          doc.moveDown(1.5);

          // Member archetype
          if (member.archetype) {
            doc.fillColor('#333333')
               .fontSize(9)
               .font('Helvetica')
               .text(member.archetype, { align: 'justify' });
          }
        });

        doc.moveDown(1.5);
      }

      // MUSICAL DETAILS - Two columns
      addSection(doc, 'Musical Details', colors.primary);

      const leftCol = 60;
      const rightCol = doc.page.width / 2 + 30;
      const colWidth = (doc.page.width - 120) / 2 - 20;

      let detailY = doc.y;

      // Left column
      doc.fillColor('#666666')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Signature Sound:', leftCol, detailY);

      doc.moveDown(0.3);
      doc.fillColor('#333333')
         .fontSize(9)
         .font('Helvetica')
         .text(bandData.signatureSound, leftCol, doc.y, { width: colWidth });

      doc.moveDown(1);
      doc.fillColor('#666666')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Lyrical Themes:', leftCol, doc.y);

      doc.moveDown(0.3);
      doc.fillColor('#333333')
         .fontSize(9)
         .font('Helvetica')
         .text(bandData.lyricalThemes, leftCol, doc.y, { width: colWidth });

      // Right column
      doc.fillColor('#666666')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Live Visuals:', rightCol, detailY);

      doc.moveDown(0.3);
      doc.fillColor('#333333')
         .fontSize(9)
         .font('Helvetica')
         .text(bandData.liveVisuals, rightCol, detailY + 15, { width: colWidth });

      doc.moveDown(1);
      doc.fillColor('#666666')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Influences:', rightCol, doc.y);

      doc.moveDown(0.3);
      doc.fillColor('#333333')
         .fontSize(9)
         .font('Helvetica')
         .text(bandData.influences.join(', '), rightCol, doc.y, { width: colWidth });

      // Reset Y position to after both columns
      doc.y = Math.max(doc.y, detailY + 150);
      doc.moveDown(2);

      // WORLD BUILDING
      addSection(doc, 'Cultural Impact', colors.primary);

      if (bandData.world_building.cultural_impact) {
        doc.fillColor('#333333')
           .fontSize(9)
           .font('Helvetica')
           .text(bandData.world_building.cultural_impact, { align: 'justify' });
        doc.moveDown(0.5);
      }

      if (bandData.world_building.breakthrough_moment) {
        doc.fillColor('#666666')
           .fontSize(9)
           .font('Helvetica-Bold')
           .text('Breakthrough Moment: ', { continued: true })
           .font('Helvetica')
           .text(bandData.world_building.breakthrough_moment);
        doc.moveDown(0.5);
      }

      if (bandData.world_building.hidden_depths) {
        doc.fillColor('#666666')
           .fontSize(9)
           .font('Helvetica-Bold')
           .text('Hidden Depths: ', { continued: true })
           .font('Helvetica')
           .text(bandData.world_building.hidden_depths);
      }

      doc.moveDown(1.5);

      // TAGS
      if (bandData.tags && bandData.tags.length > 0) {
        addSection(doc, 'Tags', colors.primary);

        const tagY = doc.y;
        bandData.tags.forEach((tag, index) => {
          const tagWidth = doc.widthOfString(tag) + 20;
          const tagX = 60 + (index * (tagWidth + 10));

          if (tagX + tagWidth > doc.page.width - 60) {
            doc.moveDown(0.8);
          }

          doc.roundedRect(tagX, doc.y, tagWidth, 20, 10)
             .fillAndStroke('#e0f2fe', '#0284c7');

          doc.fillColor('#0c4a6e')
             .fontSize(8)
             .font('Helvetica')
             .text(tag, tagX + 10, doc.y + 6);
        });

        doc.moveDown(2);
      }

      // NEW PAGE for Suno Prompt
      doc.addPage();

      // SUNO AI PROMPT
      addSection(doc, '🎵 AI Music Generation Prompt', colors.primary);

      doc.fillColor('#666666')
         .fontSize(10)
         .font('Helvetica')
         .text('Use this prompt with Suno.ai or similar AI music generators to create music in this band\'s style:');

      doc.moveDown(0.5);

      const promptY = doc.y;
      doc.roundedRect(50, promptY, doc.page.width - 100, 200, 8)
         .fillAndStroke('#f0f9ff', '#0ea5e9');

      doc.fillColor('#0c4a6e')
         .fontSize(9)
         .font('Helvetica')
         .text(bandData.sunoPrompt, 65, promptY + 15, {
           width: doc.page.width - 130,
           align: 'left'
         });

      doc.moveDown(14);

      // Instructions box
      const instructY = doc.y;
      doc.roundedRect(50, instructY, doc.page.width - 100, 80, 8)
         .fillAndStroke('#fef3c7', '#f59e0b');

      doc.fillColor('#92400e')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('Instructions:', 65, instructY + 10);

      doc.font('Helvetica')
         .text('1. Visit Suno.ai or your preferred AI music generator', 65, instructY + 25)
         .text('2. Copy the entire prompt above', 65, instructY + 37)
         .text('3. Paste it into the prompt field', 65, instructY + 49)
         .text(`4. Generate and enjoy ${bandData.bandName}'s sound!`, 65, instructY + 61);

      // FOOTER
      doc.moveDown(3);
      doc.moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .stroke('#cccccc');

      doc.moveDown(0.5);

      doc.fillColor('#999999')
         .fontSize(9)
         .font('Helvetica')
         .text('Generated by AetherWave Studio © 2024', { align: 'center' });

      doc.fontSize(8)
         .text('This profile contains AI-generated content based on musical analysis', { align: 'center' });

      doc.fontSize(7)
         .text(`Generated: ${new Date().toLocaleString()} | ID: AW-${Date.now().toString().slice(-8)}`, { align: 'center' });

      // Finalize PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Helper function to add styled section headers
 */
function addSection(doc: PDFKit.PDFDocument, title: string, color: string) {
  doc.fillColor(color)
     .fontSize(14)
     .font('Helvetica-Bold')
     .text(title);

  doc.moveTo(50, doc.y + 5)
     .lineTo(doc.page.width - 50, doc.y + 5)
     .lineWidth(2)
     .strokeColor(color)
     .stroke();

  doc.moveDown(0.8);
}

/**
 * Generate filename for the PDF
 */
export function generatePDFFilename(bandName: string): string {
  const safeName = bandName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  return `${safeName}-profile.pdf`;
}

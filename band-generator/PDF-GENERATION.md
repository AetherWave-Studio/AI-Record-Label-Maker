# 📄 PDF Profile Generation

The Band Generator creates comprehensive PDF profiles for every virtual band - a complete, print-ready deliverable document.

## What's Included

Each PDF profile contains:

### Page 1: Band Overview
- **Band Name** (large header with branding)
- **Genre** and generation date
- **Philosophy/Motto** (styled callout box)
- **Band Identity** (positioning statement)
- **Origin Story** (world-building narrative)
- **Band Concept** (complete backstory)
- **Band Members** (with roles and archetypes)
  - Individual member profiles
  - Roles and specialties
  - Personality archetypes
- **Musical Details** (two-column layout)
  - Signature sound
  - Lyrical themes
  - Live visuals
  - Influences
- **Cultural Impact**
  - Breakthrough moments
  - Hidden depths
- **Tags** (visual tag clouds)

### Page 2: AI Music Generation
- **Suno AI Prompt** (complete, copyable)
- **Instructions** (step-by-step guide)
- **Footer** with metadata and timestamp

## Professional Features

✅ **Letter size** (8.5" x 11")
✅ **Print-ready** format
✅ **Styled sections** with color-coded headers
✅ **Two-column layouts** for efficiency
✅ **Callout boxes** for important info
✅ **Professional typography**
✅ **Branded footer** with generation details

## API Usage

### Generate PDF for a Band

```bash
curl -X POST http://localhost:5001/api/band-profile-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "bandData": {
      "bandName": "Quantum Echoes",
      "genre": "Electronic",
      "philosophy": "Digital Dreams",
      ...
    },
    "imageUrl": "https://..."
  }' \
  --output quantum-echoes-profile.pdf
```

### Response

The API returns a **PDF binary file** with headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="band-name-profile.pdf"`

## Integration Examples

### Node.js / Express

```typescript
import { generateBandProfilePDF, generatePDFFilename } from '@aetherwave/band-generator';

// Generate PDF buffer
const pdfBuffer = await generateBandProfilePDF(bandData, imageUrl);

// Save to file
fs.writeFileSync('band-profile.pdf', pdfBuffer);

// Or send as HTTP response
res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', `attachment; filename="${generatePDFFilename(bandData.bandName)}"`);
res.send(pdfBuffer);
```

### Frontend (Download PDF)

```typescript
// After band generation
const response = await fetch('/api/band-generation', {
  method: 'POST',
  body: formData
});

const result = await response.json();

// Generate PDF
const pdfResponse = await fetch('/api/band-profile-pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bandData: result.winner,
    imageUrl: result.winner.imageUrl
  })
});

// Download the PDF
const blob = await pdfResponse.blob();
const url = window.URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = `${result.winner.bandName}-profile.pdf`;
link.click();
```

### React Component

```jsx
function DownloadPDFButton({ bandData, imageUrl }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/band-profile-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bandData, imageUrl })
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${bandData.bandName}-profile.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleDownload} disabled={loading}>
      {loading ? 'Generating PDF...' : '📄 Download Profile'}
    </button>
  );
}
```

## Use Cases

### 1. Artist Portfolios
Complete profile documents for artist submissions

### 2. Press Kits
Professional media kits for virtual bands

### 3. Collection Management
Printable records of your band collection

### 4. Presentations
Show virtual bands in meetings or pitches

### 5. Physical Distribution
Print and distribute band profiles

### 6. Archival
Long-term storage of band data

### 7. Licensing
Official documentation for licensing deals

## Customization

### Modify Colors (Programmatic)

```typescript
// The PDF uses band's color palette
const customBandData = {
  ...bandData,
  colorPalette: {
    background: '#1a1a1a',
    textPrimary: '#ffffff',
    highlight: '#ff00ff'  // Used for accents
  }
};

const pdfBuffer = await generateBandProfilePDF(customBandData);
```

### Add Custom Metadata

The PDF includes embedded metadata:
- Title: Band name + "Complete Profile"
- Author: "AetherWave Studio"
- Subject: "Virtual Band Profile"
- Keywords: Genre + Band name

## PDF Specifications

- **Format**: PDF 1.3 (compatible with all readers)
- **Size**: Letter (8.5" x 11" / 612 x 792 pt)
- **Margins**: 50pt all sides
- **Font**: Helvetica (embedded)
- **Colors**: RGB color space
- **Compression**: Enabled
- **Average File Size**: 50-150 KB

## Tips

1. **Always generate PDF after band creation** - It's the official deliverable
2. **Store PDFs for archival** - They're self-contained documents
3. **Include image URLs** - Enhances the profile visually
4. **Batch generate** - Create PDFs for entire collections
5. **Print settings** - Use "Fit to page" for best results

## Troubleshooting

### PDF won't generate?
- Check that `pdfkit` is installed
- Verify bandData is complete EnhancedBandData type
- Ensure Node.js version >= 18

### PDF missing content?
- Verify all bandData fields are populated
- Check world_building object exists
- Confirm members array has data

### PDF too large?
- PDFs are typically 50-150 KB
- If larger, check embedded images
- Consider optimizing image URLs

### Fonts not rendering?
- PDFKit uses built-in fonts (Helvetica, Times, Courier)
- No external font files needed
- Fonts are always embedded

## Server-Side vs Client-Side

### Server-Side Generation (Recommended) ✅
- Consistent output
- No browser compatibility issues
- Smaller payload (send once)
- Better performance
- **This is what band-generator uses**

### Client-Side Generation ❌
- Requires large libraries in browser
- Browser compatibility issues
- Slower generation
- Not recommended

## Complete Workflow

```bash
# 1. Generate band
curl -X POST http://localhost:5001/api/band-generation \
  -F "audio=@song.mp3" \
  -o band-result.json

# 2. Extract band data
BAND_DATA=$(cat band-result.json | jq '.winner')

# 3. Generate PDF
curl -X POST http://localhost:5001/api/band-profile-pdf \
  -H "Content-Type: application/json" \
  -d "$BAND_DATA" \
  -o complete-profile.pdf

# 4. Open PDF
open complete-profile.pdf  # macOS
# or
start complete-profile.pdf  # Windows
# or
xdg-open complete-profile.pdf  # Linux
```

---

**The PDF profile is your complete deliverable!** 📄

Every virtual band gets a professional, print-ready PDF document ready for distribution, archival, or presentation.

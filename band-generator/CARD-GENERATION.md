# 🎴 Trading Card Generation

The Band Generator automatically creates beautiful SVG trading cards for every virtual band generated.

## Card Features

Each trading card includes:

- **Artist Portrait**: AI-generated or custom band photo
- **Band Name**: Prominently displayed
- **Genre Tag**: Visual genre indicator
- **Stats Display**:
  - Total streams
  - Physical copies sold
  - Digital downloads
  - Member count
- **FAME Score**: Visual star rating
- **Style Philosophy**: Band's artistic mission
- **Rarity Badge**: Card rarity indicator
- **Theme Styling**: Dark, light, or vibrant themes

## Card Themes

### Dark Theme (Default)
- Dark background (#1a1a1a)
- Cyan accents (#00ffff)
- High contrast for readability
- Perfect for modern digital displays

### Light Theme
- White background (#ffffff)
- Blue accents (#0066cc)
- Clean, professional look
- Great for print materials

### Vibrant Theme
- Deep purple background (#1a0a2e)
- Hot pink accents (#ff00aa)
- Neon green highlights (#00ff88)
- Eye-catching and energetic

## Response Format

The card is returned as a **base64-encoded SVG** in the `cardImageUrl` field:

```json
{
  "winner": {
    "bandName": "Quantum Echoes",
    "imageUrl": "https://...",
    "cardImageUrl": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0i..."
  }
}
```

## Using the Card Image

### Display in HTML

```html
<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0i..." alt="Band Card" />
```

### Save as SVG File

```javascript
const cardData = response.winner.cardImageUrl;
const svgContent = Buffer.from(
  cardData.replace('data:image/svg+xml;base64,', ''),
  'base64'
).toString('utf8');

fs.writeFileSync('band-card.svg', svgContent);
```

### Convert to PNG

```javascript
import sharp from 'sharp';

const cardData = response.winner.cardImageUrl;
const svgBuffer = Buffer.from(
  cardData.replace('data:image/svg+xml;base64,', ''),
  'base64'
);

await sharp(svgBuffer)
  .png()
  .toFile('band-card.png');
```

### Display in React

```jsx
function BandCard({ cardImageUrl }) {
  return (
    <div className="card-container">
      <img
        src={cardImageUrl}
        alt="Band Trading Card"
        className="trading-card"
        style={{ width: '350px', height: '500px' }}
      />
    </div>
  );
}
```

## Programmatic Card Generation

You can also generate cards independently:

```typescript
import { generateTradingCardSVG, generateTradingCardImage } from '@aetherwave/band-generator';

// Generate SVG string
const svgString = generateTradingCardSVG(
  artistData,
  imageUrl,
  'realistic',  // artStyle
  'dark',       // cardTheme
  5             // FAME score
);

// Generate base64 data URL
const dataUrl = generateTradingCardImage(
  artistData,
  imageUrl,
  'realistic',
  'dark',
  5
);
```

## Card Dimensions

- **Width**: 350px
- **Height**: 500px
- **Format**: SVG (scalable to any size)
- **Aspect Ratio**: 7:10 (standard trading card ratio)

## Customization Options

### Change Theme at Generation

```bash
curl -X POST http://localhost:5001/api/band-generation \
  -F "audio=@song.mp3" \
  -F "cardTheme=vibrant"  # dark, light, or vibrant
```

### Override Stats (Programmatic)

```typescript
const customArtistData = {
  ...artistData,
  totalStreams: 1500000,
  physicalCopies: 50000,
  digitalDownloads: 250000
};

const cardUrl = generateTradingCardImage(customArtistData, imageUrl);
```

## Use Cases

### 1. Digital Collectibles
Display cards in a gallery or collection interface

### 2. Shareable Assets
Share on social media or messaging apps

### 3. Print Materials
Export as high-res PNG for physical prints

### 4. NFTs
Mint cards as blockchain tokens

### 5. Promotional Content
Use for artist marketing and branding

### 6. Game Elements
Integrate into music games or simulations

## Export Examples

### PDF Export

```typescript
import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';

const doc = new PDFDocument({ size: [350, 500] });
doc.pipe(fs.createWriteStream('card.pdf'));

SVGtoPDF(doc, svgString, 0, 0);
doc.end();
```

### High-Res PNG

```typescript
import sharp from 'sharp';

await sharp(Buffer.from(svgString))
  .png({ quality: 100 })
  .resize(1400, 2000) // 4x resolution
  .toFile('card-hires.png');
```

### Print-Ready Format

```typescript
await sharp(Buffer.from(svgString))
  .tiff({
    quality: 100,
    compression: 'lzw'
  })
  .resize(2100, 3000) // 300 DPI for print
  .toFile('card-print.tiff');
```

## Tips

1. **Always include the card in deliverables** - It's a complete visual representation
2. **Cache generated cards** - They don't change once generated
3. **Provide download options** - Let users save as SVG, PNG, or PDF
4. **Show card previews** - Display cards in UI before final selection
5. **Support multiple themes** - Let users choose their preferred style

## Troubleshooting

### Card not displaying?
- Check that the data URL format is correct
- Ensure the SVG is valid XML
- Verify browser supports inline SVG

### Image not showing in card?
- Confirm imageUrl is accessible
- Check for CORS issues with external images
- Use data URLs for embedded images

### Stats showing zeros?
- Stats come from artistData properties
- Default to 0 if not provided
- Use realistic starting metrics in Ghost platform

---

**The trading card is your deliverable!** 🎴

Every band generation includes a complete, shareable trading card ready for display, export, or integration.

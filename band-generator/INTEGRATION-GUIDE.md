# 🔌 Integration Guide

The band-generator is a **standard REST API**, so you can integrate it into **any frontend framework** or plain HTML.

## Quick Answer

✅ **Yes, you can use it with plain HTML!**
✅ **No React/TSX required!**
✅ **Works with any framework: Vue, Angular, Svelte, etc.**
✅ **Even works with PHP, Python, Ruby backends**

---

## Integration Options

### Option 1: Plain HTML/JavaScript ⭐ (Easiest)

See: `examples/vanilla-html-integration.html`

```html
<script>
async function generateBand(audioFile) {
  const formData = new FormData();
  formData.append('audio', audioFile);
  formData.append('mode', 'explore');

  const response = await fetch('http://localhost:5001/api/band-generation', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  // You now have:
  console.log(data.winner.bandName);
  console.log(data.winner.imageUrl);
  console.log(data.winner.cardImageUrl);
}
</script>
```

**No build tools, no npm, no React - just works!**

### Option 2: React/Next.js

```tsx
import { useState } from 'react';

export function BandGenerator() {
  const [band, setBand] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('audio', file);

    const response = await fetch('http://localhost:5001/api/band-generation', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    setBand(data.winner);
    setLoading(false);
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {band && (
        <div>
          <h1>{band.bandName}</h1>
          <img src={band.imageUrl} alt="Band" />
          <img src={band.cardImageUrl} alt="Card" />
        </div>
      )}
    </div>
  );
}
```

### Option 3: Vue.js

```vue
<template>
  <div>
    <input type="file" @change="generateBand" />
    <div v-if="band">
      <h1>{{ band.bandName }}</h1>
      <img :src="band.imageUrl" alt="Band" />
      <img :src="band.cardImageUrl" alt="Card" />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      band: null
    };
  },
  methods: {
    async generateBand(event) {
      const formData = new FormData();
      formData.append('audio', event.target.files[0]);

      const response = await fetch('http://localhost:5001/api/band-generation', {
        method: 'POST',
        body: formData
      });

      this.band = (await response.json()).winner;
    }
  }
};
</script>
```

### Option 4: jQuery

```javascript
$('#uploadForm').submit(function(e) {
  e.preventDefault();

  var formData = new FormData();
  formData.append('audio', $('#audioFile')[0].files[0]);

  $.ajax({
    url: 'http://localhost:5001/api/band-generation',
    type: 'POST',
    data: formData,
    processData: false,
    contentType: false,
    success: function(data) {
      $('#bandName').text(data.winner.bandName);
      $('#bandImage').attr('src', data.winner.imageUrl);
      $('#tradingCard').attr('src', data.winner.cardImageUrl);
    }
  });
});
```

### Option 5: Server-Side (PHP, Python, Node.js backend)

**PHP:**
```php
<?php
$ch = curl_init('http://localhost:5001/api/band-generation');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, [
    'audio' => new CURLFile($_FILES['audio']['tmp_name']),
    'mode' => 'explore'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$data = json_decode($response, true);

echo $data['winner']['bandName'];
?>
```

**Python (Flask):**
```python
import requests

files = {'audio': open('song.mp3', 'rb')}
data = {'mode': 'explore'}

response = requests.post(
    'http://localhost:5001/api/band-generation',
    files=files,
    data=data
)

band = response.json()['winner']
print(band['bandName'])
```

---

## Complete HTML Example

We've created a **fully functional HTML page** with NO frameworks:

📄 **`band-generator/examples/vanilla-html-integration.html`**

Features:
- ✅ File upload interface
- ✅ All generation options (mode, style, theme)
- ✅ Optional customization (band name, genre)
- ✅ Loading spinner
- ✅ Results display (band info, image, card)
- ✅ Download buttons (image, card, PDF)
- ✅ Beautiful dark theme UI
- ✅ Responsive design
- ✅ Zero dependencies
- ✅ Copy-paste ready

**To use it:**

1. Copy the HTML file to your web server
2. Update the API_URL (line 349)
3. Open in browser - it just works!

---

## API Endpoints Reference

### Generate Band
```
POST /api/band-generation
Content-Type: multipart/form-data

Body:
- audio: File (required)
- mode: "explore" | "refine" (optional)
- artStyle: "realistic" | "anime" | "abstract" (optional)
- cardTheme: "dark" | "light" | "vibrant" (optional)
- userBandName: string (optional)
- songName: string (optional)
- userGenre: string (optional)

Response: JSON
{
  "winner": {
    "bandName": "...",
    "genre": "...",
    "imageUrl": "...",
    "cardImageUrl": "data:image/svg+xml;base64,...",
    ...all other band data
  },
  "alternatives": [...],  // only in explore mode
  "metadata": {...}
}
```

### Generate PDF
```
POST /api/band-profile-pdf
Content-Type: application/json

Body:
{
  "bandData": { ...EnhancedBandData },
  "imageUrl": "..."
}

Response: PDF file (application/pdf)
```

### Health Check
```
GET /api/health

Response: JSON
{
  "status": "ok",
  "service": "AetherWave Band Generator",
  "version": "1.0.0"
}
```

---

## CORS Setup (Important!)

If you're calling from a different domain, add CORS headers:

**Already included in band-generator:**
```javascript
// In server.ts
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
```

**For production**, change `'*'` to your specific domain:
```javascript
res.header('Access-Control-Allow-Origin', 'https://yourdomain.com');
```

---

## Embedding in Existing Sites

### WordPress
Add to a page/post with HTML widget:
```html
<iframe src="/band-generator.html" width="100%" height="800px"></iframe>
```

### Shopify
Add as custom page or app block

### Wix/Squarespace
Embed using HTML iframe component

### Any CMS
Upload HTML file, link to it, or iframe it

---

## Real-World Integration Examples

### Example 1: Music Producer Website
```html
<!-- Add to your existing portfolio page -->
<div id="band-generator-section">
  <h2>Generate Your Virtual Band</h2>
  <input type="file" id="audioUpload" accept="audio/*">
  <button onclick="generate()">Generate</button>
  <div id="results"></div>
</div>

<script>
async function generate() {
  const file = document.getElementById('audioUpload').files[0];
  const formData = new FormData();
  formData.append('audio', file);

  const res = await fetch('http://localhost:5001/api/band-generation', {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  document.getElementById('results').innerHTML = `
    <h3>${data.winner.bandName}</h3>
    <img src="${data.winner.cardImageUrl}" />
  `;
}
</script>
```

### Example 2: Music Community Platform
Integrate into user profiles, post creation, or artist discovery

### Example 3: Music Education Site
Let students create bands for assignments

### Example 4: Music NFT Marketplace
Generate band metadata for NFT drops

---

## Deployment Considerations

### Development
```bash
API_URL = 'http://localhost:5001'
```

### Production
```bash
API_URL = 'https://api.yourdomain.com'
```

### Same Server
If band-generator and your site are on the same server:
```bash
API_URL = '/api'  # Use relative URLs
```

---

## No Framework Needed!

The band-generator is **just an HTTP API**. You can:

✅ Call it from vanilla JavaScript
✅ Call it from jQuery
✅ Call it from React/Vue/Angular
✅ Call it from mobile apps
✅ Call it from desktop apps
✅ Call it from server-side code
✅ Call it from command line (curl)

**It's as simple as:**
```javascript
fetch('http://localhost:5001/api/band-generation', {
  method: 'POST',
  body: formData
})
```

---

## Try the Example!

1. **Start the band-generator:**
   ```bash
   cd band-generator
   npm run dev
   ```

2. **Open the example HTML:**
   ```bash
   # Open in browser
   open examples/vanilla-html-integration.html
   # or
   start examples/vanilla-html-integration.html
   ```

3. **Upload a song and generate!**

No build process, no npm install in your project, no React - just works! 🎉

---

## Questions?

- **Can I use it without Node.js on my site?** YES - it's just an API call
- **Do I need to install npm packages?** NO - just call the API
- **Can I customize the HTML?** YES - it's your code
- **Will it work on mobile?** YES - responsive design included
- **Can I style it differently?** YES - it's all CSS you control

The band-generator server handles the AI, you just call it from any frontend you want!

import type { ArtistData } from "@shared/schema";

export async function generateArtistProfilePDF(artistData: ArtistData): Promise<void> {
  try {
    const response = await fetch("/api/generate-profile-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ artistData }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate PDF");
    }

    // Get the PDF blob
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${artistData.bandName || "artist"}-profile.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generating PDF:", error);
    // Fallback: open detailed view in new tab
    openDetailedProfile(artistData);
  }
}

function openDetailedProfile(artistData: ArtistData): void {
  const detailWindow = window.open("", "_blank");
  if (detailWindow) {
    detailWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${artistData.bandName} - Full Profile</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
          h1 { color: #2563eb; border-bottom: 2px solid #2563eb; }
          h2 { color: #1e40af; margin-top: 30px; }
          .member { background: #f3f4f6; padding: 10px; margin: 10px 0; border-radius: 5px; }
          .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        </style>
      </head>
      <body>
        <h1>${artistData.bandName || "Unknown Artist"}</h1>
        <p><strong>Genre:</strong> ${artistData.genre || "Unknown"}</p>
        <p><strong>Philosophy:</strong> ${artistData.philosophy || "No philosophy provided"}</p>
        
        <h2>Background</h2>
        <p>${artistData.bandConcept || "No background information available"}</p>
        
        ${artistData.members && artistData.members.length > 0 ? `
          <h2>Band Members</h2>
          ${artistData.members.map(member => `
            <div class="member">
              <strong>${member.name || "Unknown Member"}</strong>
              ${member.role ? ` - ${member.role}` : ""}
              ${member.archetype ? `<br><em>${member.archetype}</em>` : ""}
            </div>
          `).join("")}
        ` : ""}
        
        <h2>Additional Information</h2>
        <div class="stats">
          <div><strong>Formation Year:</strong> 2024</div>
          <div><strong>Card Rarity:</strong> Rare</div>
          <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
          <div><strong>Source:</strong> SoundCard Generator</div>
        </div>
      </body>
      </html>
    `);
    detailWindow.document.close();
  }
}
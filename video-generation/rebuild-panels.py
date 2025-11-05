# Script to rebuild video-generation.html with proper 3-column grid layout

# Read the original file
with open('video-generation.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Keep everything before line 859 (where panels start)
header = ''.join(lines[:858])

# Keep everything after line 1116 (after panels end)
footer = ''.join(lines[1116:])

# Build the new panels HTML with proper 3-column, 2-row grid structure
new_panels = '''    <!-- 3-Column, 2-Row Panel Layout -->
    <div class="panels-container">

      <!-- LEFT PANEL: Generate (Full Height) -->
      <div class="panel panel-generate">
        <div class="panel-header">
          <div class="panel-title">
            <i class="ri-magic-line"></i> Generate Video
          </div>
          <div class="panel-description">Create AI-powered videos from text or images</div>
        </div>
        <div class="panel-content">
          <!-- Generation Settings -->
          <div class="form-group">
            <label class="form-label">Prompt</label>
            <textarea class="form-textarea" id="promptInput" placeholder="Describe your video scene in detail... (e.g., 'A cinematic shot of a futuristic city at sunset with flying cars')"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Aspect Ratio</label>
            <select class="form-select" id="aspectRatio">
              <option value="16:9">16:9 (Landscape - YouTube)</option>
              <option value="9:16">9:16 (Portrait - TikTok/Reels)</option>
              <option value="1:1">1:1 (Square - Instagram)</option>
              <option value="4:3">4:3 (Classic Landscape)</option>
              <option value="21:9">21:9 (Ultra-Wide Cinematic)</option>
            </select>
          </div>

          <div class="slider-group">
            <div class="slider-header">
              <label class="form-label">Duration</label>
              <span class="slider-value" id="durationValue">5s</span>
            </div>
            <input type="range" id="durationSlider" min="5" max="15" value="5" step="1">
          </div>

          <div class="slider-group">
            <div class="slider-header">
              <label class="form-label">Resolution (Seedance only)</label>
              <span class="slider-value" id="resolutionValue">720p</span>
            </div>
            <select class="form-select" id="resolution">
              <option value="480p">480p (SD)</option>
              <option value="720p" selected>720p (HD)</option>
              <option value="1080p">1080p (Full HD)</option>
              <option value="4k">4K (Ultra HD - Pro only)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Reference Image (Optional)</label>
            <div class="upload-area" id="uploadArea">
              <i class="ri-image-add-line upload-icon"></i>
              <p class="upload-text">Click to upload or drag and drop</p>
              <p class="upload-hint">PNG, JPG up to 10MB</p>
              <input type="file" id="imageInput" accept="image/*" style="display: none;">
              <img id="previewImage" class="preview-image" style="display: none;">
            </div>
          </div>

          <button class="btn-generate" id="generateBtn">
            <i class="ri-play-circle-line"></i>
            <span>Generate Video</span>
          </button>

          <!-- Progress Card -->
          <div class="progress-card" id="progressCard">
            <div class="spinner"></div>
            <p class="progress-text" id="progressText">Initializing generation...</p>
            <p class="progress-subtitle">This may take a few minutes</p>
          </div>

          <!-- Result Card -->
          <div class="result-card" id="resultCard">
            <video id="resultVideo" class="result-video" controls></video>
            <div class="result-actions">
              <button class="btn-secondary" onclick="downloadVideo()">
                <i class="ri-download-line"></i>
                Download
              </button>
              <button class="btn-secondary" onclick="saveProject()">
                <i class="ri-save-line"></i>
                Save to Projects
              </button>
              <button class="btn-secondary" onclick="resetGeneration()">
                <i class="ri-refresh-line"></i>
                Generate Another
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- MIDDLE TOP: AI Model Selection -->
      <div class="panel model-selection-section">
        <div class="panel-header">
          <div class="panel-title">
            <i class="ri-cpu-line"></i> Select AI Model
          </div>
          <div class="panel-description">Choose the AI model for video generation</div>
        </div>
        <div class="panel-content">
          <div class="model-grid">
            <div class="model-card selected" data-model="veo3_fast">
              <div class="model-name">
                VEO 3 Fast
                <span class="model-badge">Premium</span>
              </div>
              <div class="model-description">
                Google's latest video model. 8s fixed duration, ultra-fast generation.
              </div>
              <div class="model-specs">
                <div class="model-spec">
                  <i class="ri-flashlight-line"></i>
                  <span>30 credits</span>
                </div>
                <div class="model-spec">
                  <i class="ri-time-line"></i>
                  <span>~2 mins</span>
                </div>
              </div>
            </div>

            <div class="model-card" data-model="sora2">
              <div class="model-name">
                SORA 2
                <span class="model-badge">Premium</span>
              </div>
              <div class="model-description">
                OpenAI's powerful model. 10-15s videos with cinematic quality.
              </div>
              <div class="model-specs">
                <div class="model-spec">
                  <i class="ri-flashlight-line"></i>
                  <span>15 credits/10s</span>
                </div>
                <div class="model-spec">
                  <i class="ri-time-line"></i>
                  <span>~3-5 mins</span>
                </div>
              </div>
            </div>

            <div class="model-card" data-model="seedance-lite">
              <div class="model-name">
                Seedance Lite
                <span class="model-badge" style="background: var(--aetherwave-cyan);">Fast</span>
              </div>
              <div class="model-description">
                Quick and affordable. Perfect for rapid prototyping and iterations.
              </div>
              <div class="model-specs">
                <div class="model-spec">
                  <i class="ri-flashlight-line"></i>
                  <span>8 credits/5s</span>
                </div>
                <div class="model-spec">
                  <i class="ri-time-line"></i>
                  <span>~1-2 mins</span>
                </div>
              </div>
            </div>

            <div class="model-card" data-model="seedance-pro">
              <div class="model-name">
                Seedance Pro
                <span class="model-badge">High Quality</span>
              </div>
              <div class="model-description">
                Professional quality with advanced controls. Up to 4K resolution.
              </div>
              <div class="model-specs">
                <div class="model-spec">
                  <i class="ri-flashlight-line"></i>
                  <span>15 credits/5s</span>
                </div>
                <div class="model-spec">
                  <i class="ri-time-line"></i>
                  <span>~2-4 mins</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MIDDLE BOTTOM: Edit -->
      <div class="panel panel-edit">
        <div class="panel-header">
          <div class="panel-title">
            <i class="ri-scissors-line"></i> Video Editing
          </div>
          <div class="panel-description">Edit and enhance your videos</div>
        </div>
        <div class="panel-content">
          <div class="form-group">
            <label class="form-label">Upload Video to Edit</label>
            <div class="upload-area" id="editUploadArea">
              <i class="ri-video-add-line upload-icon"></i>
              <p class="upload-text">Click to upload video</p>
              <p class="upload-hint">MP4, WebM up to 100MB</p>
              <input type="file" id="videoEditInput" accept="video/*" style="display: none;">
            </div>
          </div>

          <video id="editPreview" class="result-video" style="display: none;" controls></video>

          <div class="form-group" id="editingTools" style="display: none;">
            <h3 style="margin-bottom: 1rem; color: var(--text-secondary);">Editing Options</h3>

            <button class="btn-secondary" style="width: 100%; margin-bottom: 0.75rem;" onclick="removeBackground()">
              <i class="ri-eraser-line"></i>
              Remove Background (AI-powered)
            </button>

            <button class="btn-secondary" style="width: 100%; margin-bottom: 0.75rem;" onclick="trimVideo()">
              <i class="ri-scissors-cut-line"></i>
              Trim / Cut Scenes
            </button>

            <button class="btn-secondary" style="width: 100%; margin-bottom: 0.75rem;" onclick="addEffects()">
              <i class="ri-contrast-drop-line"></i>
              Add Visual Effects
            </button>

            <button class="btn-secondary" style="width: 100%; margin-bottom: 0.75rem;" onclick="addAudio()">
              <i class="ri-music-line"></i>
              Add Background Music
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHT PANEL: Projects (Full Height) -->
      <div class="panel panel-projects">
        <div class="panel-header">
          <div class="panel-title">
            <i class="ri-folder-video-line"></i> My Video Projects
          </div>
          <div class="panel-description">Your saved video projects</div>
        </div>
        <div class="panel-content">
          <div class="project-grid" id="projectGrid">
            <!-- Projects will be loaded here -->
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
              <i class="ri-folder-open-line" style="font-size: 4rem; display: block; margin-bottom: 1rem; opacity: 0.3;"></i>
              <p>No projects yet. Generate your first video to get started!</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>

'''

# Write the new file
with open('video-generation.html', 'w', encoding='utf-8') as f:
    f.write(header + new_panels + footer)

print("File successfully rebuilt with 3-column, 2-row grid layout!")
print("Layout: Generate (left, full) | AI Models (top-mid) + Edit (bottom-mid) | Projects (right, full)")

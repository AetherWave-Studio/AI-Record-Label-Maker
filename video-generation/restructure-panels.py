# Script to restructure panels: Left=Media Uploads, Middle-Bottom=Generation Controls

# Read the current file
with open('video-generation.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Keep everything before line 859 (where panels start)
header = ''.join(lines[:858])

# Keep everything after the panels (find the closing div for panels-container)
# Looking for the script section which starts around line 1118
footer = ''.join(lines[1118:])

# Build new panels structure
new_panels = '''    <!-- 3-Column, 2-Row Panel Layout -->
    <div class="panels-container">

      <!-- LEFT PANEL: Recent Media Uploads (Full Height) -->
      <div class="panel panel-media">
        <div class="panel-header">
          <div class="panel-title">
            <i class="ri-folder-video-line"></i> Recent Media
          </div>
          <div class="panel-description">Your recently created videos and uploads</div>
        </div>
        <div class="panel-content">
          <div class="project-grid" id="mediaGrid">
            <!-- Media will be loaded here -->
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
              <i class="ri-video-line" style="font-size: 4rem; display: block; margin-bottom: 1rem; opacity: 0.3;"></i>
              <p>No media yet. Generate your first video!</p>
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

      <!-- MIDDLE BOTTOM: Generate Video -->
      <div class="panel panel-generate">
        <div class="panel-header">
          <div class="panel-title">
            <i class="ri-magic-line"></i> Generate Video
          </div>
          <div class="panel-description">Create AI-powered videos from text or images</div>
        </div>
        <div class="panel-content">
          <div class="form-group">
            <label class="form-label">Prompt</label>
            <textarea class="form-textarea" id="promptInput" placeholder="Describe your video scene..." style="min-height: 80px;"></textarea>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Aspect Ratio</label>
              <select class="form-select" id="aspectRatio">
                <option value="16:9">16:9 (YouTube)</option>
                <option value="9:16">9:16 (TikTok)</option>
                <option value="1:1">1:1 (Instagram)</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Duration</label>
              <select class="form-select" id="durationSelect">
                <option value="5">5 seconds</option>
                <option value="10">10 seconds</option>
                <option value="15">15 seconds</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Reference Image (Optional)</label>
            <div class="upload-area" id="uploadArea" style="padding: 1rem;">
              <i class="ri-image-add-line upload-icon" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
              <p class="upload-text" style="font-size: 0.875rem;">Click to upload</p>
              <input type="file" id="imageInput" accept="image/*" style="display: none;">
              <img id="previewImage" class="preview-image" style="display: none; max-height: 100px;">
            </div>
          </div>

          <button class="btn-generate" id="generateBtn">
            <i class="ri-play-circle-line"></i>
            <span>Generate Video</span>
          </button>

          <!-- Progress Card -->
          <div class="progress-card" id="progressCard">
            <div class="spinner"></div>
            <p class="progress-text" id="progressText">Generating...</p>
            <p class="progress-subtitle">This may take a few minutes</p>
          </div>

          <!-- Result Card -->
          <div class="result-card" id="resultCard">
            <video id="resultVideo" class="result-video" controls style="max-height: 300px;"></video>
            <div class="result-actions">
              <button class="btn-secondary" onclick="downloadVideo()">
                <i class="ri-download-line"></i>
                Download
              </button>
              <button class="btn-secondary" onclick="saveProject()">
                <i class="ri-save-line"></i>
                Save
              </button>
              <button class="btn-secondary" onclick="resetGeneration()">
                <i class="ri-refresh-line"></i>
                New
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT PANEL: Projects & Tools (Full Height) -->
      <div class="panel panel-projects">
        <div class="panel-header">
          <div class="panel-title">
            <i class="ri-tools-line"></i> Video Tools
          </div>
          <div class="panel-description">Edit and manage your videos</div>
        </div>
        <div class="panel-content">
          <!-- Editing Tools -->
          <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.75rem;">Quick Actions</h3>

            <button class="btn-secondary" style="width: 100%; margin-bottom: 0.5rem;" onclick="document.getElementById('videoEditInput').click()">
              <i class="ri-upload-line"></i>
              Upload Video
            </button>
            <input type="file" id="videoEditInput" accept="video/*" style="display: none;">

            <button class="btn-secondary" style="width: 100%; margin-bottom: 0.5rem;" onclick="removeBackground()">
              <i class="ri-eraser-line"></i>
              Remove Background
            </button>

            <button class="btn-secondary" style="width: 100%;" onclick="addEffects()">
              <i class="ri-contrast-drop-line"></i>
              Add Effects
            </button>
          </div>

          <!-- Saved Projects -->
          <div>
            <h3 style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.75rem;">Saved Projects</h3>
            <div id="projectGrid" style="display: flex; flex-direction: column; gap: 0.5rem;">
              <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <i class="ri-folder-open-line" style="font-size: 3rem; display: block; margin-bottom: 0.5rem; opacity: 0.3;"></i>
                <p style="font-size: 0.875rem;">No saved projects</p>
              </div>
            </div>
          </div>

          <video id="editPreview" class="result-video" style="display: none; margin-top: 1rem;" controls></video>
        </div>
      </div>

    </div>
  </div>

'''

# Write the new file
with open('video-generation.html', 'w', encoding='utf-8') as f:
    f.write(header + new_panels + footer)

print("File successfully restructured!")
print("Layout: Media Uploads (left) | AI Models (top-mid) + Generate (bottom-mid) | Tools/Projects (right)")

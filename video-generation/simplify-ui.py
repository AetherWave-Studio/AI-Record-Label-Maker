# Script to simplify UI: Replace model cards with hero section and add dropdown to form

# Read the current file
with open('video-generation.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the model selection section with hero section
old_middle_top = '''      <!-- MIDDLE TOP: AI Model Selection -->
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
      </div>'''

new_middle_top = '''      <!-- MIDDLE TOP: Hero Section -->
      <div class="hero-text">
        <h1>AI Video Generation Studio</h1>
        <p class="subtitle">Create stunning AI-powered videos from text prompts and images</p>
      </div>'''

# Replace middle-top section
content = content.replace(old_middle_top, new_middle_top)

# Add model dropdown to the generation form (after the prompt textarea)
old_form_start = '''          <div class="form-group">
            <label class="form-label">Prompt</label>
            <textarea class="form-textarea" id="promptInput" placeholder="Describe your video scene..." style="min-height: 80px;"></textarea>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">'''

new_form_start = '''          <div class="form-group">
            <label class="form-label">Prompt</label>
            <textarea class="form-textarea" id="promptInput" placeholder="Describe your video scene..." style="min-height: 80px;"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">AI Model</label>
            <select class="form-select" id="modelSelect">
              <option value="veo3_fast">VEO 3 Fast (Premium - 30 credits, ~2 mins)</option>
              <option value="sora2">SORA 2 (Premium - 15 credits/10s, ~3-5 mins)</option>
              <option value="seedance-lite">Seedance Lite (Fast - 8 credits/5s, ~1-2 mins)</option>
              <option value="seedance-pro">Seedance Pro (High Quality - 15 credits/5s, ~2-4 mins)</option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">'''

content = content.replace(old_form_start, new_form_start)

# Update CSS to add hero-text styling and adjust grid positioning
old_css_model_section = '''    .model-selection-section {
      grid-column: 2 / 3;
      grid-row: 1 / 2;
    }'''

new_css_hero = '''    .hero-text {
      grid-column: 2 / 3;
      grid-row: 1 / 2;
      text-align: center;
      animation: fadeInUp 0.8s ease-out;
      background: url('/assets/header-panel_1761541736595.png') no-repeat center center, linear-gradient(135deg, rgba(13, 11, 21, 0.98), rgba(20, 15, 35, 0.98));
      background-size: cover;
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.75rem 2rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .hero-text h1 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      color: var(--text-primary);
      background: linear-gradient(135deg, var(--aetherwave-purple), var(--aetherwave-cyan));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .subtitle {
      font-size: 1rem;
      color: var(--text-secondary);
      margin: 0;
    }'''

content = content.replace(old_css_model_section, new_css_hero)

# Remove model-card related CSS
model_card_css_patterns = [
    '''    .model-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .model-card {
      background: var(--panel-bg);
      border: 2px solid var(--border-color);
      border-radius: 12px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .model-card:hover {
      border-color: var(--aetherwave-purple);
      transform: translateY(-2px);
    }

    .model-card.selected {
      border-color: var(--aetherwave-purple);
      background: linear-gradient(135deg, rgba(138, 92, 246, 0.1), rgba(6, 182, 212, 0.1));
    }

    .model-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .model-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      background: var(--aetherwave-purple);
      border-radius: 6px;
      color: white;
    }

    .model-description {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 0.75rem;
      line-height: 1.4;
    }

    .model-specs {
      display: flex;
      gap: 1rem;
    }

    .model-spec {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .model-spec i {
      font-size: 0.875rem;
    }'''
]

for pattern in model_card_css_patterns:
    content = content.replace(pattern, '')

# Write the updated file
with open('video-generation.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("File successfully updated!")
print("Changes made:")
print("- Replaced model card grid with hero section")
print("- Added model dropdown to generation form")
print("- Updated CSS styling to match aimusic-media.html")

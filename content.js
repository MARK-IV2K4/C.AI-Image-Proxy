// Character AI Image Proxy Content Script
class ImageProxy {
    constructor() {
        this.imageMap = new Map();
        this.observer = null;
        this.init();
    }

    async init() {
        // Load saved image mappings
        await this.loadImageMappings();

        // Start observing for new images
        this.startObserving();

        // Process existing images
        this.processExistingImages();

        console.log('Character AI Image Proxy initialized');
    }

    async loadImageMappings() {
        try {
            const result = await chrome.storage.local.get(['imageMappings']);
            if (result.imageMappings) {
                this.imageMap = new Map(Object.entries(result.imageMappings));
            }
        } catch (error) {
            console.log('No saved mappings found');
        }
    }

    async saveImageMappings() {
        const mappingsObj = Object.fromEntries(this.imageMap);
        await chrome.storage.local.set({ imageMappings: mappingsObj });
    }

    startObserving() {
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.processImages(node);
                    }
                });
            });
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    processExistingImages() {
        this.processImages(document.body);
    }

    processImages(container) {
        // More comprehensive selectors for Character AI images
        const imageSelectors = [
            'img[src*="characterai"]',
            'img[src*="character.ai"]',
            'img[alt*="avatar"]',
            'img[alt*="character"]',
            'img[class*="avatar"]',
            'img[class*="character"]',
            'img[class*="bot"]',
            '.character-avatar img',
            '.bot-avatar img',
            '[data-testid*="avatar"] img',
            '[data-testid*="character"] img',
            // Generic avatar patterns
            'img[src*="avatar"]',
            'img[src*="profile"]',
            // Look for any img in avatar-like containers
            '[class*="avatar"] img',
            '[class*="profile"] img',
            '[id*="avatar"] img'
        ];

        // Also try to find images by their parent containers
        const containerSelectors = [
            '.character-card img',
            '.chat-character img',
            '.message-avatar img',
            '.user-avatar img'
        ];

        const allSelectors = [...imageSelectors, ...containerSelectors];

        allSelectors.forEach(selector => {
            try {
                const images = container.querySelectorAll ?
                    container.querySelectorAll(selector) :
                    (container.matches && container.matches(selector) ? [container] : []);

                images.forEach(img => {
                    if (img && img.src && !img.dataset.proxyProcessed) {
                        console.log('Found potential avatar image:', img.src);
                        this.handleImage(img);
                    }
                });
            } catch (e) {
                // Ignore selector errors
            }
        });

        // Also check all images and filter by src patterns
        const allImages = container.querySelectorAll ? container.querySelectorAll('img') : [];
        allImages.forEach(img => {
            if (img.src && !img.dataset.proxyProcessed) {
                // Check if the image looks like an avatar based on URL patterns
                const src = img.src.toLowerCase();
                if (src.includes('avatar') ||
                    src.includes('character') ||
                    src.includes('profile') ||
                    src.includes('bot') ||
                    img.alt?.toLowerCase().includes('avatar') ||
                    img.alt?.toLowerCase().includes('character')) {
                    console.log('Found avatar-like image by pattern:', img.src);
                    this.handleImage(img);
                }
            }
        });
    }

    handleImage(img) {
        if (img.dataset.proxyProcessed) return;

        const originalSrc = img.src;
        if (!originalSrc) return;

        // Check if we have a replacement for this image
        const replacementSrc = this.imageMap.get(originalSrc);

        if (replacementSrc) {
            this.replaceImage(img, replacementSrc);
        } else {
            // Add click handler to set up proxy mapping
            this.addProxySetupHandler(img);
        }

        img.dataset.proxyProcessed = 'true';
    }

    replaceImage(img, newSrc) {
        // Store original src before replacing
        if (!img.dataset.originalSrc) {
            img.dataset.originalSrc = img.src;
        }

        // Try to replace the image directly
        const originalSrc = img.src;
        img.src = newSrc;

        // Handle load errors by reverting to original
        img.onerror = () => {
            console.warn('Failed to load replacement image, trying proxy method:', newSrc);
            // Try using a CORS proxy service
            const proxyUrl = `https://cors-anywhere.herokuapp.com/${newSrc}`;
            img.src = proxyUrl;

            img.onerror = () => {
                console.warn('Proxy also failed, reverting to original:', originalSrc);
                img.src = originalSrc;
            };
        };

        img.onload = () => {
            console.log('Image successfully replaced:', newSrc);
        };
    }

    addProxySetupHandler(img) {
        img.style.cursor = 'pointer';
        img.title = 'Right-click to set proxy image';

        img.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showProxySetup(img);
        });
    }

    showProxySetup(img) {
        const currentSrc = img.dataset.originalSrc || img.src;

        const modal = document.createElement('div');
        modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

        modal.innerHTML = `
      <div style="background: white; padding: 20px; border-radius: 10px; max-width: 600px; width: 90%;">
        <h3>Set Proxy Image</h3>
        <p><strong>Current (Proxy for AI):</strong></p>
        <img src="${currentSrc}" style="max-width: 100px; max-height: 100px; border: 1px solid #ccc;">
        <p style="font-size: 12px; word-break: break-all;">${currentSrc}</p>
        
        <p><strong>Enter direct image URL:</strong></p>
        <input type="text" id="newImageUrl" placeholder="https://i.imgur.com/example.jpg" style="width: 100%; padding: 8px; margin: 10px 0;">
        <div id="urlStatus" style="font-size: 12px; margin: 5px 0;"></div>
        
        <div style="margin-top: 15px;">
          <button id="testUrl" style="background: #2196F3; color: white; padding: 8px 15px; border: none; border-radius: 5px; margin-right: 10px;">Test URL</button>
          <button id="setProxy" style="background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin-right: 10px;" disabled>Set Proxy</button>
          <button id="cancelProxy" style="background: #f44336; color: white; padding: 10px 20px; border: none; border-radius: 5px;">Cancel</button>
        </div>
        
        <div style="font-size: 12px; color: #666; margin-top: 15px; padding: 10px; background: #f9f9f9; border-radius: 5px;">
          <strong>How to get direct image URLs:</strong><br>
          • <strong>imgur.com:</strong> Upload → Right-click image → "Copy image address"<br>
          • <strong>PostImg:</strong> Upload → Copy the "Direct link" (not page URL)<br>
          • <strong>Discord:</strong> Upload to any channel → Right-click → "Copy image address"<br>
          • <strong>GitHub:</strong> Upload to repo → Click file → Click "Raw" button<br>
          <br>
          <strong>URL should end with:</strong> .jpg, .png, .gif, .webp
        </div>
      </div>
    `;

        document.body.appendChild(modal);

        const input = modal.querySelector('#newImageUrl');
        const setBtn = modal.querySelector('#setProxy');
        const cancelBtn = modal.querySelector('#cancelProxy');
        const testBtn = modal.querySelector('#testUrl');
        const status = modal.querySelector('#urlStatus');

        const closeModal = () => document.body.removeChild(modal);

        const testImageUrl = (url) => {
            if (!url) return;

            status.textContent = 'Testing URL...';
            status.style.color = '#666';
            setBtn.disabled = true;

            const testImg = new Image();
            testImg.onload = () => {
                status.textContent = '✓ URL works! Image loaded successfully.';
                status.style.color = '#4CAF50';
                setBtn.disabled = false;
            };
            testImg.onerror = () => {
                status.textContent = '✗ URL failed to load. Check if it\'s a direct image link.';
                status.style.color = '#f44336';
                setBtn.disabled = true;
            };
            testImg.src = url;
        };

        testBtn.onclick = () => {
            const url = input.value.trim();
            if (url) {
                testImageUrl(url);
            } else {
                status.textContent = 'Please enter a URL first.';
                status.style.color = '#f44336';
            }
        };

        input.addEventListener('input', () => {
            status.textContent = '';
            setBtn.disabled = true;
        });

        setBtn.onclick = () => {
            const newUrl = input.value.trim();
            if (newUrl) {
                this.imageMap.set(currentSrc, newUrl);
                this.saveImageMappings();
                this.replaceImage(img, newUrl);
                closeModal();
            }
        };

        cancelBtn.onclick = closeModal;
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };

        input.focus();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ImageProxy());
} else {
    new ImageProxy();
}
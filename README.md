# Character AI Image Proxy Extension

A personal browser extension for learning purposes that allows you to replace bot avatar images on Character AI while keeping the original as a proxy for the AI model.

## How It Works

1. **Proxy Concept**: The AI model continues to "see" the original uploaded image, but users see a different image of your choice
2. **Content Script**: Monitors the page for bot avatar images and replaces them based on your mappings
3. **Storage**: Saves your image mappings locally using Chrome's storage API

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select this folder
4. The extension should now appear in your extensions list

## Usage

1. Navigate to Character AI
2. Right-click on any bot avatar image
3. Enter the URL of the image you want to display to users
4. The original image remains as the proxy for the AI model
5. Manage mappings through the extension popup (click the extension icon)

## Files Structure

- `manifest.json` - Extension configuration
- `content.js` - Main logic for image detection and replacement
- `popup.html` - Extension popup interface
- `popup.js` - Popup functionality
- `styles.css` - Styling for the extension

## Technical Notes

- Uses Manifest V3 for modern Chrome extensions
- Content scripts run on Character AI domains
- Image mappings are stored locally using chrome.storage.local
- MutationObserver watches for dynamically loaded images

## Limitations

- Only works on Character AI domains
- Requires valid image URLs for replacements
- Images must be publicly accessible
- Personal use and learning purposes only

## Troubleshooting

If images aren't being detected:
1. Check the browser console for errors
2. Verify the CSS selectors in `content.js` match Character AI's current structure
3. Ensure the extension has proper permissions

## Learning Objectives

This extension demonstrates:
- Content script injection
- DOM manipulation and observation
- Chrome extension APIs
- Local storage management
- Event handling and user interaction
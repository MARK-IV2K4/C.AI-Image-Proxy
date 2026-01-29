// Popup script for managing image mappings
document.addEventListener('DOMContentLoaded', async () => {
  await loadMappings();
  
  document.getElementById('clear-all').addEventListener('click', clearAllMappings);
});

async function loadMappings() {
  try {
    const result = await chrome.storage.local.get(['imageMappings']);
    const mappings = result.imageMappings || {};
    
    const container = document.getElementById('mappings-container');
    container.innerHTML = '';
    
    if (Object.keys(mappings).length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #666;">No image mappings yet</p>';
      return;
    }
    
    Object.entries(mappings).forEach(([proxyUrl, displayUrl]) => {
      const item = createMappingItem(proxyUrl, displayUrl);
      container.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading mappings:', error);
  }
}

function createMappingItem(proxyUrl, displayUrl) {
  const div = document.createElement('div');
  div.className = 'mapping-item';
  
  div.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div style="flex: 1;">
        <div style="font-size: 12px; color: #666;">Proxy (AI sees):</div>
        <img src="${proxyUrl}" class="proxy-img" onerror="this.style.display='none'">
        <div style="font-size: 10px; word-break: break-all;">${proxyUrl.substring(0, 50)}...</div>
        
        <div style="font-size: 12px; color: #666; margin-top: 5px;">Display (You see):</div>
        <img src="${displayUrl}" class="display-img" onerror="this.style.display='none'">
        <div style="font-size: 10px; word-break: break-all;">${displayUrl.substring(0, 50)}...</div>
      </div>
      <button class="remove-btn" onclick="removeMapping('${proxyUrl}')">×</button>
    </div>
  `;
  
  return div;
}

async function removeMapping(proxyUrl) {
  try {
    const result = await chrome.storage.local.get(['imageMappings']);
    const mappings = result.imageMappings || {};
    
    delete mappings[proxyUrl];
    
    await chrome.storage.local.set({ imageMappings: mappings });
    await loadMappings();
  } catch (error) {
    console.error('Error removing mapping:', error);
  }
}

async function clearAllMappings() {
  if (confirm('Are you sure you want to clear all image mappings?')) {
    try {
      await chrome.storage.local.set({ imageMappings: {} });
      await loadMappings();
    } catch (error) {
      console.error('Error clearing mappings:', error);
    }
  }
}
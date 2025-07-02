// Fragment Loader Utility
// Loads HTML fragments from separate files and injects them into the DOM

export async function loadFragment(url, containerSelector) {
  try {
    console.log(`Attempting to load fragment: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load fragment: ${response.status} ${response.statusText}`);
    }
    const html = await response.text();
    console.log(`Fragment content loaded (${html.length} chars):`, html.substring(0, 100) + '...');

    const template = document.createElement('template');
    template.innerHTML = html.trim();

    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error(`Container not found: ${containerSelector}`);
    }

    container.appendChild(template.content);
    console.log(`Successfully loaded fragment: ${url} into ${containerSelector}`);
  } catch (error) {
    console.error(`Error loading fragment ${url}:`, error);
  }
}

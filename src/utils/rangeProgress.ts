// Utility function to update range slider progress indication
export function updateRangeProgress(input: HTMLInputElement) {
  const min = parseFloat(input.min) || 0;
  const max = parseFloat(input.max) || 100;
  const value = parseFloat(input.value) || 0;

  // Calculate percentage (0-100)
  const percentage = ((value - min) / (max - min)) * 100;

  // Update CSS custom property
  input.style.setProperty('--progress-percent', `${percentage}%`);
}

// Initialize progress for all range inputs on page load and when new ones are added
export function initializeRangeProgress() {
  const updateAllRanges = () => {
    const ranges = document.querySelectorAll('input[type="range"]');
    ranges.forEach(range => updateRangeProgress(range as HTMLInputElement));
  };

  // Update on page load
  updateAllRanges();

  // Update when values change
  document.addEventListener('input', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'range') {
      updateRangeProgress(target as HTMLInputElement);
    }
  });

  // Use MutationObserver to handle dynamically added range inputs
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          if (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'range') {
            updateRangeProgress(element as HTMLInputElement);
          }
          // Also check for range inputs within added elements
          const ranges = element.querySelectorAll('input[type="range"]');
          ranges.forEach(range => updateRangeProgress(range as HTMLInputElement));
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
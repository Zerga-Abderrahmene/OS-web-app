// FakeOS Desktop JavaScript
class FakeOS {
  constructor() {
    this.activeWindow = null;
    this.windows = new Map();
    this.taskbarApps = new Map();
    this.calculator = {
      display: '0',
      previousValue: null,
      operation: null,
      waitingForOperand: false
    };
    this.init();
  }

  init() {
    this.setupDesktopIcons();
    this.setupStartMenu();
    this.setupWindowManagement();
    this.setupCalculator();
    this.setupNotes();
    this.setupFileManager();
    this.setupSettings();
    this.setupChrome();
    this.setupClock();
    this.setupKeyboardShortcuts();
    this.setupContextMenu();
  }

  setupDesktopIcons() {
    const icons = document.querySelectorAll('.desktop-icon');
    icons.forEach(icon => {
      icon.addEventListener('dblclick', (e) => {
        e.preventDefault();
        const app = icon.dataset.app;
        this.openApp(app);
      });
    });
  }

  setupStartMenu() {
    const startBtn = document.getElementById('start-btn');
    const startMenu = document.getElementById('start-menu');
    const menuItems = document.querySelectorAll('.start-menu-item');

    startBtn.addEventListener('click', () => {
      startMenu.style.display = startMenu.style.display === 'none' ? 'block' : 'none';
    });

    menuItems.forEach(item => {
      item.addEventListener('click', () => {
        const app = item.dataset.app;
        const action = item.dataset.action;
        
        if (app) {
          this.openApp(app);
        } else if (action === 'shutdown') {
          this.shutdown();
        }
        
        startMenu.style.display = 'none';
      });
    });

    // Close start menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) {
        startMenu.style.display = 'none';
      }
    });
  }

  setupWindowManagement() {
    // Window dragging
    document.addEventListener('mousedown', (e) => {
      const titlebar = e.target.closest('.titlebar');
      if (!titlebar) return;

      const window = titlebar.closest('.window');
      if (!window) return;

      this.bringToFront(window);
      
      let isDragging = false;
      let startX = e.clientX - window.offsetLeft;
      let startY = e.clientY - window.offsetTop;

      const onMouseMove = (e) => {
        if (!isDragging) {
          isDragging = true;
          window.style.transition = 'none';
        }
        
        const newX = e.clientX - startX;
        const newY = e.clientY - startY;
        
        // Keep window within bounds
        const maxX = window.innerWidth - window.offsetWidth;
        const maxY = window.innerHeight - window.offsetHeight - 40; // Account for taskbar
        
        window.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
        window.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
      };

      const onMouseUp = () => {
        isDragging = false;
        window.style.transition = '';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    // Window controls
    document.addEventListener('click', (e) => {
      const window = e.target.closest('.window');
      if (!window) return;

      if (e.target.classList.contains('minimize')) {
        this.minimizeWindow(window);
      } else if (e.target.classList.contains('maximize')) {
        this.maximizeWindow(window);
      } else if (e.target.classList.contains('close')) {
        this.closeWindow(window);
      }
    });

    // Window resizing
    document.addEventListener('mousedown', (e) => {
      const window = e.target.closest('.window');
      if (!window) return;

      const rect = window.getBoundingClientRect();
      const isResizing = e.clientX > rect.right - 10 && e.clientY > rect.bottom - 10;
      
      if (isResizing) {
        let startWidth = window.offsetWidth;
        let startHeight = window.offsetHeight;
        let startX = e.clientX;
        let startY = e.clientY;

        const onMouseMove = (e) => {
          const newWidth = startWidth + (e.clientX - startX);
          const newHeight = startHeight + (e.clientY - startY);
          
          if (newWidth > 200 && newHeight > 150) {
            window.style.width = newWidth + 'px';
            window.style.height = newHeight + 'px';
          }
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      }
    });
  }

  setupCalculator() {
    const calcButtons = document.querySelectorAll('.calc-btn');
    const display = document.querySelector('.calculator .display');

    calcButtons.forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        const value = button.textContent;

        switch (action) {
          case 'number':
            this.inputDigit(value);
            break;
          case 'decimal':
            this.inputDecimal();
            break;
          case 'operator':
            this.performOperation(value);
            break;
          case 'equals':
            this.performCalculation();
            break;
          case 'clear':
            this.clearCalculator();
            break;
          case 'backspace':
            this.backspace();
            break;
        }

        if (display) {
          display.textContent = this.calculator.display;
        }
      });
    });
  }

  setupNotes() {
    const textarea = document.querySelector('#notes-window textarea');
    if (textarea) {
      // Load saved content
      const savedContent = localStorage.getItem('notes-content');
      if (savedContent) {
        textarea.value = savedContent;
      }

      // Auto-save on input
      textarea.addEventListener('input', () => {
        localStorage.setItem('notes-content', textarea.value);
      });

      // Ctrl+S to save
      textarea.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
          e.preventDefault();
          localStorage.setItem('notes-content', textarea.value);
          this.showNotification('Notes saved!');
        }
      });
    }
  }

  setupFileManager() {
    const fileButtons = document.querySelectorAll('.file-btn');
    const fileList = document.querySelector('.file-list');

    fileButtons.forEach(button => {
      button.addEventListener('click', () => {
        const action = button.textContent.toLowerCase();
        
        switch (action) {
          case 'new folder':
            this.createNewFolder();
            break;
          case 'new file':
            this.createNewFile();
            break;
          case 'delete':
            this.deleteSelectedFile();
            break;
        }
      });
    });

    // File selection
    if (fileList) {
      fileList.addEventListener('click', (e) => {
        const fileItem = e.target.closest('.file-item');
        if (fileItem) {
          // Remove previous selection
          document.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('selected');
          });
          // Add selection to clicked item
          fileItem.classList.add('selected');
        }
      });
    }
  }

  setupSettings() {
    const themeSelect = document.getElementById('theme-select');
    const volumeSlider = document.getElementById('volume-slider');
    const autosaveCheckbox = document.getElementById('autosave');

    // Load saved settings
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedVolume = localStorage.getItem('volume') || '50';
    const savedAutosave = localStorage.getItem('autosave') !== 'false';

    if (themeSelect) {
      themeSelect.value = savedTheme;
      this.applyTheme(savedTheme);
      
      themeSelect.addEventListener('change', (e) => {
        const theme = e.target.value;
        localStorage.setItem('theme', theme);
        this.applyTheme(theme);
        this.showNotification('Theme changed!');
      });
    }

    if (volumeSlider) {
      volumeSlider.value = savedVolume;
      
      volumeSlider.addEventListener('input', (e) => {
        const volume = e.target.value;
        localStorage.setItem('volume', volume);
        this.updateVolumeDisplay(volume);
      });
    }

    if (autosaveCheckbox) {
      autosaveCheckbox.checked = savedAutosave;
      
      autosaveCheckbox.addEventListener('change', (e) => {
        localStorage.setItem('autosave', e.target.checked);
        this.showNotification(e.target.checked ? 'Auto-save enabled!' : 'Auto-save disabled!');
      });
    }
  }

  setupChrome() {
    this.browserHistory = ['https://www.google.com'];
    this.currentHistoryIndex = 0;
    this.tabs = [
      { id: 'google', title: 'Google', icon: '🌐', url: 'https://www.google.com', active: true }
    ];
    this.currentTab = 'google';

    this.setupBrowserControls();
    this.setupAddressBar();
    this.setupTabs();
    this.setupSearch();
  }

  setupBrowserControls() {
    const backBtn = document.querySelector('[data-action="back"]');
    const forwardBtn = document.querySelector('[data-action="forward"]');
    const refreshBtn = document.querySelector('[data-action="refresh"]');

    if (backBtn) {
      backBtn.addEventListener('click', () => this.goBack());
    }

    if (forwardBtn) {
      forwardBtn.addEventListener('click', () => this.goForward());
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshPage());
    }
  }

  setupAddressBar() {
    const urlInput = document.getElementById('url-input');
    const goBtn = document.querySelector('[data-action="go"]');
    const bookmarkBtn = document.querySelector('[data-action="bookmark"]');

    if (urlInput) {
      urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.navigateToUrl(urlInput.value);
        }
      });
    }

    if (goBtn) {
      goBtn.addEventListener('click', () => {
        this.navigateToUrl(urlInput.value);
      });
    }

    if (bookmarkBtn) {
      bookmarkBtn.addEventListener('click', () => {
        this.addBookmark(urlInput.value);
      });
    }
  }

  setupTabs() {
    const newTabBtn = document.querySelector('.new-tab-btn');
    const tabsContainer = document.querySelector('.browser-tabs');

    if (newTabBtn) {
      newTabBtn.addEventListener('click', () => this.createNewTab());
    }

    // Tab switching
    document.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (tab && !e.target.classList.contains('tab-close')) {
        this.switchTab(tab.dataset.tab);
      }

      const closeBtn = e.target.closest('.tab-close');
      if (closeBtn) {
        e.stopPropagation();
        const tabId = closeBtn.closest('.tab').dataset.tab;
        this.closeTab(tabId);
      }
    });
  }

  setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.performSearch(searchInput.value);
        }
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.performSearch(searchInput.value);
      });
    }

    // Setup quick links
    const quickLinks = document.querySelectorAll('.quick-link');
    quickLinks.forEach(link => {
      link.addEventListener('click', () => {
        const url = link.dataset.url;
        this.navigateToUrl(url);
      });
    });
  }

  navigateToUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.') && !url.includes(' ')) {
        url = 'https://' + url;
      } else {
        // Treat as search
        this.performSearch(url);
        return;
      }
    }

    // Add to history
    this.browserHistory.push(url);
    this.currentHistoryIndex = this.browserHistory.length - 1;

    // Update address bar
    const urlInput = document.getElementById('url-input');
    if (urlInput) {
      urlInput.value = url;
    }

    // Show appropriate content
    if (url.includes('youtube.com') || url.includes('youtube')) {
      this.showYouTubePage();
    } else if (url.includes('google.com') || url.includes('google')) {
      this.showGooglePage();
    } else {
      this.loadRealWebpage(url);
    }

    this.updateBrowserControls();
  }

  performSearch(query) {
    if (!query.trim()) return;

    // Add to history
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    this.browserHistory.push(searchUrl);
    this.currentHistoryIndex = this.browserHistory.length - 1;

    // Update address bar
    const urlInput = document.getElementById('url-input');
    if (urlInput) {
      urlInput.value = searchUrl;
    }

    // Use backend search API
    fetch(`/search/?q=${encodeURIComponent(query)}`)
      .then(response => response.json())
      .then(data => {
        if (data.results) {
          this.showSearchResults(data.results);
        } else {
          this.showSearchResults([{
            title: `Search results for "${query}"`,
            url: searchUrl,
            snippet: `About 1,000,000 results for "${query}" (0.45 seconds)`
          }]);
        }
        this.updateBrowserControls();
      })
      .catch(error => {
        console.error('Search error:', error);
        this.showSearchResults([{
          title: `Search results for "${query}"`,
          url: searchUrl,
          snippet: `About 1,000,000 results for "${query}" (0.45 seconds)`
        }]);
        this.updateBrowserControls();
      });
  }

  showSearchResults(results) {
    const searchResults = document.getElementById('search-results');
    if (searchResults) {
      searchResults.innerHTML = results.map(result => `
        <div class="search-result" onclick="fakeOS.navigateToUrl('${result.url}')">
          <div class="search-result-title">${result.title}</div>
          <div class="search-result-url">${result.url}</div>
          <div class="search-result-snippet">${result.snippet}</div>
        </div>
      `).join('');
    }
  }

  showGooglePage() {
    const googleTab = document.getElementById('google-tab');
    const youtubeTab = document.getElementById('youtube-tab');
    
    if (googleTab) googleTab.classList.add('active');
    if (youtubeTab) youtubeTab.classList.remove('active');
    
    // Clear search results
    const searchResults = document.getElementById('search-results');
    if (searchResults) {
      searchResults.innerHTML = '';
    }
  }

  showYouTubePage() {
    const googleTab = document.getElementById('google-tab');
    const youtubeTab = document.getElementById('youtube-tab');
    const webpageTab = document.getElementById('webpage-tab');
    const webpageFrame = document.getElementById('webpage-frame');
    
    if (googleTab) googleTab.classList.remove('active');
    if (youtubeTab) youtubeTab.classList.remove('active');
    if (webpageTab) webpageTab.classList.add('active');
    
    // Load real YouTube
    if (webpageFrame) {
      webpageFrame.src = 'https://www.youtube.com';
      this.showNotification('Loading YouTube...');
    }
  }

  loadRealWebpage(url) {
    const googleTab = document.getElementById('google-tab');
    const youtubeTab = document.getElementById('youtube-tab');
    const webpageTab = document.getElementById('webpage-tab');
    const webpageContent = document.getElementById('webpage-content');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');
    const pageContent = document.getElementById('page-content');
    
    if (googleTab) googleTab.classList.remove('active');
    if (youtubeTab) youtubeTab.classList.remove('active');
    if (webpageTab) webpageTab.classList.add('active');
    
    // Show loading indicator
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    if (errorMessage) errorMessage.style.display = 'none';
    if (pageContent) pageContent.innerHTML = '';
    
    // Store current URL for retry
    this.currentUrl = url;
    
    // Use our Django proxy to load the webpage
    const proxyUrl = `/proxy/?url=${encodeURIComponent(url)}`;
    
    fetch(proxyUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.text();
      })
      .then(html => {
        // Hide loading indicator
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        
        // Process and display the HTML content
        this.displayWebpage(html, url);
        this.showNotification(`Loaded ${url}`);
      })
      .catch(error => {
        console.error('Error loading webpage:', error);
        
        // Hide loading indicator and show error
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (errorMessage) {
          errorMessage.style.display = 'block';
          const errorDetails = document.getElementById('error-details');
          if (errorDetails) {
            errorDetails.textContent = `Failed to load ${url}: ${error.message}`;
          }
        }
        
        this.showNotification('Error loading webpage');
      });
  }

  displayWebpage(html, url) {
    const pageContent = document.getElementById('page-content');
    if (!pageContent) return;
    
    try {
      // Create a temporary div to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Extract the body content
      const body = tempDiv.querySelector('body');
      if (body) {
        // Remove scripts and other problematic elements
        const scripts = body.querySelectorAll('script');
        scripts.forEach(script => script.remove());
        
        const styles = body.querySelectorAll('style');
        styles.forEach(style => style.remove());
        
        const links = body.querySelectorAll('link');
        links.forEach(link => link.remove());
        
        // Fix relative URLs to absolute URLs
        this.fixRelativeUrls(body, url);
        
        // Display the content
        pageContent.innerHTML = body.innerHTML;
      } else {
        // If no body tag, display the entire HTML
        pageContent.innerHTML = html;
      }
      
      // Add some basic styling to make it look better
      pageContent.style.fontFamily = 'Arial, sans-serif';
      pageContent.style.lineHeight = '1.6';
      
    } catch (error) {
      console.error('Error processing webpage:', error);
      pageContent.innerHTML = `
        <div style="text-align: center; padding: 50px;">
          <h2>Content Loaded</h2>
          <p>The webpage content has been loaded but couldn't be fully processed.</p>
          <p><strong>URL:</strong> ${url}</p>
        </div>
      `;
    }
  }

  fixRelativeUrls(element, baseUrl) {
    // Fix relative URLs in href and src attributes
    const links = element.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('//')) {
        try {
          const absoluteUrl = new URL(href, baseUrl).href;
          link.href = absoluteUrl;
        } catch (e) {
          // Keep original if URL construction fails
        }
      }
    });
    
    const images = element.querySelectorAll('img[src]');
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http') && !src.startsWith('//')) {
        try {
          const absoluteUrl = new URL(src, baseUrl).href;
          img.src = absoluteUrl;
        } catch (e) {
          // Keep original if URL construction fails
        }
      }
    });
  }

  retryLoad() {
    if (this.currentUrl) {
      this.loadRealWebpage(this.currentUrl);
    }
  }

  goBack() {
    if (this.currentHistoryIndex > 0) {
      this.currentHistoryIndex--;
      const url = this.browserHistory[this.currentHistoryIndex];
      this.navigateToUrl(url);
    }
  }

  goForward() {
    if (this.currentHistoryIndex < this.browserHistory.length - 1) {
      this.currentHistoryIndex++;
      const url = this.browserHistory[this.currentHistoryIndex];
      this.navigateToUrl(url);
    }
  }

  refreshPage() {
    const urlInput = document.getElementById('url-input');
    if (urlInput) {
      this.navigateToUrl(urlInput.value);
    }
  }

  updateBrowserControls() {
    const backBtn = document.querySelector('[data-action="back"]');
    const forwardBtn = document.querySelector('[data-action="forward"]');

    if (backBtn) {
      backBtn.disabled = this.currentHistoryIndex <= 0;
    }

    if (forwardBtn) {
      forwardBtn.disabled = this.currentHistoryIndex >= this.browserHistory.length - 1;
    }
  }

  createNewTab() {
    const tabId = 'tab-' + Date.now();
    const newTab = {
      id: tabId,
      title: 'New Tab',
      icon: '🌐',
      url: 'https://www.google.com',
      active: false
    };

    this.tabs.push(newTab);
    this.switchTab(tabId);
    this.showNotification('New tab created!');
  }

  switchTab(tabId) {
    this.tabs.forEach(tab => tab.active = false);
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      tab.active = true;
      this.currentTab = tabId;
      this.updateTabDisplay();
    }
  }

  closeTab(tabId) {
    if (this.tabs.length > 1) {
      this.tabs = this.tabs.filter(tab => tab.id !== tabId);
      if (this.currentTab === tabId) {
        this.currentTab = this.tabs[0].id;
      }
      this.updateTabDisplay();
      this.showNotification('Tab closed!');
    }
  }

  updateTabDisplay() {
    // This would update the tab display in a real implementation
    // For now, we'll just show a notification
    this.showNotification('Tab switched!');
  }

  addBookmark(url) {
    if (!url || url === 'about:blank') {
      this.showNotification('Cannot bookmark this page');
      return;
    }

    // Get bookmarks from localStorage
    let bookmarks = JSON.parse(localStorage.getItem('browser-bookmarks') || '[]');
    
    // Check if already bookmarked
    const existing = bookmarks.find(b => b.url === url);
    if (existing) {
      this.showNotification('Already bookmarked!');
      return;
    }

    // Add new bookmark
    const bookmark = {
      url: url,
      title: this.getPageTitle(url),
      date: new Date().toISOString()
    };

    bookmarks.push(bookmark);
    localStorage.setItem('browser-bookmarks', JSON.stringify(bookmarks));
    
    this.showNotification('Bookmark added!');
  }

  getPageTitle(url) {
    // Extract domain name for bookmark title
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch {
      return 'Bookmark';
    }
  }

  setupClock() {
    const updateClock = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const clockElement = document.getElementById('clock');
      if (clockElement) {
        clockElement.textContent = timeString;
      }
    };

    updateClock();
    setInterval(updateClock, 1000);
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Alt + Tab to switch windows
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        this.switchWindows();
      }
      
      // Escape to close start menu
      if (e.key === 'Escape') {
        const startMenu = document.getElementById('start-menu');
        if (startMenu) {
          startMenu.style.display = 'none';
        }
      }
      
      // Ctrl + N for new notes
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        this.openApp('notes');
      }
      
      // Ctrl + C for calculator
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        this.openApp('calculator');
      }
    });
  }

  setupContextMenu() {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      
      // Create context menu
      const contextMenu = document.createElement('div');
      contextMenu.className = 'context-menu';
      contextMenu.style.cssText = `
        position: fixed;
        top: ${e.clientY}px;
        left: ${e.clientX}px;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 8px 0;
        z-index: 1000;
        min-width: 150px;
      `;
      
      contextMenu.innerHTML = `
        <div class="context-item" data-action="refresh">🔄 Refresh</div>
        <div class="context-item" data-action="new-folder">📁 New Folder</div>
        <div class="context-item" data-action="properties">ℹ️ Properties</div>
      `;
      
      document.body.appendChild(contextMenu);
      
      // Handle context menu clicks
      contextMenu.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (action) {
          this.handleContextAction(action);
        }
        document.body.removeChild(contextMenu);
      });
      
      // Remove context menu when clicking outside
      setTimeout(() => {
        document.addEventListener('click', () => {
          if (document.body.contains(contextMenu)) {
            document.body.removeChild(contextMenu);
          }
        }, { once: true });
      }, 0);
    });
  }

  openApp(appName) {
    const windowId = `${appName}-window`;
    let window = document.getElementById(windowId);
    
    if (!window) return;
    
    // If window is minimized, restore it
    if (window.style.display === 'none') {
      window.style.display = 'block';
    }
    
    this.bringToFront(window);
    this.addToTaskbar(appName, window);
    this.windows.set(windowId, window);
  }

  bringToFront(window) {
    // Remove active class from all windows
    document.querySelectorAll('.window').forEach(w => {
      w.style.zIndex = '10';
    });
    
    // Bring clicked window to front
    window.style.zIndex = '20';
    this.activeWindow = window;
    
    // Update taskbar
    this.updateTaskbarActive(window);
  }

  minimizeWindow(window) {
    window.style.display = 'none';
    this.updateTaskbarActive(window, false);
  }

  maximizeWindow(window) {
    if (window.classList.contains('maximized')) {
      window.classList.remove('maximized');
    } else {
      window.classList.add('maximized');
    }
  }

  closeWindow(window) {
    window.style.display = 'none';
    this.removeFromTaskbar(window);
    this.windows.delete(window.id);
  }

  addToTaskbar(appName, window) {
    const taskbarApps = document.getElementById('taskbar-apps');
    const existingApp = taskbarApps.querySelector(`[data-app="${appName}"]`);
    
    if (!existingApp) {
      const taskbarApp = document.createElement('div');
      taskbarApp.className = 'taskbar-app';
      taskbarApp.dataset.app = appName;
      taskbarApp.dataset.window = window.id;
      taskbarApp.textContent = this.getAppDisplayName(appName);
      
      taskbarApp.addEventListener('click', () => {
        if (window.style.display === 'none') {
          this.openApp(appName);
        } else {
          this.bringToFront(window);
        }
      });
      
      taskbarApps.appendChild(taskbarApp);
      this.taskbarApps.set(appName, taskbarApp);
    }
  }

  removeFromTaskbar(window) {
    const appName = this.getAppNameFromWindow(window);
    const taskbarApp = this.taskbarApps.get(appName);
    
    if (taskbarApp) {
      taskbarApp.remove();
      this.taskbarApps.delete(appName);
    }
  }

  updateTaskbarActive(window, active = true) {
    const appName = this.getAppNameFromWindow(window);
    const taskbarApp = this.taskbarApps.get(appName);
    
    if (taskbarApp) {
      if (active) {
        taskbarApp.classList.add('active');
      } else {
        taskbarApp.classList.remove('active');
      }
    }
  }

  getAppNameFromWindow(window) {
    return window.id.replace('-window', '');
  }

  getAppDisplayName(appName) {
    const names = {
      'notes': '📝 Notes',
      'calculator': '🧮 Calc',
      'files': '📁 Files',
      'settings': '⚙️ Settings',
      'chrome': '🌐 Chrome'
    };
    return names[appName] || appName;
  }

  switchWindows() {
    const windows = Array.from(this.windows.values()).filter(w => w.style.display !== 'none');
    if (windows.length > 1) {
      const currentIndex = windows.indexOf(this.activeWindow);
      const nextIndex = (currentIndex + 1) % windows.length;
      this.bringToFront(windows[nextIndex]);
    }
  }

  shutdown() {
    if (confirm('Are you sure you want to shutdown FakeOS?')) {
      document.body.innerHTML = `
        <div style="
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: #000;
          color: #fff;
          font-family: monospace;
          font-size: 24px;
        ">
          Shutting down FakeOS...
        </div>
      `;
      
      setTimeout(() => {
        window.close();
      }, 2000);
    }
  }

  handleContextAction(action) {
    switch (action) {
      case 'refresh':
        location.reload();
        break;
      case 'new-folder':
        this.createNewFolder();
        break;
      case 'properties':
        this.showProperties();
        break;
    }
  }

  createNewFolder() {
    const fileList = document.querySelector('.file-list');
    if (fileList) {
      const folderName = prompt('Enter folder name:', 'New Folder');
      if (folderName) {
        const newFolder = document.createElement('div');
        newFolder.className = 'file-item';
        newFolder.innerHTML = `
          <span class="file-icon">📁</span>
          <span class="file-name">${folderName}</span>
        `;
        fileList.appendChild(newFolder);
        this.showNotification(`Folder "${folderName}" created!`);
      }
    }
  }

  createNewFile() {
    const fileList = document.querySelector('.file-list');
    if (fileList) {
      const fileName = prompt('Enter file name:', 'newfile.txt');
      if (fileName) {
        const newFile = document.createElement('div');
        newFile.className = 'file-item';
        newFile.innerHTML = `
          <span class="file-icon">📄</span>
          <span class="file-name">${fileName}</span>
        `;
        fileList.appendChild(newFile);
        this.showNotification(`File "${fileName}" created!`);
      }
    }
  }

  deleteSelectedFile() {
    const selectedFile = document.querySelector('.file-item.selected');
    if (selectedFile) {
      const fileName = selectedFile.querySelector('.file-name').textContent;
      if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
        selectedFile.remove();
        this.showNotification(`"${fileName}" deleted!`);
      }
    } else {
      this.showNotification('Please select a file to delete!');
    }
  }

  applyTheme(theme) {
    const body = document.body;
    body.className = `theme-${theme}`;
  }

  updateVolumeDisplay(volume) {
    const volumeIcon = document.querySelector('.volume');
    if (volumeIcon) {
      if (volume == 0) {
        volumeIcon.textContent = '🔇';
      } else if (volume < 30) {
        volumeIcon.textContent = '🔈';
      } else if (volume < 70) {
        volumeIcon.textContent = '🔉';
      } else {
        volumeIcon.textContent = '🔊';
      }
    }
  }

  showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 10000;
      font-size: 14px;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  showProperties() {
    alert('System Properties\n\nFakeOS v1.0\nMemory: 8GB\nStorage: 256GB\nProcessor: FakeCPU 3.0GHz');
  }

  // Calculator methods
  inputDigit(digit) {
    if (this.calculator.waitingForOperand) {
      this.calculator.display = digit;
      this.calculator.waitingForOperand = false;
    } else {
      this.calculator.display = this.calculator.display === '0' ? digit : this.calculator.display + digit;
    }
  }

  inputDecimal() {
    if (this.calculator.waitingForOperand) {
      this.calculator.display = '0.';
      this.calculator.waitingForOperand = false;
      return;
    }

    if (!this.calculator.display.includes('.')) {
      this.calculator.display += '.';
    }
  }

  performOperation(nextOperator) {
    const inputValue = parseFloat(this.calculator.display);

    if (this.calculator.previousValue === null) {
      this.calculator.previousValue = inputValue;
    } else if (this.calculator.operation) {
      const currentValue = this.calculator.previousValue || 0;
      const newValue = this.calculateResult(currentValue, inputValue, this.calculator.operation);

      this.calculator.display = String(newValue);
      this.calculator.previousValue = newValue;
    }

    this.calculator.waitingForOperand = true;
    this.calculator.operation = nextOperator;
  }

  performCalculation() {
    const inputValue = parseFloat(this.calculator.display);

    if (this.calculator.previousValue === null) {
      return;
    }

    const newValue = this.calculateResult(this.calculator.previousValue, inputValue, this.calculator.operation);

    this.calculator.display = String(newValue);
    this.calculator.previousValue = null;
    this.calculator.operation = null;
    this.calculator.waitingForOperand = true;
  }

  calculateResult(firstValue, secondValue, operation) {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      default:
        return secondValue;
    }
  }

  clearCalculator() {
    this.calculator.display = '0';
    this.calculator.previousValue = null;
    this.calculator.operation = null;
    this.calculator.waitingForOperand = false;
  }

  backspace() {
    if (this.calculator.display.length > 1) {
      this.calculator.display = this.calculator.display.slice(0, -1);
    } else {
      this.calculator.display = '0';
    }
  }
}

// Initialize FakeOS when DOM is loaded
let fakeOS;
document.addEventListener('DOMContentLoaded', () => {
  fakeOS = new FakeOS();
});

// Add some CSS for context menu
const style = document.createElement('style');
style.textContent = `
  .context-item {
    padding: 8px 16px;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  
  .context-item:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;
document.head.appendChild(style);

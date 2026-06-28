/* ============================================
   QA AUTOMATION TRAINING GROUND - JAVASCRIPT
   ============================================
   Core utilities for the QA Training Platform
   Includes: Navigation, Progress, Quiz, Toast,
   Modals, Code Copy, Playground utilities
   ============================================ */

// ==========================================
// 1. GLOBAL STATE MANAGEMENT
// ==========================================

/**
 * Global application state
 * Tracks sidebar state, current module, quiz progress
 */
const AppState = {
  sidebarOpen: true,
  currentModule: null,
  quizProgress: {},
  moduleProgress: {},
  completedSections: [],

  /**
   * Initialize state from localStorage
   * Restores saved progress on page load
   */
  init() {
    const savedProgress = localStorage.getItem('qa-training-progress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        this.moduleProgress = parsed.moduleProgress || {};
        this.completedSections = parsed.completedSections || [];
        this.quizProgress = parsed.quizProgress || {};
      } catch (e) {
        console.warn('Failed to parse saved progress:', e);
      }
    }
  },

  /**
   * Save current state to localStorage
   */
  save() {
    localStorage.setItem('qa-training-progress', JSON.stringify({
      moduleProgress: this.moduleProgress,
      completedSections: this.completedSections,
      quizProgress: this.quizProgress
    }));
  },

  /**
   * Mark a section as completed
   * @param {string} moduleId - Module identifier
   * @param {string} sectionId - Section identifier
   */
  completeSection(moduleId, sectionId) {
    const key = `${moduleId}-${sectionId}`;
    if (!this.completedSections.includes(key)) {
      this.completedSections.push(key);
      this.save();
      this.updateProgressUI();
    }
  },

  /**
   * Get completion percentage for a module
   * @param {string} moduleId - Module identifier
   * @param {number} totalSections - Total sections in module
   * @returns {number} Percentage complete (0-100)
   */
  getModuleProgress(moduleId, totalSections) {
    const completed = this.completedSections.filter(s => s.startsWith(moduleId)).length;
    return totalSections > 0 ? Math.round((completed / totalSections) * 100) : 0;
  }
};

// Initialize state on load
AppState.init();

// ==========================================
// 2. SIDEBAR NAVIGATION
// ==========================================

/**
 * Sidebar Navigation Controller
 * Handles toggle, collapse, and active states
 */
const Sidebar = {
  /** Toggle sidebar open/closed state */
  toggle() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    if (sidebar) {
      AppState.sidebarOpen = !AppState.sidebarOpen;
      sidebar.classList.toggle('collapsed', !AppState.sidebarOpen);

      if (mainContent) {
        mainContent.classList.toggle('sidebar-collapsed', !AppState.sidebarOpen);
      }

      // Save preference
      localStorage.setItem('sidebar-collapsed', !AppState.sidebarOpen);
    }
  },

  /** Initialize sidebar based on saved preference */
  init() {
    const sidebar = document.querySelector('.sidebar');
    const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';

    if (sidebar && isCollapsed) {
      sidebar.classList.add('collapsed');
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.classList.add('sidebar-collapsed');
      }
    }

    // Add toggle button listener
    const toggleBtn = document.querySelector('.sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggle());
    }

    // Set active nav item based on current page
    this.setActiveNavItem();
  },

  /** Set the active navigation item based on current URL */
  setActiveNavItem() {
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href && currentPath.includes(href.split('/').pop().replace('.html', ''))) {
        item.classList.add('active');
        AppState.currentModule = href;
      }
    });
  }
};

// ==========================================
// 3. COLLAPSIBLE SECTIONS
// ==========================================

/**
 * Collapsible Section Controller
 * Handles expand/collapse animations and state
 */
const Collapsibles = {
  /** Initialize all collapsibles on the page */
  init() {
    const headers = document.querySelectorAll('.collapsible-header');

    headers.forEach(header => {
      header.addEventListener('click', (e) => {
        const collapsible = header.closest('.collapsible');
        const moduleId = collapsible.dataset.module;
        const sectionId = collapsible.dataset.section;

        // Toggle the open state
        collapsible.classList.toggle('open');

        // If opening, mark section as complete
        if (collapsible.classList.contains('open') && moduleId && sectionId) {
          AppState.completeSection(moduleId, sectionId);
        }
      });

      // Add keyboard support (Enter and Space)
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          header.click();
        }
      });

      // Make header focusable
      header.setAttribute('tabindex', '0');
      header.setAttribute('role', 'button');
      header.setAttribute('aria-expanded', 'false');

      // Update aria-expanded on click
      const observer = new MutationObserver(() => {
        const isOpen = header.closest('.collapsible').classList.contains('open');
        header.setAttribute('aria-expanded', isOpen);
      });
    });
  },

  /** Open a specific collapsible by ID */
  open(id) {
    const collapsible = document.querySelector(`.collapsible[data-section="${id}"]`);
    if (collapsible && !collapsible.classList.contains('open')) {
      collapsible.classList.add('open');
    }
  },

  /** Close a specific collapsible by ID */
  close(id) {
    const collapsible = document.querySelector(`.collapsible[data-section="${id}"]`);
    if (collapsible && collapsible.classList.contains('open')) {
      collapsible.classList.remove('open');
    }
  },

  /** Close all collapsibles */
  closeAll() {
    document.querySelectorAll('.collapsible.open').forEach(c => c.classList.remove('open'));
  },

  /** Open all collapsibles */
  openAll() {
    document.querySelectorAll('.collapsible').forEach(c => c.classList.add('open'));
  }
};

// ==========================================
// 4. TOAST NOTIFICATIONS
// ==========================================

/**
 * Toast Notification System
 * Shows temporary notifications to users
 */
const Toast = {
  container: null,

  /** Initialize toast container */
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.setAttribute('aria-live', 'polite');
      document.body.appendChild(this.container);
    }
  },

  /**
   * Show a toast notification
   * @param {Object} options - Toast options
   * @param {string} options.title - Toast title
   * @param {string} options.message - Toast message
   * @param {string} [options.type='info'] - Toast type: info, success, error, warning
   * @param {number} [options.duration=5000] - Auto-dismiss duration in ms
   */
  show({ title, message, type = 'info', duration = 5000 }) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fas fa-${this.getIcon(type)}"></i>
      </div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close notification">
        <i class="fas fa-times"></i>
      </button>
    `;

    // Close button handler
    toast.querySelector('.toast-close').addEventListener('click', () => {
      this.dismiss(toast);
    });

    this.container.appendChild(toast);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }

    return toast;
  },

  /**
   * Dismiss a toast notification
   * @param {HTMLElement} toast - Toast element to dismiss
   */
  dismiss(toast) {
    toast.style.animation = 'slideIn 0.25s ease reverse';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 250);
  },

  /** Get icon class for toast type */
  getIcon(type) {
    const icons = {
      info: 'info-circle',
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle'
    };
    return icons[type] || icons.info;
  },

  /** Convenience methods */
  info(title, message) { return this.show({ title, message, type: 'info' }); },
  success(title, message) { return this.show({ title, message, type: 'success' }); },
  error(title, message) { return this.show({ title, message, type: 'error' }); },
  warning(title, message) { return this.show({ title, message, type: 'warning' }); }
};

// ==========================================
// 5. MODAL DIALOGS
// ==========================================

/**
 * Modal Dialog Controller
 * Handles opening, closing, and backdrop clicks
 */
const Modal = {
  activeModal: null,

  /**
   * Open a modal by ID
   * @param {string} modalId - ID of modal to open
   */
  open(modalId) {
    const backdrop = document.getElementById('modal-backdrop');
    const modal = document.getElementById(modalId);

    if (backdrop && modal) {
      backdrop.classList.add('open');
      modal.classList.add('open');
      this.activeModal = modal;

      // Focus trap - focus first focusable element
      const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable) focusable.focus();

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
  },

  /**
   * Close the currently active modal
   */
  close() {
    const backdrop = document.getElementById('modal-backdrop');

    if (backdrop) {
      backdrop.classList.remove('open');
    }

    if (this.activeModal) {
      this.activeModal.classList.remove('open');
      this.activeModal = null;
    }

    // Restore body scroll
    document.body.style.overflow = '';
  },

  /** Initialize modal event listeners */
  init() {
    const backdrop = document.getElementById('modal-backdrop');

    // Close on backdrop click
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.close();
        }
      });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close();
      }
    });

    // Close buttons
    document.querySelectorAll('.modal-close, [data-modal-close]').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });
  }
};

// ==========================================
// 6. CODE BLOCK COPY FUNCTIONALITY
// ==========================================

/**
 * Code Block Copy Controller
 * Adds copy buttons to code blocks
 */
const CodeCopy = {
  /** Initialize all code blocks with copy functionality */
  init() {
    document.querySelectorAll('.code-block').forEach(block => {
      const copyBtn = block.querySelector('.code-block-copy');
      const code = block.querySelector('pre code');

      if (copyBtn && code) {
        copyBtn.addEventListener('click', async () => {
          const text = code.textContent;

          try {
            await navigator.clipboard.writeText(text);
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';

            setTimeout(() => {
              copyBtn.classList.remove('copied');
              copyBtn.innerHTML = '<i class="far fa-copy"></i> Copy';
            }, 2000);
          } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);

            copyBtn.classList.add('copied');
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
              copyBtn.classList.remove('copied');
              copyBtn.innerHTML = '<i class="far fa-copy"></i> Copy';
            }, 2000);
          }
        });
      }
    });
  }
};

// ==========================================
// 7. QUIZ SYSTEM
// ==========================================

/**
 * Quiz System Controller
 * Handles quiz logic, scoring, and feedback
 */
const Quiz = {
  /**
   * Initialize a quiz by its container ID
   * @param {string} containerId - ID of quiz container
   */
  init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const questions = container.querySelectorAll('.quiz-question');
    let currentQuestion = 0;
    let score = 0;
    const answers = [];

    this.showQuestion(container, currentQuestion, questions, answers);

    // Next button handler
    container.querySelector('.quiz-next')?.addEventListener('click', () => {
      if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        this.showQuestion(container, currentQuestion, questions, answers);
      }
    });

    // Previous button handler
    container.querySelector('.quiz-prev')?.addEventListener('click', () => {
      if (currentQuestion > 0) {
        currentQuestion--;
        this.showQuestion(container, currentQuestion, questions, answers);
      }
    });
  },

  /**
   * Display a specific question
   */
  showQuestion(container, index, questions, answers) {
    const question = questions[index];
    const options = question.querySelectorAll('.quiz-option');
    const prevBtn = container.querySelector('.quiz-prev');
    const nextBtn = container.querySelector('.quiz-next');
    const progressFill = container.querySelector('.quiz-progress-fill');
    const progressText = container.querySelector('.quiz-progress-text');

    // Update progress
    if (progressFill) {
      progressFill.style.width = `${((index + 1) / questions.length) * 100}%`;
    }
    if (progressText) {
      progressText.textContent = `Question ${index + 1} of ${questions.length}`;
    }

    // Hide all questions and show current
    questions.forEach((q, i) => {
      q.style.display = i === index ? 'block' : 'none';
    });

    // Update navigation buttons
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) {
      nextBtn.disabled = index === questions.length - 1;
      nextBtn.textContent = index === questions.length - 1 ? 'See Results' : 'Next';
    }

    // Add click handlers to options
    options.forEach(option => {
      option.addEventListener('click', () => {
        if (option.classList.contains('disabled')) return;

        // Disable all options
        options.forEach(opt => {
          opt.classList.add('disabled');
          opt.classList.remove('selected');
        });

        // Select this option
        option.classList.add('selected');

        // Store answer
        const isCorrect = option.dataset.correct === 'true';
        answers[index] = isCorrect;

        // Show correct/incorrect
        if (isCorrect) {
          option.classList.add('correct');
        } else {
          option.classList.add('incorrect');
          // Show correct answer
          options.forEach(opt => {
            if (opt.dataset.correct === 'true') {
              opt.classList.add('correct');
            }
          });
        }

        // Show explanation
        const explanation = question.querySelector('.quiz-explanation');
        if (explanation) {
          explanation.style.display = 'block';
        }
      });
    });
  },

  /**
   * Calculate and display final score
   * @param {string} containerId - Quiz container ID
   * @param {Array} answers - User's answers
   */
  showResults(containerId, answers) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const score = answers.filter(a => a === true).length;
    const total = answers.length;
    const percentage = Math.round((score / total) * 100);

    const resultsDiv = container.querySelector('.quiz-results');
    if (resultsDiv) {
      resultsDiv.innerHTML = `
        <div class="quiz-score">${percentage}%</div>
        <div class="quiz-score-label">You scored ${score} out of ${total} correctly</div>
        <button class="btn btn-primary mt-4" onclick="Quiz.restart('${containerId}')">
          <i class="fas fa-redo"></i> Try Again
        </button>
      `;
      resultsDiv.style.display = 'block';
    }

    // Hide question container
    container.querySelectorAll('.quiz-question').forEach(q => q.style.display = 'none');
    container.querySelector('.quiz-footer')?.style.display = 'none';
  },

  /**
   * Restart a quiz
   * @param {string} containerId - Quiz container ID
   */
  restart(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Reset UI
    container.querySelectorAll('.quiz-option').forEach(opt => {
      opt.classList.remove('disabled', 'selected', 'correct', 'incorrect');
    });
    container.querySelectorAll('.quiz-explanation').forEach(exp => {
      exp.style.display = 'none';
    });
    const resultsDiv = container.querySelector('.quiz-results');
    if (resultsDiv) resultsDiv.style.display = 'none';
    container.querySelector('.quiz-footer')?.style.removeProperty('display');

    // Reinitialize
    this.init(containerId);
  }
};

// ==========================================
// 8. PROGRESS TRACKING UI
// ==========================================

/**
 * Progress Tracking UI Updates
 */
const ProgressUI = {
  /** Update all progress indicators on the page */
  updateAll() {
    this.updateProgressBar();
    this.updateModuleCards();
    this.updateSidebarProgress();
  },

  /** Update main progress bar */
  updateProgressBar() {
    const progressBars = document.querySelectorAll('[data-progress-bar]');
    progressBars.forEach(bar => {
      const moduleId = bar.dataset.moduleId;
      const totalSections = parseInt(bar.dataset.totalSections) || 1;
      const percentage = AppState.getModuleProgress(moduleId, totalSections);

      const fill = bar.querySelector('.progress-fill');
      if (fill) {
        fill.style.width = `${percentage}%`;
      }
    });
  },

  /** Update module cards progress */
  updateModuleCards() {
    document.querySelectorAll('.module-card').forEach(card => {
      const moduleId = card.dataset.moduleId;
      const totalSections = parseInt(card.dataset.totalSections) || 1;
      const percentage = AppState.getModuleProgress(moduleId, totalSections);

      const progressBar = card.querySelector('.module-progress-bar');
      if (progressBar) {
        progressBar.style.width = `${percentage}%`;
      }

      const progressText = card.querySelector('.module-progress-text');
      if (progressText) {
        progressText.textContent = `${percentage}% complete`;
      }
    });
  },

  /** Update sidebar overall progress */
  updateSidebarProgress() {
    const allModules = document.querySelectorAll('[data-module-id]');
    const totalSections = allModules.length;
    const completedSections = AppState.completedSections.length;
    const overallPercentage = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

    const progressFill = document.querySelector('.sidebar .progress-fill');
    if (progressFill) {
      progressFill.style.width = `${overallPercentage}%`;
    }

    const progressLabel = document.querySelector('.sidebar .progress-label span');
    if (progressLabel) {
      progressLabel.textContent = `${overallPercentage}%`;
    }
  }
};

// ==========================================
// 9. CODE PLAYGROUND EXECUTION
// ==========================================

/**
 * Code Playground Executor
 * Safely runs user code in sandboxed environment
 */
const Playground = {
  /**
   * Execute JavaScript code from playground
   * @param {string} codeId - ID of code element
   * @param {string} outputId - ID of output element
   */
  executeCode(codeId, outputId) {
    const codeElement = document.getElementById(codeId);
    const outputElement = document.getElementById(outputId);

    if (!codeElement || !outputElement) return;

    const code = codeElement.textContent;
    outputElement.innerHTML = '';
    outputElement.classList.remove('error');

    // Create sandboxed execution context
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const logs = [];

    console.log = (...args) => {
      logs.push({ type: 'log', content: args.map(a => this.formatOutput(a)).join(' ') });
    };
    console.error = (...args) => {
      logs.push({ type: 'error', content: args.map(a => this.formatOutput(a)).join(' ') });
    };
    console.warn = (...args) => {
      logs.push({ type: 'warn', content: args.map(a => this.formatOutput(a)).join(' ') });
    };

    try {
      // Execute in try-catch for error handling
      // eslint-disable-next-line no-eval
      const result = eval(code);

      // If there's a return value, show it
      if (result !== undefined) {
        logs.push({ type: 'result', content: `→ ${this.formatOutput(result)}` });
      }

      // Display all logs
      outputElement.innerHTML = logs
        .map(log => `<div class="output-${log.type}">${this.escapeHtml(log.content)}</div>`)
        .join('');

    } catch (error) {
      outputElement.classList.add('error');
      outputElement.innerHTML = `<div class="output-error">Error: ${this.escapeHtml(error.message)}</div>`;
      console.error(error);
    } finally {
      // Restore console methods
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    }
  },

  /**
   * Format output for display
   * @param {any} value - Value to format
   * @returns {string} Formatted string
   */
  formatOutput(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  },

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Initialize a playground with run/reset buttons
   * @param {string} containerId - Playground container ID
   * @param {string} codeId - Code element ID
   * @param {string} outputId - Output element ID
   */
  initPlayground(containerId, codeId, outputId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const runBtn = container.querySelector('.playground-run');
    const resetBtn = container.querySelector('.playground-reset');

    if (runBtn) {
      runBtn.addEventListener('click', () => this.executeCode(codeId, outputId));
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        const output = document.getElementById(outputId);
        if (output) output.innerHTML = '';
      });
    }

    // Allow Ctrl+Enter to run code
    const codeElement = document.getElementById(codeId);
    if (codeElement) {
      codeElement.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          this.executeCode(codeId, outputId);
        }
      });
    }
  }
};

// ==========================================
// 10. FORM VALIDATION HELPERS
// ==========================================

/**
 * Form Validation Utilities
 * Common validation patterns for testing practice
 */
const Validation = {
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Is valid email
   */
  isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  /**
   * Validate password strength
   * @param {string} password - Password to check
   * @returns {Object} Validation result with strength
   */
  checkPasswordStrength(password) {
    let strength = 0;
    const feedback = [];

    if (password.length >= 8) {
      strength++;
    } else {
      feedback.push('At least 8 characters');
    }

    if (/[a-z]/.test(password)) strength++;
    else feedback.push('Lowercase letter');

    if (/[A-Z]/.test(password)) strength++;
    else feedback.push('Uppercase letter');

    if (/[0-9]/.test(password)) strength++;
    else feedback.push('Number');

    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    else feedback.push('Special character');

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return {
      strength: strength,
      label: labels[strength] || 'Very Weak',
      feedback,
      isValid: strength >= 3
    };
  },

  /**
   * Validate required field
   * @param {string} value - Value to check
   * @returns {boolean} Is not empty
   */
  isRequired(value) {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
  },

  /**
   * Validate minimum length
   * @param {string} value - Value to check
   * @param {number} min - Minimum length
   * @returns {boolean} Meets minimum length
   */
  minLength(value, min) {
    return value && value.length >= min;
  },

  /**
   * Validate maximum length
   * @param {string} value - Value to check
   * @param {number} max - Maximum length
   * @returns {boolean} Within maximum length
   */
  maxLength(value, max) {
    return value && value.length <= max;
  },

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} Is valid URL
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
};

// ==========================================
// 11. SEARCH & FILTER FUNCTIONALITY
// ==========================================

/**
 * Search and Filter Controller
 */
const SearchFilter = {
  /**
   * Filter elements by search query
   * @param {string} inputId - Search input ID
   * @param {string} containerSelector - Selector for items to filter
   * @param {string} textSelector - Selector for text content to search
   */
  initSearch(inputId, containerSelector, textSelector) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const items = document.querySelectorAll(containerSelector);

      items.forEach(item => {
        const text = item.querySelector(textSelector)?.textContent.toLowerCase() || '';
        const matches = text.includes(query);
        item.style.display = matches ? '' : 'none';
      });
    });
  },

  /**
   * Filter tabs in a tab container
   * @param {string} filterId - Filter input ID
   * @param {string} tabClass - Class of tab items
   */
  filterTabs(filterId, tabClass) {
    const input = document.getElementById(filterId);
    if (!input) return;

    input.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const tabs = document.querySelectorAll(`.${tabClass}`);

      tabs.forEach(tab => {
        const label = tab.textContent.toLowerCase();
        tab.style.display = label.includes(query) ? '' : 'none';
      });
    });
  }
};

// ==========================================
// 12. INTERACTIVE EXAMPLES
// ==========================================

/**
 * Interactive Example Handlers
 * For testing practice playgrounds
 */
const InteractiveExamples = {
  /**
   * Initialize login form playground
   * @param {string} formId - Form element ID
   */
  initLoginForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"]');
    const submitBtn = form.querySelector('button[type="submit"]');
    const errorDisplay = form.querySelector('.form-error');
    const successDisplay = form.querySelector('.form-success');

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Clear previous messages
      if (errorDisplay) errorDisplay.style.display = 'none';
      if (successDisplay) successDisplay.style.display = 'none';

      // Validate
      const email = emailInput?.value;
      const password = passwordInput?.value;

      if (!Validation.isRequired(email)) {
        if (errorDisplay) {
          errorDisplay.textContent = 'Email is required';
          errorDisplay.style.display = 'block';
        }
        return;
      }

      if (!Validation.isValidEmail(email)) {
        if (errorDisplay) {
          errorDisplay.textContent = 'Please enter a valid email address';
          errorDisplay.style.display = 'block';
        }
        return;
      }

      if (!Validation.isRequired(password)) {
        if (errorDisplay) {
          errorDisplay.textContent = 'Password is required';
          errorDisplay.style.display = 'block';
        }
        return;
      }

      if (!Validation.minLength(password, 6)) {
        if (errorDisplay) {
          errorDisplay.textContent = 'Password must be at least 6 characters';
          errorDisplay.style.display = 'block';
        }
        return;
      }

      // Simulate successful login
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sign In';

        if (successDisplay) {
          successDisplay.textContent = `Welcome! Logged in as ${email}`;
          successDisplay.className = 'form-success';
          successDisplay.style.display = 'block';
        }

        Toast.success('Login Successful', `Welcome back!`);
      }, 1500);
    });
  },

  /**
   * Initialize form validation playground
   * @param {string} formId - Form element ID
   */
  initValidationForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const inputs = form.querySelectorAll('.form-input');

    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        this.validateInput(input);
      });

      input.addEventListener('input', () => {
        // Clear error on input
        input.classList.remove('error');
        const error = input.parentElement.querySelector('.form-error');
        if (error) error.style.display = 'none';
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid = true;

      inputs.forEach(input => {
        if (!this.validateInput(input)) {
          isValid = false;
        }
      });

      if (isValid) {
        Toast.success('Form Valid', 'All fields are correctly filled!');
      } else {
        Toast.error('Validation Failed', 'Please fix the errors above');
      }
    });
  },

  /**
   * Validate a single input field
   * @param {HTMLElement} input - Input element
   * @returns {boolean} Is valid
   */
  validateInput(input) {
    const value = input.value;
    const required = input.required;
    const minLength = parseInt(input.minLength) || 0;
    const maxLength = parseInt(input.maxLength) || Infinity;
    const type = input.type;

    let isValid = true;
    let errorMessage = '';

    // Check required
    if (required && !Validation.isRequired(value)) {
      isValid = false;
      errorMessage = 'This field is required';
    }
    // Check min length
    else if (value && value.length < minLength) {
      isValid = false;
      errorMessage = `Minimum ${minLength} characters required`;
    }
    // Check max length
    else if (value && value.length > maxLength) {
      isValid = false;
      errorMessage = `Maximum ${maxLength} characters allowed`;
    }
    // Check email
    else if (type === 'email' && value && !Validation.isValidEmail(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid email address';
    }

    // Update UI
    const formGroup = input.parentElement;
    const errorDisplay = formGroup.querySelector('.form-error');

    if (!isValid) {
      input.classList.add('error');
      if (errorDisplay) {
        errorDisplay.textContent = errorMessage;
        errorDisplay.style.display = 'block';
      }
    } else {
      input.classList.remove('error');
      if (errorDisplay) errorDisplay.style.display = 'none';
    }

    return isValid;
  },

  /**
   * Initialize table sorting playground
   * @param {string} tableId - Table element ID
   */
  initSortableTable(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const headers = table.querySelectorAll('th[data-sortable]');

    headers.forEach((header, columnIndex) => {
      header.style.cursor = 'pointer';
      header.addEventListener('click', () => {
        this.sortTable(table, columnIndex, header.dataset.sortType || 'string');
      });
    });
  },

  /**
   * Sort table by column
   * @param {HTMLElement} table - Table element
   * @param {number} columnIndex - Column to sort by
   * @param {string} sortType - Sort type: string, number, date
   */
  sortTable(table, columnIndex, sortType) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const isAsc = table.dataset.sortDir !== 'asc';

    rows.sort((a, b) => {
      const aVal = a.cells[columnIndex]?.textContent.trim() || '';
      const bVal = b.cells[columnIndex]?.textContent.trim() || '';

      let comparison = 0;
      if (sortType === 'number') {
        comparison = parseFloat(aVal) - parseFloat(bVal);
      } else if (sortType === 'date') {
        comparison = new Date(aVal) - new Date(bVal);
      } else {
        comparison = aVal.localeCompare(bVal);
      }

      return isAsc ? comparison : -comparison;
    });

    // Re-append rows in sorted order
    rows.forEach(row => tbody.appendChild(row));

    // Update sort direction for next click
    table.dataset.sortDir = isAsc ? 'asc' : 'desc';

    // Update header icons
    const headers = table.querySelectorAll('th');
    headers.forEach((h, i) => {
      const icon = h.querySelector('i');
      if (icon) {
        icon.className = i === columnIndex
          ? (isAsc ? 'fas fa-sort-up' : 'fas fa-sort-down')
          : 'fas fa-sort';
      }
    });
  }
};

// ==========================================
// 13. TABS SYSTEM
// ==========================================

/**
 * Tabs Controller
 */
const Tabs = {
  /**
   * Initialize tabs in a container
   * @param {string} containerId - Tabs container ID
   */
  init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const tabButtons = container.querySelectorAll('.tab-btn');
    const tabPanels = container.querySelectorAll('.tab-panel');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.tab;

        // Remove active from all
        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));

        // Add active to clicked
        btn.classList.add('active');
        document.getElementById(targetId)?.classList.add('active');
      });
    });
  }
};

// ==========================================
// 14. INITIALIZATION
// ==========================================

/**
 * Initialize all components when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize core components
  Sidebar.init();
  Collapsibles.init();
  Modal.init();
  CodeCopy.init();
  ProgressUI.updateAll();

  // Initialize interactive examples
  document.querySelectorAll('[data-playground]').forEach(container => {
    const type = container.dataset.playground;
    const codeId = container.dataset.codeId;
    const outputId = container.dataset.outputId;

    if (type === 'login-form') {
      InteractiveExamples.initLoginForm(container.id);
    } else if (type === 'validation-form') {
      InteractiveExamples.initValidationForm(container.id);
    } else if (type === 'sortable-table') {
      InteractiveExamples.initSortableTable(container.id);
    } else if (type === 'code') {
      Playground.initPlayground(container.id, codeId, outputId);
    }
  });

  // Initialize quizzes
  document.querySelectorAll('[data-quiz]').forEach(quiz => {
    Quiz.init(quiz.id);
  });

  // Initialize tabs
  document.querySelectorAll('[data-tabs]').forEach(tabContainer => {
    Tabs.init(tabContainer.id);
  });

  // Initialize search
  const searchInput = document.getElementById('module-search');
  if (searchInput) {
    SearchFilter.initSearch('module-search', '.module-card', '.card-title');
  }

  console.log('QA Training Platform initialized');
});

// ==========================================
// 15. EXPORTED API
// ==========================================

// Make utilities available globally for use in HTML
window.QAApp = {
  AppState,
  Sidebar,
  Collapsibles,
  Toast,
  Modal,
  CodeCopy,
  Quiz,
  ProgressUI,
  Playground,
  Validation,
  SearchFilter,
  InteractiveExamples,
  Tabs
};
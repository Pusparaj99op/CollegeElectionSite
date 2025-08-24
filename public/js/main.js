/**
 * Enhanced Main JavaScript File
 * Purpose: Client-side functionality and interactions for College Election Site
 * Version: 2.0.0
 * Last Modified: August 1, 2025
 * Created By: Pranay Gajbhiye
 */

// Global variables
let isLoading = false;
const ANIMATION_DURATION = 300;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
  initializeComponents();
  setupEventListeners();
  loadAnimations();
  setupProgressiveEnhancement();
});

// Initialize all components
function initializeComponents() {
  // Bootstrap tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Bootstrap popovers
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  popoverTriggerList.map(function(popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl);
  });

  // Auto-hide flash messages
  setTimeout(() => {
    const alerts = document.querySelectorAll('.alert-dismissible');
    alerts.forEach(alert => {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    });
  }, 6000);

  // Initialize lazy loading for images
  if ('IntersectionObserver' in window) {
    setupLazyLoading();
  }
}

// Setup event listeners
function setupEventListeners() {
  // Form validation
  const forms = document.querySelectorAll('.needs-validation');
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', handleFormSubmit);
  });

  // Loading states for buttons
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-loading')) {
      handleLoadingButton(e.target);
    }
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Keyboard navigation improvements
  document.addEventListener('keydown', handleKeyboardNavigation);

  // Search functionality
  const searchInputs = document.querySelectorAll('.search-input');
  searchInputs.forEach(input => {
    input.addEventListener('input', debounce(handleSearch, 300));
  });
}

// Handle form submission with validation
function handleFormSubmit(event) {
  const form = event.target;

  if (!form.checkValidity()) {
    event.preventDefault();
    event.stopPropagation();

    // Focus on first invalid field
    const firstInvalid = form.querySelector(':invalid');
    if (firstInvalid) {
      firstInvalid.focus();
      showNotification('Please check the highlighted fields', 'warning');
    }
  } else {
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      handleLoadingButton(submitBtn);
    }
  }

  form.classList.add('was-validated');
}

// Handle loading button states
function handleLoadingButton(button) {
  if (isLoading) return;

  isLoading = true;
  const originalText = button.innerHTML;
  const loadingText = button.dataset.loading || 'Loading...';

  button.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>${loadingText}`;
  button.disabled = true;

  // Reset after 10 seconds (fallback)
  setTimeout(() => {
    button.innerHTML = originalText;
    button.disabled = false;
    isLoading = false;
  }, 10000);
}

// Debounce function for search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Handle search functionality
function handleSearch(event) {
  const query = event.target.value.trim();
  const searchResults = document.querySelector('.search-results');

  if (query.length < 2) {
    if (searchResults) searchResults.innerHTML = '';
    return;
  }

  // Show loading
  if (searchResults) {
    searchResults.innerHTML = '<div class="spinner-custom mx-auto"></div>';
  }

  // Simulate search (replace with actual search implementation)
  setTimeout(() => {
    if (searchResults) {
      searchResults.innerHTML = `<p class="text-muted">Search results for "${query}"...</p>`;
    }
  }, 500);
}

// Keyboard navigation
function handleKeyboardNavigation(event) {
  // ESC key closes modals and dropdowns
  if (event.key === 'Escape') {
    const openModals = document.querySelectorAll('.modal.show');
    openModals.forEach(modal => {
      const bsModal = bootstrap.Modal.getInstance(modal);
      if (bsModal) bsModal.hide();
    });
  }
}

// Load animations and effects
function loadAnimations() {
  // Animate cards on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe cards and other elements
  document.querySelectorAll('.card, .alert, .table').forEach(el => {
    observer.observe(el);
  });
}

// Setup lazy loading for images
function setupLazyLoading() {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// Progressive enhancement
function setupProgressiveEnhancement() {
  // Add loading states to forms
  document.querySelectorAll('form').forEach(form => {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn && !submitBtn.classList.contains('btn-loading')) {
      submitBtn.classList.add('btn-loading');
    }
  });

  // Enhance tables with sorting
  enhanceTables();

  // Setup notification system
  setupNotifications();
}

// Enhance tables with basic sorting
function enhanceTables() {
  document.querySelectorAll('.table-sortable thead th').forEach(header => {
    if (!header.classList.contains('no-sort')) {
      header.style.cursor = 'pointer';
      header.addEventListener('click', () => sortTable(header));
    }
  });
}

// Basic table sorting
function sortTable(header) {
  const table = header.closest('table');
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const index = Array.from(header.parentNode.children).indexOf(header);
  const isAscending = header.classList.contains('sort-asc');

  rows.sort((a, b) => {
    const aText = a.children[index].textContent.trim();
    const bText = b.children[index].textContent.trim();

    if (isAscending) {
      return bText.localeCompare(aText);
    } else {
      return aText.localeCompare(bText);
    }
  });

  // Update header classes
  header.parentNode.querySelectorAll('th').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
  });

  header.classList.add(isAscending ? 'sort-desc' : 'sort-asc');

  // Reorder rows
  rows.forEach(row => tbody.appendChild(row));
}

// Notification system
function setupNotifications() {
  window.showNotification = function(message, type = 'info', duration = 5000) {
    const container = getNotificationContainer();
    const notification = createNotification(message, type);

    container.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto remove
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (container.contains(notification)) {
          container.removeChild(notification);
        }
      }, 300);
    }, duration);
  };
}

// Get or create notification container
function getNotificationContainer() {
  let container = document.querySelector('.notification-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1060;
      max-width: 400px;
    `;
    document.body.appendChild(container);
  }
  return container;
}

// Create notification element
function createNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type} alert-dismissible notification-item`;
  notification.style.cssText = `
    margin-bottom: 10px;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
  `;

  notification.innerHTML = `
    ${message}
    <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
  `;

  // Add show class for animation
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 100);

  return notification;
}

// Countdown timer functionality
function updateCountdowns() {
  const countdownElements = document.querySelectorAll('.election-countdown');

  countdownElements.forEach(element => {
    const targetDate = new Date(element.dataset.target).getTime();
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference <= 0) {
      element.innerHTML = 'Ended';
      return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    element.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  });
}

/**
 * Update password strength indicator
 * @param {string} password - The password to check
 * @param {Element} element - The element to update
 */
function updatePasswordStrength(password, element) {
  // Password strength criteria
  const lengthValid = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  // Calculate strength
  let strength = 0;
  if (lengthValid) strength++;
  if (hasUpperCase) strength++;
  if (hasLowerCase) strength++;
  if (hasNumbers) strength++;
  if (hasSpecialChars) strength++;

  // Update UI
  let strengthText = '';
  let strengthClass = '';

  switch(strength) {
    case 0:
    case 1:
      strengthText = 'Very Weak';
      strengthClass = 'bg-danger';
      break;
    case 2:
      strengthText = 'Weak';
      strengthClass = 'bg-warning';
      break;
    case 3:
      strengthText = 'Medium';
      strengthClass = 'bg-info';
      break;
    case 4:
      strengthText = 'Strong';
      strengthClass = 'bg-primary';
      break;
    case 5:
      strengthText = 'Very Strong';
      strengthClass = 'bg-success';
      break;
  }

  // Update progress bar
  element.querySelector('.progress-bar').className = `progress-bar ${strengthClass}`;
  element.querySelector('.progress-bar').style.width = `${(strength / 5) * 100}%`;
  element.querySelector('.progress-bar').textContent = strengthText;
}

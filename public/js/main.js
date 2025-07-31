/**
 * Main JavaScript File
 * Purpose: Client-side functionality for College Election Site
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 * Created By: Pranay Gajbhiye
 */

// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
  // Bootstrap tooltips
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Flash message auto-hide
  setTimeout(function() {
    $('.alert-dismissible').alert('close');
  }, 5000);

  // Form validation
  const forms = document.querySelectorAll('.needs-validation');
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    }, false);
  });

  // Countdown timer for elections
  const countdownElements = document.querySelectorAll('.election-countdown');
  if (countdownElements.length > 0) {
    updateCountdowns();
    setInterval(updateCountdowns, 1000);
  }

  // Password strength meter
  const passwordInput = document.getElementById('password');
  const passwordStrength = document.getElementById('password-strength');
  if (passwordInput && passwordStrength) {
    passwordInput.addEventListener('input', function() {
      updatePasswordStrength(this.value, passwordStrength);
    });
  }
});

/**
 * Update all countdown timers on the page
 */
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

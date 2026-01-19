// 10X Accountability Coach - Landing Page Scripts

// Copy code to clipboard
function copyCode(button, codeId) {
  const codeElement = document.getElementById(codeId);
  const codeText = codeElement.textContent;

  navigator.clipboard.writeText(codeText).then(() => {
    // Update button state
    const originalText = button.innerHTML;
    button.classList.add('copied');
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Copied!
    `;

    // Reset after 2 seconds
    setTimeout(() => {
      button.classList.remove('copied');
      button.innerHTML = originalText;
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

// Toggle FAQ items
function toggleFaq(button) {
  const faqItem = button.closest('.faq-item');
  const isOpen = faqItem.classList.contains('open');

  // Close all FAQ items
  document.querySelectorAll('.faq-item').forEach(item => {
    item.classList.remove('open');
  });

  // Open clicked item if it was closed
  if (!isOpen) {
    faqItem.classList.add('open');
  }
}

// Mobile menu toggle
function toggleMobileMenu() {
  const navMenu = document.querySelector('.nav-menu');
  navMenu.classList.toggle('active');
}

// Check if user has already requested access
function checkAlreadyRequested() {
  const requested = localStorage.getItem('10x_access_requested');
  if (requested) {
    const requestData = JSON.parse(requested);
    const form = document.getElementById('access-form');
    if (form) {
      form.innerHTML = `
        <div class="already-requested">
          <div class="requested-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h3>Already Requested!</h3>
          <p>You've already requested access on <strong>${requestData.date}</strong></p>
          <p>We'll send your access link to <strong>${requestData.email}</strong> within 24 hours.</p>
          <p class="form-note">Check your inbox (and spam folder) for the access link.</p>
        </div>
      `;

      // Add styles for already requested state
      const style = document.createElement('style');
      style.textContent = `
        .already-requested {
          text-align: center;
          padding: 40px 20px;
        }
        .already-requested .requested-icon {
          width: 80px;
          height: 80px;
          background: rgba(34, 197, 94, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        .already-requested .requested-icon svg {
          color: #22c55e;
        }
        .already-requested h3 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 16px;
          color: #22c55e;
        }
        .already-requested p {
          color: #a1a1aa;
          margin-bottom: 12px;
          font-size: 15px;
        }
        .already-requested strong {
          color: #8b5cf6;
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// Handle access form submission
function handleAccessForm(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  const name = formData.get('name');
  const email = formData.get('email');
  const useCase = formData.get('use-case') || 'Not specified';

  // Get first name for personalization
  const firstName = name.split(' ')[0];

  // Map use case to friendly description
  const useCaseDescriptions = {
    'habits': 'building better daily habits',
    'fitness': 'achieving my fitness goals',
    'learning': 'learning new skills and staying consistent',
    'productivity': 'boosting my productivity and focus',
    'business': 'hitting my business goals',
    'other': 'personal development'
  };
  const friendlyUseCase = useCaseDescriptions[useCase] || useCase;

  // Create a conversational, personalized email body
  const subject = encodeURIComponent(`Beta Access Request: ${firstName} wants to join 10X Coach`);
  const body = encodeURIComponent(`Hi Team 10X,

I'm ${name} and I'm excited to request beta access to the 10X Accountability Coach!

I discovered your AI-powered accountability system and I'm particularly interested in ${friendlyUseCase}. I believe having an intelligent coaching partner will help me stay on track and build consistent momentum.

A bit about me:
- Name: ${name}
- Email: ${email}
- Primary Goal: ${friendlyUseCase}

I'm ready to start my first 30-day challenge and would love to be part of the beta program.

Looking forward to getting started!

Best,
${firstName}

---
Sent from: 10X Accountability Coach Landing Page
Submitted on: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);

  const yourEmail = 'support@1to10x.com';

  // Use Gmail compose URL directly (more reliable than mailto)
  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${yourEmail}&su=${subject}&body=${body}`;

  // Also create a standard mailto URL as fallback for non-Gmail users
  const mailtoUrl = `mailto:${yourEmail}?subject=${subject}&body=${body}`;

  // Save to localStorage to prevent duplicate requests
  const requestData = {
    name: name,
    email: email,
    useCase: useCase,
    friendlyUseCase: friendlyUseCase,
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  };
  localStorage.setItem('10x_access_requested', JSON.stringify(requestData));

  // Try to detect if user prefers Gmail or default email client
  // Open Gmail compose in new tab (most common)
  const newWindow = window.open(gmailComposeUrl, '_blank');

  // If popup was blocked, fall back to mailto
  if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    window.location.href = mailtoUrl;
  }

  // Show success modal
  showSuccessModal(email);

  // Update the form to show already requested state
  checkAlreadyRequested();
}

// Success modal
function showSuccessModal(email) {
  const modal = document.createElement('div');
  modal.className = 'success-modal';
  modal.innerHTML = `
    <div class="modal-backdrop" onclick="closeSuccessModal()"></div>
    <div class="modal-content">
      <div class="modal-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <h3>Request Submitted!</h3>
      <p>Thank you for your interest in 10X Accountability Coach.</p>
      <p>We'll send your access link to <strong>${email}</strong> within 24 hours.</p>
      <button class="btn btn-primary" onclick="closeSuccessModal()">Got it!</button>
    </div>
  `;

  // Add modal styles
  const style = document.createElement('style');
  style.textContent = `
    .success-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    }
    .modal-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(4px);
    }
    .modal-content {
      position: relative;
      background: #111118;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 48px;
      text-align: center;
      max-width: 400px;
      margin: 24px;
      animation: slideUp 0.3s ease;
    }
    .modal-icon {
      width: 80px;
      height: 80px;
      background: rgba(34, 197, 94, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .modal-icon svg {
      color: #22c55e;
    }
    .modal-content h3 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    .modal-content p {
      color: #a1a1aa;
      margin-bottom: 12px;
      font-size: 15px;
    }
    .modal-content strong {
      color: #8b5cf6;
    }
    .modal-content button {
      margin-top: 24px;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(modal);
}

function closeSuccessModal() {
  const modal = document.querySelector('.success-modal');
  if (modal) {
    modal.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => modal.remove(), 300);
  }
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const navHeight = document.querySelector('.navbar').offsetHeight;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 100) {
    navbar.style.background = 'rgba(10, 10, 15, 0.95)';
  } else {
    navbar.style.background = 'rgba(10, 10, 15, 0.8)';
  }
});

// Intersection Observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
  // Check if user has already requested access
  checkAlreadyRequested();

  // Add fade-in class to animatable elements
  const animatables = document.querySelectorAll(
    '.feature-card, .step, .command-card, .testimonial-card, .faq-item'
  );

  animatables.forEach((el, index) => {
    el.classList.add('fade-in');
    el.style.transitionDelay = `${index * 0.05}s`;
    observer.observe(el);
  });

  // Initialize page with fade in
  document.body.style.opacity = '0';
  requestAnimationFrame(() => {
    document.body.style.transition = 'opacity 0.5s ease';
    document.body.style.opacity = '1';
  });

  // AI typing animation - show message after 3 seconds
  const typingDots = document.getElementById('typing-dots');
  const typedText = document.getElementById('ai-typed-text');

  if (typingDots && typedText) {
    setTimeout(() => {
      // Hide typing dots
      typingDots.style.display = 'none';
      // Show the typed message with animation
      typedText.style.display = 'inline';
      typedText.style.animation = 'typeIn 0.5s ease forwards';
    }, 3000);
  }
});

// Toast notification
function showToast(message) {
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    ${message}
  `;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #22c55e;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 1000;
    animation: toastIn 0.3s ease;
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes toastIn {
      from { transform: translateX(-50%) translateY(100%); opacity: 0; }
      to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    @keyframes toastOut {
      from { transform: translateX(-50%) translateY(0); opacity: 1; }
      to { transform: translateX(-50%) translateY(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

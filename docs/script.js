/**
 * Autofy Landing Page Interactive Script
 */

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initCopyButtons();
  initStatsCounter();
  initScrollAnimations();
});

/**
 * Code Snippets Tab Switcher
 */
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panes = document.querySelectorAll('.code-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');

      // Update active tab button
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update active code panel
      panes.forEach(pane => {
        if (pane.id === targetTab) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });
    });
  });
}

/**
 * Copy to Clipboard functionality for Code blocks
 */
function initCopyButtons() {
  const copyButtons = document.querySelectorAll('.btn-copy');

  copyButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const targetId = button.getAttribute('data-target');
      const codeElement = document.getElementById(targetId);
      
      if (!codeElement) return;

      try {
        const textToCopy = codeElement.textContent;
        await navigator.clipboard.writeText(textToCopy);
        
        // Success visual feedback
        const originalText = button.textContent;
        button.textContent = 'Copiado! ✓';
        button.style.backgroundColor = 'rgba(62, 207, 142, 0.2)';
        button.style.borderColor = 'rgba(62, 207, 142, 0.5)';
        button.style.color = '#3ecf8e';

        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '';
          button.style.borderColor = '';
          button.style.color = '';
        }, 2000);
      } catch (err) {
        console.error('Falha ao copiar texto: ', err);
        button.textContent = 'Erro ao copiar ✗';
      }
    });
  });
}

/**
 * Animated Counter for Statistics Section
 */
function initStatsCounter() {
  const counters = document.querySelectorAll('.counter');
  const speed = 100; // Counter speed (higher means slower)

  const startCounting = (counter) => {
    const target = parseFloat(counter.getAttribute('data-target'));
    const isDecimal = counter.textContent.includes('.');
    let count = 0;
    
    const updateCount = () => {
      const increment = target / speed;
      
      if (count < target) {
        count += increment;
        if (isDecimal) {
          counter.textContent = count.toFixed(1);
        } else {
          counter.textContent = Math.ceil(count);
        }
        setTimeout(updateCount, 15);
      } else {
        counter.textContent = target; // Ensure exact final value
      }
    };
    
    updateCount();
  };

  // Intersection Observer to trigger counter when visible
  const observerOptions = {
    threshold: 0.5,
    rootMargin: "0px"
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        startCounting(counter);
        observer.unobserve(counter); // Run only once
      }
    });
  }, observerOptions);

  counters.forEach(counter => {
    observer.observe(counter);
  });
}

/**
 * Page scroll animation reveals
 */
function initScrollAnimations() {
  const scrollElements = document.querySelectorAll(
    '.feature-card, .diagram-node, .diagram-arrow, .step-card, .info-block, .verification-box'
  );

  // Set initial hidden state with style
  scrollElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(25px)';
    el.style.transition = 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
  });

  const elementInView = (el, dividend = 1) => {
    const elementTop = el.getBoundingClientRect().top;
    return (
      elementTop <= 
      (window.innerHeight || document.documentElement.clientHeight) / dividend
    );
  };

  const displayScrollElement = (element) => {
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';
  };

  const handleScrollAnimation = () => {
    scrollElements.forEach((el) => {
      if (elementInView(el, 1.15)) {
        displayScrollElement(el);
      }
    });
  };

  // Run on load and on scroll
  window.addEventListener('scroll', handleScrollAnimation);
  // Trigger once on initialization to reveal visible items immediately
  setTimeout(handleScrollAnimation, 100);
}

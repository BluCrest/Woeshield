import './style.css';
import './landing.css';

// Intersection Observer for scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const animateOnScroll = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      animateOnScroll.unobserve(entry.target);
    }
  });
}, observerOptions);

// Apply to sections
document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.cap-card, .how-step, .philosophy-inner, .cta');
  sections.forEach((el, i) => {
    (el as HTMLElement).style.opacity = '0';
    (el as HTMLElement).style.transform = 'translateY(24px)';
    (el as HTMLElement).style.transition = `opacity 0.6s ease ${i * 0.05}s, transform 0.6s ease ${i * 0.05}s`;
    animateOnScroll.observe(el);
  });

  // Add .visible class handler
  const style = document.createElement('style');
  style.textContent = `.visible { opacity: 1 !important; transform: translateY(0) !important; }`;
  document.head.appendChild(style);
});

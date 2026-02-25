const revealElements = document.querySelectorAll('.card, .mission, .bio-card, .contact-card, .contact-form, .panel-card');

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealElements.forEach(el => observer.observe(el));

// Gestion du formulaire de contact (Formspree ou fallback mailto)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const successMsg = form.querySelector('.form-status.success');
  const errorMsg = form.querySelector('.form-status.error');
  const submitBtn = form.querySelector('button[type="submit"]');

  function showStatus(el) {
    if (!el) return;
    el.setAttribute('aria-hidden', 'false');
    el.style.display = 'block';
    setTimeout(() => { el.style.opacity = '1'; }, 10);
  }

  function hideStatuses() {
    [successMsg, errorMsg].forEach(el => {
      if (!el) return;
      el.setAttribute('aria-hidden', 'true');
      el.style.display = 'none';
      el.style.opacity = '0';
    });
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideStatuses();

    const formData = new FormData(form);
    const name = formData.get('name')?.toString().trim();
    const email = formData.get('email')?.toString().trim();
    const message = formData.get('message')?.toString().trim();

    if (!name || !email || !message) {
      showStatus(errorMsg);
      errorMsg.textContent = 'Veuillez remplir tous les champs.';
      return;
    }
    if (!validateEmail(email)) {
      showStatus(errorMsg);
      errorMsg.textContent = 'Adresse email invalide.';
      return;
    }

    submitBtn.disabled = true;
    const metaId = document.querySelector('meta[name="formspree-id"]')?.content?.trim();
    const datasetId = form.dataset.formspreeId?.trim();
    const formspreeId = datasetId || metaId || '';

    try {
      if (formspreeId) {
        const endpoint = `https://formspree.io/f/${formspreeId}`;
        const resp = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });
        if (resp.ok) {
          showStatus(successMsg);
          form.reset();
        } else {
          const data = await resp.json().catch(() => ({}));
          showStatus(errorMsg);
          errorMsg.textContent = data.error || 'Envoi impossible (Formspree).';
        }
      } else {
        // Fallback : ouvrir le client mail
        const contactLink = document.querySelector('.contact-card a[href^="mailto:"]');
        const to = contactLink ? contactLink.getAttribute('href').replace('mailto:', '') : '';
        const subject = encodeURIComponent(`Demande — ${name}`);
        const body = encodeURIComponent(`${message}\n\nContact: ${name} <${email}>`);
        window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
        showStatus(successMsg);
        form.reset();
      }
    } catch (err) {
      showStatus(errorMsg);
      errorMsg.textContent = 'Erreur réseau, veuillez réessayer.';
    } finally {
      submitBtn.disabled = false;
    }
  });
});

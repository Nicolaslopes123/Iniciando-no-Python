/* utils.js — helpers de UI compartilhados entre as telas. */

const Utils = {
  escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[c]));
  },

  formatDate(isoOrDateStr) {
    if (!isoOrDateStr) return '—';
    const d = new Date(isoOrDateStr);
    if (Number.isNaN(d.getTime())) return isoOrDateStr;
    return d.toLocaleDateString('pt-BR');
  },

  formatDateTime(isoStr) {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return isoStr;
    return d.toLocaleString('pt-BR');
  },

  debounce(fn, delay = 250) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  },

  toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.textContent = message;
    document.getElementById('toasts').appendChild(el);
    requestAnimationFrame(() => el.classList.add('toast--show'));
    setTimeout(() => {
      el.classList.remove('toast--show');
      setTimeout(() => el.remove(), 300);
    }, 2600);
  },

  confirm(message) {
    return window.confirm(message);
  },

  /** Abre um modal genérico. `bodyHtml` é o conteúdo; `onMount` recebe o elemento do modal. */
  openModal({ title, bodyHtml, onMount, wide = false }) {
    const root = document.getElementById('modal-root');
    root.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal ${wide ? 'modal--wide' : ''}">
          <div class="modal__header">
            <h3>${Utils.escapeHtml(title)}</h3>
            <button class="modal__close" type="button" aria-label="Fechar">&times;</button>
          </div>
          <div class="modal__body">${bodyHtml}</div>
        </div>
      </div>`;
    const backdrop = root.querySelector('.modal-backdrop');
    const close = () => {
      root.innerHTML = '';
    };
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });
    root.querySelector('.modal__close').addEventListener('click', close);
    document.addEventListener(
      'keydown',
      function onEsc(e) {
        if (e.key === 'Escape') {
          close();
          document.removeEventListener('keydown', onEsc);
        }
      },
      { once: true }
    );
    if (onMount) onMount(root.querySelector('.modal'), close);
    return close;
  },

  /** Redimensiona/comprime uma imagem no navegador (canvas) antes de guardar em base64. */
  resizeImageFile(file, maxDim = 1280, quality = 0.75) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width >= height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  },
};

window.Utils = Utils;

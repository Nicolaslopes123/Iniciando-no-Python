/* views/photos.js — Aba Fotos: upload e galeria de fotos do projeto (e opcionalmente de um material). */

const PhotosView = {
  render(container, project) {
    const materials = DB.Materials.listByProject(project.id);

    container.innerHTML = `
      <div class="tab-panel">
        <div class="toolbar">
          <label class="btn btn--primary btn--upload">
            + Adicionar Foto
            <input type="file" id="input-foto" accept="image/*" multiple hidden />
          </label>
        </div>
        <div id="photos-grid" class="photos-grid"></div>
      </div>
    `;

    const input = container.querySelector('#input-foto');
    input.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      const materialId = await this._askMaterial(materials);
      for (const file of files) {
        try {
          const dataUrl = await Utils.resizeImageFile(file);
          DB.Photos.create(project.id, { materialId, legenda: file.name, dataUrl });
        } catch (err) {
          console.error(err);
          Utils.toast(`Falha ao processar ${file.name}`, 'error');
        }
      }
      Utils.toast('Foto(s) adicionada(s).', 'success');
      input.value = '';
      this.renderGrid(container, project);
    });

    this.renderGrid(container, project);
  },

  /** Pergunta (via modal simples) a qual material a foto deve ser vinculada, se houver materiais. */
  _askMaterial(materials) {
    return new Promise((resolve) => {
      if (materials.length === 0) {
        resolve(null);
        return;
      }
      const options = ['<option value="">Foto geral do projeto (sem material)</option>']
        .concat(materials.map((m) => `<option value="${m.id}">${Utils.escapeHtml(m.nome)}</option>`))
        .join('');
      Utils.openModal({
        title: 'Vincular foto a um material?',
        bodyHtml: `
          <form id="form-vincula-foto" class="form">
            <label class="field"><span>Material (opcional)</span>
              <select name="materialId" class="input input--select">${options}</select>
            </label>
            <div class="form-actions"><button type="submit" class="btn btn--primary">Continuar</button></div>
          </form>
        `,
        onMount: (modalEl, close) => {
          modalEl.querySelector('#form-vincula-foto').addEventListener('submit', (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target).entries());
            close();
            resolve(data.materialId || null);
          });
        },
      });
    });
  },

  renderGrid(container, project) {
    const grid = container.querySelector('#photos-grid');
    const photos = DB.Photos.listByProject(project.id);

    if (photos.length === 0) {
      grid.innerHTML = `<div class="empty-state"><p>Nenhuma foto adicionada ainda.</p></div>`;
      return;
    }

    grid.innerHTML = photos
      .map((ph) => {
        const material = ph.materialId ? DB.Materials.get(ph.materialId) : null;
        return `
          <figure class="photo-card">
            <img src="${ph.dataUrl}" alt="${Utils.escapeHtml(ph.legenda)}" />
            <figcaption>
              <span class="photo-card__name">${Utils.escapeHtml(ph.legenda) || 'Foto'}</span>
              ${material ? `<span class="badge badge--info">${Utils.escapeHtml(material.nome)}</span>` : ''}
              <span class="muted">${Utils.formatDate(ph.criadoEm)}</span>
              <button class="btn btn--ghost btn--sm" data-delete="${ph.id}">Remover</button>
            </figcaption>
          </figure>
        `;
      })
      .join('');

    grid.querySelectorAll('[data-delete]').forEach((el) =>
      el.addEventListener('click', () => {
        if (Utils.confirm('Remover esta foto?')) {
          DB.Photos.remove(el.dataset.delete);
          Utils.toast('Foto removida.', 'success');
          this.renderGrid(container, project);
        }
      })
    );
  },
};

window.PhotosView = PhotosView;

/* views/pendencies.js — Aba Pendências: itens em aberto/resolvidos do projeto. */

const PendenciesView = {
  _statusFilter: 'aberta',

  render(container, project) {
    container.innerHTML = `
      <div class="tab-panel">
        <div class="toolbar">
          <select id="filtro-status-pendencia" class="input input--select">
            <option value="aberta">Abertas</option>
            <option value="resolvida">Resolvidas</option>
            <option value="todas">Todas</option>
          </select>
          <button class="btn btn--primary" id="btn-nova-pendencia">+ Nova Pendência</button>
        </div>
        <div id="pendencies-list"></div>
      </div>
    `;

    container.querySelector('#filtro-status-pendencia').value = this._statusFilter;
    container.querySelector('#btn-nova-pendencia').addEventListener('click', () => this.openForm(project));
    container.querySelector('#filtro-status-pendencia').addEventListener('change', (e) => {
      this._statusFilter = e.target.value;
      this.renderList(container, project);
    });

    this.renderList(container, project);
  },

  renderList(container, project) {
    const listEl = container.querySelector('#pendencies-list');
    let pendencies = DB.Pendencies.listByProject(project.id);
    if (this._statusFilter !== 'todas') {
      pendencies = pendencies.filter((p) => p.status === this._statusFilter);
    }
    const order = { critica: 0, alta: 1, media: 2, baixa: 3 };
    pendencies.sort((a, b) => order[a.prioridade] - order[b.prioridade] || b.criadoEm.localeCompare(a.criadoEm));

    if (pendencies.length === 0) {
      listEl.innerHTML = `<div class="empty-state"><p>Nenhuma pendência encontrada.</p></div>`;
      return;
    }

    listEl.innerHTML = `<div class="pendencies-list">${pendencies.map((p) => this._itemHtml(p)).join('')}</div>`;

    listEl.querySelectorAll('[data-resolve]').forEach((el) =>
      el.addEventListener('click', () => {
        DB.Pendencies.resolve(el.dataset.resolve);
        Utils.toast('Pendência marcada como resolvida.', 'success');
        this.renderList(container, project);
      })
    );
    listEl.querySelectorAll('[data-reopen]').forEach((el) =>
      el.addEventListener('click', () => {
        DB.Pendencies.reopen(el.dataset.reopen);
        Utils.toast('Pendência reaberta.', 'success');
        this.renderList(container, project);
      })
    );
    listEl.querySelectorAll('[data-edit]').forEach((el) =>
      el.addEventListener('click', () => {
        const p = DB.Pendencies.listByProject(project.id).find((x) => x.id === el.dataset.edit);
        this.openForm(project, p);
      })
    );
    listEl.querySelectorAll('[data-delete]').forEach((el) =>
      el.addEventListener('click', () => {
        if (Utils.confirm('Remover esta pendência?')) {
          DB.Pendencies.remove(el.dataset.delete);
          Utils.toast('Pendência removida.', 'success');
          this.renderList(container, project);
        }
      })
    );
  },

  _itemHtml(p) {
    const prioridade = Labels.prioridadePendencia[p.prioridade];
    const status = Labels.statusPendencia[p.status];
    const material = p.materialId ? DB.Materials.get(p.materialId) : null;
    return `
      <article class="pendencia-item ${p.status === 'resolvida' ? 'pendencia-item--resolved' : ''}">
        <div class="pendencia-item__top">
          <span class="badge ${prioridade.badge}">${prioridade.label}</span>
          <span class="badge ${status.badge}">${status.label}</span>
          ${material ? `<span class="badge badge--info">${Utils.escapeHtml(material.nome)}</span>` : ''}
        </div>
        <h4>${Utils.escapeHtml(p.titulo)}</h4>
        ${p.descricao ? `<p class="muted">${Utils.escapeHtml(p.descricao)}</p>` : ''}
        <div class="pendencia-item__meta">
          Aberta em ${Utils.formatDate(p.criadoEm)}${p.resolvidoEm ? ` · Resolvida em ${Utils.formatDate(p.resolvidoEm)}` : ''}
        </div>
        <div class="pendencia-item__actions">
          ${
            p.status === 'aberta'
              ? `<button class="btn btn--secondary btn--sm" data-resolve="${p.id}">Marcar resolvida</button>`
              : `<button class="btn btn--ghost btn--sm" data-reopen="${p.id}">Reabrir</button>`
          }
          <button class="btn btn--ghost btn--sm" data-edit="${p.id}">Editar</button>
          <button class="btn btn--ghost btn--sm" data-delete="${p.id}">Remover</button>
        </div>
      </article>
    `;
  },

  openForm(project, pendencia = null) {
    const isEdit = !!pendencia;
    const materials = DB.Materials.listByProject(project.id);
    const materialOptions = ['<option value="">Nenhum</option>']
      .concat(
        materials.map(
          (m) => `<option value="${m.id}" ${pendencia?.materialId === m.id ? 'selected' : ''}>${Utils.escapeHtml(m.nome)}</option>`
        )
      )
      .join('');

    const bodyHtml = `
      <form id="form-pendencia" class="form">
        <label class="field"><span>Título *</span>
          <input required name="titulo" class="input" value="${Utils.escapeHtml(pendencia?.titulo || '')}" />
        </label>
        <label class="field"><span>Descrição</span>
          <textarea name="descricao" class="input" rows="2">${Utils.escapeHtml(pendencia?.descricao || '')}</textarea>
        </label>
        <div class="field-row">
          <label class="field"><span>Prioridade</span>
            <select name="prioridade" class="input input--select">
              <option value="critica" ${pendencia?.prioridade === 'critica' ? 'selected' : ''}>Crítica</option>
              <option value="alta" ${pendencia?.prioridade === 'alta' ? 'selected' : ''}>Alta</option>
              <option value="media" ${!pendencia || pendencia?.prioridade === 'media' ? 'selected' : ''}>Média</option>
              <option value="baixa" ${pendencia?.prioridade === 'baixa' ? 'selected' : ''}>Baixa</option>
            </select>
          </label>
          <label class="field"><span>Material relacionado</span>
            <select name="materialId" class="input input--select">${materialOptions}</select>
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn--primary">${isEdit ? 'Salvar alterações' : 'Criar pendência'}</button>
        </div>
      </form>
    `;

    Utils.openModal({
      title: isEdit ? 'Editar pendência' : 'Nova Pendência',
      bodyHtml,
      onMount: (modalEl, close) => {
        modalEl.querySelector('#form-pendencia').addEventListener('submit', (e) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(e.target).entries());
          if (!data.titulo.trim()) return;
          if (isEdit) {
            DB.Pendencies.update(pendencia.id, data);
            Utils.toast('Pendência atualizada.', 'success');
          } else {
            DB.Pendencies.create(project.id, data);
            Utils.toast('Pendência criada.', 'success');
          }
          close();
          Router._resolve();
        });
      },
    });
  },
};

window.PendenciesView = PendenciesView;

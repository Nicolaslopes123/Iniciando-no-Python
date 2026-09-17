/* views/materials.js — Aba Materiais: CRUD dos materiais do projeto atual. */

const MaterialsView = {
  _search: '',
  _statusFilter: 'todos',

  render(container, project) {
    container.innerHTML = `
      <div class="tab-panel">
        <div class="toolbar">
          <input type="search" id="busca-material" class="input" placeholder="Pesquisar material ou código SAP..." value="${Utils.escapeHtml(this._search)}" />
          <select id="filtro-status-material" class="input input--select">
            <option value="todos">Todos os status</option>
            <option value="disponivel">Disponível</option>
            <option value="parcial">Parcial</option>
            <option value="faltante">Faltante</option>
          </select>
          <button class="btn btn--primary" id="btn-novo-material">+ Novo Material</button>
        </div>
        <div id="materials-table-wrap"></div>
      </div>
    `;

    container.querySelector('#filtro-status-material').value = this._statusFilter;
    container.querySelector('#btn-novo-material').addEventListener('click', () => this.openForm(project));
    container.querySelector('#busca-material').addEventListener(
      'input',
      Utils.debounce((e) => {
        this._search = e.target.value;
        this.renderTable(container, project);
      }, 200)
    );
    container.querySelector('#filtro-status-material').addEventListener('change', (e) => {
      this._statusFilter = e.target.value;
      this.renderTable(container, project);
    });

    this.renderTable(container, project);
  },

  renderTable(container, project) {
    const wrap = container.querySelector('#materials-table-wrap');
    let materials = DB.Materials.listByProject(project.id);

    const q = this._search.trim().toLowerCase();
    if (q) {
      materials = materials.filter(
        (m) => m.nome.toLowerCase().includes(q) || m.codigoSAP.toLowerCase().includes(q)
      );
    }
    if (this._statusFilter !== 'todos') {
      materials = materials.filter((m) => DB.Materials.statusDisponibilidade(m) === this._statusFilter);
    }
    materials.sort((a, b) => a.nome.localeCompare(b.nome));

    if (materials.length === 0) {
      wrap.innerHTML = `<div class="empty-state"><p>Nenhum material cadastrado ainda.</p></div>`;
      return;
    }

    wrap.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Material</th><th>Código SAP</th><th>Necessário</th><th>Disponível</th>
            <th>Status</th><th>Local</th><th>Prioridade</th><th>Origem</th><th></th>
          </tr>
        </thead>
        <tbody>
          ${materials.map((m) => this._rowHtml(m)).join('')}
        </tbody>
      </table>
    `;

    wrap.querySelectorAll('[data-edit]').forEach((el) =>
      el.addEventListener('click', () => this.openForm(project, DB.Materials.get(el.dataset.edit)))
    );
    wrap.querySelectorAll('[data-delete]').forEach((el) =>
      el.addEventListener('click', () => {
        const m = DB.Materials.get(el.dataset.delete);
        if (Utils.confirm(`Remover o material "${m.nome}"? Fotos vinculadas também serão removidas.`)) {
          DB.Materials.remove(m.id);
          Utils.toast('Material removido.', 'success');
          this.renderTable(container, project);
        }
      })
    );
  },

  _rowHtml(m) {
    const status = Labels.statusDisponibilidade[DB.Materials.statusDisponibilidade(m)];
    const origem = Labels.origemIdentificacao[DB.Materials.origemIdentificacao(m)];
    const prioridade = Labels.prioridade[m.prioridade];
    return `
      <tr>
        <td>${Utils.escapeHtml(m.nome)}</td>
        <td>${Utils.escapeHtml(m.codigoSAP) || '—'}</td>
        <td>${m.quantidadeNecessaria}</td>
        <td>${m.quantidadeDisponivel}</td>
        <td><span class="badge ${status.badge}">${status.label}</span></td>
        <td>${Utils.escapeHtml(m.local) || '—'}</td>
        <td><span class="badge ${prioridade.badge}">${prioridade.label}</span></td>
        <td><span class="badge ${origem.badge}">${origem.label}</span></td>
        <td class="table__actions">
          <button class="btn btn--ghost btn--sm" data-edit="${m.id}">Editar</button>
          <button class="btn btn--ghost btn--sm" data-delete="${m.id}">Remover</button>
        </td>
      </tr>
    `;
  },

  openForm(project, material = null) {
    const isEdit = !!material;
    const bodyHtml = `
      <form id="form-material" class="form">
        <label class="field"><span>Nome do material *</span>
          <input required name="nome" class="input" value="${Utils.escapeHtml(material?.nome || '')}" />
        </label>
        <div class="field-row">
          <label class="field"><span>Código SAP</span>
            <input name="codigoSAP" class="input" value="${Utils.escapeHtml(material?.codigoSAP || '')}" />
          </label>
          <label class="field"><span>Referência externa</span>
            <input name="referenciaExterna" class="input" value="${Utils.escapeHtml(material?.referenciaExterna || '')}" placeholder="ex: catálogo do fabricante" />
          </label>
        </div>
        <div class="field-row">
          <label class="field"><span>Quantidade necessária</span>
            <input type="number" min="0" step="any" name="quantidadeNecessaria" class="input" value="${material?.quantidadeNecessaria ?? 0}" />
          </label>
          <label class="field"><span>Quantidade disponível</span>
            <input type="number" min="0" step="any" name="quantidadeDisponivel" class="input" value="${material?.quantidadeDisponivel ?? 0}" />
          </label>
        </div>
        <div class="field-row">
          <label class="field"><span>Local</span>
            <input name="local" class="input" value="${Utils.escapeHtml(material?.local || '')}" />
          </label>
          <label class="field"><span>Prioridade</span>
            <select name="prioridade" class="input input--select">
              <option value="alta" ${material?.prioridade === 'alta' ? 'selected' : ''}>Alta</option>
              <option value="media" ${!material || material?.prioridade === 'media' ? 'selected' : ''}>Média</option>
              <option value="baixa" ${material?.prioridade === 'baixa' ? 'selected' : ''}>Baixa</option>
            </select>
          </label>
        </div>
        <label class="field"><span>Observações</span>
          <textarea name="observacoes" class="input" rows="2">${Utils.escapeHtml(material?.observacoes || '')}</textarea>
        </label>
        <p class="field-hint">O status (Disponível/Parcial/Faltante) é calculado automaticamente a partir das quantidades. A origem da identificação é SAP se houver código SAP, referência externa se houver referência, ou "Não identificado" caso nenhum dos dois seja informado.</p>
        <div class="form-actions">
          <button type="submit" class="btn btn--primary">${isEdit ? 'Salvar alterações' : 'Adicionar material'}</button>
        </div>
      </form>
    `;

    Utils.openModal({
      title: isEdit ? 'Editar material' : 'Novo Material',
      bodyHtml,
      onMount: (modalEl, close) => {
        modalEl.querySelector('#form-material').addEventListener('submit', (e) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(e.target).entries());
          if (!data.nome.trim()) return;
          if (isEdit) {
            DB.Materials.update(material.id, data);
            Utils.toast('Material atualizado.', 'success');
          } else {
            DB.Materials.create(project.id, data);
            Utils.toast('Material adicionado.', 'success');
          }
          close();
          Router._resolve();
        });
      },
    });
  },
};

window.MaterialsView = MaterialsView;

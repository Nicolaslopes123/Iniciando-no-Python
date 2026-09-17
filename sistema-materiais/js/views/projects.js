/* views/projects.js — Tela inicial: lista de projetos em cards. */

const ProjectsView = {
  _search: '',
  _statusFilter: 'ativo', // ativo | arquivado | todos

  render(container) {
    container.innerHTML = `
      <div class="page page--projects">
        <div class="page-header">
          <div>
            <h1>Projetos</h1>
            <p class="page-subtitle">Cada projeto tem seus próprios materiais, fotos, pendências e indicadores.</p>
          </div>
          <button class="btn btn--primary" id="btn-novo-projeto">+ Novo Projeto</button>
        </div>

        <div class="toolbar">
          <input type="search" id="busca-projeto" class="input" placeholder="Pesquisar por nome ou código..." value="${Utils.escapeHtml(this._search)}" />
          <select id="filtro-status" class="input input--select">
            <option value="ativo">Ativos</option>
            <option value="arquivado">Arquivados</option>
            <option value="todos">Todos</option>
          </select>
        </div>

        <div id="projects-grid" class="cards-grid"></div>
      </div>
    `;

    container.querySelector('#filtro-status').value = this._statusFilter;

    container.querySelector('#btn-novo-projeto').addEventListener('click', () => this.openForm());
    container.querySelector('#busca-projeto').addEventListener(
      'input',
      Utils.debounce((e) => {
        this._search = e.target.value;
        this.renderGrid(container);
      }, 200)
    );
    container.querySelector('#filtro-status').addEventListener('change', (e) => {
      this._statusFilter = e.target.value;
      this.renderGrid(container);
    });

    this.renderGrid(container);
  },

  renderGrid(container) {
    const grid = container.querySelector('#projects-grid');
    let projects = DB.Projects.list();

    if (this._statusFilter !== 'todos') {
      projects = projects.filter((p) => p.status === this._statusFilter);
    }
    const q = this._search.trim().toLowerCase();
    if (q) {
      projects = projects.filter(
        (p) => p.nome.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
      );
    }
    projects.sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));

    if (projects.length === 0) {
      grid.innerHTML = `<div class="empty-state">
        <p>Nenhum projeto encontrado.</p>
        <button class="btn btn--primary" id="btn-novo-projeto-empty">+ Criar o primeiro projeto</button>
      </div>`;
      const btn = grid.querySelector('#btn-novo-projeto-empty');
      if (btn) btn.addEventListener('click', () => this.openForm());
      return;
    }

    grid.innerHTML = projects.map((p) => this._cardHtml(p)).join('');

    grid.querySelectorAll('[data-open]').forEach((el) =>
      el.addEventListener('click', () => Router.navigate(`#/projeto/${el.dataset.open}`))
    );
    grid.querySelectorAll('[data-edit]').forEach((el) =>
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openForm(DB.Projects.get(el.dataset.edit));
      })
    );
    grid.querySelectorAll('[data-archive]').forEach((el) =>
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const project = DB.Projects.get(el.dataset.archive);
        const toArchive = project.status !== 'arquivado';
        const msg = toArchive
          ? `Arquivar o projeto "${project.nome}"? Ele deixará de aparecer na lista de ativos.`
          : `Reativar o projeto "${project.nome}"?`;
        if (Utils.confirm(msg)) {
          DB.Projects.setStatus(project.id, toArchive ? 'arquivado' : 'ativo');
          Utils.toast(toArchive ? 'Projeto arquivado.' : 'Projeto reativado.', 'success');
          this.renderGrid(container);
        }
      })
    );
  },

  _cardHtml(p) {
    const s = DB.Stats.summary(p.id);
    const statusClass = {
      'Crítico': 'badge--danger',
      'Concluído': 'badge--success',
      'Em andamento': 'badge--info',
      'Início': 'badge--muted',
    }[s.statusGeral] || 'badge--muted';
    const archivedBadge = p.status === 'arquivado' ? '<span class="badge badge--muted">Arquivado</span>' : '';

    return `
      <article class="card project-card" data-open="${p.id}">
        <div class="project-card__top">
          <h3 class="project-card__title">${Utils.escapeHtml(p.nome)}</h3>
          <div class="project-card__badges">
            ${archivedBadge}
            <span class="badge ${statusClass}">${s.statusGeral}</span>
          </div>
        </div>
        ${p.codigo ? `<div class="project-card__code">Código: ${Utils.escapeHtml(p.codigo)}</div>` : ''}
        <p class="project-card__desc">${Utils.escapeHtml(p.descricao) || '<span class="muted">Sem descrição</span>'}</p>

        <div class="progress">
          <div class="progress__bar" style="width:${Math.min(s.percentualAtendimento, 100)}%"></div>
        </div>
        <div class="progress__label">${s.percentualAtendimento}% de atendimento</div>

        <div class="project-card__stats">
          <div class="stat"><span class="stat__value">${s.totalMateriais}</span><span class="stat__label">Materiais</span></div>
          <div class="stat"><span class="stat__value">${s.disponiveis}</span><span class="stat__label">Disponíveis</span></div>
          <div class="stat"><span class="stat__value">${s.faltantes}</span><span class="stat__label">Faltantes</span></div>
          <div class="stat"><span class="stat__value">${s.referenciasExternas}</span><span class="stat__label">Ref. externa</span></div>
          <div class="stat"><span class="stat__value">${s.pendenciasAbertas}</span><span class="stat__label">Pendências</span></div>
        </div>

        <div class="project-card__meta">
          <span>Criado em ${Utils.formatDate(p.criadoEm)}</span>
          <span>Atualizado em ${Utils.formatDate(p.atualizadoEm)}</span>
        </div>

        <div class="project-card__actions">
          <button class="btn btn--secondary btn--sm" data-open="${p.id}">Abrir</button>
          <button class="btn btn--ghost btn--sm" data-edit="${p.id}">Editar</button>
          <button class="btn btn--ghost btn--sm" data-archive="${p.id}">${p.status === 'arquivado' ? 'Reativar' : 'Arquivar'}</button>
        </div>
      </article>
    `;
  },

  openForm(project = null) {
    const isEdit = !!project;
    const bodyHtml = `
      <form id="form-projeto" class="form">
        <label class="field"><span>Nome do projeto *</span>
          <input required name="nome" class="input" value="${Utils.escapeHtml(project?.nome || '')}" />
        </label>
        <div class="field-row">
          <label class="field"><span>Código/identificação</span>
            <input name="codigo" class="input" value="${Utils.escapeHtml(project?.codigo || '')}" />
          </label>
          <label class="field"><span>Local</span>
            <input name="local" class="input" value="${Utils.escapeHtml(project?.local || '')}" />
          </label>
        </div>
        <label class="field"><span>Descrição</span>
          <textarea name="descricao" class="input" rows="2">${Utils.escapeHtml(project?.descricao || '')}</textarea>
        </label>
        <div class="field-row">
          <label class="field"><span>Responsável</span>
            <input name="responsavel" class="input" value="${Utils.escapeHtml(project?.responsavel || '')}" />
          </label>
        </div>
        <div class="field-row">
          <label class="field"><span>Data de início</span>
            <input type="date" name="dataInicio" class="input" value="${project?.dataInicio || ''}" />
          </label>
          <label class="field"><span>Prazo previsto</span>
            <input type="date" name="prazoPrevisto" class="input" value="${project?.prazoPrevisto || ''}" />
          </label>
        </div>
        <label class="field"><span>Observações</span>
          <textarea name="observacoes" class="input" rows="2">${Utils.escapeHtml(project?.observacoes || '')}</textarea>
        </label>
        <div class="form-actions">
          <button type="submit" class="btn btn--primary">${isEdit ? 'Salvar alterações' : 'Criar projeto'}</button>
        </div>
      </form>
    `;

    Utils.openModal({
      title: isEdit ? 'Editar projeto' : 'Novo Projeto',
      bodyHtml,
      onMount: (modalEl, close) => {
        modalEl.querySelector('#form-projeto').addEventListener('submit', (e) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(e.target).entries());
          if (!data.nome.trim()) return;
          if (isEdit) {
            DB.Projects.update(project.id, data);
            Utils.toast('Projeto atualizado.', 'success');
            close();
            Router._resolve();
          } else {
            const created = DB.Projects.create(data);
            close();
            Utils.toast('Projeto criado.', 'success');
            Router.navigate(`#/projeto/${created.id}`);
          }
        });
      },
    });
  },
};

window.ProjectsView = ProjectsView;

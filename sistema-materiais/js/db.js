/*
 * db.js — Camada de dados do Sistema de Materiais por Projeto.
 *
 * Toda a persistência hoje é feita em localStorage (para funcionar sem
 * instalar nada). A API abaixo (Projects, Materials, Photos, Pendencies,
 * History, Stats) é a única porta de entrada usada pelas telas — nenhuma
 * tela lê localStorage diretamente. Isso permite, no futuro, trocar a
 * implementação por chamadas a uma API remota (multiusuário) sem alterar
 * nenhuma tela: basta reescrever as funções deste arquivo para usar fetch().
 *
 * Relacionamento entre entidades (todas guardam projectId, sem exceção,
 * garantindo isolamento entre projetos):
 *
 *   Project 1───N Material
 *   Project 1───N Photo  (Photo N───1 Material, opcional)
 *   Project 1───N Pendencia (Pendencia N───1 Material, opcional)
 *   Project 1───N HistoryEntry
 *
 * O campo `usuario` já existe em HistoryEntry (e pode ser adicionado a
 * outras entidades) para preparar o terreno para múltiplos usuários.
 */

const DB_KEY = 'sistemaMateriais.v1';
const CURRENT_USER = 'Você';

function uid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function nowISO() {
  return new Date().toISOString();
}

function emptyState() {
  return { projects: [], materials: [], photos: [], pendencies: [], history: [] };
}

function loadState() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { ...emptyState(), ...parsed };
  } catch (e) {
    console.error('Falha ao ler dados locais, iniciando vazio.', e);
    return null;
  }
}

let state = loadState() || emptyState();

function persist() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Falha ao salvar dados locais (armazenamento cheio?).', e);
    alert('Não foi possível salvar: o armazenamento local está cheio. Considere remover fotos antigas.');
  }
}

function logHistory(projectId, entidade, entidadeId, acao, descricao) {
  state.history.push({
    id: uid(),
    projectId,
    entidade,
    entidadeId,
    acao,
    descricao,
    timestamp: nowISO(),
    usuario: CURRENT_USER,
  });
}

// ---------------------------------------------------------------- Projects
const Projects = {
  list() {
    return [...state.projects];
  },
  get(id) {
    return state.projects.find((p) => p.id === id) || null;
  },
  create(data) {
    const project = {
      id: uid(),
      nome: (data.nome || '').trim(),
      codigo: (data.codigo || '').trim(),
      descricao: (data.descricao || '').trim(),
      local: (data.local || '').trim(),
      responsavel: (data.responsavel || '').trim(),
      dataInicio: data.dataInicio || '',
      prazoPrevisto: data.prazoPrevisto || '',
      observacoes: (data.observacoes || '').trim(),
      status: 'ativo',
      criadoEm: nowISO(),
      atualizadoEm: nowISO(),
    };
    state.projects.push(project);
    logHistory(project.id, 'projeto', project.id, 'criado', `Projeto "${project.nome}" criado`);
    persist();
    return project;
  },
  update(id, data) {
    const p = this.get(id);
    if (!p) return null;
    Object.assign(p, {
      nome: data.nome ?? p.nome,
      codigo: data.codigo ?? p.codigo,
      descricao: data.descricao ?? p.descricao,
      local: data.local ?? p.local,
      responsavel: data.responsavel ?? p.responsavel,
      dataInicio: data.dataInicio ?? p.dataInicio,
      prazoPrevisto: data.prazoPrevisto ?? p.prazoPrevisto,
      observacoes: data.observacoes ?? p.observacoes,
      atualizadoEm: nowISO(),
    });
    logHistory(id, 'projeto', id, 'atualizado', `Dados do projeto "${p.nome}" atualizados`);
    persist();
    return p;
  },
  setStatus(id, status) {
    const p = this.get(id);
    if (!p) return null;
    p.status = status;
    p.atualizadoEm = nowISO();
    logHistory(
      id,
      'projeto',
      id,
      status === 'arquivado' ? 'arquivado' : 'reativado',
      status === 'arquivado' ? `Projeto "${p.nome}" arquivado` : `Projeto "${p.nome}" reativado`
    );
    persist();
    return p;
  },
};

// --------------------------------------------------------------- Materials
const PRIORIDADES = ['alta', 'media', 'baixa'];

const Materials = {
  listByProject(projectId) {
    return state.materials.filter((m) => m.projectId === projectId);
  },
  get(id) {
    return state.materials.find((m) => m.id === id) || null;
  },
  create(projectId, data) {
    const material = {
      id: uid(),
      projectId,
      nome: (data.nome || '').trim(),
      codigoSAP: (data.codigoSAP || '').trim(),
      quantidadeNecessaria: Number(data.quantidadeNecessaria) || 0,
      quantidadeDisponivel: Number(data.quantidadeDisponivel) || 0,
      local: (data.local || '').trim(),
      prioridade: PRIORIDADES.includes(data.prioridade) ? data.prioridade : 'media',
      referenciaExterna: (data.referenciaExterna || '').trim(),
      observacoes: (data.observacoes || '').trim(),
      criadoEm: nowISO(),
      atualizadoEm: nowISO(),
    };
    state.materials.push(material);
    logHistory(projectId, 'material', material.id, 'criado', `Material "${material.nome}" cadastrado`);
    persist();
    return material;
  },
  update(id, data) {
    const m = this.get(id);
    if (!m) return null;
    Object.assign(m, {
      nome: data.nome ?? m.nome,
      codigoSAP: data.codigoSAP ?? m.codigoSAP,
      quantidadeNecessaria: data.quantidadeNecessaria !== undefined ? Number(data.quantidadeNecessaria) || 0 : m.quantidadeNecessaria,
      quantidadeDisponivel: data.quantidadeDisponivel !== undefined ? Number(data.quantidadeDisponivel) || 0 : m.quantidadeDisponivel,
      local: data.local ?? m.local,
      prioridade: PRIORIDADES.includes(data.prioridade) ? data.prioridade : m.prioridade,
      referenciaExterna: data.referenciaExterna ?? m.referenciaExterna,
      observacoes: data.observacoes ?? m.observacoes,
      atualizadoEm: nowISO(),
    });
    logHistory(m.projectId, 'material', id, 'atualizado', `Material "${m.nome}" atualizado`);
    persist();
    return m;
  },
  remove(id) {
    const m = this.get(id);
    if (!m) return false;
    state.materials = state.materials.filter((x) => x.id !== id);
    state.photos = state.photos.filter((ph) => ph.materialId !== id);
    logHistory(m.projectId, 'material', id, 'removido', `Material "${m.nome}" removido`);
    persist();
    return true;
  },
  // Status de disponibilidade calculado a partir das quantidades.
  statusDisponibilidade(m) {
    if (m.quantidadeDisponivel <= 0) return 'faltante';
    if (m.quantidadeDisponivel >= m.quantidadeNecessaria) return 'disponivel';
    return 'parcial';
  },
  // Origem da identificação do material.
  origemIdentificacao(m) {
    if (m.codigoSAP) return 'sap';
    if (m.referenciaExterna) return 'referencia_externa';
    return 'nao_identificado';
  },
};

// ------------------------------------------------------------------ Photos
const Photos = {
  listByProject(projectId) {
    return state.photos.filter((ph) => ph.projectId === projectId).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  },
  listByMaterial(materialId) {
    return state.photos.filter((ph) => ph.materialId === materialId);
  },
  create(projectId, data) {
    const photo = {
      id: uid(),
      projectId,
      materialId: data.materialId || null,
      legenda: (data.legenda || '').trim(),
      dataUrl: data.dataUrl,
      criadoEm: nowISO(),
    };
    state.photos.push(photo);
    const material = photo.materialId ? Materials.get(photo.materialId) : null;
    logHistory(
      projectId,
      'foto',
      photo.id,
      'criado',
      material ? `Foto adicionada ao material "${material.nome}"` : 'Foto adicionada ao projeto'
    );
    persist();
    return photo;
  },
  remove(id) {
    const ph = state.photos.find((p) => p.id === id);
    if (!ph) return false;
    state.photos = state.photos.filter((p) => p.id !== id);
    logHistory(ph.projectId, 'foto', id, 'removido', 'Foto removida');
    persist();
    return true;
  },
};

// -------------------------------------------------------------- Pendencies
const PRIORIDADES_PENDENCIA = ['critica', 'alta', 'media', 'baixa'];

const Pendencies = {
  listByProject(projectId) {
    return state.pendencies.filter((p) => p.projectId === projectId);
  },
  create(projectId, data) {
    const pend = {
      id: uid(),
      projectId,
      materialId: data.materialId || null,
      titulo: (data.titulo || '').trim(),
      descricao: (data.descricao || '').trim(),
      prioridade: PRIORIDADES_PENDENCIA.includes(data.prioridade) ? data.prioridade : 'media',
      status: 'aberta',
      criadoEm: nowISO(),
      resolvidoEm: null,
    };
    state.pendencies.push(pend);
    logHistory(projectId, 'pendencia', pend.id, 'criado', `Pendência "${pend.titulo}" aberta`);
    persist();
    return pend;
  },
  update(id, data) {
    const p = state.pendencies.find((x) => x.id === id);
    if (!p) return null;
    Object.assign(p, {
      titulo: data.titulo ?? p.titulo,
      descricao: data.descricao ?? p.descricao,
      prioridade: PRIORIDADES_PENDENCIA.includes(data.prioridade) ? data.prioridade : p.prioridade,
      materialId: data.materialId !== undefined ? data.materialId : p.materialId,
    });
    logHistory(p.projectId, 'pendencia', id, 'atualizado', `Pendência "${p.titulo}" atualizada`);
    persist();
    return p;
  },
  resolve(id) {
    const p = state.pendencies.find((x) => x.id === id);
    if (!p) return null;
    p.status = 'resolvida';
    p.resolvidoEm = nowISO();
    logHistory(p.projectId, 'pendencia', id, 'resolvido', `Pendência "${p.titulo}" resolvida`);
    persist();
    return p;
  },
  reopen(id) {
    const p = state.pendencies.find((x) => x.id === id);
    if (!p) return null;
    p.status = 'aberta';
    p.resolvidoEm = null;
    logHistory(p.projectId, 'pendencia', id, 'reaberto', `Pendência "${p.titulo}" reaberta`);
    persist();
    return p;
  },
  remove(id) {
    const p = state.pendencies.find((x) => x.id === id);
    if (!p) return false;
    state.pendencies = state.pendencies.filter((x) => x.id !== id);
    logHistory(p.projectId, 'pendencia', id, 'removido', `Pendência "${p.titulo}" removida`);
    persist();
    return true;
  },
};

// ----------------------------------------------------------------- History
const History = {
  listByProject(projectId) {
    return state.history
      .filter((h) => h.projectId === projectId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },
};

// ------------------------------------------------------------------ Stats
const Stats = {
  /** Resumo completo usado no Dashboard e nos Indicadores do projeto. */
  summary(projectId) {
    const materials = Materials.listByProject(projectId);
    const pendencies = Pendencies.listByProject(projectId);

    let disponiveis = 0,
      faltantes = 0,
      parciais = 0,
      referenciasExternas = 0,
      naoIdentificados = 0,
      sapIdentificados = 0,
      necessariaTotal = 0,
      disponivelUtilTotal = 0,
      faltanteTotal = 0;

    for (const m of materials) {
      const status = Materials.statusDisponibilidade(m);
      if (status === 'disponivel') disponiveis++;
      else if (status === 'faltante') faltantes++;
      else parciais++;

      const origem = Materials.origemIdentificacao(m);
      if (origem === 'referencia_externa') referenciasExternas++;
      else if (origem === 'nao_identificado') naoIdentificados++;
      else sapIdentificados++;

      necessariaTotal += m.quantidadeNecessaria;
      disponivelUtilTotal += Math.min(m.quantidadeDisponivel, m.quantidadeNecessaria);
      faltanteTotal += Math.max(m.quantidadeNecessaria - m.quantidadeDisponivel, 0);
    }

    const totalMateriais = materials.length;
    const percentualAtendimento = necessariaTotal > 0 ? Math.round((disponivelUtilTotal / necessariaTotal) * 1000) / 10 : 0;
    const percentualIdentificacaoSAP = totalMateriais > 0 ? Math.round((sapIdentificados / totalMateriais) * 1000) / 10 : 0;

    const pendenciasAbertas = pendencies.filter((p) => p.status === 'aberta');
    const pendenciasCriticas = pendenciasAbertas.filter((p) => p.prioridade === 'critica');

    let statusGeral = 'Início';
    if (percentualAtendimento >= 95) statusGeral = 'Concluído';
    else if (percentualAtendimento >= 50) statusGeral = 'Em andamento';
    if (pendenciasCriticas.length > 0) statusGeral = 'Crítico';

    return {
      totalMateriais,
      disponiveis,
      faltantes,
      parciais,
      referenciasExternas,
      naoIdentificados,
      quantidadeTotalFaltante: faltanteTotal,
      percentualAtendimento,
      percentualIdentificacaoSAP,
      pendenciasAbertas: pendenciasAbertas.length,
      pendenciasCriticas,
      statusGeral,
    };
  },

  /** Agrupamentos usados nos gráficos da aba Indicadores. */
  groupings(projectId) {
    const materials = Materials.listByProject(projectId);
    const byStatus = { disponivel: 0, parcial: 0, faltante: 0 };
    const byPrioridade = { alta: 0, media: 0, baixa: 0 };
    const byOrigem = { sap: 0, referencia_externa: 0, nao_identificado: 0 };
    const byLocal = {};

    for (const m of materials) {
      byStatus[Materials.statusDisponibilidade(m)]++;
      byPrioridade[m.prioridade] = (byPrioridade[m.prioridade] || 0) + 1;
      byOrigem[Materials.origemIdentificacao(m)]++;
      const local = m.local || 'Não informado';
      byLocal[local] = (byLocal[local] || 0) + 1;
    }

    return { byStatus, byPrioridade, byOrigem, byLocal };
  },
};

window.DB = { Projects, Materials, Photos, Pendencies, History, Stats, uid, nowISO };

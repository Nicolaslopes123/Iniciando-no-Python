/* labels.js — rótulos e cores centralizados, usados por várias telas. */

const Labels = {
  statusDisponibilidade: {
    disponivel: { label: 'Disponível', badge: 'badge--success' },
    parcial: { label: 'Parcial', badge: 'badge--warning' },
    faltante: { label: 'Faltante', badge: 'badge--danger' },
  },
  origemIdentificacao: {
    sap: { label: 'SAP', badge: 'badge--info' },
    referencia_externa: { label: 'Referência externa', badge: 'badge--purple' },
    nao_identificado: { label: 'Não identificado', badge: 'badge--muted' },
  },
  prioridade: {
    alta: { label: 'Alta', badge: 'badge--danger' },
    media: { label: 'Média', badge: 'badge--warning' },
    baixa: { label: 'Baixa', badge: 'badge--muted' },
  },
  prioridadePendencia: {
    critica: { label: 'Crítica', badge: 'badge--danger' },
    alta: { label: 'Alta', badge: 'badge--warning' },
    media: { label: 'Média', badge: 'badge--info' },
    baixa: { label: 'Baixa', badge: 'badge--muted' },
  },
  statusPendencia: {
    aberta: { label: 'Aberta', badge: 'badge--warning' },
    resolvida: { label: 'Resolvida', badge: 'badge--success' },
  },
};

window.Labels = Labels;

/*
 * router.js — Roteador simples baseado em hash, sem dependências externas.
 *
 * Rotas suportadas:
 *   #/                                  -> tela de Projetos
 *   #/projeto/:id                       -> ambiente do projeto, aba Dashboard
 *   #/projeto/:id/:aba                  -> ambiente do projeto, aba específica
 */

const Router = {
  _routes: [],

  on(pattern, handler) {
    const paramNames = [];
    const regex = new RegExp(
      '^' +
        pattern
          .replace(/:[^/]+/g, (m) => {
            paramNames.push(m.slice(1));
            return '([^/]+)';
          })
          .replace(/\//g, '\\/') +
        '$'
    );
    this._routes.push({ regex, paramNames, handler });
    return this;
  },

  start() {
    window.addEventListener('hashchange', () => this._resolve());
    this._resolve();
  },

  navigate(hash) {
    if (window.location.hash === hash) {
      this._resolve();
    } else {
      window.location.hash = hash;
    }
  },

  _resolve() {
    const path = (window.location.hash || '#/').slice(1) || '/';
    for (const route of this._routes) {
      const match = path.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, i) => {
          params[name] = decodeURIComponent(match[i + 1]);
        });
        route.handler(params);
        return;
      }
    }
    // Rota desconhecida: volta para a tela de projetos.
    window.location.hash = '#/';
  },
};

window.Router = Router;

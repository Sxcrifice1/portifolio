// Caminho de um arquivo da pasta /public, já com o prefixo da base.
//
// Por que isso existe: no GitHub Pages o site não fica na raiz do
// domínio, e sim em `sxcrifice1.github.io/portifolio/`. O Vite reescreve
// sozinho os caminhos que aparecem em HTML e CSS, mas NÃO toca em
// strings dentro do JavaScript — então um `useTexture('/Panorama.webp')`
// continuaria apontando para a raiz do domínio e daria 404.
//
// `import.meta.env.BASE_URL` é o que o Vite preenche com a base
// configurada ("/portifolio/" no build, "/" no `npm run dev`), então o
// mesmo código serve para os dois casos sem `if`.
export const arquivo = (caminho) =>
  `${import.meta.env.BASE_URL}${String(caminho).replace(/^\//, "")}`;

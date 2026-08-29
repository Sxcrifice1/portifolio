import React from 'react';
import UI from './components/UI';
import './index.css';

function App() {
  return (
    <>
      {/* Fundo: cinza sólido, um tom acima do #141414 dos cards — eles
          ficam levemente afundados, o que ajuda a separá-los do fundo
          sem precisar de sombra forte.

          Era um shader WebGL cobrindo a tela e rodando 60 vezes por
          segundo. Cor sólida é o extremo oposto: o navegador pinta uma
          vez, não guarda framebuffer nenhum e não usa GPU. Também sai
          um contexto WebGL inteiro (o site tinha dois). */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 0,
        backgroundColor: '#202020',
      }} />
      
      {/* UI Overlay */}
      <UI />
    </>
  );
}

export default App;

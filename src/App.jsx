import React from 'react';
import UI from './components/UI';
import { arquivo } from './arquivos';
import './index.css';

function App() {
  return (
    <>
      {/* Fundo: uma imagem de mata fechada, desfocada.
          Era um shader WebGL (o Silk) rodando 60 vezes por segundo, pra
          sempre. Aqui o navegador desenha uma vez e esquece — some um
          contexto WebGL inteiro (o site tinha dois) e o trabalho
          continuo de GPU, o que em notebook significa menos calor e
          mais bateria. A imagem tem 44 KB.

          `backgroundColor` embaixo cobre o instante antes da imagem
          carregar, pra não piscar branco. */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%',
          zIndex: 0,
          backgroundColor: '#060d08',
          backgroundImage: `url(${arquivo('/floresta.webp')})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* UI Overlay */}
      <UI />
    </>
  );
}

export default App;

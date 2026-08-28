import React, { Suspense } from 'react';
import Silk from './components/Silk';
import UI from './components/UI';
import './index.css';

function App() {
  return (
    <>
      {/* 3D Canvas Background (Silk) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, backgroundColor: '#030014' }}>
        <Suspense fallback={null}>
          <Silk
            speed={8.2}
            scale={1.2}
            color="#bfe3ce"
            noiseIntensity={0.4}
            rotation={3.6}
          />
        </Suspense>
      </div>
      
      {/* UI Overlay */}
      <UI />
    </>
  );
}

export default App;

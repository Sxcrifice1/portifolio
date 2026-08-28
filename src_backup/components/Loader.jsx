import React from 'react';
import './Loader.scss';

export default function Loader() {
  return (
    <div className="loader-wrapper !flex !flex-col !items-center !justify-center !gap-8">
      <div className="device">
        <div className="device__a">
          <div className="device__a-1"></div>
          <div className="device__a-2"></div>
        </div>
        <div className="device__b"></div>
        <div className="device__c"></div>
        <div className="device__d"></div>
        <div className="device__e"></div>
        <div className="device__f"></div>
        <div className="device__g"></div>
      </div>
      <p className="text-white/60 text-sm tracking-[0.2em] font-medium uppercase animate-pulse">Carregando...</p>
    </div>
  );
}

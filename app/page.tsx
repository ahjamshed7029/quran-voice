import React from 'react';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="bg-midnight text-soft" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
    }}>

      {/* Ваш новый логотип Siraj */}
      <div style={{ position: 'relative', width: '320px', height: '450px' }}>
        <Image
          src="/quran-voice/logo.png"
          alt="Siraj — Quran Voice Coach"
          fill
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>

      <h1 style={{ marginTop: '10px', fontSize: '28px', letterSpacing: '2px', color: '#e5c158' }}>
        SIRAJ
      </h1>
      <p style={{ color: '#a3b899', fontStyle: 'italic' }}>
        سراج — Путеводный свет
      </p>

    </div>
  );
}
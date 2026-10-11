import React from 'react';
import iconeVacinei from '../../assets/icone-vacinei.svg';

export const Footer: React.FC = () => (
  <footer className="px-4 sm:px-6 lg:px-8 pb-6">
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-white px-4 py-4 text-center text-sm text-muted">
      <img src={iconeVacinei} alt="" className="size-6 rounded-md" />
      <span>© 2026 Vacinei!? — Centro Universitário CESMAC</span>
    </div>
  </footer>
);

export default Footer;

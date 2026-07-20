import React from 'react';

export function Footer() {
  return (
    <footer className="text-[13px] leading-[14px] text-center pt-12 pb-6">
      <span className="text-(--footer-muted)">Made by </span>
      <a className="text-(--footer-name) no-underline transition-colors duration-150 hover:text-(--footer-name-hover)" href="https://x.com/jakubantalik" target="_blank" rel="noopener noreferrer">
        Jakub Antalik
      </a>
    </footer>
  );
}

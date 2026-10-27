import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- TEST SUITE: UI DESIGN SYSTEM & WCAG 2.2 AA AUDIT ---');

// 1. Auditoria de Acessibilidade no globals.css
console.log('[1/4] Validando regras de acessibilidade e redução de movimento no CSS...');
const cssPath = path.resolve(__dirname, '../src/app/globals.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

assert.ok(
  cssContent.includes('prefers-reduced-motion: reduce'),
  'globals.css deve conter regras explicitas para prefers-reduced-motion.'
);
assert.ok(
  cssContent.includes(':focus-visible'),
  'globals.css deve conter anel de foco acessivel (:focus-visible).'
);
assert.ok(
  cssContent.includes('@media print'),
  'globals.css deve conter estilos para impressao limpa de curriculo.'
);
console.log('PASS: Estilos globais atendem aos criterios de movimento, foco e impressao.');

// 2. Auditoria do Botão e Dimensões de Toque (Target Size >= 44px)
console.log('[2/4] Validando dimensoes minimas de toque no Button.tsx...');
const buttonPath = path.resolve(__dirname, '../src/components/ui/Button.tsx');
const buttonContent = fs.readFileSync(buttonPath, 'utf8');

assert.ok(
  buttonContent.includes('min-h-[44px]'),
  'Button.tsx deve assegurar altura minima de 44px para interacao por toque (WCAG 2.2 AA).'
);
assert.ok(
  buttonContent.includes('focus-visible:outline-2'),
  'Button.tsx deve conter contorno de foco visivel ao navegar por teclado.'
);
console.log('PASS: Botoes validados para navegacao por toque e teclado.');

// 3. Auditoria do ThemeToggle e Acessibilidade
console.log('[3/4] Validando atributos ARIA no ThemeToggle.tsx...');
const themeTogglePath = path.resolve(__dirname, '../src/components/ui/ThemeToggle.tsx');
const themeToggleContent = fs.readFileSync(themeTogglePath, 'utf8');

assert.ok(
  themeToggleContent.includes('aria-label='),
  'ThemeToggle deve conter aria-label descritivo para leitores de tela.'
);
console.log('PASS: Alternador de tema possui acessibilidade declarada.');

// 4. Auditoria de Skip Link no Layout Global
console.log('[4/4] Validando skip-to-content no layout.tsx...');
const layoutPath = path.resolve(__dirname, '../src/app/layout.tsx');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');

assert.ok(
  layoutContent.includes('href="#main-content"') && layoutContent.includes('sr-only focus:not-sr-only'),
  'layout.tsx deve incluir skip link acessivel para navegacao rápida por teclado.'
);
console.log('PASS: Skip link presente e funcional.');

console.log('--- AUDITORIA DE ACESSIBILIDADE E UI APROVADA COM SUCESSO! ---');

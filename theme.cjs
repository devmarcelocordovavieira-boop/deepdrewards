const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/className="([^"]+)"/g, (match, classes) => {
    let newClasses = classes
        .replace(/bg-\[\#050505\]/g, 'bg-[#F7F7F7]')
        .replace(/bg-\[\#0A0A0A\]/g, 'bg-white')
        .replace(/bg-\[\#121212\]/g, 'bg-white')
        .replace(/bg-\[\#1A1A1A\]/g, 'bg-gray-50')
        .replace(/bg-black\/50/g, 'bg-gray-900/50')
        .replace(/bg-black\/80/g, 'bg-gray-900/50')
        .replace(/bg-black/g, 'bg-white')
        .replace(/border-white\/5/g, 'border-gray-200')
        .replace(/border-white\/10/g, 'border-gray-200')
        .replace(/border-white\/20/g, 'border-gray-300')
        .replace(/border-white\/30/g, 'border-gray-300')
        .replace(/border-\[\#121212\]/g, 'border-white')
        .replace(/hover:bg-white\/5/g, 'hover:bg-gray-50')
        .replace(/hover:bg-white\/10/g, 'hover:bg-gray-100')
        .replace(/bg-white\/5/g, 'bg-gray-50')
        .replace(/bg-white\/10/g, 'bg-gray-100')
        .replace(/text-gray-400/g, 'text-gray-500')
        .replace(/text-gray-300/g, 'text-gray-600')
        .replace(/text-gray-500/g, 'text-gray-500') // just to be sure
        .replace(/shadow-\[inset_0_1px_0_0_rgba\(255,255,255,0\.1\)\]/g, 'shadow-sm')
        .replace(/shadow-\[0_0_15px_rgba\(0,163,255,0\.1\)\]/g, 'shadow-md')
        .replace(/shadow-\[0_0_15px_rgba\(0,163,255,0\.3\)\]/g, 'shadow-md')
        .replace(/shadow-\[0_0_15px_rgba\(234,29,44,0\.1\)\]/g, 'shadow-md')
        .replace(/shadow-\[0_0_15px_rgba\(234,29,44,0\.3\)\]/g, 'shadow-md');

    // Handle text-white -> text-gray-900
    const hasDarkBg = /bg-\[\#EA1D2C\]|bg-emerald-|bg-red-|bg-gradient-|bg-gray-900/.test(newClasses);
    if (!hasDarkBg) {
        newClasses = newClasses.replace(/text-white/g, 'text-gray-900');
    }

    return `className="${newClasses}"`;
});

code = code.replace(/className=\{`([^`]+)`\}/g, (match, classes) => {
    let newClasses = classes
        .replace(/bg-\[\#050505\]/g, 'bg-[#F7F7F7]')
        .replace(/bg-\[\#0A0A0A\]/g, 'bg-white')
        .replace(/bg-\[\#121212\]/g, 'bg-white')
        .replace(/bg-\[\#1A1A1A\]/g, 'bg-gray-50')
        .replace(/bg-black\/50/g, 'bg-gray-900/50')
        .replace(/bg-black\/80/g, 'bg-gray-900/50')
        .replace(/bg-black/g, 'bg-white')
        .replace(/border-white\/5/g, 'border-gray-200')
        .replace(/border-white\/10/g, 'border-gray-200')
        .replace(/border-white\/20/g, 'border-gray-300')
        .replace(/border-white\/30/g, 'border-gray-300')
        .replace(/border-\[\#121212\]/g, 'border-white')
        .replace(/hover:bg-white\/5/g, 'hover:bg-gray-50')
        .replace(/hover:bg-white\/10/g, 'hover:bg-gray-100')
        .replace(/bg-white\/5/g, 'bg-gray-50')
        .replace(/bg-white\/10/g, 'bg-gray-100')
        .replace(/text-gray-400/g, 'text-gray-500')
        .replace(/text-gray-300/g, 'text-gray-600');

    const hasDarkBg = /bg-\[\#EA1D2C\]|bg-emerald-|bg-red-|bg-gradient-|bg-gray-900/.test(newClasses);
    if (!hasDarkBg) {
        newClasses = newClasses.replace(/text-white/g, 'text-gray-900');
    }

    return `className={\`${newClasses}\`}`;
});

fs.writeFileSync('src/App.tsx', code);

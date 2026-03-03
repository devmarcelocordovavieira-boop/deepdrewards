import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Colors
const BROWN = '#8B4513';
const BROWN_HOVER = '#6B3410';
const GOLD = '#D4AF37';
const BEIGE = '#F5F5DC';
const BEIGE_HOVER = '#E8E8C8';
const BROWN_LIGHT = '#A0522D';

// Replacements
content = content.replace(/bg-\[#EA1D2C\]/g, `bg-[${BROWN}]`);
content = content.replace(/hover:bg-\[#D01A27\]/g, `hover:bg-[${BROWN_HOVER}]`);
content = content.replace(/shadow-red-500\/20/g, `shadow-[${BROWN}]/20`);
content = content.replace(/shadow-red-500\/30/g, `shadow-[${BROWN}]/30`);
content = content.replace(/border-\[#EA1D2C\]/g, `border-[${BROWN}]`);
content = content.replace(/ring-\[#EA1D2C\]/g, `ring-[${BROWN}]`);
content = content.replace(/from-\[#EA1D2C\]/g, `from-[${BROWN}]`);
content = content.replace(/to-\[#FF4B5A\]/g, `to-[${BROWN_LIGHT}]`);
content = content.replace(/bg-red-50/g, `bg-[${BEIGE}]`);
content = content.replace(/bg-red-100/g, `bg-[${BEIGE_HOVER}]`);

// Icons and Text
content = content.replace(/text-\[#EA1D2C\] fill-\[#EA1D2C\]/g, `text-[${GOLD}] fill-[${GOLD}]`);
content = content.replace(/fill-\[#EA1D2C\]/g, `fill-[${GOLD}]`);
content = content.replace(/text-\[#EA1D2C\]/g, `text-[${BROWN}]`); // Default text to brown

fs.writeFileSync(filePath, content);
console.log('Colors replaced successfully!');

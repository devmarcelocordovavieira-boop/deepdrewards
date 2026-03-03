import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replace(/hover:border-red-100/g, `hover:border-[#E8E8C8]`);
content = content.replace(/hover:text-red-600/g, `hover:text-[#8B4513]`);

fs.writeFileSync(filePath, content);
console.log('Colors replaced successfully!');

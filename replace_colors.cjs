const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/#8B4513/g, '#00A3FF');
content = content.replace(/#6B3410/g, '#0077CC');
content = content.replace(/#A0522D/g, '#005580');
content = content.replace(/#D4AF37/g, '#00F0FF');
content = content.replace(/#FBBF24/g, '#00F0FF');
content = content.replace(/#9CA3AF/g, '#7DD3FC');
content = content.replace(/#B45309/g, '#0284C7');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Colors replaced successfully!');

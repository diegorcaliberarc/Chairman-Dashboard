const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');
content = content.replace(/[ \t]*@@schema\("public"\)\r?\n?/g, '');
fs.writeFileSync('prisma/schema.prisma', content);

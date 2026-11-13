const fs = require('fs'); 
let content = fs.readFileSync('prisma/schema.prisma', 'utf8'); 

content = content.replace(/model\s+(\w+)\s+\{([\s\S]*?)\}/g, (match, p1, p2) => { 
    return `model ${p1} {${p2}  @@schema("public")\n}`; 
}); 

content = content.replace(/enum\s+(\w+)\s+\{([\s\S]*?)\}/g, (match, p1, p2) => { 
    return `enum ${p1} {${p2}  @@schema("public")\n}`; 
}); 

fs.writeFileSync('prisma/schema.prisma', content);

const fs = require('fs');
const path = 'prisma/tenant-schema.prisma';
try {
    let content = fs.readFileSync(path, 'utf8');
    // Replace visible \r literal if they exist, and normal CR
    content = content.replace(/\\r/g, '');
    // Normalize line endings
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    fs.writeFileSync(path, content);
    console.log('Cleaned schema file');
} catch (e) {
    console.error(e);
}

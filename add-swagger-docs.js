const fs = require('fs');
const path = require('path');

// Files that need Swagger documentation
const filesToUpdate = [
    'fees.routes.js',
    'library.routes.js',
    'transport.routes.js',
    'certificates.routes.js',
    'communication.routes.js',
    'timetable.routes.js',
    'dashboard.routes.js',
    'reports.routes.js'
];

const routesDir = path.join(__dirname, 'src', 'modules', 'school');

console.log('Adding Swagger documentation to route files...\n');

filesToUpdate.forEach(filename => {
    const filePath = path.join(routesDir, filename);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${filename} not found, skipping...`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if already has swagger
    if (content.includes('@swagger')) {
        console.log(`✅ ${filename} - Already has Swagger documentation`);
        return;
    }

    // Add swagger comments before each router method
    content = content.replace(
        /router\.(get|post|put|delete)\('([^']+)',\s*([^,]+),\s*([^)]+)\);/g,
        (match, method, path, middleware, controller) => {
            const tag = getTagName(filename);
            const summary = generateSummary(method, path, controller);

            return `/**
 * @swagger
 * /school${path}:
 *   ${method}:
 *     summary: ${summary}
 *     tags: [${tag}]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
${match}`;
        }
    );

    fs.writeFileSync(filePath, content);
    console.log(`✅ ${filename} - Swagger documentation added`);
});

function getTagName(filename) {
    const name = filename.replace('.routes.js', '');
    const formatted = name.charAt(0).toUpperCase() + name.slice(1);
    return `School - ${formatted.replace(/([A-Z])/g, ' $1').trim()}`;
}

function generateSummary(method, path, controller) {
    const action = method.charAt(0).toUpperCase() + method.slice(1);
    const resource = path.split('/')[1] || 'resource';

    if (method === 'get' && path.includes(':')) return `Get ${resource} by ID`;
    if (method === 'get') return `Get all ${resource}`;
    if (method === 'post') return `Create ${resource}`;
    if (method === 'put') return `Update ${resource}`;
    if (method === 'delete') return `Delete ${resource}`;

    return `${action} ${resource}`;
}

console.log('\n✅ Swagger documentation added to all files!');
console.log('Restart the server to see the changes in Swagger UI');

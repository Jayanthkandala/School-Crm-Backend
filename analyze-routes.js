// Script to find all route files and their required controller functions
const fs = require('fs');
const path = require('path');

const routesDir = './src/modules/school';
const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.routes.js'));

console.log('Checking route files for required controller functions...\n');

routeFiles.forEach(routeFile => {
    const routePath = path.join(routesDir, routeFile);
    const content = fs.readFileSync(routePath, 'utf8');

    // Extract controller name
    const controllerMatch = content.match(/const (\w+Controller) = require\('\.\/(\w+)\.controller'\)/);
    if (!controllerMatch) return;

    const controllerVar = controllerMatch[1];
    const controllerName = controllerMatch[2];

    // Find all controller function calls
    const functionCalls = content.match(new RegExp(`${controllerVar}\\.(\\w+)`, 'g'));
    if (!functionCalls) return;

    const uniqueFunctions = [...new Set(functionCalls.map(call => call.split('.')[1]))];

    console.log(`${routeFile}:`);
    console.log(`  Controller: ${controllerName}.controller.js`);
    console.log(`  Required functions: ${uniqueFunctions.join(', ')}`);
    console.log('');
});

const routesData = [];

(function updateModules() {
    const requireModule = require.context(
        '@/views/',
        true,
        /route.js/
    );

    // console.log("Files Found:", requireModule.keys()); // ✅ Check if files are found

    const root = {
        path: '/',
        name: 'Root',
        redirect: '/dashboard',
    };

    routesData.push(root);

    requireModule.keys().forEach((fileName) => {
        const moduleDefinition = requireModule(fileName);
        // console.log(`Module Loaded from ${fileName}:`, moduleDefinition); // ✅ Check content

        moduleDefinition.default.forEach((route) => {
            routesData.push(route);
        });
    });

    routesData.push({ path: '/:catchAll(.*)', redirect: '/404-page-not-found' });
}());

if (process.env.BASE_URL) {
    // console.log(routesData);
}

export default routesData;
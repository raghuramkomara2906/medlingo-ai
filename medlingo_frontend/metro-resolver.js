const path = require('path');

module.exports = {
  resolver: {
    // Custom resolver to handle memoize-one specifically
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'memoize-one') {
        // Try to resolve memoize-one from node_modules
        const memoizeOnePath = path.resolve(__dirname, 'node_modules/memoize-one');
        const packageJson = require(path.join(memoizeOnePath, 'package.json'));
        
        // Return the main file path
        if (packageJson.main) {
          return {
            type: 'sourceFile',
            filePath: path.join(memoizeOnePath, packageJson.main)
          };
        }
      }
      
      // Fall back to default resolver
      return context.resolveRequest(context, moduleName, platform);
    }
  }
};


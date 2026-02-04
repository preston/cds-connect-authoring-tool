// In this file you can configure migrate-mongo
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const mmConfig = {
  mongodb: {
    url: config.get('mongo.url'),
    options: {
      //   connectTimeoutMS: 3600000, // increase connection timeout to 1 hour
      //   socketTimeoutMS: 3600000, // increase socket timeout to 1 hour
    }
  },

  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: path.join(currentDir, 'migrations'),

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: 'changelog',

  // The file extension to create migrations and search for in migration dir
  migrationFileExtension: '.js',

  // Enable the algorithm to create a checksum of the file contents and use that in the comparison to determine
  // if the file should be run.  Requires that scripts are coded to be run multiple times.
  useFileHash: false,

  // Don't change this, unless you know what you're doing
  moduleSystem: 'esm'
};

export default mmConfig;

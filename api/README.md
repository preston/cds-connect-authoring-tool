# CDS Connect Authoring Tool API

## About

The Clinical Decision Support (CDS) Authoring Tool is a web-based application aimed at simplifying the creation of production-ready CQL code. The project is based on "concept templates" (e.g. gender, HDL Cholesterol, etc.), which allow for additional clinical concepts to be included in the future. Concept modifiers are included to allow for more flexible definitions (e.g. most recent, value comparisons, etc.).

The CDS Authoring Tool API provides a RESTful backend for the CDS Authoring Tool React web frontend.

As of May, 2025, AHRQ's public CDS Connect environment is no longer available. 

The original CDS Authoring Tool from [CDS Connect](https://cds.ahrq.gov/cdsconnect) was sponsored by the [Agency for Healthcare Research and Quality](https://www.ahrq.gov/) (AHRQ), and initially developed under contract with AHRQ by MITRE's [Health FFRDC](https://www.mitre.org/our-impact/rd-centers/health-ffrdc).


## Contributions

For information about contributing to this project, please see [CONTRIBUTING](../CONTRIBUTING.md).

## Development Details

This project represents the M, E, and N in the MERN application architecture, using MongoDB, Express, and Node.

To develop and run this project, your must install MongoDB and Node.js LTS edition. On Mac OS X, this can be done through brew:

```bash
brew install node # install node, which also installs npm
brew install mongodb # install mongodb on host system
brew services start mongodb # start mongo
```

For other operating systems, use the instructions provided in each tool's online documentation.

Alternately, MongoDB can be installed and run using a docker image:

```bash
mkdir -p db
docker run --name=mongodb --volume=$PWD/db:/data/db -p 27017:27017 --restart=unless-stopped --detach=true mongo:6.0
```

This creates a local db directory and then runs a MongoDB docker container that will store files in that directory.

Once the prerequisite tools are installed, use npm to install the dependency libraries:

```bash
npm install # installs this app's dependencies based on this project's package.json and package-lock.json
```

By default, the project will attempt to convert CQL to ELM on download. To disable this in development, see the configuration section below. If enabled, you will need the CQL-to-ELM translation service, a Java application that can be run locally via Maven or Docker.

- To run locally with Maven: https://github.com/cqframework/cql-translation-service
- To run locally with Docker, install Docker and run: `docker run -p 8080:8080 cqframework/cql-translation-service:v2.3.0`

### Add / Remove / Adjust dependencies

```bash
npm install <package> # add a package. add --save-dev if this is a development dependency.
npm install <package>@<version> # will adjust version
npm uninstall <package> # remove a package.
```

### Configuration

This project uses the popular [convict](https://www.npmjs.com/package/convict) module to manage configuration. The configuration schema and default values can be found at `src/config.js`, and an example config file can be found at `config/example.json`.

The API server will uses the `NODE_ENV` environment variable to detect the active environment: `production`, `development`, or `test` (defaulting to `development` when no environment is supplied). If a corresponding configuration file (`config/${NODE_ENV}.json`) is present, it will merge its values into the default configuration.

For local development, a `config/local.json` file can also be used to override configuration settings. It has precedence over the environment-based configuration and default configuration.

Lastly, most aspects of config can also be overridden via specific environment variables. See the `src/config.js` configuration schema for the relevant environment variable names.

### Enabling HTTPS

By default, the API server and frontend server listen over unsecure HTTP. To listen over HTTPS, all three of the following environment variables must be set:

- `HTTPS`: Set to `true` to enable HTTPS.
- `SSL_KEY_FILE`: The absolute path to the SSL key file (e.g., `/data/ssl/server.key`)
- `SSL_CRT_FILE`: The absolute path to the SSL cert file (e.g., `/data/ssl/server.cert`)

These variable names match the variables documented in Create React App's [Using HTTPS in Development](https://create-react-app.dev/docs/using-https-in-development/) documentation.

### Updating Modifier Templates

This project uses EJS templates to generate CQL files. These files are all located in the subdirectories of `api/src/data/cql` and can be updated according to changes in CQL.

To add a rule template to `api/src/data/cql/rules` for an operator in the query builder, follow these steps:

1. Create a file for this template in `api/src/data/cql/rules`
2. Find the corresponding operator in `api/src/data/query_builder/operators.json` and update its `operatorTemplate` field to equal the name of the template file
3. For every rule template that's created, add a test to `api/test/handlers/cqlHandler/basicTests.js`

Note that if any new operator needs to be added to the `api/src/data/query_builder/operators.json` file, if there is a `userSelectedOperand` that requires a concept value or a valueset value, the field's name _must_ match the following:

- `conceptValue` for a singular concept
- `conceptValues` for a list of concepts
- `valueset` for a valueset

### Migrations

As the project evolves over time, the database schema may change in ways that require existing data to be transformed. Until early 2023, this project used [mongodb-migrations](https://www.npmjs.com/package/mongodb-migrations) to support database migrations. Those legacy migration scripts can be found in the `migrations/old-migrations` folder. Now this project uses [migrate-mongo](https://www.npmjs.com/package/migrate-mongo) for database migrations. The migrate-mongo scripts can be found in the `migrations/migrations` folder.

Migrations are automatically applied on application startup. This may be disabled via configuration (`migrations.active` in your local config file or the `MIGRATIONS_ACTIVE` environment variable). Migrations should only be disabled during development.

To create a new migration from the commandline, run the following command from the `api/src/migrations` folder:

```bash
npx migrate-mongo create my_migration_description
```

To run migrations from the commandline, run the following command from the `api/src/migrations` folder:

```bash
npx migrate-mongo up
```

### Authentication

This project uses [Passport](http://www.passportjs.org/) to authenticate users. By default, the project uses the [LDAP Authentication Strategy](https://github.com/vesse/passport-ldapauth).

For development purposes, the [Local Authentication Strategy](https://github.com/jaredhanson/passport-local) can be enabled via configuration. In order to do so, a `config/local-users.json` file must be created. For an example of the structure of this file, see `config/example-local-users.json`.

### Run

`npm start` will run the api server:

```bash
npm start # run the api server
```

`npm run start-dev` will run the api server in development mode, reloading the server when changes are detected.

```bash
npm run start-dev # run the api server with hot-reloading for development
```

### Linting

JavaScript linting is done using ESLint.

```bash
npm run lint # runs eslint using the configuration in .eslintrc.
npm run lint:fix # runs eslint --fix using the configuration in .eslintrc. The --fix flag will autocorrect minor errors
```

### Testing

API server testing uses [Chai](http://chaijs.com/) with [Mocha](http://mochajs.org/) as the test runner.

```bash
npm test # runs all api tests
```

### Docker

For information on running the CDS Authoring Tool in Docker, see the main [README](../README.md).

### Conversion functions

`AT_Internal_CDS_Connect_Conversions` provides a list of available functions to convert units. When updating or adding to these functions, update the file in `src/data/library_helpers/CQLFiles/AT_Internal_CDS_Connect_Conversions.cql` with the functions needed. After, regenerate the ELM file for this CQL file and update it in `src/data/library_helpers/ELMFiles/AT_Internal_CDS_Connect_Conversions.json`. If a function requires a more understandable description to be displayed in the user interface, such as the start and target units for the function, update the list of descriptions in `src/data/handlers/configHandler.js`.

## LICENSE

Copyright 2016-2023 Agency for Healthcare Research and Quality

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

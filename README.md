# CDS Connect Authoring Tool :: Community Edition 

[![Build Status](https://ci.hl7.org/api/badges/HL7-Quality/cds-connect-authoring-tool/status.svg)](https://ci.hl7.org/HL7-Quality/cds-connect-authoring-tool)

The Clinical Decision Support (CDS) Authoring Tool is a web-based application aimed at simplifying the creation of production-ready clinical quality language (CQL) code. The project is based on "concept templates" (e.g. gender, HDL Cholesterol, etc.), which allow for additional clinical concepts to be included in the future. Concept modifiers are included to allow for more flexible definitions (e.g. most recent, value comparisons, etc.).

This self-hosted Community Edition was originally part of the [CDS Connect](https://cds.ahrq.gov/cdsconnect) project by the [Agency for Healthcare Research and Quality](https://www.ahrq.gov/) (AHRQ) and initially developed under contract by MITRE's [Health FFRDC](https://www.mitre.org/our-impact/rd-centers/health-ffrdc).



## Contributions

For information about contributing to this project, please see [CONTRIBUTING](CONTRIBUTING.md).

## Development Details

This project uses the MERN stack: Mongo, Express, React, and NodeJS. The project is split into two components in separate directories:

- [api](/api): the backend Express API server
- [frontend](/frontend): the frontend React web application

For specific development details of each component, including configuration, see their respective README files.

## Run From Source (Development Quick Start)

### First, Run MongoDB

To run from source you must you have [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/download-center/community) installed. MongoDB can be run using a container image via Docker, Podman etc if desired via:

```bash
mkdir -p db
docker run --name=mongodb --volume=$PWD/db:/data/db -p 27017:27017 --restart=unless-stopped --detach=true mongo:8 
```

This creates a local db directory and then runs a MongoDB docker container that will store files in that directory.

### Configure Authentication

User authentication is required to use most of the application. Local file authentication is used by default, and LDAP is also supported. For local development, the simplest approach is to use default [`local.json`](api/config/local.json) application configuration and [`local-users.json`](api/config//local-users.json) default username/password credentials as-is. Also see [`minimal-example.json`](api/config/minimal-example.json) and [`example-local-users.json`](api/config/example-local-users.json) for more complex examples.

### Install Dependencies and Run

Each of the subprojects (_api_ and _frontend_) must have the dependencies installed via _npm_. This can be done as follows:

```sh
cd api
npm i # Install project dependencies
npm run start # Run the Express API application
```

After the api dependency install successfully runs, install the frontend dependencies:

```sh
cd ../frontend
npm i # Install project dependencies
npm run start # Run the React application
```

The frontend should now be available at [http://localhost:3000/authoring](http://localhost:3000/authoring)!

### Testing CQL Execution Results

Testing CQL execution in development requires the API to be configured to use the CQL-to-ELM
Translator and also requires the Translator to be running locally.

To configure the API, edit the configuration settings in `api/config/local.json` to point to a local
instance of the Translator:

```json
"cqlToElm": {
  "url": "http://localhost:8080/cql/translator",
  "active": true
}
```

This should replace any existing cqlToElm configuration block where `active` is set to `false`. See
the Configuration section of the [API README](api/README.md) for details on configuring the API.

Once the configuration is updated and the API has been restarted the translation service can be run
locally in docker via:

```bash
docker run -p 8080:8080 cqframework/cql-translation-service:v2.6.0
```

### Running tests

The API tests can be run with

```bash
npm --prefix api test
```

The frontend tests can be run with

```bash
npm --prefix frontend test
```

## Docker

This project can also be built into a Docker image and deployed as a Docker container. To do any of the commands below, [Docker](https://www.docker.com/) must be installed.

### Building the docker image

To build the Docker image, execute the following command from the project's root directory (the directory containing _api_ and _frontend_):

```
docker build -t hlseven/cds-connect-authoring-tool:latest .
```

### Running Everything with Docker Compose

To run pre-build images For the Authoring Tool to run in a docker container, MongoDB and CQL-to-ELM docker containers must be linked. The following commands run the necessary containers, with the required links and exposed ports:

```sh
docker compose -f docker-compose.yml up --remove-orphans --pull always
```


**Proxying the API**

By default, the server on port 9000 will proxy requests on _/authoring/api_ to the local API server using express-http-proxy. In production environments, a dedicated external proxy server may be desired. In that case, the external proxy server will be responsible for proxying _/authoring/api_ to port 3001. To accomodate this, disable the express-http-proxy by adding `API_PROXY_ACTIVE=false` as a frontend environment variable.



**Enabling HTTPS**

By default, the API server and frontend server listen over unsecure HTTP. To listen over HTTPS, add these three flags and volume mount settings to your `docker run` command:

```
  -v /data/ssl:/data/ssl \
  -e "HTTPS=true" \
  -e "SSL_KEY_FILE=/data/ssl/server.key" \
  -e "SSL_CRT_FILE=/data/ssl/server.cert" \
```

You should substitute the volume mapping and SSL filenames as needed for your specific environment.


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

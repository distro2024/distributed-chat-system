# Distributed Chat System 

Documents required for project evaluation
- Work Plan [pdf](./docs/work-plan.pdf) / [md](./docs/work-plan.md)
- Final report [pdf](./docs/final-report.pdf) / [qmd](./docs/final-report.qmd)

> Note: The final report was written with [quarto](https://quarto.org/) for better markdown-to-pdf support. This affects the reading experience in GitHub markdown format. 


## Running the application

### System requirements 

For development of this application the following versions have been used:
- node.js:`23.3.0` 
- npm: `10.9.0`
- docker-compose: `2.30.1` 
- docker: `27.4.0`

Older versions of these applications are not guaranteed to work.

### Installation

Start by cloning the application from the default branch (main) of the GitHub -repository with `git clone`.

The application has two modules: `director` and `node`. For each of these you need to install required dependencies. Alternatively, you can use Docker Compose if you want to [test this in containers](#running-with-docker).

#### Director
Move to the subdirectory `./director` and run the command 

```bash
npm install
```

To verify that everything is working correctly, run the unittests with 

```bash
npm test
```
To start a node run the command:
```bash
npm start
```

#### Node

Move to the subdirectory `./node` and run the command 

```bash
npm install
```

To verify that everything is working correctly, run the unittests with 

```bash
npm test
```

After the Director is running, to start a node run the command:

```bash
PORT=<xxxx> npm start
```

> The `PORT=<xxxx>` is optional, but lets you define a port for the node. This is useful when starting multiple nodes locally. 

### Local testing

To test the application locally, you can start the application either manually or using Docker.

#### Running manually

Open a new terminal and start the director with:
```
node director.js
```

In different terminal windows/panes start each node by providing a port of your choosing, for instance:
```
PORT=6541 node node.js
PORT=6542 node node.js
...
PORT=654x node node.js
```

In terminal windows you can follow the messages between nodes and the director. You can test the chat-features by navigating to localhost:PORT (for each node). 

#### Running with Docker

Alternatively, you can run the application using Docker (or Docker Compose). This method simplifies the setup by containerizing the director and nodes.

Open separate terminal windows to start each service:
```
docker-compose up director
docker-compose up node1
docker-compose up node2
docker-compose up node3
```
Once all services are up and running, you can access the clients via your web browser at the following URLs:
```
http://localhost:4000
http://localhost:4001
http://localhost:4002
```
## Instructions for developers

### Code Quality Tools

This project uses ESLint and Prettier to ensure code quality and consistency. Both are included as dev dependencies in the project.


#### ESLint

- It is recommended that all team members use, when possible, plugins for their IDEs to automatically lint the code.

- Alternatively, linting can be done with the command `npm run lint` (it's good to use CLI ESLint in any case to see open issues).


#### Prettier

- It is recommended that all team members use Prettier plugins for their IDEs to automatically format the code on save. This helps ensure consistent code style across the project.

- Alternatively, formatting can be done with the command `npm run format` (it's good to use CLI Prettier in any case to see all files that were changed). This command will format all files in the project that are supported by Prettier. You can also specify individual files or directories to format.

### Unittests
The team should write code in a manner that supports unittesting of different functionalities. With a proof-of-concept deadlines are tight and workhours low, so sometimes compromises have to be made. As saifguards we follow these steps:
- write Unittests whenever possible (the team uses jest)
- If you cannot unittest:  
  - verify with end-to-end testing that your code works
  - write clean code so that others can understand your intentions
  - comment your code thoroughly to persuade the reader that your code is sensible. 

### Branches
- New code is developed in feature-branches
- Code is merged to main with pull requests (PRs). 
- Each PR requires atleast one approval
- When you are added as a reviewer, try to review the PR in no more than three days. 


## Video demonstration of the system

[Distibuted Chat System](https://helsinkifi-my.sharepoint.com/:v:/g/personal/vaisajuh_ad_helsinki_fi/EZwn-eFB-g5Ko_OXWVBGUS4BmKZBHP22L3Yw1NQCFuj6cw?e=sOnlBV&nav=eyJwbGF5YmFja09wdGlvbnMiOnt9LCJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbE1vZGUiOiJtaXMiLCJyZWZlcnJhbFZpZXciOiJwb3N0cm9sbC1jb3B5bGluayIsInJlZmVycmFsUGxheWJhY2tTZXNzaW9uSWQiOiI5NDdhNWQ1ZC1iOWYzLTRjYzMtOGQ0NS0wYTk0N2RmZjRmZGYifX0%3D)

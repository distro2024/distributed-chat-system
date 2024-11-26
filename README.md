# Distributed Chat System 

Documents required for project evaluation
- Work Plan [pdf](./docs/work-plan.pdf) / [md](./docs/work-plan.md)
- Final report [pdf](./docs/final-report.pdf) / [qmd](./docs/final-report.qmd)

> Note: The final report was written with [quarto](https://quarto.org/) for better markdown-to-pdf support. This affects the reading experience in GitHub markdown format. 


## Running the application

### System requirements 

Running this application required version `x.x.x` of node.js and version `x.x.x` of npm. 

### Installation

Start by cloning the application from the default branch (main) of the GitHub -repository with `git clone`.

The application has two modules: `director` and `node`. For each of these you need to install required dependencies. 

#### Node
Move to the subdirectory `./node` and run the command 

```bash
npm install
```

To verify that everything is working correctly, run the unittests with 

```bash
npm test
```

#### Director
Move to the subdirectory `./director` and run the command 

```bash
npm install
```

To verify that everything is working correctly, run the unittests with 

```bash
npm test
```

### Local testing

To test the application locally, start new terminals for director and as many nodes as you want. Start the director with
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

## Instructions for developers

### Linter
The team uses eslint for linting and it is included as a dependency. 
- It is recommended that all team members use when possible plugins for their IDEs to automatically lint the code. 
- Alternatively linting can be done with the command `npm eslint` (it's good to use CLI eslint in any case to see open issues)

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

Let's add a short video tutorial to help the review process. 


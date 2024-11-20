# Distributed Chat System 

A brief introductory text here. Perhaps main project links
- [Work Plan](./docs/work-plan.md)
- Definition of Done(?)



## Running the application

### System requirements 

Running this application required version `x.x.x` of node.js and version `x.x.x` of npm. 

### Installation

Start by cloning the application from the default branch (main) of the GitHub -repository with `git clone`.

The application has two modules: `director` and `node`. For each of these you need to install required dependencies. 

#### Node
Mode to the subdirectory `./node` and run the command `npm install`. To verify that everything is working correctly, run the unittests with `npm test`.

#### Director
Mode to the subdirectory `./director` and run the command `npm install`. To verify that everything is working correctly, run the unittests with `npm test`.



## Instruction for developers

### Linter
The team uses eslint for linting and it is included as a dependency. 
- It is recommended that all team members use when possible plugins for their IDEs to automatically lint the code. 
- Alternatively linting can be done with the command `npm eslint`

### Unittests
The team should write code in a manner that supports unittesting of different functionalities. With a proof-of-concept deadlines are tight and workhours low, so sometimes compromises have to be made. As saifguards we follow these steps:
1. Unittest whenever possible
2. If you cannot unittest:
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


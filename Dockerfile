FROM node:24.0-slim

LABEL "com.github.actions.name"=" Create branch from issue name."
LABEL "com.github.actions.description"="Create a branch from the issue name, issue number, and other information."
LABEL "com.github.actions.icon"="plus"
LABEL "com.github.actions.color"="green"

COPY package.json ./

RUN apt update && apt install -y git git-lfs && yarn

COPY . .

RUN yarn build

ENTRYPOINT ["node", "dist/index.js"]

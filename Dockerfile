FROM mhart/alpine-node:base-8

RUN apk update

RUN npm i -g pm2 babel-cli

COPY . /server

WORKDIR /server
RUN npm i

CMD pm2-docker server.js --interpreter babel-node


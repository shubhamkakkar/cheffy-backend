FROM node:10-alpine

WORKDIR /var/www/app

COPY package.json .
RUN npm install pm2 -g
RUN npm install
RUN apk add htop
RUN apk add nano
COPY . .
ENV PM2_PUBLIC_KEY hnw3h61uq4w7b4a
ENV PM2_SECRET_KEY odacx7rke9r8816

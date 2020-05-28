# if getting build issues
#https://www.richardkotze.com/top-tips/install-bcrypt-docker-image-exclude-host-node-modules

# Stage-1 dependencies
FROM node:10 as stage1

WORKDIR /var/www/app

#RUN npm install
ADD package.json .
RUN npm i


# Stage-2 final image
FROM node:10-alpine as stage2

COPY --from=stage1 /var/www/app/node_modules ./node_modules
RUN npm install pm2 -g
RUN ["npm", "rebuild", "-q"]
RUN apk add htop
RUN apk add nano
COPY . .
COPY .docker-env .
ENV PM2_PUBLIC_KEY hnw3h61uq4w7b4a
ENV PM2_SECRET_KEY odacx7rke9r8816
#CMD ["node", "./bin/server.js"]

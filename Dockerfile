FROM node:14-alpine

RUN apk add  git

RUN apk add --no-cache python3 g++ make

WORKDIR app

COPY ./ /app

RUN yarn install 

EXPOSE 3022

CMD ["yarn", "start"]

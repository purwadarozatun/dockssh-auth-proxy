FROM node:14-alpine

RUN apk add  git

WORKDIR app

COPY ./ /app

RUN yarn install 

EXPOSE "3022"

CMD ["node", "index.js"]

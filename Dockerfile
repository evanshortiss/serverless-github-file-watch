FROM node:10-slim

COPY package*.json *.js ./

RUN npm install --production

CMD [ "npm", "start" ]

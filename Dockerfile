FROM node
WORKDIR /opt/egg
COPY package*.json ./
RUN npm i
COPY . .
EXPOSE 7001
CMD ["npm","start"]

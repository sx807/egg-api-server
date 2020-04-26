FROM node
WORKDIR /opt/egg
COPY package*.json ./
RUN npm i
COPY . .
COPY ../vue ../
EXPOSE 7001
CMD ["npm","start"]

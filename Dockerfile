FROM node:16

WORKDIR /app

COPY package*.json ./
RUN npm install socket.io socket.io-redis redis --save

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]

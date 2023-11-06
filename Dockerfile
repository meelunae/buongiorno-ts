# Pulls latest Node image
FROM node:latest

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
# Copy package.json in container folder for packages installation
COPY package.json /usr/src/app
RUN npm install
# copies source code in container folder
COPY . /usr/src/app
EXPOSE 1337
CMD ["npm", "run", "build"]
CMD ["npm", "run", "start"]


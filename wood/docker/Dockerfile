FROM node:16

# Create app directory
RUN mkdir /nodewood
WORKDIR /nodewood

# Install app dependencies
COPY package.json yarn.lock ./
COPY app/package.json ./app/package.json
COPY wood/package.json ./wood/package.json
RUN yarn install

# Bundle app source
COPY . .

EXPOSE 3000

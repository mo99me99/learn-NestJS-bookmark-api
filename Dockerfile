# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# generate migrations
RUN npx prisma generate
# Build the application
RUN npm run build

# Expose the port your app runs on
EXPOSE 3333

# Run the application
# CMD ["npm", "run", "start:prod"]
CMD [ "npm", "run", "start:prod" ]
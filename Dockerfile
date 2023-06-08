# Use the official Node.js 14 image as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install the project dependencies
RUN npm install

# Copy the project files to the container
COPY . .

RUN npm install -g find-campsite

# Expose port 8080 for the application
EXPOSE 8080

# Set the command to run the application
CMD ["find-campsite"]
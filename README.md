# Sred.io Task

This project demonstrates a full-stack application with a **Node.js backend** and an **Angular frontend**. The backend runs on port **3000**, while the frontend runs on port **4200**.

## Setup Instructions

### 1. Clone the Repository
To get started, clone the repository to your local machine:
```bash
  git clone https://github.com/jobayer12/sred.io-task
  cd sred.io-task
  ```
### 2. Steps to Set Up Backend Server
- Navigate to the `server` directory:

   ```bash
   cd server
   ```
- Rename `.env.sample` to `.env` and configure the environment variables.

   ### Example .env File
   ```text
   GITHUB_CLIENT_ID=
   GITHUB_CLIENT_SECRET=
   GITHUB_REDIRECT_URI=
   MONGO_URI=
   JWT_SECRET=
   CLIENT_URI=
   ```
   ###	Environment Variable Examples:
	- GITHUB_CLIENT_ID: Your GitHub app client ID.
	- GITHUB_CLIENT_SECRET: Your GitHub app client secret.
	- GITHUB_REDIRECT_URI: The redirect URI for GitHub OAuth. Example: http://localhost:3000/api/v1/github/callback.
	- MONGO_URI: MongoDB connection string. Example: mongodb://localhost:27017/sred.
	- JWT_SECRET: Secret key for signing JWTs.
	- CLIENT_URI: URL of the frontend server. Example: http://localhost:4200.


- Steps to Set Node.js Version.

    This project requires `Node.js v18`. To ensure you’re using the correct version, the .nvmrc file is included in the repository. You can use nvm (Node Version Manager) to set the appropriate Node.js version:

   1.	Install nvm if you don’t already have it:

         ```bash
         curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
         ```
   2.	Use the Node.js version specified in .nvmrc:
         ```bash
         nvm use
         ```
   3. If the specified version is not installed, install it with:

         ```bash
         nvm install
         ```


- Install the dependencies:
   ```bash
   npm install
   ```
- Start the server:
   ```bash
   npm run start
   ```

The backend server will run on http://localhost:3000.


### 2. Steps to Set Up Frontend Server
- Navigate to the `client` directory:

   ```bash
   cd client
   ```
- Steps to Set Node.js Version.

    This project requires `Node.js v16 & Angular 15.2`. To ensure you’re using the correct version, the .nvmrc file is included in the repository. You can use nvm (Node Version Manager) to set the appropriate Node.js version:

   1.	Install nvm if you don’t already have it:

         ```bash
         curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
         ```
   2.	Use the Node.js version specified in .nvmrc:
         ```bash
         nvm use
         ```
   3. If the specified version is not installed, install it with:

         ```bash
         nvm install
         ```

- Install the dependencies:
   ```bash
   npm install
   ```
- Start the server:
   ```bash
   npm run start
   ```
The frontend server will run on http://localhost:4200.

## Application Overview

- Frontend: Accessible at http://localhost:4200.
- Backend: Accessible at http://localhost:3000.

Make sure both the backend and frontend servers are running for the application to function properly.
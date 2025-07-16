# WordMaster Server

Backend server for the WordMaster vocabulary learning application.

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Generate RSA keys:
   ```
   node generate-keys.js
   ```
   This will create a `.env` file with your RSA keys. Make sure this file is in your `.gitignore`!

4. Start the server:
   ```
   npm start
   ```

## Deployment to Vercel

### Prerequisites
- [Vercel CLI](https://vercel.com/docs/cli) installed: `npm i -g vercel`
- A Vercel account

### Deployment Steps

1. Login to Vercel:
   ```
   vercel login
   ```

2. Generate RSA keys locally using `node generate-keys.js`

3. Add the RSA keys as environment variables in your Vercel project:
   - Go to your project settings in the Vercel dashboard
   - Add `RSA_PUBLIC_KEY` and `RSA_PRIVATE_KEY` from your local `.env` file

4. Deploy to Vercel:
   ```
   vercel
   ```

5. Follow the prompts in the CLI. Choose the following options:
   - Set up and deploy: `Y`
   - Directory: `server` (or the path to your server directory)
   - Link to existing project: `N` (or `Y` if you've already created a project)
   - Project name: `wordmaster-server` (or your preferred name)
   - Framework preset: `Other`

6. For production deployment:
   ```
   vercel --prod
   ```

## Environment Variables

The following environment variables can be set in your Vercel project settings:

- `NODE_ENV`: Set to `production` for production deployments
- `PORT`: Port number for local development (not used in Vercel)
- `RSA_PUBLIC_KEY`: The public key for RSA encryption
- `RSA_PRIVATE_KEY`: The private key for RSA encryption

## API Endpoints

- `GET /api/publicKey`: Get RSA public key for encryption
- `GET /api/units`: Get available vocabulary units
- `GET /api/vocabulary/:volume/:unit`: Get vocabulary for specific volume and unit
- `POST /api/secure/vocabulary/:volume/:unit`: Get encrypted vocabulary data 

# POS Inventory Frontend

Install dependencies with `npm install`, then run `npm start`. Set `REACT_APP_API_URL` when the API is not running at `http://localhost:5000/api`.

## Vercel deployment

Set the Vercel project root directory to `POS Order & Inventory System/Frontend`. The included `vercel.json` configures Create React App with `npm run build` and the `build` output directory. Add `REACT_APP_API_URL` in Vercel Production environment variables using the deployed backend URL, for example `https://your-backend.example.com/api`. Do not use `http://localhost:5000/api` in production.
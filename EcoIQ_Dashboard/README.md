# EcoIQ Dashboard – Phase 1 (Frontend)

A responsive React + Vite + Tailwind CSS application that visualises indoor environmental data **(temperature, humidity, occupancy, AQI)** for each room and shows the current HVAC **mode**.  This is the first milestone of the EcoIQ project and ships with mocked data plus AWS Amplify scaffolding for authentication.

---

## 🚀 Quick start

```bash
# 1. Install dependencies (only needed once)
cd EcoIQ_Dashboard
npm install

# 2. Create a local .env file with your AWS Cognito details
cp .env.example .env
# then edit .env with real values (see below)

# 3. Run the dev server (auto-reloads on save)
npm run dev
```

The app is available at `http://localhost:5173` (or the port Vite prints). It’s fully mobile-responsive—open browser DevTools and toggle the device toolbar to confirm.

## 🖼️ UI preview
![Dashboard screenshot](docs/dashboard-mobile.png)

> The layout adapts fluidly: single-column on phones, two columns on small tablets, up to a 4-column grid on desktop.

## 📦 Tech stack

| Layer      | Library               | Why                                   |
|------------|-----------------------|---------------------------------------|
| UI         | React 18              | Modern component model                |
| Styling    | Tailwind CSS          | Utility-first, rapid responsive UI    |
| Charts     | Recharts              | Simple yet powerful line charts       |
| Auth (stub)| AWS Amplify JS        | Easy Cognito integration (Phase 2)    |

---

## 🔐 Environment variables
Create a `.env` (or `.env.local`) file in `EcoIQ_Dashboard/` containing:

```bash
VITE_AWS_REGION=us-east-1                # e.g. us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXX # your User Pool ID
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxx # web client ID
```
These are read in `src/aws-exports.ts` and passed to `aws-amplify` at runtime.

> **Note**: Phase 1 ships with **mock data** only.  Cognito login screens will appear once a real User Pool exists and Amplify’s Auth UI is enabled.

---

## 📁 Project structure (relevant bits)
```
EcoIQ_Dashboard/
├── src/
│   ├── components/
│   │   ├── HistoryChart.tsx   # Recharts wrapper
│   │   ├── ModeIndicator.tsx  # Colour badge (Eco, Comfort, Cool)
│   │   └── RoomCard.tsx       # Responsive room card
│   ├── App.tsx                # Renders grid of RoomCards
│   ├── main.tsx               # React entry + Amplify config
│   └── index.css              # Tailwind directives
├── tailwind.config.js         # Tailwind paths & theme
├── postcss.config.js          # PostCSS plugins
└── README.md                  # You are here
```

---

## 🛠️ Available scripts

```bash
npm run dev       # start Vite dev server with HMR
npm run build     # production build (dist/)
npm run preview   # preview a production build locally
npm run lint      # eslint (coming soon)
```

---

## 🧭 Next steps
1. **Backend CDK stack** – DynamoDB, Lambdas, API Gateway, Cognito (Phase 2 tasks `T04-T09`).
2. Replace the mock `mockRooms` array with real API calls (Authenticated GET `/rooms`).
3. Add sign-in / sign-up screens via `@aws-amplify/ui-react` once Cognito is provisioned.
4. Add historical line charts and live updates via polling or websockets.

---

Made with ❤️ for better indoor environments.

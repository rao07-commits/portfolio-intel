This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Seeding portfolio holdings (required for concentration analysis)

The briefing's Portfolio Risk section (HHI / position weights) only works when
holdings have real share quantities. All rows currently default to `quantity = 0`,
which disables the section (the email shows a one-line data alert instead).

Seed quantities via `POST /api/portfolio`, one call per holding:

```bash
curl -X POST https://<your-deployment>/api/portfolio \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AMZN","name":"Amazon","quantity":123,"avg_cost":150.00,"asset_type":"stock","account":"robinhood","sector":"consumer_discretionary"}'
```

Holdings to seed (from skills.md): AMZN, NVDA, CRWD, GOOG, APP, ASTS, HOOD,
EWY, MU, SPY, GLD, BTC, and the 401K target-date fund. Update `quantity` and
`avg_cost` with your actual figures.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

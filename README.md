# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## Stripe Billing Setup

Stripe billing for NextStride runs through Supabase Edge Functions. The frontend does not store Stripe secret keys, and the functions expect Stripe configuration through `Deno.env.get(...)`.

Required Supabase Edge Function secrets:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_YEARLY`
- `STRIPE_PRICE_ELITE_MONTHLY`
- `STRIPE_PRICE_ELITE_YEARLY`

Where to set them:

- Supabase Dashboard: Project Settings -> Edge Functions -> Secrets
- Supabase CLI: `supabase secrets set --env-file supabase/functions/.env`

Local development:

- Start from `supabase/functions/.env.example` and create a local `supabase/functions/.env`
- Put Stripe test values in that local file only
- Do not commit real secrets

Notes:

- Hosted Supabase Edge Functions already provide `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`, so you do not need to add those manually for production
- Stripe secrets become available to functions immediately after you set them
- Redeploying the functions is not required just to pick up newly added Edge Function secrets

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

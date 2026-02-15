# 🚨 LEKHAPORA EMERGENCY RESCUE GUIDE

Your app was stuck because of broken build scripts or dependencies in the repository. Follow these steps exactly to fix it.

## STEP 1: CLEAN YOUR GITHUB REPO
Vercel is pulling your old, broken code. You need to clear it.
1. In your terminal, go to your project folder.
2. Run: `rm -rf * .*[!.]*` (This deletes everything except the `.git` folder).
3. Now, you should only have the `index.html` and `vercel.json` I just provided.
4. Run:
   ```bash
   git add .
   git commit -m "Emergency Nuclear Fix: Single-file static"
   git push origin main
   ```

## STEP 2: CONFIGURE VERCEL SETTINGS
Vercel is still trying to "build" the app using Vite/React scripts that are broken.
1. Go to your [Vercel Dashboard](https://vercel.com).
2. Select the `lekhapora-beta` project.
3. Go to **Settings** -> **General**.
4. Change **Framework Preset** to `Other`.
5. Clear the **Build Command** (make sure it's empty).
6. Set **Output Directory** to `.` (just a single dot).
7. Clear the **Install Command** (make sure it's empty).
8. Scroll down and click **Save**.

## STEP 3: REDEPLOY
1. Go to the **Deployments** tab in Vercel.
2. Find your latest push.
3. Click the three dots `...` and select **Redeploy**.

## STEP 4: VERIFY
1. Open `https://lekhapora-beta.vercel.app/` in an **Incognito Window**.
2. You should see the Purple Rescue Page instantly.
3. Click the "Test React" button to ensure functionality.

## WHY THIS WORKS
This bypasses `npm install`, `vite build`, and all the complex steps where your app was failing. It serves a single, high-quality HTML file directly. Once this is live, you have a solid foundation to start adding back your advanced features one by one.

---
*Created by Lekhapora Rescue Protocol v1.0*
import React from "react";
import { Box, Container, Link, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import Seo, { breadcrumbs } from "../components/Seo";

/*
 * Every statement here is checked against the code: the Supabase tables in
 * supabase/migrations, the OpenAI calls in supabase/functions, and the
 * localStorage keys in src/lib/planCache.ts and AuthPage. Update this page
 * when any of those change.
 */
const LAST_UPDATED = "5 October 2026";

/*
 * The site owner's contact address for privacy questions. Left empty until
 * the owner supplies one — the contact section is hidden while it is blank.
 */
const PRIVACY_CONTACT_EMAIL = "";

const sections: { heading: string; body: React.ReactNode }[] = [
  {
    heading: "What we collect",
    body: (
      <>
        <p>Only what you enter, and only once you create an account. Browsing the site without an account stores nothing about you on our servers.</p>
        <ul>
          <li><strong>Account:</strong> your name and email address, or the name and email Google shares if you sign in with Google. Passwords are handled by our authentication provider and are never visible to us.</li>
          <li><strong>Athlete profile:</strong> age, height, weight, activity level, sport, experience, goals, training days, injury areas, equipment, and food preferences, allergies and intolerances.</li>
          <li><strong>Daily check-ins:</strong> sleep, energy, soreness, fatigue, stress, mood, hydration, nutrition, training intensity, pain level, any notes you write, and the readiness scores calculated from them.</li>
          <li><strong>AI coach conversations:</strong> the messages you send and the replies you receive. Photos you attach are sent to the AI with your message but are not saved.</li>
          <li><strong>Plans:</strong> the workout and nutrition plans generated for you each day.</li>
          <li><strong>Usage count:</strong> how many AI requests you make each day, so we can apply a fair-use limit.</li>
        </ul>
        <p>We do not use advertising or analytics trackers.</p>
      </>
    ),
  },
  {
    heading: "Why we use it",
    body: (
      <p>
        To run the features you use: your dashboard, readiness and recovery trends, and AI coaching, workout and
        nutrition plans that take your profile, allergies and recent check-ins into account. We do not sell your
        data or use it for advertising.
      </p>
    ),
  },
  {
    heading: "Who processes it",
    body: (
      <ul>
        <li><strong>Supabase</strong> stores your account and the data above, and handles sign-in. Each record is locked to your account, so other users cannot read it.</li>
        <li><strong>OpenAI</strong> generates AI replies and plans. When you use an AI feature, your message, any attached photo, and the relevant parts of your profile and recent check-ins are sent to OpenAI to produce the answer.</li>
        <li><strong>Google</strong>, only if you choose "Continue with Google", to sign you in.</li>
        <li><strong>Render and Cloudflare</strong> host and deliver the website itself.</li>
      </ul>
    ),
  },
  {
    heading: "Health information",
    body: (
      <p>
        Check-ins, injuries, allergies and similar details are health-related. SportLab AI gives general sports
        science guidance, not medical advice. Only enter what you are comfortable sharing, and speak to a qualified
        professional about injuries or medical conditions.
      </p>
    ),
  },
  {
    heading: "Stored on your device",
    body: (
      <p>
        To keep you signed in and load faster, your browser stores your sign-in session and a copy of today's plans.
        Your workout log — the sets, reps and weights you record in My Workout Plan — is kept only in this browser and
        never sent to us. While "Remember me" is ticked (it is by default), your email address is saved so the login
        form can fill it in. Signing out ends the session and removes the cached plans; your workout log and
        remembered email stay so they are there next time. You can clear them at any time in your browser's site
        settings.
      </p>
    ),
  },
  {
    heading: "Keeping and deleting your data",
    body: (
      <p>
        We keep your data while your account exists. You can edit your profile at any time on the{" "}
        <Link component={RouterLink} to="/profile">Profile</Link> page, and delete your account there too. Deleting
        your account permanently removes your profile, check-ins, conversations, plans and usage records, and clears
        everything SportLab AI stored in the browser you delete it from.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <Box sx={{ bgcolor: "#f8fafc", py: { xs: 4, md: 7 } }}>
      <Seo
        title="Privacy Policy"
        description="What SportLab AI collects, why, who processes it, and how to delete your account and data."
        path="/privacy"
        jsonLd={breadcrumbs([
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy" },
        ])}
      />

      <Container maxWidth="md">
        <Typography
          component="h1"
          sx={{ fontWeight: 950, fontSize: { xs: "2rem", md: "2.6rem" }, color: "#0f172a", letterSpacing: -0.8 }}
        >
          Privacy Policy
        </Typography>
        <Typography sx={{ mt: 1, color: "#64748b", fontSize: 14 }}>Last updated {LAST_UPDATED}</Typography>

        <Stack
          spacing={4}
          sx={{
            mt: 4,
            color: "#334155",
            lineHeight: 1.8,
            "& p": { m: 0, mb: 1.5 },
            "& ul": { m: 0, mb: 1.5, pl: 3 },
            "& li": { mb: 0.75 },
            "& a": { color: "#2563eb", fontWeight: 700 },
          }}
        >
          {sections.map((section) => (
            <Box component="section" key={section.heading}>
              <Typography component="h2" sx={{ fontWeight: 900, fontSize: "1.2rem", color: "#0f172a", mb: 1.5 }}>
                {section.heading}
              </Typography>
              {section.body}
            </Box>
          ))}

          {PRIVACY_CONTACT_EMAIL && (
            <Box component="section">
              <Typography component="h2" sx={{ fontWeight: 900, fontSize: "1.2rem", color: "#0f172a", mb: 1.5 }}>
                Contact
              </Typography>
              <p>
                Questions about your data? Email{" "}
                <Link href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>{PRIVACY_CONTACT_EMAIL}</Link>.
              </p>
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

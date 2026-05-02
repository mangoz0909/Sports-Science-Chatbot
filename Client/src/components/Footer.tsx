import React from "react";
import {
  Box,
  Container,
  Grid,
  Link,
  Typography,
  Stack,
  Divider,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#000957",
        color: "#fff",
        mt: "auto",
        borderTop: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
        <Grid container spacing={{ xs: 4, md: 5 }}>
          <Grid item xs={12} md={5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                component="img"
                src="/logo.png"
                alt="Mernbase logo"
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 1.5,
                  bgcolor: "#fff",
                  objectFit: "cover",
                }}
              />

              <Typography variant="h6" fontWeight={900}>
                Mernbase
              </Typography>
            </Stack>

            <Typography
              variant="body2"
              sx={{
                opacity: 0.82,
                mt: 2,
                maxWidth: 520,
                lineHeight: 1.8,
              }}
            >
              A clean AI assistant platform with responsive pages for sports,
              mental health, authentication, and dashboard workflows.
            </Typography>
          </Grid>

          <Grid item xs={6} sm={4} md={2.5}>
            <Typography
              variant="subtitle2"
              sx={{
                opacity: 0.72,
                mb: 1.5,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Product
            </Typography>

            <Stack spacing={1}>
              <Link
                component={RouterLink}
                to="/"
                color="inherit"
                underline="hover"
                sx={{ opacity: 0.88 }}
              >
                Home
              </Link>

              <Link
                component={RouterLink}
                to="/sports"
                color="inherit"
                underline="hover"
                sx={{ opacity: 0.88 }}
              >
                Sports Assistant
              </Link>

              <Link
                component={RouterLink}
                to="/mental-health"
                color="inherit"
                underline="hover"
                sx={{ opacity: 0.88 }}
              >
                Mental Health Assistant
              </Link>

              <Link
                component={RouterLink}
                to="/dashboard"
                color="inherit"
                underline="hover"
                sx={{ opacity: 0.88 }}
              >
                Dashboard
              </Link>
            </Stack>
          </Grid>

          <Grid item xs={6} sm={4} md={2}>
            <Typography
              variant="subtitle2"
              sx={{
                opacity: 0.72,
                mb: 1.5,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Account
            </Typography>

            <Stack spacing={1}>
              <Link
                component={RouterLink}
                to="/auth?mode=login"
                color="inherit"
                underline="hover"
                sx={{ opacity: 0.88 }}
              >
                Log in
              </Link>

              <Link
                component={RouterLink}
                to="/auth?mode=signup"
                color="inherit"
                underline="hover"
                sx={{ opacity: 0.88 }}
              >
                Sign up
              </Link>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={4} md={2.5}>
            <Typography
              variant="subtitle2"
              sx={{
                opacity: 0.72,
                mb: 1.5,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Status
            </Typography>

            <Typography
              variant="body2"
              sx={{
                opacity: 0.82,
                lineHeight: 1.8,
              }}
            >
              Built with React, TypeScript, MUI, and responsive-first UI
              structure.
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.14)" }} />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1.5}
        >
          <Typography variant="body2" sx={{ opacity: 0.75 }}>
            © {year} Mernbase. All rights reserved.
          </Typography>

          <Typography variant="body2" sx={{ opacity: 0.75 }}>
            AI assistant platform
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
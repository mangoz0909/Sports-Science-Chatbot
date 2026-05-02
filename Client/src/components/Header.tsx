import React from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import { Link as RouterLink, useLocation } from "react-router-dom";

type NavItem = {
  label: string;
  to: string;
};

const navItems: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "Sports AI", to: "/sports" },
  { label: "Mental Health", to: "/mental-health" },
  { label: "Dashboard", to: "/dashboard" },
];

const Header: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const { pathname } = useLocation();

  const isActive = (to: string) => {
    if (to === "/") return pathname === "/";
    return pathname.startsWith(to);
  };

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "rgba(255,255,255,0.94)",
          color: "#0f172a",
          borderBottom: "1px solid #e2e8f0",
          backdropFilter: "blur(14px)",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{
              minHeight: { xs: 64, md: 72 },
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box
              component={RouterLink}
              to="/"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "#0f172a",
                  color: "#38bdf8",
                }}
              >
                <MonitorHeartIcon />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontWeight: 950,
                    lineHeight: 1,
                    letterSpacing: -0.3,
                    fontSize: { xs: "1.05rem", md: "1.2rem" },
                  }}
                >
                  SportLab AI
                </Typography>
                <Typography
                  sx={{
                    display: { xs: "none", sm: "block" },
                    fontSize: 12,
                    color: "#64748b",
                    fontWeight: 700,
                  }}
                >
                  Sports Science Platform
                </Typography>
              </Box>
            </Box>

            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{ display: { xs: "none", md: "flex" } }}
            >
              {navItems.map((item) => (
                <Button
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  sx={{
                    color: isActive(item.to) ? "#0284c7" : "#334155",
                    fontWeight: isActive(item.to) ? 900 : 750,
                    borderRadius: 999,
                    px: 2,
                    bgcolor: isActive(item.to) ? "#e0f2fe" : "transparent",
                    "&:hover": {
                      bgcolor: "#f1f5f9",
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}

              <Divider orientation="vertical" flexItem sx={{ mx: 1.25 }} />

              <Button
                component={RouterLink}
                to="/auth?mode=login"
                variant="outlined"
                sx={{
                  borderRadius: 999,
                  fontWeight: 900,
                  borderColor: "#cbd5e1",
                  color: "#0f172a",
                  px: 2.25,
                  "&:hover": {
                    borderColor: "#94a3b8",
                    bgcolor: "#f8fafc",
                  },
                }}
              >
                Login
              </Button>

              <Button
                component={RouterLink}
                to="/auth?mode=signup"
                variant="contained"
                sx={{
                  borderRadius: 999,
                  fontWeight: 900,
                  bgcolor: "#0f172a",
                  color: "#fff",
                  px: 2.5,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#1e293b",
                    boxShadow: "none",
                  },
                }}
              >
                Get Started
              </Button>
            </Stack>

            <IconButton
              onClick={() => setDrawerOpen(true)}
              sx={{ display: { xs: "inline-flex", md: "none" } }}
              aria-label="Open navigation menu"
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={closeDrawer}>
        <Box sx={{ width: 300, maxWidth: "86vw", p: 2.5 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.2,
                display: "grid",
                placeItems: "center",
                bgcolor: "#0f172a",
                color: "#38bdf8",
              }}
            >
              <MonitorHeartIcon />
            </Box>

            <Box>
              <Typography fontWeight={950}>SportLab AI</Typography>
              <Typography fontSize={12} color="text.secondary" fontWeight={700}>
                Sports Science Platform
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ mb: 1 }} />

          <List>
            {navItems.map((item) => (
              <ListItemButton
                key={item.to}
                component={RouterLink}
                to={item.to}
                onClick={closeDrawer}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  bgcolor: isActive(item.to) ? "#e0f2fe" : "transparent",
                  color: isActive(item.to) ? "#0284c7" : "#0f172a",
                }}
              >
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: 850 }}
                />
              </ListItemButton>
            ))}
          </List>

          <Divider sx={{ my: 1.5 }} />

          <Stack spacing={1}>
            <Button
              fullWidth
              component={RouterLink}
              to="/auth?mode=login"
              variant="outlined"
              onClick={closeDrawer}
              sx={{ borderRadius: 2.5, fontWeight: 900 }}
            >
              Login
            </Button>

            <Button
              fullWidth
              component={RouterLink}
              to="/auth?mode=signup"
              variant="contained"
              onClick={closeDrawer}
              sx={{
                borderRadius: 2.5,
                fontWeight: 900,
                bgcolor: "#0f172a",
                boxShadow: "none",
                "&:hover": { bgcolor: "#1e293b", boxShadow: "none" },
              }}
            >
              Get Started
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
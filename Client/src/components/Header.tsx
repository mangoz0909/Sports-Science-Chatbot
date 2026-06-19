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
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import CloseIcon from "@mui/icons-material/Close";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

type NavItem = { label: string; to: string };

const navItems: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "Sports AI", to: "/sports" },
  { label: "Sports Match", to: "/sports-list" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Check-In", to: "/daily-check-in" },
];

const Logo: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <Box
    component="img"
    src="/sportslab_logo.png"
    alt="SportLab AI"
    sx={{
      width: size,
      height: size,
      objectFit: "contain",
      borderRadius: "10px",
      flexShrink: 0,
    }}
  />
);

const Header: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [profileAnchor, setProfileAnchor] = React.useState<null | HTMLElement>(null);
  const { pathname } = useLocation();

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setIsLoggedIn(!!s));
    return () => subscription.unsubscribe();
  }, []);

  const isActive = (to: string) => pathname === to;
  const closeDrawer = () => setDrawerOpen(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "rgba(255,255,255,0.96)",
          color: "#0f172a",
          borderBottom: "1px solid #e2e8f0",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{
              minHeight: { xs: 60, md: 68 },
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            {/* ── Brand ── */}
            <Box
              component={RouterLink}
              to="/"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                textDecoration: "none",
                color: "inherit",
                flexShrink: 0,
              }}
            >
              <Logo size={40} />
              <Box>
                <Typography
                  sx={{
                    fontWeight: 900,
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                    fontSize: { xs: "1rem", md: "1.1rem" },
                    color: "#0f172a",
                  }}
                >
                  SportLab AI
                </Typography>
                <Typography
                  sx={{
                    display: { xs: "none", sm: "block" },
                    fontSize: 11,
                    color: "#94a3b8",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  Sports Science
                </Typography>
              </Box>
            </Box>

            {/* ── Desktop Nav ── */}
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{ display: { xs: "none", lg: "flex" }, flex: 1, justifyContent: "center" }}
            >
              {navItems.map((item) => (
                <Button
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  sx={{
                    color: isActive(item.to) ? "#0284c7" : "#475569",
                    fontWeight: isActive(item.to) ? 800 : 600,
                    fontSize: "0.875rem",
                    borderRadius: "10px",
                    px: 1.5,
                    py: 0.75,
                    minWidth: 0,
                    bgcolor: isActive(item.to) ? "#e0f2fe" : "transparent",
                    textTransform: "none",
                    "&:hover": { bgcolor: "#f1f5f9", color: "#0f172a" },
                    transition: "all 0.15s ease",
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>

            {/* ── Desktop Auth ── */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ display: { xs: "none", lg: "flex" }, flexShrink: 0 }}
            >
              {isLoggedIn ? (
                <>
                  <IconButton
                    onClick={(e) => setProfileAnchor(e.currentTarget)}
                    aria-label="Profile menu"
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: isActive("/profile") ? "#e0f2fe" : "#f1f5f9",
                      borderRadius: "10px",
                      "&:hover": { bgcolor: "#e0f2fe" },
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                  <Menu
                    anchorEl={profileAnchor}
                    open={Boolean(profileAnchor)}
                    onClose={() => setProfileAnchor(null)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    PaperProps={{ sx: { borderRadius: 2, border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", mt: 0.5 } }}
                  >
                    <MenuItem component={RouterLink} to="/profile" onClick={() => setProfileAnchor(null)} sx={{ fontSize: 14, fontWeight: 600 }}>Profile</MenuItem>
                    <MenuItem onClick={async () => { setProfileAnchor(null); await handleLogout(); }} sx={{ fontSize: 14, fontWeight: 600, color: "#ef4444" }}>Logout</MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button
                    component={RouterLink}
                    to="/auth?mode=login"
                    sx={{
                      borderRadius: "10px",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      color: "#475569",
                      textTransform: "none",
                      px: 2,
                      "&:hover": { bgcolor: "#f1f5f9", color: "#0f172a" },
                    }}
                  >
                    Log in
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/auth?mode=signup"
                    variant="contained"
                    sx={{
                      borderRadius: "10px",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      textTransform: "none",
                      bgcolor: "#0f172a",
                      color: "#fff",
                      px: 2.25,
                      py: 0.875,
                      boxShadow: "none",
                      "&:hover": { bgcolor: "#1e293b", boxShadow: "none" },
                    }}
                  >
                    Get started
                  </Button>
                </>
              )}
            </Stack>

            {/* ── Mobile Hamburger ── */}
            <IconButton
              onClick={() => setDrawerOpen(true)}
              sx={{
                display: { xs: "inline-flex", lg: "none" },
                width: 40,
                height: 40,
                borderRadius: "10px",
                bgcolor: "#f1f5f9",
                "&:hover": { bgcolor: "#e2e8f0" },
              }}
              aria-label="Open navigation menu"
            >
              <MenuIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* ── Mobile Drawer ── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={closeDrawer}
        PaperProps={{
          sx: {
            width: 300,
            maxWidth: "90vw",
            borderRadius: "20px 0 0 20px",
            border: "none",
          },
        }}
      >
        <Box sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Drawer header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Logo size={36} />
              <Box>
                <Typography fontWeight={800} fontSize="0.95rem" lineHeight={1.2}>SportLab AI</Typography>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Sports Science
                </Typography>
              </Box>
            </Stack>
            <IconButton
              onClick={closeDrawer}
              sx={{ width: 32, height: 32, bgcolor: "#f1f5f9", borderRadius: "8px" }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>

          <Divider sx={{ mb: 1.5 }} />

          {/* Nav links */}
          <List sx={{ flex: 1, p: 0 }}>
            {navItems.map((item) => (
              <ListItemButton
                key={item.to}
                component={RouterLink}
                to={item.to}
                onClick={closeDrawer}
                sx={{
                  borderRadius: "10px",
                  mb: 0.5,
                  py: 1,
                  bgcolor: isActive(item.to) ? "#e0f2fe" : "transparent",
                  color: isActive(item.to) ? "#0284c7" : "#334155",
                  "&:hover": { bgcolor: "#f8fafc" },
                }}
              >
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: isActive(item.to) ? 800 : 600, fontSize: 15 }}
                />
              </ListItemButton>
            ))}
            {isLoggedIn && (
              <ListItemButton
                component={RouterLink}
                to="/profile"
                onClick={closeDrawer}
                sx={{
                  borderRadius: "10px",
                  mb: 0.5,
                  py: 1,
                  bgcolor: isActive("/profile") ? "#e0f2fe" : "transparent",
                  color: isActive("/profile") ? "#0284c7" : "#334155",
                  "&:hover": { bgcolor: "#f8fafc" },
                }}
              >
                <ListItemText primary="Profile" primaryTypographyProps={{ fontWeight: 600, fontSize: 15 }} />
              </ListItemButton>
            )}
          </List>

          <Divider sx={{ mb: 2 }} />

          {/* Auth buttons */}
          <Stack spacing={1}>
            {isLoggedIn ? (
              <Button
                fullWidth
                variant="outlined"
                onClick={async () => { await handleLogout(); closeDrawer(); }}
                sx={{ borderRadius: "10px", fontWeight: 700, textTransform: "none", color: "#ef4444", borderColor: "#fecaca" }}
              >
                Logout
              </Button>
            ) : (
              <>
                <Button
                  fullWidth
                  component={RouterLink}
                  to="/auth?mode=login"
                  variant="outlined"
                  onClick={closeDrawer}
                  sx={{ borderRadius: "10px", fontWeight: 700, textTransform: "none", borderColor: "#e2e8f0", color: "#334155" }}
                >
                  Log in
                </Button>
                <Button
                  fullWidth
                  component={RouterLink}
                  to="/auth?mode=signup"
                  variant="contained"
                  onClick={closeDrawer}
                  sx={{
                    borderRadius: "10px",
                    fontWeight: 700,
                    textTransform: "none",
                    bgcolor: "#0f172a",
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#1e293b", boxShadow: "none" },
                  }}
                >
                  Get started
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;

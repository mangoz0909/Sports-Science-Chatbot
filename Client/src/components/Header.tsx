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
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

type NavItem = { label: string; to: string };

const navItems: NavItem[] = [
  { label: "Sports AI", to: "/sports" },
  { label: "Sports Match", to: "/sports-list" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Health", to: "/health/workout" },
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
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [profileAnchor, setProfileAnchor] = React.useState<null | HTMLElement>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isActive = (to: string) => {
    if (to === "/") return pathname === "/";
    return pathname === to || pathname.startsWith(to + "/");
  };

  const closeDrawer = () => setDrawerOpen(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      navigate("/", { replace: true });
    } finally {
      setLoggingOut(false);
    }
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
        <Container
          maxWidth="lg"
          sx={{
            px: { xs: 2, sm: 3, md: 4 },
            mx: "auto",
          }}
        >
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
                flexShrink: 0,
              }}
            >
              <Logo size={40} />
              <Typography
                sx={{
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  fontSize: { xs: "1.25rem", md: "1.35rem" },
                  color: "#0f172a",
                }}
              >
                SportLab AI
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{
                display: { xs: "none", lg: "flex" },
                flex: 1,
                justifyContent: "center",
              }}
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
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>

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
                      width: 38,
                      height: 38,
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
                    PaperProps={{
                      sx: {
                        borderRadius: 2,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                        mt: 0.5,
                      },
                    }}
                  >
                    <MenuItem
                      component={RouterLink}
                      to="/profile"
                      onClick={() => setProfileAnchor(null)}
                      sx={{ fontSize: 14, fontWeight: 600 }}
                    >
                      Profile
                    </MenuItem>

                    <MenuItem
                      disabled={loggingOut}
                      onClick={async () => {
                        setProfileAnchor(null);
                        await handleLogout();
                      }}
                      sx={{ fontSize: 14, fontWeight: 600, color: "#ef4444" }}
                    >
                      {loggingOut ? "Logging out..." : "Logout"}
                    </MenuItem>
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

            <IconButton
              onClick={() => setDrawerOpen(true)}
              sx={{
                display: { xs: "inline-flex", lg: "none" },
                width: 48,
                height: 48,
                borderRadius: "16px",
                bgcolor: "#f1f5f9",
                "&:hover": { bgcolor: "#e2e8f0" },
              }}
              aria-label="Open navigation menu"
            >
              <MenuIcon sx={{ fontSize: 24 }} />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

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
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Logo size={36} />
              <Typography fontWeight={800} fontSize="0.95rem">
                SportLab AI
              </Typography>
            </Stack>

            <IconButton
              onClick={closeDrawer}
              sx={{ width: 32, height: 32, bgcolor: "#f1f5f9", borderRadius: "8px" }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>

          <Divider sx={{ mb: 1.5 }} />

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
                  primaryTypographyProps={{
                    fontWeight: isActive(item.to) ? 800 : 600,
                    fontSize: 15,
                  }}
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
                <ListItemText
                  primary="Profile"
                  primaryTypographyProps={{ fontWeight: 600, fontSize: 15 }}
                />
              </ListItemButton>
            )}
          </List>

          <Divider sx={{ mb: 2 }} />

          <Stack spacing={1}>
            {isLoggedIn ? (
              <Button
                fullWidth
                variant="outlined"
                disabled={loggingOut}
                onClick={async () => {
                  await handleLogout();
                  closeDrawer();
                }}
                sx={{
                  borderRadius: "10px",
                  fontWeight: 700,
                  textTransform: "none",
                  color: "#ef4444",
                  borderColor: "#fecaca",
                }}
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </Button>
            ) : (
              <>
                <Button
                  fullWidth
                  component={RouterLink}
                  to="/auth?mode=login"
                  variant="outlined"
                  onClick={closeDrawer}
                  sx={{
                    borderRadius: "10px",
                    fontWeight: 700,
                    textTransform: "none",
                    borderColor: "#e2e8f0",
                    color: "#334155",
                  }}
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
import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useScrollTrigger,
  Slide,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link as RouterLink, useLocation } from "react-router-dom";

function HideOnScroll({ children }: { children: React.ReactElement }) {
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

type NavButtonProps = {
  to: string;
  label: string;
  active?: boolean;
};

const NavButton: React.FC<NavButtonProps> = ({ to, label, active }) => {
  return (
    <Button
      component={RouterLink}
      to={to}
      sx={{
        color: "inherit",
        opacity: active ? 1 : 0.82,
        fontWeight: active ? 800 : 600,
        borderRadius: 999,
        px: 1.75,
        "&:hover": {
          opacity: 1,
          bgcolor: "rgba(255,255,255,0.1)",
        },
      }}
    >
      {label}
    </Button>
  );
};

const Header: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const { pathname, hash } = useLocation();

  const currentPath = `${pathname}${hash}`;

  const isActive = (target: string) => {
    if (target.includes("#")) return currentPath === target;
    return pathname === target;
  };

  const closeDrawer = () => setOpen(false);

  return (
    <>
      <HideOnScroll>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: "rgba(0, 9, 87, 0.92)",
            color: "#fff",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <Toolbar
            sx={{
              minHeight: { xs: 64, md: 72 },
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              px: { xs: 2, md: 4 },
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
                minWidth: 0,
              }}
            >
              <Box
                component="img"
                src="/logo.png"
                alt="Mernbase logo"
                sx={{
                  width: { xs: 32, md: 36 },
                  height: { xs: 32, md: 36 },
                  borderRadius: 1.25,
                  boxShadow: 1,
                  bgcolor: "common.white",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  letterSpacing: 0.3,
                  fontSize: { xs: "1.05rem", md: "1.25rem" },
                  whiteSpace: "nowrap",
                }}
              >
                Mernbase
              </Typography>
            </Box>

            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <NavButton to="/" label="Home" active={isActive("/")} />
              <NavButton
                to="/sports"
                label="Sports"
                active={isActive("/sports")}
              />
              <NavButton
                to="/mental-health"
                label="Mental Health"
                active={isActive("/mental-health")}
              />
              <NavButton
                to="/dashboard"
                label="Dashboard"
                active={isActive("/dashboard")}
              />

              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  mx: 1.5,
                  borderColor: "rgba(255,255,255,0.22)",
                }}
              />

              <Button
                variant="contained"
                component={RouterLink}
                to="/auth?mode=signup"
                sx={{
                  fontWeight: 800,
                  borderRadius: 999,
                  bgcolor: "#fff",
                  color: "#000957",
                  px: 2.25,
                  "&:hover": {
                    bgcolor: "#eef2ff",
                  },
                }}
              >
                Get Started
              </Button>
            </Box>

            <IconButton
              onClick={() => setOpen(true)}
              color="inherit"
              sx={{ display: { xs: "inline-flex", md: "none" } }}
              aria-label="Open menu"
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      </HideOnScroll>

      <Drawer anchor="right" open={open} onClose={closeDrawer}>
        <Box
          sx={{
            width: 300,
            maxWidth: "85vw",
            p: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              mb: 1.5,
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="Mernbase logo"
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                bgcolor: "common.white",
                boxShadow: 1,
                objectFit: "cover",
              }}
            />

            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Mernbase
            </Typography>
          </Box>

          <Divider sx={{ mb: 1 }} />

          <List>
            <ListItemButton component={RouterLink} to="/" onClick={closeDrawer}>
              <ListItemText primary="Home" />
            </ListItemButton>

            <ListItemButton
              component={RouterLink}
              to="/sports"
              onClick={closeDrawer}
            >
              <ListItemText primary="Sports Assistant" />
            </ListItemButton>

            <ListItemButton
              component={RouterLink}
              to="/mental-health"
              onClick={closeDrawer}
            >
              <ListItemText primary="Mental Health Assistant" />
            </ListItemButton>

            <ListItemButton
              component={RouterLink}
              to="/dashboard"
              onClick={closeDrawer}
            >
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </List>

          <Divider sx={{ my: 1 }} />

          <Box display="flex" flexDirection="column" gap={1}>
            <Button
              variant="outlined"
              fullWidth
              component={RouterLink}
              to="/auth?mode=login"
              onClick={closeDrawer}
            >
              Log in
            </Button>

            <Button
              variant="contained"
              fullWidth
              component={RouterLink}
              to="/auth?mode=signup"
              onClick={closeDrawer}
            >
              Get Started
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
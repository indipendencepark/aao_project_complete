import React, { useState } from 'react';
import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Container, IconButton, Avatar, Badge, Tooltip, Fade } from '@mui/material';
import { Link, Outlet, useLocation } from 'react-router-dom';

import DashboardIcon from '@mui/icons-material/Dashboard';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BuildIcon from '@mui/icons-material/Build';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const drawerWidth = 280;

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/',
      gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
      color: '#667EEA'
    },
    { 
      text: 'Diagnosi e Assessment', 
      icon: <AssessmentIcon />, 
      path: '/diagnosi',
      gradient: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
      color: '#F093FB'
    },
    { 
      text: 'Progettazione e Supporto', 
      icon: <BuildIcon />, 
      path: '/progettazione',
      gradient: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
      color: '#4FACFE'
    },
    { 
      text: 'Monitoraggio Continuativo', 
      icon: <MonitorHeartIcon />, 
      path: '/monitoraggio',
      gradient: 'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)',
      color: '#43E97B'
    },
  ];

  const getCurrentPageColor = () => {
    const currentItem = menuItems.find(item => 
      location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    );
    return currentItem?.color || '#667EEA';
  };

  const drawer = (
    <Box sx={{ height: '100%', background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)' }}>
      <Toolbar sx={{ 
        minHeight: 80, 
        px: 3,
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0px 8px 24px rgba(102, 126, 234, 0.2)',
              color: 'white',
              fontWeight: 800,
              fontSize: '1.2rem'
            }}
          >
            AAO
          </Box>
          <Box>
            <Typography variant="h6" noWrap sx={{ fontWeight: 700, color: '#1E293B' }}>
              Sistema AAO
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Gestione Assetti
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      
      <List sx={{ px: 2, py: 3 }}>
        {menuItems.map((item, index) => {
          const isSelected = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <ListItem 
              button 
              key={item.text} 
              component={Link} 
              to={item.path}
              selected={isSelected}
              sx={{
                mb: 1,
                borderRadius: '12px',
                height: 56,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                '&:hover': {
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                  transform: 'translateX(4px)',
                  '& .MuiListItemIcon-root': {
                    transform: 'scale(1.1) rotate(-5deg)',
                  }
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: isSelected ? 4 : 0,
                  height: 24,
                  borderRadius: '0 4px 4px 0',
                  background: item.gradient,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }
              }}
              className={`slide-in`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 42,
                  color: isSelected ? item.color : '#64748B',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <Box
                  sx={{
                    p: 1,
                    borderRadius: '10px',
                    background: isSelected ? item.gradient : 'transparent',
                    color: isSelected ? 'white' : 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isSelected ? '0px 8px 16px rgba(0, 0, 0, 0.1)' : 'none',
                  }}
                >
                  {item.icon}
                </Box>
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: '0.95rem',
                  color: isSelected ? '#1E293B' : '#64748B',
                }}
              />
            </ListItem>
          );
        })}
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Divider sx={{ mx: 3, mb: 2 }} />
      
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
            color: 'white',
            textAlign: 'center',
            boxShadow: '0px 12px 24px rgba(102, 126, 234, 0.2)',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Versione Pro
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Sblocca tutte le funzionalità
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          color: '#1E293B',
        }}
        elevation={0}
      >
        <Toolbar sx={{ height: 80, px: { xs: 2, sm: 4 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h5" noWrap component="div" sx={{ 
            fontWeight: 700,
            background: `linear-gradient(135deg, ${getCurrentPageColor()} 0%, ${getCurrentPageColor()}88 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            flexGrow: 1
          }}>
            Adeguati Assetti Organizzativi
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Modalità tema">
              <IconButton
                sx={{ 
                  color: '#64748B',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  }
                }}
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Notifiche">
              <IconButton
                sx={{ 
                  color: '#64748B',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  }
                }}
              >
                <Badge badgeContent={4} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Profilo">
              <IconButton
                sx={{ 
                  ml: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  }
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 40, 
                    height: 40,
                    background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                  }}
                >
                  U
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: 'none',
              boxShadow: '4px 0px 24px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: 'none',
              boxShadow: '4px 0px 24px rgba(0, 0, 0, 0.05)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          minHeight: 'calc(100vh - 80px)',
          mt: '80px',
        }}
      >
        <Fade in timeout={500}>
          <Container maxWidth="xl" sx={{ 
            animation: 'fadeIn 0.5s ease-out',
            px: { xs: 0, sm: 2, md: 3 }
          }}>
            <Outlet />
          </Container>
        </Fade>
      </Box>
    </Box>
  );
};

export default MainLayout;
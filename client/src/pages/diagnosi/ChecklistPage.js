import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Grid, Paper, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Alert, useTheme, alpha, Grow, CardContent, Avatar, Skeleton, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';
import {
    Chip,
    Card,
    Zoom,
    Fade,
    Badge,
    LinearProgress,
    styled,
    keyframes
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import DraftsIcon from '@mui/icons-material/Drafts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import NuovaChecklist from './NuovaChecklist';
import CompilazioneChecklist from './CompilazioneChecklist';

// Animazioni
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

// Componenti stilizzati
const GlassPaper = styled(Paper)(({ theme }) => ({
    backdropFilter: 'blur(20px)',
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    borderRadius: theme.spacing(3),
    overflow: 'hidden',
    position: 'relative',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        pointerEvents: 'none'
    }
}));

const ModernCard = styled(Card)(({ theme }) => ({
    borderRadius: theme.spacing(3),
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    position: 'relative',
    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
    '&:hover': {
        transform: 'translateY(-8px) scale(1.02)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
    }
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
    const getStatusStyle = () => {
        switch (status) {
            case 'completata':
                return {
                    background: `linear-gradient(135deg, ${theme.palette.success.light} 0%, ${theme.palette.success.main} 100%)`,
                    color: theme.palette.success.contrastText
                };
            case 'in_corso':
                return {
                    background: `linear-gradient(135deg, ${theme.palette.info.light} 0%, ${theme.palette.info.main} 100%)`,
                    color: theme.palette.info.contrastText
                };
            default:
                return {
                    background: `linear-gradient(135deg, ${theme.palette.grey[400]} 0%, ${theme.palette.grey[600]} 100%)`,
                    color: theme.palette.common.white
                };
        }
    };
    return {
        ...getStatusStyle(),
        fontWeight: 600,
        padding: theme.spacing(0.5, 2),
        height: 28,
        '& .MuiChip-icon': {
            color: 'inherit'
        }
    };
});

const AnimatedButton = styled(Button)(({ theme }) => ({
    borderRadius: theme.spacing(3),
    textTransform: 'none',
    fontWeight: 600,
    padding: theme.spacing(1.5, 3),
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: -100,
        width: '100%',
        height: '100%',
        background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.common.white, 0.4)}, transparent)`,
        transition: 'left 0.5s'
    },
    '&:hover::before': {
        left: '100%'
    }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.04),
        transform: 'scale(1.01)',
        boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`
    }
}));

const getStatusIcon = (status) => {
    switch (status) {
        case 'completata': return <CheckCircleIcon />;
        case 'in_corso': return <HourglassEmptyIcon />;
        default: return <DraftsIcon />;
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'completata': return 'Completata';
        case 'in_corso': return 'In Corso';
        case 'bozza': return 'Bozza';
        default: return status;
    }
};

const ChecklistPage = () => {
    const theme = useTheme();
    const [checklists, setChecklists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedChecklistToDelete, setSelectedChecklistToDelete] = useState(null);
    const [showNewChecklistForm, setShowNewChecklistForm] = useState(false);
    const [selectedChecklistToCompile, setSelectedChecklistToCompile] = useState(null);

    const fetchChecklists = async (clearMessages = true) => {
        setLoading(true);
        if (clearMessages) {
            setError(null);
            setSuccessMessage(null);
        }
        try {
            const response = await axios.get('http://localhost:5001/api/checklist');
            setChecklists(response.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Errore nel recupero delle checklist.');
            setChecklists([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChecklists(true);
    }, []);

    const handleOpenDeleteDialog = (checklist) => {
        setSelectedChecklistToDelete(checklist);
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setSelectedChecklistToDelete(null);
    };

    const handleDeleteChecklist = async (id) => {
        if (!id) return;
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await axios.delete(`http://localhost:5001/api/checklist/${id}`);
            setSuccessMessage('Checklist eliminata con successo.');
            fetchChecklists(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Errore durante l\'eliminazione.');
        } finally {
            handleCloseDeleteDialog();
        }
    };

    const handleShowNewForm = () => {
        setError(null);
        setSuccessMessage(null);
        setShowNewChecklistForm(true);
        setSelectedChecklistToCompile(null);
    };

    const handleHideNewForm = () => {
        setShowNewChecklistForm(false);
    };

    const handleNewChecklistSuccess = (newChecklist) => {
        setSuccessMessage(`Checklist "${newChecklist.nome}" creata con successo!`);
        setShowNewChecklistForm(false);
        fetchChecklists(false);
    };

    const handleBackFromCompile = () => {
        setSelectedChecklistToCompile(null);
        setError(null);
        setSuccessMessage(null);
        fetchChecklists(true);
    };

    // Calcola statistiche
    const stats = {
        total: checklists.length,
        completate: checklists.filter(c => c.stato === 'completata').length,
        inCorso: checklists.filter(c => c.stato === 'in_corso').length,
        bozze: checklists.filter(c => c.stato === 'bozza').length
    };

    return (
        <Box sx={{ position: 'relative', minHeight: '100vh' }}>
            {/* Background decorativo */}
            <Box sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 0,
                opacity: 0.03,
                pointerEvents: 'none',
                background: `radial-gradient(circle at 20% 50%, ${theme.palette.primary.main} 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, ${theme.palette.secondary.main} 0%, transparent 50%)`
            }} />

            {selectedChecklistToCompile ? (
                <Fade in timeout={800}>
                    <Box>
                        <CompilazioneChecklist
                            checklistId={selectedChecklistToCompile}
                            onBackToList={handleBackFromCompile}
                        />
                    </Box>
                </Fade>
            ) : showNewChecklistForm ? (
                <Fade in timeout={800}>
                    <Box>
                        <AnimatedButton
                            variant="outlined"
                            onClick={handleHideNewForm}
                            sx={{ mb: 3 }}
                            startIcon={<ArrowBackIcon />}
                        >
                            Torna alla Lista
                        </AnimatedButton>
                        <NuovaChecklist
                            onSaveSuccess={handleNewChecklistSuccess}
                            onCancel={handleHideNewForm}
                        />
                    </Box>
                </Fade>
            ) : (
                <>
                    {/* Header */}
                    <Fade in timeout={600}>
                        <Box sx={{ mb: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Box>
                                    <Typography variant="h4" sx={{
                                        fontWeight: 800,
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        mb: 1
                                    }}>
                                        Check-list di Valutazione
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary">
                                        Gestisci e monitora le valutazioni degli assetti aziendali
                                    </Typography>
                                </Box>
                                <AnimatedButton
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleShowNewForm}
                                    sx={{
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                        color: 'white',
                                        '&:hover': {
                                            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                                        }
                                    }}
                                >
                                    Nuova Checklist
                                </AnimatedButton>
                            </Box>

                            {/* Messaggi */}
                            {error && (
                                <Zoom in timeout={400}>
                                    <Alert severity="error" onClose={() => setError(null)} sx={{
                                        mb: 2,
                                        borderRadius: 2,
                                        background: `linear-gradient(135deg, ${alpha(theme.palette.error.light, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.1)} 100%)`
                                    }}>
                                        {error}
                                    </Alert>
                                </Zoom>
                            )}
                            {successMessage && (
                                <Zoom in timeout={400}>
                                    <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{
                                        mb: 2,
                                        borderRadius: 2,
                                        background: `linear-gradient(135deg, ${alpha(theme.palette.success.light, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.1)} 100%)`
                                    }}>
                                        {successMessage}
                                    </Alert>
                                </Zoom>
                            )}
                        </Box>
                    </Fade>

                    {/* Statistiche */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {[
                            { label: 'Totali', value: stats.total, color: 'primary', icon: <AssignmentIcon /> },
                            { label: 'Completate', value: stats.completate, color: 'success', icon: <CheckCircleIcon /> },
                            { label: 'In Corso', value: stats.inCorso, color: 'info', icon: <HourglassEmptyIcon /> },
                            { label: 'Bozze', value: stats.bozze, color: 'grey', icon: <DraftsIcon /> }
                        ].map((stat, index) => (
                            <Grid item xs={12} sm={6} md={3} key={stat.label}>
                                <Grow in timeout={600 + index * 100}>
                                    <ModernCard>
                                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                            <Avatar sx={{
                                                mx: 'auto',
                                                mb: 2,
                                                width: 56,
                                                height: 56,
                                                background: `linear-gradient(135deg, ${theme.palette[stat.color].light} 0%, ${theme.palette[stat.color].main} 100%)`,
                                                animation: `${float} 3s ease-in-out infinite`,
                                                animationDelay: `${index * 0.2}s`
                                            }}>
                                                {stat.icon}
                                            </Avatar>
                                            <Typography variant="h3" sx={{
                                                fontWeight: 800,
                                                color: theme.palette[stat.color].main,
                                                mb: 0.5
                                            }}>
                                                {stat.value}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {stat.label}
                                            </Typography>
                                        </CardContent>
                                    </ModernCard>
                                </Grow>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Tabella checklist */}
                    <Fade in timeout={800}>
                        <GlassPaper sx={{ p: 0, overflow: 'hidden' }}>
                            <Box sx={{
                                p: 3,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                            }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                                    <AutoAwesomeIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                                    Elenco Checklist
                                </Typography>
                            </Box>

                            {loading ? (
                                <Box sx={{ p: 4 }}>
                                    {[...Array(3)].map((_, i) => (
                                        <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
                                    ))}
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ '& th': { fontWeight: 700, borderBottom: `2px solid ${theme.palette.divider}` } }}>
                                                <TableCell>Nome Checklist</TableCell>
                                                <TableCell>Cliente</TableCell>
                                                <TableCell>Data Creazione</TableCell>
                                                <TableCell>Stato</TableCell>
                                                <TableCell align="right">Azioni</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {checklists.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                                        <Box sx={{ textAlign: 'center' }}>
                                                            <AssignmentIcon sx={{ fontSize: 64, color: theme.palette.grey[300], mb: 2 }} />
                                                            <Typography variant="h6" color="text.secondary">
                                                                Nessuna checklist trovata
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                                Inizia creando una nuova checklist di valutazione
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                checklists.map((checklist) => (
                                                    <StyledTableRow key={checklist._id}>
                                                        <TableCell>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                                {checklist.nome}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>{checklist.cliente?.nome ?? 'N/D'}</TableCell>
                                                        <TableCell>{new Date(checklist.data_creazione).toLocaleDateString('it-IT')}</TableCell>
                                                        <TableCell>
                                                            <StatusChip
                                                                label={getStatusLabel(checklist.stato)}
                                                                icon={getStatusIcon(checklist.stato)}
                                                                status={checklist.stato}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                        <TableCell padding="none" align="right">
                                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', pr: 2 }}>
                                                                <Tooltip title="Visualizza/Compila" arrow>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => setSelectedChecklistToCompile(checklist._id)}
                                                                        sx={{
                                                                            color: theme.palette.primary.main,
                                                                            '&:hover': {
                                                                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                                                transform: 'scale(1.1)'
                                                                            }
                                                                        }}
                                                                    >
                                                                        <VisibilityIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                {checklist.stato === 'completata' && (
                                                                    <Tooltip title="Analizza Gap" arrow>
                                                                        <IconButton
                                                                            size="small"
                                                                            component={RouterLink}
                                                                            to={`/diagnosi/gap-analysis?checklist_id=${checklist._id}`}
                                                                            sx={{
                                                                                color: theme.palette.secondary.main,
                                                                                '&:hover': {
                                                                                    backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                                                                                    transform: 'scale(1.1)'
                                                                                }
                                                                            }}
                                                                        >
                                                                            <FindInPageIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}
                                                                <Tooltip title="Elimina" arrow>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleOpenDeleteDialog(checklist)}
                                                                        sx={{
                                                                            color: theme.palette.error.main,
                                                                            '&:hover': {
                                                                                backgroundColor: alpha(theme.palette.error.main, 0.1),
                                                                                transform: 'scale(1.1)'
                                                                            }
                                                                        }}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        </TableCell>
                                                    </StyledTableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </GlassPaper>
                    </Fade>

                    {/* Dialog eliminazione */}
                    <Dialog
                        open={openDeleteDialog}
                        onClose={handleCloseDeleteDialog}
                        PaperProps={{
                            sx: {
                                borderRadius: 3,
                                backdropFilter: 'blur(10px)',
                                backgroundColor: alpha(theme.palette.background.paper, 0.9)
                            }
                        }}
                    >
                        <DialogTitle sx={{ fontWeight: 700 }}>Conferma Eliminazione</DialogTitle>
                        <DialogContent>
                            <Typography>Sei sicuro di voler eliminare la checklist "{selectedChecklistToDelete?.nome}"?</Typography>
                            <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                                Questa azione non può essere annullata.
                            </Alert>
                        </DialogContent>
                        <DialogActions sx={{ p: 3 }}>
                            <Button onClick={handleCloseDeleteDialog} sx={{ borderRadius: 2 }}>
                                Annulla
                            </Button>
                            <AnimatedButton
                                onClick={() => handleDeleteChecklist(selectedChecklistToDelete?._id)}
                                color="error"
                                variant="contained"
                                disabled={loading}
                                sx={{ borderRadius: 2 }}
                            >
                                {loading ? <CircularProgress size={20} /> : 'Elimina'}
                            </AnimatedButton>
                        </DialogActions>
                    </Dialog>
                </>
            )}
        </Box>
    );
};

export default ChecklistPage;
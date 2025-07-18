import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  Snackbar,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Alert,
  Stack,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import SecurityIcon from '@mui/icons-material/Security';
import NotificationsIcon from '@mui/icons-material/Notifications';
import BusinessIcon from '@mui/icons-material/Business';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import SaveIcon from '@mui/icons-material/Save';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PaymentIcon from '@mui/icons-material/Payment';
import { useThemeContext } from '../context/ThemeContext';
import UserManagement from './UserManagement';
import { usePermissions } from '../context/PermissionsContext';
import {
  People as PeopleIcon,
  Email as EmailIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  ContentCopy as CopyIcon,
  ContactSupport as ContactSupportIcon,
  Edit as EditIcon
} from '@mui/icons-material';

const themeColors = [
  { name: 'Blue', value: 'blue-600' },
  { name: 'Emerald', value: 'emerald-500' },
  { name: 'Purple', value: 'purple-600' },
  { name: 'Rose', value: 'rose-500' },
  { name: 'Amber', value: 'amber-500' },
  { name: 'Teal', value: 'teal-500' },
  { name: 'Cyan', value: 'cyan-500' },
  { name: 'Green', value: 'green-500' },
  { name: 'Orange', value: 'orange-500' },
  { name: 'Red', value: 'red-500' },
  { name: 'Pink', value: 'pink-500' },
  { name: 'Indigo', value: 'indigo-500' },
  { name: 'Lime', value: 'lime-500' },
  { name: 'Violet', value: 'violet-600' },
  { name: 'Slate', value: 'slate-500' },
  { name: 'Sky', value: 'sky-500' },
];

const colorMap = {
  'blue-600': '#2563eb',
  'emerald-500': '#10b981',
  'purple-600': '#7c3aed',
  'rose-500': '#f43f5e',
  'amber-500': '#f59e42',
  'teal-500': '#14b8a6',
  'cyan-500': '#06b6d4',
  'green-500': '#22c55e',
  'orange-500': '#f97316',
  'red-500': '#ef4444',
  'pink-500': '#ec4899',
  'indigo-500': '#6366f1',
  'lime-500': '#84cc16',
  'violet-600': '#a21caf',
  'slate-500': '#64748b',
  'sky-500': '#0ea5e9',
};

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Settings() {
  const { user, profile, organization, reloadOrganization } = useAuth();
  const { isOrgAdmin } = usePermissions();
  const navigate = useNavigate();
  const { mode, setMode, accent, setAccent } = useThemeContext();
  const [activeTab, setActiveTab] = useState(0);

  // Profile Info
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileSnackbar, setProfileSnackbar] = useState(false);
  const [profileChanged, setProfileChanged] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordSnackbar, setPasswordSnackbar] = useState(false);

  // Import Customers Page Theme
  const [importCustomersTheme, setImportCustomersTheme] = useState(localStorage.getItem('importCustomersTheme') || 'system');
  const [importThemeChanged, setImportThemeChanged] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState(
    JSON.parse(localStorage.getItem('notifications')) || {
      email: true,
      inApp: true,
      browser: false,
      sms: false,
      dailySummary: true,
      alerts: true,
      reports: false,
    }
  );
  const [notificationsChanged, setNotificationsChanged] = useState(false);
  const [notifMsg, setNotifMsg] = useState('');
  const [notifSnackbar, setNotifSnackbar] = useState(false);

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState(
    JSON.parse(localStorage.getItem('securitySettings')) || {
      sessionTimeout: 30,
      twoFactorEnabled: false,
      loginHistory: true,
      passwordRequirements: true,
      accountLockout: true,
      failedAttempts: 5,
    }
  );
  const [securityChanged, setSecurityChanged] = useState(false);

  // Business Logic Settings
  const [businessSettings, setBusinessSettings] = useState(
    JSON.parse(localStorage.getItem('businessSettings')) || {
      defaultScanMode: 'SHIP',
      autoAssignment: false,
      billingPreferences: {
        taxIncluded: true,
        currency: 'USD',
        decimalPlaces: 2,
      },
      customerDefaults: {
        autoGroup: false,
        defaultStatus: 'active',
      },
      reportSettings: {
        autoGenerate: false,
        schedule: 'weekly',
        recipients: [],
      },
    }
  );
  const [businessChanged, setBusinessChanged] = useState(false);

  // Data & Export Settings
  const [dataSettings, setDataSettings] = useState(
    JSON.parse(localStorage.getItem('dataSettings')) || {
      exportFormat: 'CSV',
      backupFrequency: 'weekly',
      retentionDays: 365,
      autoBackup: true,
      includeArchived: false,
    }
  );
  const [dataChanged, setDataChanged] = useState(false);



  // Dialogs
  const [exportDialog, setExportDialog] = useState(false);
  const [backupDialog, setBackupDialog] = useState(false);

  // User Invites
  const [invites, setInvites] = useState([]);
  const [inviteDialog, setInviteDialog] = useState(false);
  const [newInvite, setNewInvite] = useState({
    email: '',
    role: 'user'
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [copiedToken, setCopiedToken] = useState('');
  const [securityDialog, setSecurityDialog] = useState(false);

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(organization?.logo_url || '');
  const [logoMsg, setLogoMsg] = useState('');

  // Role Management
  const [roles, setRoles] = useState([]);
  const [roleDialog, setRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState('');
  const [roleSuccess, setRoleSuccess] = useState('');

  // A predefined list of all possible permissions in the system
  const allPermissions = [
    'manage:users', 'manage:billing', 'manage:roles',
    'read:customers', 'write:customers', 'delete:customers',
    'read:cylinders', 'write:cylinders', 'delete:cylinders',
    'read:invoices', 'write:invoices', 'delete:invoices',
    'read:rentals', 'write:rentals',
    'update:cylinder_location'
  ];

  // Add state for role name
  const [roleName, setRoleName] = useState('');

  // Initialize theme from localStorage if available
  useEffect(() => {
    const storedMode = localStorage.getItem('themeMode');
    const storedAccent = localStorage.getItem('themeAccent');
    if (storedMode) setMode(storedMode);
    if (storedAccent) setAccent(storedAccent);
  }, [setMode, setAccent]);

  useEffect(() => {
    setFullName(profile?.full_name || '');
    setEmail(user?.email || '');
    setLogoUrl(organization?.logo_url || '');
  }, [profile, user, organization]);

  useEffect(() => {
    if (profile?.role === 'owner' || profile?.role === 'admin') {
      fetchInvites();
      fetchRoles();
    }
  }, [profile]);

  // Fetch the role name from the roles table
  useEffect(() => {
    async function fetchRoleName() {
      if (profile?.role_id) {
        const { data, error } = await supabase
          .from('roles')
          .select('name')
          .eq('id', profile.role_id)
          .single();
        if (data) setRoleName(data.name);
        else setRoleName('');
      } else {
        setRoleName('');
      }
    }
    fetchRoleName();
  }, [profile?.role_id]);

  // Profile update
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);
    if (!error) {
      setProfileMsg('Profile updated successfully!');
      setProfileSnackbar(true);
      setProfileChanged(false);
    } else {
      setProfileMsg(error.message);
      setProfileSnackbar(true);
    }
  };

  // Password update
  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    if (newPassword !== confirmPassword) {
      setPasswordMsg('Passwords do not match.');
      setPasswordSnackbar(true);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters long.');
      setPasswordSnackbar(true);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) {
      setPasswordMsg('Password updated successfully!');
      setPasswordSnackbar(true);
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMsg(error.message);
      setPasswordSnackbar(true);
    }
  };

  // Theme update
  const handleThemeChange = (t) => {
    setMode(t);
    localStorage.setItem('themeMode', t);
    setProfileChanged(true);
    setNotifMsg('Theme updated successfully!');
    setNotifSnackbar(true);
  };

  const handleColorChange = (c) => {
    setAccent(c);
    localStorage.setItem('themeAccent', c);
    setProfileChanged(true);
    setNotifMsg('Accent color updated successfully!');
    setNotifSnackbar(true);
  };

  // Import customers theme update
  const handleImportThemeChange = (theme) => {
    setImportCustomersTheme(theme);
    setImportThemeChanged(true);
  };

  const handleImportThemeSave = () => {
    localStorage.setItem('importCustomersTheme', importCustomersTheme);
    setImportThemeChanged(false);
    setNotifMsg('Import page theme saved!');
    setNotifSnackbar(true);
  };

  // Notifications update
  const handleNotifChange = (type) => {
    const updated = { ...notifications, [type]: !notifications[type] };
    setNotifications(updated);
    setNotificationsChanged(true);
  };

  const handleNotificationsSave = () => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
    setNotificationsChanged(false);
    setNotifMsg('Notification preferences saved!');
    setNotifSnackbar(true);
  };

  // Security settings update
  const handleSecurityChange = (key, value) => {
    const updated = { ...securitySettings, [key]: value };
    setSecuritySettings(updated);
    setSecurityChanged(true);
  };

  const handleSecuritySave = () => {
    localStorage.setItem('securitySettings', JSON.stringify(securitySettings));
    setSecurityChanged(false);
    setNotifMsg('Security settings saved!');
    setNotifSnackbar(true);
  };

  // Business settings update
  const handleBusinessChange = (key, value) => {
    const updated = { ...businessSettings, [key]: value };
    setBusinessSettings(updated);
    setBusinessChanged(true);
  };

  const handleBusinessSave = () => {
    localStorage.setItem('businessSettings', JSON.stringify(businessSettings));
    setBusinessChanged(false);
    setNotifMsg('Business settings saved!');
    setNotifSnackbar(true);
  };

  // Data settings update
  const handleDataChange = (key, value) => {
    const updated = { ...dataSettings, [key]: value };
    setDataSettings(updated);
    setDataChanged(true);
  };

  const handleDataSave = () => {
    localStorage.setItem('dataSettings', JSON.stringify(dataSettings));
    setDataChanged(false);
    setNotifMsg('Data settings saved!');
    setNotifSnackbar(true);
  };



  // Export data
  const handleExportData = async (format) => {
    // This would integrate with your actual data export logic
    console.log(`Exporting data in ${format} format`);
    setExportDialog(false);
    setNotifMsg(`Data exported successfully in ${format} format!`);
    setNotifSnackbar(true);
  };

  // Create backup
  const handleCreateBackup = async () => {
    // This would integrate with your actual backup logic
    console.log('Creating backup...');
    setBackupDialog(false);
    setNotifMsg('Backup created successfully!');
    setNotifSnackbar(true);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Track profile changes
  useEffect(() => {
    setProfileChanged(fullName !== (profile?.full_name || ''));
  }, [fullName, profile?.full_name]);

  // Admin-only logo upload handler
  // User Invite Functions
  const fetchInvites = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_invites')
        .select(`
          *,
          invited_by:profiles!organization_invites_invited_by_fkey(full_name, email)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error) {
      console.error('Error fetching invites:', error);
      setInviteError('Failed to load invites: ' + error.message);
    }
  };

  const handleCreateInvite = async () => {
    if (!newInvite.email || !newInvite.role) {
      setInviteError('Please fill in all fields');
      return;
    }

    setInviteLoading(true);
    setInviteError('');

    try {
      // Check if email already exists in the organization
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .eq('email', newInvite.email)
        .single();

      if (existingUser) {
        throw new Error('This email is already registered in your organization');
      }

      // Check if email is already registered with any other organization
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('email, organization_id, organizations(name)')
        .eq('email', newInvite.email)
        .single();

      if (existingProfile && existingProfile.organization_id && existingProfile.organization_id !== profile.organization_id) {
        throw new Error(`This email (${newInvite.email}) is already registered with organization "${existingProfile.organizations?.name}". Each email can only be associated with one organization. Please use a different email address.`);
      }

      // Check if there's already a pending invite for this email
      const { data: existingInvite } = await supabase
        .from('organization_invites')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .eq('email', newInvite.email)
        .is('accepted_at', null)
        .single();

      if (existingInvite) {
        throw new Error('An invite has already been sent to this email');
      }

      // Create the invite using the database function
      const { data, error } = await supabase.rpc('create_organization_invite', {
        p_organization_id: profile.organization_id,
        p_email: newInvite.email,
        p_role: newInvite.role,
        p_expires_in_days: 7
      });

      if (error) throw error;

      // Fetch the invite row to get the token
      const { data: inviteRow } = await supabase
        .from('organization_invites')
        .select('token')
        .eq('organization_id', profile.organization_id)
        .eq('email', newInvite.email)
        .is('accepted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (inviteRow && inviteRow.token) {
        const inviteLink = `${window.location.origin}/accept-invite?token=${inviteRow.token}`;
        await fetch('/.netlify/functions/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: newInvite.email,
            subject: `You're invited to join ${organization.name}`,
            template: 'invite',
            data: {
              inviteLink,
              organizationName: organization.name,
              inviter: profile.full_name || profile.email,
            }
          })
        });
      }

      setInviteSuccess(`Invite sent to ${newInvite.email}`);
      setNewInvite({ email: '', role: 'user' });
      setInviteDialog(false);
      fetchInvites();
    } catch (error) {
      console.error('Error creating invite:', error);
      setInviteError(error.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeleteInvite = async (inviteId) => {
    try {
      const { error } = await supabase
        .from('organization_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;

      setInviteSuccess('Invite deleted successfully');
      fetchInvites();
    } catch (error) {
      console.error('Error deleting invite:', error);
      setInviteError('Failed to delete invite: ' + error.message);
    }
  };

  const copyInviteLink = (token) => {
    const inviteLink = `${window.location.origin}/accept-invite?token=${token}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedToken(token);
    setInviteSuccess('Invite link copied to clipboard!');
    setTimeout(() => setCopiedToken(''), 2000);
  };

  const getInviteStatus = (invite) => {
    if (invite.accepted_at) {
      return { status: 'accepted', color: 'success', icon: <CheckCircleIcon />, label: 'Accepted' };
    } else if (new Date(invite.expires_at) < new Date()) {
      return { status: 'expired', color: 'error', icon: <WarningIcon />, label: 'Expired' };
    } else {
      return { status: 'pending', color: 'warning', icon: <ScheduleIcon />, label: 'Pending' };
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner': return 'error';
      case 'admin': return 'warning';
      case 'manager': return 'info';
      default: return 'default';
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    console.log('Logo upload started:', file.name, file.size);
    setLogoUploading(true);
    setLogoMsg('');
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `org-${organization.id}-${Date.now()}.${fileExt}`;
      console.log('Uploading to path:', filePath);
      
      // Upload to Supabase Storage
      let { error: uploadError } = await supabase.storage
        .from('organization-logos')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      console.log('File uploaded successfully');
      
      // Get public URL
      const { data } = supabase.storage.from('organization-logos').getPublicUrl(filePath);
      if (!data?.publicUrl) throw new Error('Failed to get public URL');
      console.log('Public URL obtained:', data.publicUrl);
      
      // Add cache-busting parameter to the URL
      const logoUrlWithCacheBust = `${data.publicUrl}?t=${Date.now()}`;
      console.log('Logo URL with cache busting:', logoUrlWithCacheBust);
      
      // Save to org
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: logoUrlWithCacheBust })
        .eq('id', organization.id);
      if (updateError) throw updateError;
      console.log('Organization updated in database');
      
      setLogoUrl(logoUrlWithCacheBust);
      setLogoMsg('Logo updated!');
      
      // Refresh organization context/state so new logo appears immediately
      console.log('Calling reloadOrganization...');
      if (typeof reloadOrganization === 'function') {
        await reloadOrganization();
        console.log('reloadOrganization completed');
      } else {
        console.log('reloadOrganization function not available');
      }
      
      // Don't force page refresh - let the reloadOrganization handle it
      console.log('Logo upload process completed');
      
    } catch (err) {
      console.error('Logo upload error:', err);
      setLogoMsg('Error uploading logo: ' + err.message);
    } finally {
      setLogoUploading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoleError('Failed to load roles: ' + error.message);
    }
  };

  const handleCreateRole = async () => {
    if (!editingRole.name || !editingRole.description) {
      setRoleError('Please fill in all required fields');
      return;
    }

    setRoleLoading(true);
    setRoleError('');

    try {
      const { error } = await supabase
        .from('roles')
        .insert({
          name: editingRole.name,
          description: editingRole.description,
          permissions: editingRole.permissions || []
        });

      if (error) throw error;

      setRoleSuccess(`Role "${editingRole.name}" created successfully`);
      setEditingRole({ name: '', description: '', permissions: [] });
      setRoleDialog(false);
      fetchRoles();
    } catch (error) {
      console.error('Error creating role:', error);
      setRoleError(error.message);
    } finally {
      setRoleLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole.name || !editingRole.description) {
      setRoleError('Please fill in all required fields');
      return;
    }

    setRoleLoading(true);
    setRoleError('');

    try {
      const { error } = await supabase
        .from('roles')
        .update({
          name: editingRole.name,
          description: editingRole.description,
          permissions: editingRole.permissions || []
        })
        .eq('id', editingRole.id);

      if (error) throw error;

      setRoleSuccess(`Role "${editingRole.name}" updated successfully`);
      setEditingRole({ name: '', description: '', permissions: [] });
      setRoleDialog(false);
      fetchRoles();
    } catch (error) {
      console.error('Error updating role:', error);
      setRoleError(error.message);
    } finally {
      setRoleLoading(false);
    }
  };

  const handleDeleteRole = async (roleId, roleName) => {
    if (!window.confirm(`Are you sure you want to delete the role "${roleName}"? This could affect users currently assigned to it.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      setRoleSuccess(`Role "${roleName}" deleted successfully`);
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      setRoleError('Failed to delete role: ' + error.message);
    }
  };

  const handlePermissionToggle = (permission) => {
    setEditingRole(prev => {
      const permissions = prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission];
      return { ...prev, permissions };
    });
  };

  const openRoleDialog = (role = null) => {
    if (role) {
      setEditingRole(role);
    } else {
      setEditingRole({ name: '', description: '', permissions: [] });
    }
    setRoleDialog(true);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 4 }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto', px: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" fontWeight={700} color="primary" sx={{ mb: 1 }}>
            Settings
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage your account, organization, and preferences
          </Typography>
        </Box>

        <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            sx={{ 
              borderBottom: '1px solid #e2e8f0',
              px: 3,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 64
              }
            }} 
            variant="scrollable" 
            scrollButtons="auto"
          >
            <Tab label="Profile" icon={<AccountCircleIcon />} iconPosition="start" />
            <Tab label="Security" icon={<SecurityIcon />} iconPosition="start" />
            <Tab label="Appearance" icon={<BusinessIcon />} iconPosition="start" />
            <Tab label="Notifications" icon={<NotificationsIcon />} iconPosition="start" />
            <Tab label="Billing" icon={<PaymentIcon />} iconPosition="start" />
            {(roleName === 'admin') && <Tab label="Team" icon={<PeopleIcon />} iconPosition="start" />}
            {(roleName === 'owner' || roleName === 'admin') && <Tab label="Invites" icon={<EmailIcon />} iconPosition="start" />}
          </Tabs>
          
          <Box sx={{ p: 4 }}>
            {/* Profile Tab */}
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ maxWidth: 600 }}>
                <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
                  Profile Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={profileData.full_name}
                      onChange={(e) => {
                        setProfileData({ ...profileData, full_name: e.target.value });
                        setProfileChanged(true);
                      }}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={profileData.email}
                      disabled
                      variant="outlined"
                      helperText="Contact support to change your email"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bio"
                      multiline
                      rows={3}
                      value={profileData.bio || ''}
                      onChange={(e) => {
                        setProfileData({ ...profileData, bio: e.target.value });
                        setProfileChanged(true);
                      }}
                      variant="outlined"
                      placeholder="Tell us about yourself..."
                    />
                  </Grid>
                </Grid>
                {profileChanged && (
                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      onClick={handleProfileSave}
                      disabled={profileLoading}
                      startIcon={profileLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                      Save Changes
                    </Button>
                  </Box>
                )}
              </Box>
            </TabPanel>

            {/* Billing Tab */}
            <TabPanel value={activeTab} index={4}>
              <Box sx={{ maxWidth: 600 }}>
                <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
                  Billing & Subscription
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Manage your subscription plan and billing information.
                </Typography>
                
                {organization && (
                  <Card sx={{ p: 3, mb: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Current Plan</Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {organization.subscription_plan || 'Free Trial'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Organization</Typography>
                        <Typography variant="body1">{organization.name}</Typography>
                      </Grid>
                      {organization.trial_end_date && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Trial ends: {new Date(organization.trial_end_date).toLocaleDateString()}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Card>
                )}
                
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate('/billing')}
                  size="large"
                  startIcon={<PaymentIcon />}
                  sx={{ py: 1.5 }}
                >
                  Manage Billing & Plans
                </Button>
              </Box>
            </TabPanel>

            {/* Security Tab */}
            <TabPanel value={activeTab} index={1}>
              <Stack spacing={3}>
                {/* Password Change */}
                <Box component="form" onSubmit={handlePasswordSave}>
                  <Typography variant="subtitle1" gutterBottom>Change Password</Typography>
                  <Stack spacing={2}>
                    <TextField
                      type="password"
                      label="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      type="password"
                      label="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      fullWidth
                    />
                    <Button type="submit" variant="contained" color="primary">
                      Update Password
                    </Button>
                  </Stack>
                </Box>
                
                <Divider />
                
                {/* Security Preferences */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>Security Preferences</Typography>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={<Switch checked={securitySettings.loginHistory} onChange={(e) => handleSecurityChange('loginHistory', e.target.checked)} />}
                      label="Track Login History"
                    />
                    <FormControlLabel
                      control={<Switch checked={securitySettings.twoFactorEnabled} onChange={(e) => handleSecurityChange('twoFactorEnabled', e.target.checked)} />}
                      label="Two-Factor Authentication"
                    />
                    <Box>
                      <Typography gutterBottom>Session Timeout (minutes)</Typography>
                      <Slider
                        value={securitySettings.sessionTimeout}
                        onChange={(e, value) => handleSecurityChange('sessionTimeout', value)}
                        min={15}
                        max={120}
                        step={15}
                        marks
                        valueLabelDisplay="auto"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Current: {securitySettings.sessionTimeout} minutes
                      </Typography>
                    </Box>
                    <Button 
                      variant="outlined" 
                      color="primary"
                      onClick={handleSecuritySave}
                      disabled={!securityChanged}
                      startIcon={<SaveIcon />}
                    >
                      Save Security Settings
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </TabPanel>

            {/* Appearance Tab */}
            <TabPanel value={activeTab} index={2}>
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>Theme</InputLabel>
                  <Select
                    value={mode}
                    label="Theme"
                    onChange={(e) => handleThemeChange(e.target.value)}
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="system">System</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel>Import Customers Page Theme</InputLabel>
                  <Select
                    value={importCustomersTheme}
                    label="Import Customers Page Theme"
                    onChange={(e) => setImportCustomersTheme(e.target.value)}
                  >
                    <MenuItem value="system">System/Global</MenuItem>
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                  </Select>
                </FormControl>
                
                <Box>
                  <Typography variant="subtitle1" mb={1}>Accent Color</Typography>
                  <Stack direction="row" spacing={2}>
                    {themeColors.map(tc => (
                      <IconButton
                        key={tc.value}
                        onClick={() => handleColorChange(tc.value)}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          border: accent === tc.value ? `3px solid #fff` : '2px solid #ccc',
                          background: colorMap[tc.value],
                          boxShadow: accent === tc.value ? '0 0 0 4px rgba(0,0,0,0.1)' : 'none',
                        }}
                      >
                        {accent === tc.value && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                        )}
                      </IconButton>
                    ))}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">Your accent color is used for highlights, buttons, and tabs.</Typography>
                </Box>
                
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={handleImportThemeSave}
                  startIcon={<SaveIcon />}
                >
                  Save Appearance Settings
                </Button>

                {isOrgAdmin && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Organization Logo</Typography>
                    {logoUrl && (
                      <Box sx={{ mb: 1 }}>
                        <img src={logoUrl} alt="Organization Logo" style={{ maxHeight: 64, maxWidth: 128, borderRadius: 8, border: '1px solid #eee' }} />
                      </Box>
                    )}
                    <Button
                      variant="contained"
                      component="label"
                      disabled={logoUploading}
                      sx={{ mb: 1 }}
                    >
                      {logoUploading ? 'Uploading...' : 'Upload Logo'}
                      <input type="file" accept="image/*" hidden onChange={handleLogoUpload} />
                    </Button>
                    {logoMsg && <Alert severity={logoMsg.startsWith('Error') ? 'error' : 'success'} sx={{ mt: 1 }}>{logoMsg}</Alert>}
                    <Typography variant="body2" color="text.secondary">Recommended: PNG, JPG, or SVG. Max 1MB.</Typography>
                  </Box>
                )}
              </Stack>
            </TabPanel>

            {/* Notifications Tab */}
            <TabPanel value={activeTab} index={3}>
              <Stack spacing={3}>
                <FormControlLabel
                  control={<Switch checked={notifications.email} onChange={() => handleNotifChange('email')} color="primary" />}
                  label="Email Notifications"
                />
                <FormControlLabel
                  control={<Switch checked={notifications.inApp} onChange={() => handleNotifChange('inApp')} color="primary" />}
                  label="In-App Notifications"
                />
                <FormControlLabel
                  control={<Switch checked={notifications.sms} onChange={() => handleNotifChange('sms')} color="primary" />}
                  label="SMS Notifications"
                />
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={handleNotificationsSave}
                  startIcon={<SaveIcon />}
                >
                  Save Notification Settings
                </Button>
              </Stack>
            </TabPanel>

            {/* User Management Tab (Admins Only) */}
            {(roleName === 'admin') && (
              <TabPanel value={activeTab} index={5}>
                <UserManagement />
              </TabPanel>
            )}

            {/* User Invites Tab (Owners and Admins) */}
            {(roleName === 'owner' || roleName === 'admin') && (
              <TabPanel value={activeTab} index={roleName === 'admin' ? 6 : 5}>
                <Stack spacing={3}>
                  {inviteError && (
                    <Alert severity="error" onClose={() => setInviteError('')}>
                      {inviteError}
                    </Alert>
                  )}

                  {inviteSuccess && (
                    <Alert severity="success" onClose={() => setInviteSuccess('')}>
                      {inviteSuccess}
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                      Pending Invites ({invites.filter(i => !i.accepted_at && new Date(i.expires_at) > new Date()).length})
                    </Typography>
                    <Box>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchInvites}
                        sx={{ mr: 2 }}
                      >
                        Refresh
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setInviteDialog(true)}
                      >
                        Invite User
                      </Button>
                    </Box>
                  </Box>

                  {invites.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No invites found. Create your first invite to get started.
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      {invites.map((invite) => {
                        const status = getInviteStatus(invite);
                        return (
                          <Paper key={invite.id} sx={{ p: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                  <Typography variant="subtitle1">
                                    {invite.email}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                  <Chip
                                    label={invite.role}
                                    color={getRoleColor(invite.role)}
                                    size="small"
                                  />
                                  <Chip
                                    icon={status.icon}
                                    label={status.label}
                                    color={status.color}
                                    size="small"
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    Expires: {new Date(invite.expires_at).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                {status.status === 'pending' && (
                                  <>
                                    <Tooltip title="Copy Invite Link">
                                      <IconButton
                                        size="small"
                                        onClick={() => copyInviteLink(invite.token)}
                                        color={copiedToken === invite.token ? 'success' : 'primary'}
                                      >
                                        <CopyIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete Invite">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteInvite(invite.id)}
                                        sx={{ color: 'error.main' }}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                                {status.status === 'expired' && (
                                  <Tooltip title="Delete Expired Invite">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteInvite(invite.id)}
                                      sx={{ color: 'error.main' }}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </Box>
                          </Paper>
                        );
                      })}
                    </Box>
                  )}
                </Stack>
              </TabPanel>
            )}

            {/* Role Management Tab (Owners and Admins) */}
            {(roleName === 'owner' || roleName === 'admin') && (
              <TabPanel value={activeTab} index={roleName === 'admin' ? 7 : 6}>
                <Stack spacing={3}>
                  {roleError && (
                    <Alert severity="error" onClose={() => setRoleError('')}>
                      {roleError}
                    </Alert>
                  )}
                  
                  {roleSuccess && (
                    <Alert severity="success" onClose={() => setRoleSuccess('')}>
                      {roleSuccess}
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                      Custom Roles
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => openRoleDialog()}
                    >
                      Create New Role
                    </Button>
                  </Box>

                  {roles.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No custom roles found. Create your first role to get started.
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      {roles.map((role) => (
                        <Paper key={role.id} sx={{ p: 2, mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <AdminPanelSettingsIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="subtitle1">
                                  {role.name}
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {role.description}
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {role.permissions?.map((permission) => (
                                  <Chip
                                    key={permission}
                                    label={permission}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => openRoleDialog(role)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteRole(role.id, role.name)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Stack>
              </TabPanel>
            )}



            {/* Create Invite Dialog */}
            <Dialog
              open={inviteDialog}
              onClose={() => setInviteDialog(false)}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>
                <Typography variant="h6">
                  Invite New User
                </Typography>
              </DialogTitle>
              <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={newInvite.email}
                      onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                      required
                      helperText="The user will receive an invite link at this email address"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Role</InputLabel>
                      <Select
                        value={newInvite.role}
                        onChange={(e) => setNewInvite({ ...newInvite, role: e.target.value })}
                        label="Role"
                      >
                        {roles.map((role) => (
                          <MenuItem key={role.id} value={role.id}>
                            {role.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Alert severity="info">
                      <Typography variant="body2">
                        The invite will expire in 7 days. The user will receive a secure link to join your organization.
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setInviteDialog(false)}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleCreateInvite}
                  disabled={inviteLoading || !newInvite.email || !newInvite.role}
                  startIcon={inviteLoading ? <CircularProgress size={20} /> : <AddIcon />}
                >
                  Send Invite
                </Button>
              </DialogActions>
            </Dialog>

            {/* Role Management Dialog */}
            <Dialog
              open={roleDialog}
              onClose={() => setRoleDialog(false)}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle>
                <Typography variant="h6">
                  {editingRole?.id ? 'Edit Role' : 'Create New Role'}
                </Typography>
              </DialogTitle>
              <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Role Name"
                      value={editingRole?.name || ''}
                      onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                      required
                      helperText="Enter a descriptive name for this role"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={editingRole?.description || ''}
                      onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                      required
                      multiline
                      rows={3}
                      helperText="Describe what this role is for"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                      Permissions
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {allPermissions.map(permission => (
                        <Chip
                          key={permission}
                          label={permission}
                          clickable
                          color={editingRole?.permissions?.includes(permission) ? 'primary' : 'default'}
                          onClick={() => handlePermissionToggle(permission)}
                          onDelete={editingRole?.permissions?.includes(permission) ? () => handlePermissionToggle(permission) : undefined}
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setRoleDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={editingRole?.id ? handleUpdateRole : handleCreateRole}
                  variant="contained"
                  disabled={roleLoading}
                >
                  {roleLoading ? 'Saving...' : (editingRole?.id ? 'Update Role' : 'Create Role')}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Snackbars */}
            <Snackbar open={profileSnackbar} autoHideDuration={3000} onClose={() => setProfileSnackbar(false)}>
              <Alert onClose={() => setProfileSnackbar(false)} severity={profileMsg === 'Profile updated!' ? 'success' : 'error'} sx={{ width: '100%' }}>
                {profileMsg}
              </Alert>
            </Snackbar>
            
            <Snackbar open={passwordSnackbar} autoHideDuration={3000} onClose={() => setPasswordSnackbar(false)}>
              <Alert onClose={() => setPasswordSnackbar(false)} severity={passwordMsg === 'Password updated!' ? 'success' : 'error'} sx={{ width: '100%' }}>
                {passwordMsg}
              </Alert>
            </Snackbar>
            
            <Snackbar open={notifSnackbar} autoHideDuration={3000} onClose={() => setNotifSnackbar(false)}>
              <Alert onClose={() => setNotifSnackbar(false)} severity="success" sx={{ width: '100%' }}>
                {notifMsg}
              </Alert>
            </Snackbar>
          </Box>
        </Card>
      </Box>
    </Box>
  );
} 
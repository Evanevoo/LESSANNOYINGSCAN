import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, CardActions,
  Button, Chip, IconButton, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress, Avatar, Tooltip, Badge,
  FormControl, InputLabel, Select, MenuItem, Container
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../hooks/useAuth';

export default function OwnerCustomers() {
  const { profile } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgDetailDialog, setOrgDetailDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [subscriptionDialog, setSubscriptionDialog] = useState(false);
  const [selectedOrgForSubscription, setSelectedOrgForSubscription] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'active',
    contactEmail: ''
  });
  const [subscriptionForm, setSubscriptionForm] = useState({
    plan_id: '',
    status: 'active',
    trial_ends_at: null,
    subscription_end_date: null
  });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    trial: 0,
    expired: 0
  });

  useEffect(() => {
    if (profile?.role === 'owner') {
      fetchOrganizations();
      fetchAvailablePlans();
    }
  }, [profile]);

  const fetchAvailablePlans = async () => {
    try {
      const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setAvailablePlans(plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      console.log('Fetching organizations...');
      console.log('Current profile:', profile);
      
      // Fetch all organizations first
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Then fetch counts and contact info for each organization
      const orgsWithCounts = await Promise.all(
        (orgs || []).map(async (org) => {
          // Get user count and primary contact email
          const { data: profiles, count: userCount } = await supabase
            .from('profiles')
            .select('email, role')
            .eq('organization_id', org.id);

          // Get customer count
          const { count: customerCount } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id);

          // Get bottle count
          const { count: bottleCount } = await supabase
            .from('bottles')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id);

          // Get the primary contact email (first user or owner)
          const primaryContact = profiles?.find(p => p.role === 'owner') || profiles?.[0];
          const contactEmail = primaryContact?.email || 'No contact found';

          return {
            ...org,
            userCount: userCount || 0,
            customerCount: customerCount || 0,
            bottleCount: bottleCount || 0,
            contactEmail: contactEmail
          };
        })
      );

      console.log('Organizations with counts:', orgsWithCounts);
      
      // Also try a simple count query to see if we can access the table
      const { count, error: countError } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });
      
      console.log('Organizations count:', { count, countError });

      setOrganizations(orgsWithCounts || []);
      
      // Calculate stats
      const total = orgs?.length || 0;
      const active = orgs?.filter(org => org.status === 'active').length || 0;
      const trial = orgs?.filter(org => org.status === 'trial').length || 0;
      const expired = orgs?.filter(org => org.status === 'expired').length || 0;
      
      console.log('Calculated stats:', { total, active, trial, expired });
      
      setStats({ total, active, trial, expired });
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.organization_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'trial': return 'warning';
      case 'expired': return 'error';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircleIcon />;
      case 'trial': return <WarningIcon />;
      case 'expired': return <WarningIcon />;
      case 'suspended': return <WarningIcon />;
      default: return <WarningIcon />;
    }
  };

  const handleViewDetails = (org) => {
    setSelectedOrg(org);
    setOrgDetailDialog(true);
  };

  const handleEditOrganization = (org) => {
    setEditingOrg(org);
    setEditForm({
      name: org.name || '',
      email: org.email || '',
      phone: org.phone || '',
      address: org.address || '',
      status: org.status || 'active',
      contactEmail: org.contactEmail || ''
    });
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingOrg) return;
    
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          address: editForm.address,
          status: editForm.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingOrg.id);

      if (error) throw error;

      // Update the local state
      setOrganizations(prev => prev.map(org => 
        org.id === editingOrg.id 
          ? { ...org, ...editForm, updated_at: new Date().toISOString() }
          : org
      ));

      setEditDialog(false);
      setEditingOrg(null);
      setEditForm({ name: '', email: '', phone: '', address: '', status: 'active', contactEmail: '' });
      
      // Refresh the data
      fetchOrganizations();
    } catch (error) {
      console.error('Error updating organization:', error);
      alert('Failed to update organization: ' + error.message);
    }
  };

  const handleManageSubscription = (org) => {
    setSelectedOrgForSubscription(org);
    setSubscriptionForm({
      plan_id: org.subscription_plan_id || '',
      status: org.subscription_status || 'active',
      trial_ends_at: org.trial_ends_at || null,
              subscription_end_date: org.subscription_end_date || null
    });
    setSubscriptionDialog(true);
  };

  const handleSaveSubscription = async () => {
    if (!selectedOrgForSubscription) return;
    
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          subscription_plan_id: subscriptionForm.plan_id,
          subscription_status: subscriptionForm.status,
          trial_ends_at: subscriptionForm.trial_ends_at,
          subscription_end_date: subscriptionForm.subscription_end_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrgForSubscription.id);

      if (error) throw error;

      // Update the local state
      setOrganizations(prev => prev.map(org => 
        org.id === selectedOrgForSubscription.id 
          ? { 
              ...org, 
              subscription_plan_id: subscriptionForm.plan_id,
              subscription_status: subscriptionForm.status,
              trial_ends_at: subscriptionForm.trial_ends_at,
              subscription_end_date: subscriptionForm.subscription_end_date,
              updated_at: new Date().toISOString() 
            }
          : org
      ));

      setSubscriptionDialog(false);
      setSelectedOrgForSubscription(null);
      setSubscriptionForm({ plan_id: '', status: 'active', trial_ends_at: null, subscription_end_date: null });
      
      // Refresh the data
      fetchOrganizations();
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription: ' + error.message);
    }
  };

  const handleDeleteOrganization = (org) => {
    setOrgToDelete(org);
    setDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!orgToDelete) return;
    
    try {
      // First, delete all related data
      const orgId = orgToDelete.id;
      
      // Delete profiles (users)
      const { error: profilesError } = await supabase
        .from('profiles')
        .delete()
        .eq('organization_id', orgId);
      
      if (profilesError) {
        console.error('Error deleting profiles:', profilesError);
      }

      // Delete customers
      const { error: customersError } = await supabase
        .from('customers')
        .delete()
        .eq('organization_id', orgId);
      
      if (customersError) {
        console.error('Error deleting customers:', customersError);
      }

      // Delete bottles
      const { error: bottlesError } = await supabase
        .from('bottles')
        .delete()
        .eq('organization_id', orgId);
      
      if (bottlesError) {
        console.error('Error deleting bottles:', bottlesError);
      }

      // Delete rentals
      const { error: rentalsError } = await supabase
        .from('rentals')
        .delete()
        .eq('organization_id', orgId);
      
      if (rentalsError) {
        console.error('Error deleting rentals:', rentalsError);
      }

      // Finally, delete the organization
      const { error: orgError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId);

      if (orgError) throw orgError;

      // Update local state
      setOrganizations(prev => prev.filter(org => org.id !== orgId));
      
      // Update stats
      const newTotal = organizations.length - 1;
      const newActive = organizations.filter(org => org.id !== orgId && org.status === 'active').length;
      const newTrial = organizations.filter(org => org.id !== orgId && org.status === 'trial').length;
      const newExpired = organizations.filter(org => org.id !== orgId && org.status === 'expired').length;
      
      setStats({ total: newTotal, active: newActive, trial: newTrial, expired: newExpired });

      setDeleteDialog(false);
      setOrgToDelete(null);
      
      alert(`Organization "${orgToDelete.name}" and all its data have been permanently deleted.`);
      
      // Refresh the data
      fetchOrganizations();
    } catch (error) {
      console.error('Error deleting organization:', error);
      alert('Failed to delete organization: ' + error.message);
    }
  };

  const StatCard = ({ title, value, color, icon }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, mr: 2 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={800} color="primary">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (profile?.role !== 'owner') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. This page is only available to platform owners.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={800} color="primary">
          Customer Organizations
        </Typography>
        <IconButton onClick={fetchOrganizations} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Organizations"
            value={stats.total}
            color="primary"
            icon={<BusinessIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Subscriptions"
            value={stats.active}
            color="success"
            icon={<CheckCircleIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Trial Accounts"
            value={stats.trial}
            color="warning"
            icon={<WarningIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Expired Accounts"
            value={stats.expired}
            color="error"
            icon={<WarningIcon />}
          />
        </Grid>
      </Grid>

      {/* Search */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search organizations by name, email, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
      </Paper>

      {/* Organizations Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : organizations.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Organizations Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            There are no organizations registered in the system yet.
          </Typography>
          <Button variant="contained" onClick={fetchOrganizations}>
            Refresh
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Organization</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Users</TableCell>
                <TableCell>Customers</TableCell>
                <TableCell>Assets</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrganizations.map((org) => {
                console.log('Rendering organization:', org);
                return (
                <TableRow key={org.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        <BusinessIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {org.name || 'Unnamed Organization'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {org.organization_id || org.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                        <EmailIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        {org.contactEmail || 'No contact email'}
                      </Typography>
                      {org.phone ? (
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                          <PhoneIcon sx={{ fontSize: 16, mr: 0.5 }} />
                          {org.phone}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No phone
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(org.status)}
                      label={org.status || 'unknown'}
                      color={getStatusColor(org.status)}
                      size="small"
                    />
                  </TableCell>
                                     <TableCell>
                     <Badge badgeContent={org.userCount || 0} color="primary">
                       <PeopleIcon />
                     </Badge>
                   </TableCell>
                   <TableCell>
                     <Typography variant="body2">
                       {org.customerCount || 0}
                     </Typography>
                   </TableCell>
                   <TableCell>
                     <Typography variant="body2">
                       {org.bottleCount || 0}
                     </Typography>
                   </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(org.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                                    <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(org)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Organization">
                        <IconButton 
                          size="small"
                          onClick={() => handleEditOrganization(org)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Manage Subscription">
                        <IconButton 
                          size="small"
                          onClick={() => handleManageSubscription(org)}
                        >
                          <PaymentIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Organization">
                        <IconButton 
                          size="small"
                          onClick={() => handleDeleteOrganization(org)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Organization Detail Dialog */}
      <Dialog 
        open={orgDetailDialog} 
        onClose={() => setOrgDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedOrg && (
          <>
            <DialogTitle>
              <Typography variant="h6" fontWeight={700}>
                {selectedOrg.name || 'Unnamed Organization'}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Organization Details
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Organization ID
                    </Typography>
                    <Typography variant="body1">
                      {selectedOrg.organization_id}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      icon={getStatusIcon(selectedOrg.status)}
                      label={selectedOrg.status}
                      color={getStatusColor(selectedOrg.status)}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedOrg.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Contact Information
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {selectedOrg.email}
                    </Typography>
                  </Box>
                  {selectedOrg.phone && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1">
                        {selectedOrg.phone}
                      </Typography>
                    </Box>
                  )}
                  {selectedOrg.address && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body1">
                        {selectedOrg.address}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Statistics
                  </Typography>
                  <Grid container spacing={2}>
                                         <Grid item xs={4}>
                       <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                         <Typography variant="h6" color="primary">
                           {selectedOrg.userCount || 0}
                         </Typography>
                         <Typography variant="caption">Users</Typography>
                       </Paper>
                     </Grid>
                     <Grid item xs={4}>
                       <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                         <Typography variant="h6" color="primary">
                           {selectedOrg.customerCount || 0}
                         </Typography>
                         <Typography variant="caption">Customers</Typography>
                       </Paper>
                     </Grid>
                     <Grid item xs={4}>
                       <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                         <Typography variant="h6" color="primary">
                           {selectedOrg.bottleCount || 0}
                         </Typography>
                         <Typography variant="caption">Assets</Typography>
                       </Paper>
                     </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOrgDetailDialog(false)}>Close</Button>
              <Button variant="contained">Edit Organization</Button>
                         </DialogActions>
           </>
         )}
       </Dialog>

       {/* Edit Organization Dialog */}
       <Dialog 
         open={editDialog} 
         onClose={() => setEditDialog(false)}
         maxWidth="sm"
         fullWidth
       >
         <DialogTitle>
           <Typography variant="h6" fontWeight={700}>
             Edit Organization
           </Typography>
         </DialogTitle>
         <DialogContent>
           <Grid container spacing={2} sx={{ mt: 1 }}>
             <Grid item xs={12}>
               <TextField
                 fullWidth
                 label="Organization Name"
                 value={editForm.name}
                 onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                 required
               />
             </Grid>
             <Grid item xs={12}>
               <TextField
                 fullWidth
                 label="Email"
                 type="email"
                 value={editForm.email}
                 onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                 required
               />
             </Grid>
             <Grid item xs={12}>
               <TextField
                 fullWidth
                 label="Phone"
                 value={editForm.phone}
                 onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
               />
             </Grid>
             <Grid item xs={12}>
               <TextField
                 fullWidth
                 label="Address"
                 multiline
                 rows={2}
                 value={editForm.address}
                 onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
               />
             </Grid>
             <Grid item xs={12}>
               <FormControl fullWidth>
                 <InputLabel>Status</InputLabel>
                 <Select
                   value={editForm.status}
                   onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                   label="Status"
                 >
                   <MenuItem value="active">Active</MenuItem>
                   <MenuItem value="trial">Trial</MenuItem>
                   <MenuItem value="expired">Expired</MenuItem>
                   <MenuItem value="suspended">Suspended</MenuItem>
                 </Select>
               </FormControl>
             </Grid>
           </Grid>
         </DialogContent>
         <DialogActions>
           <Button onClick={() => setEditDialog(false)}>Cancel</Button>
           <Button 
             variant="contained" 
             onClick={handleSaveEdit}
             disabled={!editForm.name || !editForm.email}
           >
             Save Changes
           </Button>
         </DialogActions>
       </Dialog>

       {/* Subscription Management Dialog */}
       <Dialog 
         open={subscriptionDialog} 
         onClose={() => setSubscriptionDialog(false)}
         maxWidth="md"
         fullWidth
       >
         <DialogTitle>
           <Typography variant="h6" fontWeight={700}>
             Manage Subscription - {selectedOrgForSubscription?.name}
           </Typography>
         </DialogTitle>
         <DialogContent>
           <Grid container spacing={2} sx={{ mt: 1 }}>
             <Grid item xs={12} sm={6}>
               <FormControl fullWidth>
                 <InputLabel>Subscription Plan</InputLabel>
                 <Select
                   value={subscriptionForm.plan_id}
                   onChange={(e) => setSubscriptionForm({ ...subscriptionForm, plan_id: e.target.value })}
                   label="Subscription Plan"
                 >
                   <MenuItem value="">No Plan</MenuItem>
                   {availablePlans.map((plan) => (
                     <MenuItem key={plan.id} value={plan.id}>
                       {plan.name} - ${plan.price}/{plan.price_interval}
                     </MenuItem>
                   ))}
                 </Select>
               </FormControl>
             </Grid>
             <Grid item xs={12} sm={6}>
               <FormControl fullWidth>
                 <InputLabel>Status</InputLabel>
                 <Select
                   value={subscriptionForm.status}
                   onChange={(e) => setSubscriptionForm({ ...subscriptionForm, status: e.target.value })}
                   label="Status"
                 >
                   <MenuItem value="active">Active</MenuItem>
                   <MenuItem value="trial">Trial</MenuItem>
                   <MenuItem value="expired">Expired</MenuItem>
                   <MenuItem value="suspended">Suspended</MenuItem>
                   <MenuItem value="cancelled">Cancelled</MenuItem>
                 </Select>
               </FormControl>
             </Grid>
             <Grid item xs={12} sm={6}>
               <TextField
                 fullWidth
                 label="Trial Ends At"
                 type="datetime-local"
                 value={subscriptionForm.trial_ends_at ? subscriptionForm.trial_ends_at.slice(0, 16) : ''}
                 onChange={(e) => setSubscriptionForm({ ...subscriptionForm, trial_ends_at: e.target.value })}
                 InputLabelProps={{ shrink: true }}
               />
             </Grid>
             <Grid item xs={12} sm={6}>
               <TextField
                 fullWidth
                 label="Subscription Ends At"
                 type="datetime-local"
                                 value={subscriptionForm.subscription_end_date ? subscriptionForm.subscription_end_date.slice(0, 16) : ''}
                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, subscription_end_date: e.target.value })}
                 InputLabelProps={{ shrink: true }}
               />
             </Grid>
             <Grid item xs={12}>
               <Alert severity="info">
                 <Typography variant="body2">
                   <strong>Quick Actions:</strong>
                 </Typography>
                 <Box sx={{ mt: 1 }}>
                   <Button 
                     size="small" 
                     variant="outlined" 
                     sx={{ mr: 1 }}
                     onClick={() => {
                       const trialEnd = new Date();
                       trialEnd.setDate(trialEnd.getDate() + 30);
                       setSubscriptionForm({
                         ...subscriptionForm,
                         status: 'trial',
                         trial_ends_at: trialEnd.toISOString().slice(0, 16)
                       });
                     }}
                   >
                     Extend Trial (30 days)
                   </Button>
                   <Button 
                     size="small" 
                     variant="outlined" 
                     sx={{ mr: 1 }}
                     onClick={() => {
                       const subEnd = new Date();
                       subEnd.setFullYear(subEnd.getFullYear() + 1);
                       setSubscriptionForm({
                         ...subscriptionForm,
                         status: 'active',
                         subscription_end_date: subEnd.toISOString().slice(0, 16)
                       });
                     }}
                   >
                     Extend 1 Year
                   </Button>
                   <Button 
                     size="small" 
                     variant="outlined"
                     onClick={() => {
                       setSubscriptionForm({
                         ...subscriptionForm,
                         status: 'suspended'
                       });
                     }}
                   >
                     Suspend Access
                   </Button>
                 </Box>
               </Alert>
             </Grid>
           </Grid>
         </DialogContent>
         <DialogActions>
           <Button onClick={() => setSubscriptionDialog(false)}>Cancel</Button>
           <Button 
             variant="contained" 
             onClick={handleSaveSubscription}
           >
             Save Subscription Changes
           </Button>
         </DialogActions>
       </Dialog>

       {/* Delete Confirmation Dialog */}
       <Dialog
         open={deleteDialog}
         onClose={() => setDeleteDialog(false)}
         maxWidth="sm"
         fullWidth
       >
         <DialogTitle sx={{ color: 'error.main' }}>
           <Box display="flex" alignItems="center" gap={1}>
             <WarningIcon color="error" />
             Delete Organization
           </Box>
         </DialogTitle>
         <DialogContent>
           <Typography variant="body1" sx={{ mb: 2 }}>
             Are you sure you want to permanently delete <strong>{orgToDelete?.name}</strong>?
           </Typography>
           <Typography variant="body2" color="error" sx={{ mb: 2 }}>
             This action will permanently delete:
           </Typography>
           <Box component="ul" sx={{ pl: 2, mb: 2 }}>
             <li>All users and their accounts</li>
             <li>All customers and their data</li>
             <li>All gas cylinders and bottles</li>
             <li>All rental records and transactions</li>
             <li>The organization itself</li>
           </Box>
           <Typography variant="body2" color="error" fontWeight="bold">
             This action cannot be undone!
           </Typography>
         </DialogContent>
         <DialogActions>
           <Button onClick={() => setDeleteDialog(false)}>
             Cancel
           </Button>
           <Button 
             onClick={confirmDelete} 
             variant="contained" 
             color="error"
             startIcon={<DeleteIcon />}
           >
             Delete Permanently
           </Button>
         </DialogActions>
       </Dialog>
     </Box>
   );
 } 
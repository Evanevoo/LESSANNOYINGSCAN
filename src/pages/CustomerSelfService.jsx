import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, Button, Chip, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, FormControl, InputLabel, Select, MenuItem, Alert,
  CircularProgress, Tabs, Tab, Avatar, List, ListItem, ListItemText,
  ListItemIcon, ListItemSecondaryAction, Divider,
  Badge, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  Inventory as InventoryIcon, Schedule as ScheduleIcon,
  LocationOn as LocationIcon, Receipt as BillingIcon,
  Support as SupportIcon, Notifications as NotificationIcon,
  CheckCircle as CheckIcon, Warning as WarningIcon, 
  Info as InfoIcon, Error as ErrorIcon, Refresh as RefreshIcon,
  Chat as ChatIcon, Phone as PhoneIcon, Email as EmailIcon,
  Download as DownloadIcon, Print as PrintIcon, Star as StarIcon,
  ExpandMore as ExpandMoreIcon, QrCode as QrCodeIcon,
  Visibility as TrackIcon, CalendarToday as CalendarIcon,
  LocalShipping as DeliveryIcon, Build as ServiceIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase/client';
import { deliveryService } from '../services/deliveryService';

function CustomerDashboard({ customer, stats }) {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Welcome, {customer.name}
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <InventoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Active Cylinders
                </Typography>
              </Box>
              <Typography variant="h4">{stats.activeCylinders}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DeliveryIcon color="success" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Pending Deliveries
                </Typography>
              </Box>
              <Typography variant="h4">{stats.pendingDeliveries}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ServiceIcon color="warning" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Service Requests
                </Typography>
              </Box>
              <Typography variant="h4">{stats.serviceRequests}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BillingIcon color="info" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Outstanding Balance
                </Typography>
              </Box>
              <Typography variant="h4">${stats.outstandingBalance}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <List>
          {stats.recentActivity?.map((activity, index) => (
            <ListItem key={index} sx={{ alignItems: 'flex-start', py: 2 }}>
              <ListItemIcon>
                <Chip
                  icon={activity.icon}
                  label={activity.type}
                  color={activity.type === 'delivery' ? 'primary' : 'success'}
                  size="small"
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2">
                      {activity.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.date}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Quick Actions */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ScheduleIcon />}
              sx={{ py: 2 }}
            >
              Schedule Delivery
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ServiceIcon />}
              sx={{ py: 2 }}
            >
              Request Service
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<TrackIcon />}
              sx={{ py: 2 }}
            >
              Track Cylinders
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SupportIcon />}
              sx={{ py: 2 }}
            >
              Contact Support
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

function CylinderTracking({ customerId }) {
  const [cylinders, setCylinders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trackingFilter, setTrackingFilter] = useState('all');

  useEffect(() => {
    fetchCylinders();
  }, [customerId, trackingFilter]);

  const fetchCylinders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('bottles')
        .select('*')
        .eq('assigned_customer', customerId);

      if (trackingFilter !== 'all') {
        query = query.eq('status', trackingFilter);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;
      setCylinders(data || []);
    } catch (error) {
      console.error('Error fetching cylinders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'in_transit': return 'warning';
      case 'ready_for_pickup': return 'info';
      case 'maintenance': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return <CheckIcon />;
      case 'in_transit': return <DeliveryIcon />;
      case 'ready_for_pickup': return <ScheduleIcon />;
      case 'maintenance': return <ServiceIcon />;
      default: return <InventoryIcon />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Cylinder Tracking</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={trackingFilter}
              onChange={(e) => setTrackingFilter(e.target.value)}
              label="Filter"
            >
              <MenuItem value="all">All Cylinders</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="in_transit">In Transit</MenuItem>
              <MenuItem value="ready_for_pickup">Ready for Pickup</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchCylinders}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {cylinders.map(cylinder => (
            <Grid item xs={12} sm={6} md={4} key={cylinder.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {getStatusIcon(cylinder.status)}
                    <Box sx={{ ml: 2, flex: 1 }}>
                      <Typography variant="h6">
                        {cylinder.barcode_number}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {cylinder.product_type}
                      </Typography>
                    </Box>
                    <Chip
                      label={cylinder.status}
                      color={getStatusColor(cylinder.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Location:
                    </Typography>
                    <Typography variant="body2">
                      {cylinder.location || 'Unknown'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Last Updated:
                    </Typography>
                    <Typography variant="body2">
                      {new Date(cylinder.updated_at).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Days at Location:
                    </Typography>
                    <Typography variant="body2">
                      {cylinder.days_at_location || 0} days
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <Button
                      size="small"
                      startIcon={<TrackIcon />}
                      onClick={() => {
                        // Open detailed tracking view
                        console.log('Track cylinder:', cylinder.barcode_number);
                      }}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && cylinders.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No cylinders found with the current filter.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

function DeliveryScheduling({ customerId }) {
  const [deliveryRequest, setDeliveryRequest] = useState({
    delivery_date: '',
    delivery_time: '',
    service_type: 'delivery',
    special_instructions: '',
    contact_person: '',
    contact_phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState([]);

  useEffect(() => {
    fetchUpcomingDeliveries();
  }, [customerId]);

  const fetchUpcomingDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_requests')
        .select('*')
        .eq('customer_id', customerId)
        .eq('status', 'scheduled')
        .order('requested_date', { ascending: true });

      if (error) throw error;
      setUpcomingDeliveries(data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    }
  };

  const submitDeliveryRequest = async () => {
    if (!deliveryRequest.delivery_date || !deliveryRequest.contact_person) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('delivery_requests')
        .insert({
          customer_id: customerId,
          requested_date: deliveryRequest.delivery_date,
          requested_time: deliveryRequest.delivery_time,
          service_type: deliveryRequest.service_type,
          special_instructions: deliveryRequest.special_instructions,
          contact_person: deliveryRequest.contact_person,
          contact_phone: deliveryRequest.contact_phone,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      alert('Delivery request submitted successfully!');
      setDeliveryRequest({
        delivery_date: '',
        delivery_time: '',
        service_type: 'delivery',
        special_instructions: '',
        contact_person: '',
        contact_phone: ''
      });
      fetchUpcomingDeliveries();
    } catch (error) {
      console.error('Error submitting delivery request:', error);
      alert('Failed to submit delivery request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Delivery Scheduling
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Schedule New Delivery
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Delivery Date"
                  type="date"
                  value={deliveryRequest.delivery_date}
                  onChange={(e) => setDeliveryRequest({ ...deliveryRequest, delivery_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Preferred Time</InputLabel>
                  <Select
                    value={deliveryRequest.delivery_time}
                    onChange={(e) => setDeliveryRequest({ ...deliveryRequest, delivery_time: e.target.value })}
                    label="Preferred Time"
                  >
                    <MenuItem value="morning">Morning (8AM - 12PM)</MenuItem>
                    <MenuItem value="afternoon">Afternoon (12PM - 5PM)</MenuItem>
                    <MenuItem value="evening">Evening (5PM - 8PM)</MenuItem>
                    <MenuItem value="anytime">Anytime</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Service Type</InputLabel>
                  <Select
                    value={deliveryRequest.service_type}
                    onChange={(e) => setDeliveryRequest({ ...deliveryRequest, service_type: e.target.value })}
                    label="Service Type"
                  >
                    <MenuItem value="delivery">Delivery</MenuItem>
                    <MenuItem value="pickup">Pickup</MenuItem>
                    <MenuItem value="exchange">Exchange</MenuItem>
                    <MenuItem value="maintenance">Maintenance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  value={deliveryRequest.contact_person}
                  onChange={(e) => setDeliveryRequest({ ...deliveryRequest, contact_person: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Phone"
                  value={deliveryRequest.contact_phone}
                  onChange={(e) => setDeliveryRequest({ ...deliveryRequest, contact_phone: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Special Instructions"
                  multiline
                  rows={3}
                  value={deliveryRequest.special_instructions}
                  onChange={(e) => setDeliveryRequest({ ...deliveryRequest, special_instructions: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={submitDeliveryRequest}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <ScheduleIcon />}
                  fullWidth
                >
                  Submit Request
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Deliveries
            </Typography>
            
            {upcomingDeliveries.length > 0 ? (
              <List>
                {upcomingDeliveries.map(delivery => (
                  <ListItem key={delivery.id} divider>
                    <ListItemIcon>
                      <CalendarIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${delivery.service_type} - ${new Date(delivery.requested_date).toLocaleDateString()}`}
                      secondary={`Time: ${delivery.requested_time} | Contact: ${delivery.contact_person}`}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={delivery.status}
                        color="primary"
                        size="small"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">
                No upcoming deliveries scheduled.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

function ServiceRequests({ customerId }) {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newRequest, setNewRequest] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: 'general'
  });

  useEffect(() => {
    fetchServiceRequests();
  }, [customerId]);

  const fetchServiceRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServiceRequests(data || []);
    } catch (error) {
      console.error('Error fetching service requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitServiceRequest = async () => {
    if (!newRequest.subject || !newRequest.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('service_requests')
        .insert({
          customer_id: customerId,
          subject: newRequest.subject,
          description: newRequest.description,
          priority: newRequest.priority,
          category: newRequest.category,
          status: 'open',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      alert('Service request submitted successfully!');
      setNewRequest({
        subject: '',
        description: '',
        priority: 'medium',
        category: 'general'
      });
      fetchServiceRequests();
    } catch (error) {
      console.error('Error submitting service request:', error);
      alert('Failed to submit service request');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Service Requests
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Submit New Request
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject"
                  value={newRequest.subject}
                  onChange={(e) => setNewRequest({ ...newRequest, subject: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={newRequest.category}
                    onChange={(e) => setNewRequest({ ...newRequest, category: e.target.value })}
                    label="Category"
                  >
                    <MenuItem value="general">General</MenuItem>
                    <MenuItem value="delivery">Delivery</MenuItem>
                    <MenuItem value="billing">Billing</MenuItem>
                    <MenuItem value="maintenance">Maintenance</MenuItem>
                    <MenuItem value="technical">Technical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={newRequest.priority}
                    onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}
                    label="Priority"
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={4}
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={submitServiceRequest}
                  startIcon={<ServiceIcon />}
                  fullWidth
                >
                  Submit Request
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Requests
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : serviceRequests.length > 0 ? (
              <List>
                {serviceRequests.slice(0, 5).map(request => (
                  <ListItem key={request.id} divider>
                    <ListItemText
                      primary={request.subject}
                      secondary={`${request.category} | ${new Date(request.created_at).toLocaleDateString()}`}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={request.priority}
                        color={getPriorityColor(request.priority)}
                        size="small"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">
                No service requests found.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function CustomerSelfService() {
  const { profile, organization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeCylinders: 0,
    pendingDeliveries: 0,
    overdueInvoices: 0,
    recentActivity: []
  });

  useEffect(() => {
    if (organization) {
      fetchCustomerData();
    }
  }, [organization]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      
      // Fetch customer statistics
      const [cylindersRes, deliveriesRes, invoicesRes] = await Promise.all([
        supabase.from('bottles').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('deliveries').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('invoices').select('id', { count: 'exact' }).eq('status', 'overdue')
      ]);

      // Mock recent activity data
      const mockActivity = [
        { type: 'delivery', description: 'Delivery completed - 5 cylinders', date: '2 hours ago', icon: <DeliveryIcon /> },
        { type: 'service', description: 'Service request submitted', date: '1 day ago', icon: <ScheduleIcon /> },
        { type: 'delivery', description: 'Delivery scheduled for tomorrow', date: '2 days ago', icon: <DeliveryIcon /> },
        { type: 'service', description: 'Maintenance completed', date: '3 days ago', icon: <CheckIcon /> }
      ];

      setStats({
        activeCylinders: cylindersRes.count || 0,
        pendingDeliveries: deliveriesRes.count || 0,
        overdueInvoices: invoicesRes.count || 0,
        recentActivity: mockActivity
      });

    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const ActivityTimeline = () => (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon />
          Recent Activity
        </Typography>
        <List>
          {stats.recentActivity.map((activity, index) => (
            <ListItem key={index} sx={{ alignItems: 'flex-start', py: 2 }}>
              <ListItemIcon>
                <Chip
                  icon={activity.icon}
                  label={activity.type}
                  color={activity.type === 'delivery' ? 'primary' : 'success'}
                  size="small"
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2">
                      {activity.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.date}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Customer account not found. Please contact support to set up your customer portal access.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Customer Portal
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Dashboard" />
          <Tab label="Track Cylinders" />
          <Tab label="Schedule Delivery" />
          <Tab label="Service Requests" />
          <Tab label="Billing" />
        </Tabs>
      </Paper>

      {activeTab === 0 && <CustomerDashboard customer={customer} stats={stats} />}
      {activeTab === 1 && <CylinderTracking customerId={customer.id} />}
      {activeTab === 2 && <DeliveryScheduling customerId={customer.id} />}
      {activeTab === 3 && <ServiceRequests customerId={customer.id} />}
      {activeTab === 4 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Billing & Invoices
          </Typography>
          <Alert severity="info">
            Billing features coming soon. Contact support for billing inquiries.
          </Alert>
        </Box>
      )}
    </Box>
  );
} 
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  LinearProgress, Chip, IconButton, Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../hooks/useAuth';

export default function OrganizationAnalytics() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalCustomers: 0,
    totalCylinders: 0,
    activeRentals: 0,
    monthlyRevenue: 0,
    growthRate: 0,
    customerSatisfaction: 0
  });

  // Mock data for charts
  const monthlyData = [
    { month: 'Jan', customers: 120, revenue: 15000, cylinders: 450 },
    { month: 'Feb', customers: 135, revenue: 16500, cylinders: 480 },
    { month: 'Mar', customers: 150, revenue: 18000, cylinders: 520 },
    { month: 'Apr', customers: 165, revenue: 19500, cylinders: 550 },
    { month: 'May', customers: 180, revenue: 21000, cylinders: 580 },
    { month: 'Jun', customers: 195, revenue: 22500, cylinders: 610 }
  ];

  const cylinderTypes = [
    { name: 'Oxygen', value: 45, color: '#8884d8' },
    { name: 'Nitrogen', value: 30, color: '#82ca9d' },
    { name: 'Argon', value: 15, color: '#ffc658' },
    { name: 'CO2', value: 10, color: '#ff7300' }
  ];

  useEffect(() => {
    if (profile) {
      fetchAnalytics();
    }
  }, [profile]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAnalytics({
        totalCustomers: 195,
        totalCylinders: 610,
        activeRentals: 485,
        monthlyRevenue: 22500,
        growthRate: 8.5,
        customerSatisfaction: 4.2
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
    <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ 
            backgroundColor: `${color}.light`, 
            color: `${color}.main`,
            borderRadius: 2,
            p: 1,
            mr: 2
          }}>
            {icon}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" fontWeight={800} color="primary">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          {trend && (
            <Chip
              icon={trend > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              label={`${Math.abs(trend)}%`}
              color={trend > 0 ? 'success' : 'error'}
              size="small"
            />
          )}
        </Box>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={800} color="primary">
          Organization Analytics
        </Typography>
        <IconButton onClick={fetchAnalytics} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={analytics.totalCustomers}
            subtitle="Active customers in system"
            icon={<AnalyticsIcon />}
            color="primary"
            trend={8.5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Cylinders"
            value={analytics.totalCylinders}
            subtitle="Cylinders in inventory"
            icon={<AnalyticsIcon />}
            color="secondary"
            trend={5.2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Rentals"
            value={analytics.activeRentals}
            subtitle="Currently rented out"
            icon={<AnalyticsIcon />}
            color="success"
            trend={12.1}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Revenue"
            value={`$${analytics.monthlyRevenue.toLocaleString()}`}
            subtitle="This month's revenue"
            icon={<AnalyticsIcon />}
            color="warning"
            trend={15.3}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Customer Growth Chart */}
        <Grid item xs={12} lg={8}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} mb={3}>
              Customer Growth & Revenue
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip />
                <Line yAxisId="left" type="monotone" dataKey="customers" stroke="#8884d8" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Cylinder Types Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} mb={3}>
              Cylinder Types Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cylinderTypes}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {cylinderTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Cylinder Inventory Chart */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} mb={3}>
              Cylinder Inventory Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="cylinders" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 
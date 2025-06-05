import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Box,
  Chip,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StatusCard = styled(Card)(({ theme }) => ({
  minHeight: 200,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
}));

const Dashboard: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [vpnIp, setVpnIp] = useState('');

  const handleConnect = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockIp = '10.0.0.' + Math.floor(Math.random() * 254 + 1);
      setVpnIp(mockIp);
      setIsConnected(true);
      setMessage(`VPN connected successfully! IP: ${mockIp}`);
    } catch (error) {
      setMessage('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsConnected(false);
      setVpnIp('');
      setMessage('VPN disconnected successfully!');
    } catch (error) {
      setMessage('Disconnection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        {message && (
          <Alert 
            severity={isConnected ? 'success' : 'info'} 
            sx={{ mb: 2 }} 
            onClose={() => setMessage('')}
          >
            {message}
          </Alert>
        )}
        
        <StatusCard>
          <CardContent sx={{ textAlign: 'center', width: '100%' }}>
            <Typography variant="h4" component="div" gutterBottom>
              VPN Status
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Chip
                label={isConnected ? 'Connected' : 'Disconnected'}
                color={isConnected ? 'success' : 'error'}
                sx={{ 
                  fontSize: '1.2rem', 
                  px: 3, 
                  py: 1,
                  height: '40px'
                }}
              />
            </Box>

            {isConnected && vpnIp && (
              <Typography variant="h6" color="success.main" sx={{ mb: 2 }}>
                🌐 VPN IP: {vpnIp}
              </Typography>
            )}

            {isConnected && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                🔒 Your connection is encrypted and secure
              </Typography>
            )}

            {isLoading ? (
              <Box sx={{ mt: 3 }}>
                <CircularProgress size={40} />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {isConnected ? 'Disconnecting...' : 'Connecting...'}
                </Typography>
              </Box>
            ) : (
              <Button
                variant="contained"
                color={isConnected ? 'error' : 'primary'}
                onClick={isConnected ? handleDisconnect : handleConnect}
                size="large"
                sx={{ 
                  mt: 2, 
                  minWidth: 150,
                  height: 50,
                  fontSize: '1.1rem'
                }}
              >
                {isConnected ? '🔴 Disconnect' : '🟢 Connect'}
              </Button>
            )}
          </CardContent>
        </StatusCard>
      </Grid>

      {/* Additional info cards */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🛡️ Security Status
            </Typography>
            <Typography color="text.secondary">
              Your connection is {isConnected ? 'protected and encrypted' : 'not protected'}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Chip 
                label={isConnected ? 'Secure' : 'Unprotected'} 
                color={isConnected ? 'success' : 'warning'}
                size="small"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Connection Info
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }}>
              Status: {isConnected ? 'Active' : 'Inactive'}
            </Typography>
            {isConnected && (
              <>
                <Typography color="text.secondary" sx={{ mb: 1 }}>
                  Server: Demo Server
                </Typography>
                <Typography color="text.secondary">
                  Protocol: OpenVPN
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ℹ️ About This Demo
            </Typography>
            <Typography color="text.secondary">
              This is a demonstration of the VPN interface. In a real implementation, 
              this would connect to actual VPN servers and establish secure tunnels.
              The current demo simulates the connection process and UI interactions.
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Dashboard; 
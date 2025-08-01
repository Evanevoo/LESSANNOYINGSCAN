# Email Setup Guide

## Overview
The contact form now sends real emails when organizations submit inquiries. This requires email configuration in your Netlify environment.

## Required Environment Variables

Add these environment variables to your Netlify dashboard:

### SMTP Configuration
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Contact Information
```
CONTACT_EMAIL=your-business-email@domain.com
CONTACT_NAME=Your Business Name
CONTACT_PHONE=+1 (555) 123-4567
```

## Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password as `SMTP_PASS`

3. **Use your Gmail address** as `SMTP_USER`

## Alternative Email Providers

### Outlook/Hotmail
```
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

### Yahoo
```
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

### Custom Domain (e.g., GoDaddy, Namecheap)
```
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
```

## Testing

1. **Update contact information** in Owner Portal → Contact Management
2. **Go to** `/contact` page
3. **Fill out the contact form** and submit
4. **Check your email** - you should receive:
   - A notification email with the inquiry details
   - A confirmation email sent to the customer

## Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Check your SMTP credentials
   - Ensure 2FA is enabled for Gmail
   - Use app password, not regular password

2. **"Connection timeout"**
   - Verify SMTP_HOST and SMTP_PORT
   - Check firewall settings
   - Try different port (465 with SSL, or 587 with TLS)

3. **"Email not received"**
   - Check spam folder
   - Verify CONTACT_EMAIL is correct
   - Check Netlify function logs

### Netlify Function Logs

1. Go to Netlify Dashboard
2. Your site → Functions → send-contact-email
3. Check "Function logs" for errors

## Security Notes

- Never commit email passwords to git
- Use environment variables for all sensitive data
- Consider using a dedicated email service (SendGrid, Mailgun) for production
- Regularly rotate app passwords

## Production Recommendations

For production use, consider:
- **SendGrid**: Professional email service
- **Mailgun**: Reliable email delivery
- **AWS SES**: Cost-effective for high volume
- **Resend**: Modern email API

These services provide better deliverability and monitoring than SMTP. 
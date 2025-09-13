# AWS SES Email Setup Guide

This guide explains how to set up AWS SES (Simple Email Service) for the Digital Persona Platform password reset system.

## Overview

The password reset system uses AWS SES to send secure, professional emails to users who request password resets. This includes:

- Password reset request emails
- Professional HTML email templates
- Domain verification and authentication
- Email delivery tracking and monitoring

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Domain ownership** - You must own the domain you want to send emails from
3. **DNS access** - Ability to add DNS records to your domain

## Setup Steps

### 1. Deploy the Terraform Configuration

The SES module is automatically included in the Terraform deployment. Deploy your environment:

```bash
# For dev environment
cd terraform/environments/dev
terraform init
terraform plan -var="sub_environment=dev01"
terraform apply -var="sub_environment=dev01"

# For main environment
cd terraform/environments/main
terraform init
terraform plan -var="sub_environment=main01"
terraform apply -var="sub_environment=main01"
```

### 2. Domain Verification (Automated)

The SES module now automatically handles domain verification through Route 53:

- **TXT Record**: Automatically created for domain verification
- **DKIM Records**: Three CNAME records automatically created for email authentication
- **Verification**: Automatically verified during Terraform deployment

**No manual DNS setup required!** The infrastructure will deploy with fully verified email capabilities.

### 3. Verify Domain in AWS Console

1. Go to the [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Navigate to "Verified identities"
3. Find your domain and verify it shows as "Verified"
4. If not verified, check your DNS records and wait for propagation (can take up to 72 hours)

### 4. Request Production Access (Optional)

By default, SES starts in "sandbox mode" which only allows sending to verified email addresses. For production use:

1. Go to the [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Navigate to "Account dashboard"
3. Click "Request production access"
4. Fill out the form explaining your use case
5. Wait for approval (usually 24-48 hours)

## Configuration

### Environment Variables

The following environment variables are automatically set by Terraform:

- `FROM_EMAIL`: The verified sender email address
- `FRONTEND_URL`: The frontend URL for password reset links
- `AWS_REGION`: AWS region (automatically set by Lambda)

### Email Templates

The system includes professional HTML email templates with:

- Branded header with gradient design
- Clear instructions for password reset
- Security warnings about token expiry
- Responsive design for all devices
- Fallback text version

## Testing

### Test Email Sending

You can test the email system by:

1. **Using the forgot password page**: Go to `/auth/forgot-password` and enter a valid email
2. **Check email delivery**: Look for the password reset email in the recipient's inbox
3. **Test the reset flow**: Click the link and complete the password reset

### Monitor Email Delivery

1. Go to the [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Navigate to "Configuration sets" → Your configuration set
3. View delivery statistics and bounce/complaint rates

## Security Features

### Email Security

- **Domain verification**: Only verified domains can send emails
- **DKIM signing**: Emails are cryptographically signed
- **SPF records**: Prevents email spoofing
- **Rate limiting**: AWS SES enforces sending limits

### Password Reset Security

- **Token expiry**: Reset tokens expire after 24 hours
- **One-time use**: Tokens are invalidated after use
- **Secure generation**: 32-byte random tokens
- **Email enumeration protection**: Same response regardless of user existence

## Troubleshooting

### Common Issues

1. **Domain not verified**
   - Check DNS records are correct
   - Wait for DNS propagation (up to 72 hours)
   - Verify TXT record format

2. **Emails not delivered**
   - Check spam folder
   - Verify recipient email is valid
   - Check SES sending limits

3. **DKIM authentication failed**
   - Verify all three DKIM CNAME records are added
   - Check record format and values
   - Wait for DNS propagation

### Monitoring

- **CloudWatch logs**: Check Lambda logs for email sending errors
- **SES metrics**: Monitor bounce rates and delivery statistics
- **SNS notifications**: Set up alerts for high bounce rates

## Cost Considerations

### SES Pricing

- **Free tier**: 62,000 emails per month (if sent from EC2)
- **Standard pricing**: $0.10 per 1,000 emails
- **Data transfer**: Free for emails under 62KB

### Cost Optimization

- **Email templates**: Optimized for small size
- **Rate limiting**: Prevents excessive sending
- **Monitoring**: Alerts for unusual activity

## Production Checklist

Before going to production:

- [ ] Domain is verified in SES
- [ ] DKIM records are added and verified
- [ ] Production access is requested and approved
- [ ] Email templates are customized for your brand
- [ ] Monitoring and alerting are configured
- [ ] Bounce and complaint handling is set up
- [ ] Rate limits are appropriate for your needs

## Support

For issues with the email system:

1. Check CloudWatch logs for errors
2. Verify SES configuration in AWS Console
3. Test with a simple email first
4. Check AWS SES documentation for service limits

## Related Documentation

- [AWS SES Developer Guide](https://docs.aws.amazon.com/ses/)
- [SES Sending Statistics](https://docs.aws.amazon.com/ses/latest/dg/monitor-sending-activity.html)
- [SES Best Practices](https://docs.aws.amazon.com/ses/latest/dg/best-practices.html)

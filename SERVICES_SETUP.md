# Services Configuration Guide

This document explains how to configure external services (Redis, Email, SMS) for the Payroll SaaS platform with graceful degradation support.

## 🎯 Overview

The platform now supports **real production services** with **automatic fallback** to mock mode if services are not configured. Your application will **never crash** due to missing service configuration.

## ✨ Features

- ✅ **Graceful Degradation**: All services have fallback modes
- ✅ **Multiple Providers**: Support for various service providers
- ✅ **Production-Ready**: Upstash Redis, Resend, Twilio
- ✅ **Development-Friendly**: Mock modes for local development
- ✅ **Clear Warnings**: Detailed logging when services are not configured

---

## 🔴 Redis / Background Jobs

### Option 1: Upstash Redis (Recommended for Production/Serverless)

**Why Upstash?**
- Serverless-friendly (REST API)
- No connection pooling issues
- Works with Next.js Edge Runtime
- Free tier available

**Setup:**
1. Create account at https://console.upstash.com/
2. Create a Redis database
3. Copy REST URL and Token
4. Add to `.env`:

```bash
UPSTASH_REDIS_REST_URL="https://your-redis-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-rest-token"
```

### Option 2: Traditional Redis (Local Development)

**Setup:**
```bash
# Install Redis locally
brew install redis  # macOS
# or
sudo apt-get install redis-server  # Ubuntu

# Start Redis
redis-server

# Configure in .env
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""  # Optional
```

### Fallback Behavior

If **neither** Upstash nor Redis is configured:
- ⚠️  Background jobs are **DISABLED**
- Emails/SMS will be sent **immediately** (synchronous)
- Warning will be logged on startup
- Application will **NOT crash**

**Impact:**
- Slower response times for email/SMS operations
- No retry mechanism for failed operations
- Not recommended for production

---

## 📧 Email Service

### Option 1: Resend (Recommended)

**Why Resend?**
- Modern, developer-friendly API
- Excellent deliverability
- Simple pricing
- Great documentation

**Setup:**
1. Create account at https://resend.com
2. Generate API key at https://resend.com/api-keys
3. Add to `.env`:

```bash
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@your-domain.com"
```

### Option 2: SendGrid

**Setup:**
```bash
EMAIL_PROVIDER="sendgrid"
SENDGRID_API_KEY="SG...."
EMAIL_FROM="noreply@your-domain.com"
```

### Option 3: Mailgun

**Setup:**
```bash
EMAIL_PROVIDER="mailgun"
MAILGUN_API_KEY="your-mailgun-api-key"
MAILGUN_DOMAIN="your-mailgun-domain"
EMAIL_FROM="noreply@your-domain.com"
```

### Option 4: SMTP

**Setup:**
```bash
EMAIL_PROVIDER="smtp"
EMAIL_SMTP_HOST="smtp.your-provider.com"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="your-smtp-user"
EMAIL_SMTP_PASSWORD="your-smtp-password"
EMAIL_FROM="noreply@your-domain.com"
```

### Fallback Behavior

If no email provider is configured:
- ⚠️  Emails will be **LOGGED but NOT sent** (mock mode)
- Warning will be logged for each email attempt
- Application will **NOT crash**
- Useful for local development

---

## 📱 SMS Service

### Option 1: Twilio (Recommended)

**Why Twilio?**
- Industry standard
- Reliable delivery
- Global coverage
- Excellent documentation

**Setup:**
1. Create account at https://console.twilio.com/
2. Get a phone number
3. Copy Account SID and Auth Token
4. Add to `.env`:

```bash
SMS_PROVIDER="twilio"
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

### Option 2: Vonage (Nexmo)

**Setup:**
```bash
SMS_PROVIDER="vonage"
VONAGE_API_KEY="your-vonage-api-key"
VONAGE_API_SECRET="your-vonage-api-secret"
VONAGE_FROM="YourApp"
```

### Option 3: AWS SNS

**Setup:**
```bash
SMS_PROVIDER="aws-sns"
# Uses AWS credentials configured above for S3
SMS_FROM="YourApp"
```

### Fallback Behavior

If no SMS provider is configured:
- ⚠️  SMS will be **LOGGED but NOT sent** (mock mode)
- Warning will be logged for each SMS attempt
- Application will **NOT crash**
- Useful for local development

---

## 🚀 Quick Start Guide

### For Production

**Minimal setup for production:**

```bash
# 1. Upstash Redis (Background Jobs)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# 2. Resend (Emails)
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"

# 3. Twilio (SMS)
SMS_PROVIDER="twilio"
TWILIO_ACCOUNT_SID="ACxxx..."
TWILIO_AUTH_TOKEN="your-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

### For Local Development

**Option A: Full mock mode (no external services)**
```bash
# Leave Redis variables commented out
# EMAIL_PROVIDER defaults to "mock"
# SMS_PROVIDER defaults to "mock"
```

**Option B: With local Redis**
```bash
REDIS_HOST="localhost"
REDIS_PORT="6379"
# EMAIL_PROVIDER defaults to "mock"
# SMS_PROVIDER defaults to "mock"
```

---

## 🔍 Checking Service Status

On application startup, you'll see a summary like this:

```
============================================================
📋 External Services Configuration Summary
============================================================
✅ REDIS: PRODUCTION (upstash)
✅ EMAIL: PRODUCTION (resend)
✅ SMS: PRODUCTION (twilio)
============================================================
```

Or with warnings:

```
============================================================
📋 External Services Configuration Summary
============================================================
❌ REDIS: DISABLED
   ↳ No Redis or Upstash configuration found
⚠️  EMAIL: MOCK
   ↳ No valid email provider configured (provider: mock)
⚠️  SMS: MOCK
   ↳ No valid SMS provider configured (provider: mock)
============================================================
```

---

## 📊 Service Configuration Matrix

| Service | Production | Development | Fallback |
|---------|-----------|-------------|----------|
| **Redis** | Upstash or Local Redis | Local Redis or None | Disabled (sync execution) |
| **Email** | Resend/SendGrid/Mailgun | Mock | Mock (logged only) |
| **SMS** | Twilio/Vonage/SNS | Mock | Mock (logged only) |

---

## ⚠️ Important Notes

### Redis / Background Jobs

- **Without Redis**: Jobs execute immediately (synchronous), blocking HTTP requests
- **With Redis**: Jobs are queued and processed in the background (recommended)
- **Recommended for Production**: Upstash Redis (serverless-friendly)

### Email Service

- **Mock Mode**: Emails are logged but NOT sent
- **Production**: Use Resend, SendGrid, or Mailgun
- **Resend** is recommended for its simplicity and deliverability

### SMS Service

- **Mock Mode**: SMS are logged but NOT sent
- **Production**: Use Twilio (most reliable)
- **Cost**: Twilio charges per SMS (~$0.0075 per message)

---

## 🔧 Troubleshooting

### Redis Connection Issues

**Problem**: BullMQ fails to connect to Redis

**Solution**:
1. Check Upstash credentials are correct
2. Ensure URL includes `https://` protocol
3. Verify firewall/network allows outbound connections
4. Check Upstash dashboard for connection errors

### Email Not Sending

**Problem**: Emails are not being delivered

**Checklist**:
1. ✅ `EMAIL_PROVIDER` is set correctly
2. ✅ API key is valid and not expired
3. ✅ `EMAIL_FROM` domain is verified (Resend/SendGrid)
4. ✅ Check spam folder
5. ✅ Review service logs for errors

### SMS Not Sending

**Problem**: SMS messages are not delivered

**Checklist**:
1. ✅ `SMS_PROVIDER` is set to "twilio"
2. ✅ Account SID and Auth Token are correct
3. ✅ Phone number is in E.164 format (+1234567890)
4. ✅ Twilio phone number is verified
5. ✅ Account has sufficient credits

---

## 🎓 Migration from Legacy Configuration

If you're upgrading from an older version:

### Old Configuration (Deprecated)
```bash
# ❌ Old way
EMAIL_API_KEY="..."
SMS_API_KEY="..."
```

### New Configuration (Current)
```bash
# ✅ New way - Provider-specific
RESEND_API_KEY="re_..."
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
```

**The system supports both for backward compatibility**, but we recommend migrating to the new format.

---

## 📚 Additional Resources

- **Upstash Redis**: https://docs.upstash.com/redis
- **Resend**: https://resend.com/docs
- **Twilio**: https://www.twilio.com/docs/sms
- **SendGrid**: https://docs.sendgrid.com/
- **Mailgun**: https://documentation.mailgun.com/

---

## 💬 Support

If you encounter issues:
1. Check the startup logs for service status
2. Review this documentation
3. Verify environment variables are set correctly
4. Check service provider dashboards for errors

---

**Last Updated**: November 15, 2025  
**Version**: 1.0.0

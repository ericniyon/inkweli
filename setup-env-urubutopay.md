# UrubutoPay Environment Setup

To fix the "service code does not match" error, add these environment variables to your `.env` file:

```bash
# UrubutoPay Configuration
URUBUTOPAY_BASE_URL=https://urubutopay.rw
URUBUTOPAY_API_KEY_PRODUCTION=your_production_api_key
URUBUTOPAY_MERCHANT_CODE=TH13776003

# Service Codes (PWL slugs) - VERIFIED WORKING
URUBUTOPAY_SERVICE_CODE_ANNUAL=annual-package-1777494294743
URUBUTOPAY_SERVICE_CODE_PER_ARTICLE=per-article-package-1777494222439

# Gateway Service Codes (use same as service codes for consistency)
URUBUTOPAY_INITIATE_SERVICE_CODE_ANNUAL=annual-package-1777494294743
URUBUTOPAY_INITIATE_SERVICE_CODE_PER_ARTICLE=subscription-9644

# Optional: Payment Link and Service IDs
URUBUTOPAY_PAYMENT_LINK_ID_ANNUAL=
URUBUTOPAY_PAYMENT_LINK_ID_PER_ARTICLE=4300
URUBUTOPAY_SERVICE_ID_ANNUAL=
URUBUTOPAY_SERVICE_ID_PER_ARTICLE=9548
```

**Important:**
- Replace `your_production_api_key` with your actual UrubutoPay production API key
- The service codes above are the ones currently configured in your codebase
- If you have different service codes from UrubutoPay, update them accordingly


# Inkwell System Architecture

## 1. Domain Model Overview
- **Users & Roles**: Role-Based Access Control (RBAC) ensures that only paid subscribers or admins can access specific routes.
- **Article Lifecycle**: Managed by Editors through the CMS. Articles move from `DRAFT` to `PUBLISHED` (with optional `SCHEDULED` status using a Cron Job).
- **The Paywall Logic**: 
    - Server-side middleware checks the `User` role and `SubscriptionPlan`.
    - `ArticleViewCounter` tracks unique views per user per month.
    - If `limit` is reached, the server rejects the article payload and returns an `upsell` signal.

## 2. Highlighting Strategy
- We store **Text Offsets**. When a user selects text, we record:
    1. The paragraph index (container).
    2. The start and end character offsets within that text node.
- On render, the article content is parsed and injected with `<mark>` tags or interactive spans matching these offsets.
- This ensures that even if CSS changes the layout, the text-based references remain stable.

## 3. Rwanda Payments Integration
- Since Stripe availability varies, the system is architected for **Flutterwave** or **DPO**, which both support Mobile Money (MTN/Airtel) in Rwanda.
- A Webhook listener handles payment confirmation and automatically updates the `Subscription` model in PostgreSQL.

## 4. Next.js App Router Structure
- `app/(auth)` - Login/Signup
- `app/(reader)` - Public article feed and reading experience
- `app/admin` - Protected CMS dashboard
- `app/api/webhooks` - Payment processor endpoints
- `components/ui` - Reusable Tailwind primitives
- `lib/prisma` - Shared DB client

# Security Specification for A.P.I. SHOP

## 1. Data Invariants
- A user cannot modify their own `walletBalance` or `role`.
- A user can only read their own `orders` and `addFundRequests`.
- A user can only create an `Order` if they have sufficient `walletBalance`. (Note: rules don't support arithmetic checks between documents easily, but we can enforce it on the client and verify status on admin side). Actually, we can't easily enforce "sufficient funds" in rules without complex triggers or cloud functions, so we'll rely on the logic that orders start as `pending` and Admin approves if funds are sufficient, OR we just deduct on client and rules allow update ONLY if done by Admin OR specific conditions. Wait, `walletBalance` should be ADMIN ONLY for updates.
- `products` are public for read, but admin only for write.
- `settings` are public for read, but admin only for write.

## 2. The Dirty Dozen Payloads

### Payload 1: Privilege Escalation
Attacker tries to set their own role to 'admin' during registration.
```json
{
  "email": "attacker@hack.com",
  "role": "admin",
  "walletBalance": 999999
}
```
**Expected Result:** PERMISSION_DENIED.

### Payload 2: Wallet Tampering
User tries to increment their own balance.
```json
{
  "walletBalance": 5000
}
```
**Expected Result:** PERMISSION_DENIED.

### Payload 3: Order Spoofing
User tries to update an order status to 'completed' without admin approval.
```json
{
  "status": "completed"
}
```
**Expected Result:** PERMISSION_DENIED.

### Payload 4: Product Ransom
User tries to delete a product.
```json
{ "delete": true }
```
**Expected Result:** PERMISSION_DENIED.

... (and so on)

## 3. Implementation Patterns
- `isAdmin()` helper check by looking up user document role.
- `isValidUser()` checks for required fields.
- `isOwner()` checks `request.auth.uid == userId`.

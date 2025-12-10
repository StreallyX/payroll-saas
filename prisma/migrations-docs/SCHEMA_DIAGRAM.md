# Margin System Schema Diagram

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NEW MARGIN SYSTEM                            │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│    Contract      │
│==================│
│ + paymentModel   │ ◄────────┐
│   (enum)         │          │
│                  │          │ Many-to-1
│ margins[]        │          │
└────────┬─────────┘          │
         │                    │
         │ 1-to-Many          │
         ▼                    │
┌──────────────────┐          │
│     Margin       │          │
│==================│          │
│ id               │          │
│ invoiceId (UK)   │ ─────────┤
│ contractId       │ ─────────┘
│                  │
│ marginType       │ ◄─── enum: FIXED | VARIABLE | CUSTOM
│ marginPercentage │
│ marginAmount     │
│ calculatedMargin │
│                  │
│ isOverridden     │
│ overriddenBy     │ ───┐
│ overriddenAt     │    │
│ notes            │    │
│                  │    │
│ createdAt        │    │
│ updatedAt        │    │
└────────┬─────────┘    │
         │              │
         │ 1-to-1       │
         ▼              │
┌──────────────────┐    │
│     Invoice      │    │
│==================│    │
│ senderId         │ ───┼───┐
│ receiverId       │ ───┼───┤
│                  │    │   │
│ paymentModel     │ ◄──┘   │ enum: GROSS | PAYROLL | 
│   (enum)         │        │       PAYROLL_WE_PAY | SPLIT
│                  │        │
│ agencyMarkedPaidAt   │    │
│ agencyMarkedPaidBy   │ ───┤
│ paymentReceivedAt    │    │
│ paymentReceivedBy    │ ───┤
│                  │        │
│ margin (1-to-1)  │ ───────┘
└──────────────────┘        │
                            │
                            │ Multiple Relations
                            ▼
                   ┌──────────────────┐
                   │       User       │
                   │==================│
                   │ invoicesSent[]   │
                   │ invoicesReceived[]│
                   │ invoicesAgencyMarkedPaid[]│
                   │ invoicesPaymentReceived[] │
                   │ marginsOverridden[]       │
                   └──────────────────┘
```

## New Enums

### PaymentModel
```
┌──────────────────┐
│  PaymentModel    │
├──────────────────┤
│ GROSS            │  - Client pays contractor + agency fee
│ PAYROLL          │  - Agency handles payroll
│ PAYROLL_WE_PAY   │  - Agency pays everything
│ SPLIT            │  - Split payment model
└──────────────────┘
```

### MarginType
```
┌──────────────────┐
│   MarginType     │
├──────────────────┤
│ FIXED            │  - Fixed amount margin
│ VARIABLE         │  - Percentage-based margin
│ CUSTOM           │  - Custom calculation
└──────────────────┘
```

## Data Flow: Invoice Creation with Margin

```
1. Contract Created
   ├─► paymentModel set (GROSS/PAYROLL/etc)
   └─► marginType set (from contract defaults)

2. Timesheet Approved
   └─► Invoice Auto-Generated
       ├─► senderId = contractor
       ├─► receiverId = client
       ├─► paymentModel = contract.paymentModel
       └─► Margin Record Created
           ├─► contractId = contract.id
           ├─► marginType = contract.marginType
           ├─► calculatedMargin = computed
           └─► isOverridden = false

3. Admin Review (optional)
   └─► Margin Override
       ├─► isOverridden = true
       ├─► overriddenBy = admin.id
       ├─► overriddenAt = now()
       ├─► notes = "reason for override"
       └─► calculatedMargin = new value

4. Payment Processing
   ├─► agencyMarkedPaidAt = when marked
   ├─► agencyMarkedPaidBy = who marked
   ├─► paymentReceivedAt = when received
   └─► paymentReceivedBy = who confirmed
```

## Index Strategy

### Margin Table Indexes
```
┌──────────────────┬─────────────┬──────────────────────────┐
│ Index            │ Type        │ Purpose                  │
├──────────────────┼─────────────┼──────────────────────────┤
│ invoiceId        │ UNIQUE      │ 1-to-1 enforcement       │
│ contractId       │ INDEX       │ Contract margin queries  │
│ overriddenBy     │ INDEX       │ Audit trail lookups      │
└──────────────────┴─────────────┴──────────────────────────┘
```

### Invoice Table New Indexes
```
┌──────────────────┬─────────────┬──────────────────────────┐
│ Index            │ Type        │ Purpose                  │
├──────────────────┼─────────────┼──────────────────────────┤
│ senderId         │ INDEX       │ User's sent invoices     │
│ receiverId       │ INDEX       │ User's received invoices │
│ agencyMarkedPaidBy│ INDEX      │ Payment tracking         │
│ paymentReceivedBy│ INDEX       │ Receipt tracking         │
└──────────────────┴─────────────┴──────────────────────────┘
```

## Key Relationships

### Invoice ↔ Margin (1-to-1)
- Each Invoice can have exactly one Margin
- Margin is required for proper financial tracking
- Cascade delete: Margin deleted when Invoice deleted

### Contract ↔ Margin (1-to-Many)
- Contract defines default margin settings
- Multiple Margins can reference same Contract
- Restrict delete: Prevent Contract deletion if Margins exist

### User ↔ Invoice (Multiple Relations)
- **sender**: User who sends invoice (typically contractor)
- **receiver**: User who receives invoice (typically client)
- **agencyMarkedPaidBy**: Admin who marked invoice as paid
- **paymentReceivedBy**: Admin who confirmed payment receipt

### User ↔ Margin (1-to-Many)
- **overriddenBy**: Admin who manually adjusted margin
- Tracks all margin overrides for audit purposes

## Query Examples

### Get Invoice with Margin Details
```typescript
const invoice = await prisma.invoice.findUnique({
  where: { id: invoiceId },
  include: {
    margin: {
      include: {
        contract: true,
        overriddenByUser: true
      }
    },
    sender: true,
    receiver: true
  }
});
```

### Get Contract with All Margins
```typescript
const contract = await prisma.contract.findUnique({
  where: { id: contractId },
  include: {
    margins: {
      include: {
        invoice: true
      },
      orderBy: { createdAt: 'desc' }
    }
  }
});
```

### Get User's Payment Activities
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    invoicesSent: true,
    invoicesReceived: true,
    invoicesAgencyMarkedPaid: true,
    invoicesPaymentReceived: true,
    marginsOverridden: true
  }
});
```

### Find Overridden Margins
```typescript
const overriddenMargins = await prisma.margin.findMany({
  where: {
    isOverridden: true
  },
  include: {
    invoice: true,
    contract: true,
    overriddenByUser: true
  },
  orderBy: { overriddenAt: 'desc' }
});
```

## Migration Impact

### ✅ Additive Changes Only
- No existing data modified
- No columns removed
- All new fields are optional
- Backward compatible

### 🔄 Required Updates
1. Invoice creation logic → Create Margin record
2. Payment tracking → Use new agency payment fields
3. Reports → Query Margin table for financial data
4. Admin UI → Add margin override functionality

### 📊 Performance Considerations
- Indexes on all foreign keys
- Efficient 1-to-1 lookup via unique constraint
- Optimized for audit queries (overriddenBy index)
- No impact on existing queries

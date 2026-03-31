# Fuel Management System

A QR code-based fuel management system that enables efficient tracking and verification of fuel usage for riders and organizations.

## Features

- **QR Code-based Validation**: Riders receive unique QR codes for fuel verification
- **Role-based Access**: Different dashboards for Admin, Team Leader, Rider, and Gas Station Staff
- **LH Driver Support**: Line Haul drivers get full tank privileges
- **Credit System**: Regular riders receive fuel based on available credit
- **Real-time Tracking**: Monitor fuel distribution and transaction history

## User Roles & Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fuel.com | admin123 |
| Team Leader | leader@fuel.com | leader123 |
| Rider (Regular) | rider@fuel.com | rider123 |
| Rider (LH Driver) | lhrider@fuel.com | rider123 |
| Gas Station Staff | staff@fuel.com | staff123 |

## Technology Stack

- React + Vite
- TailwindCSS
- React Router
- QRCode.react
- Lucide Icons

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Flow

1. **Admin** creates riders, team leaders, and gas station partners
2. **Riders** receive a unique QR code
3. **Riders** visit partner gas stations and show their QR code
4. **Gas Station Staff** validate the QR code in the system
5. If valid, staff checks if employee is an LH Driver:
   - **YES** → Fill full tank
   - **NO** → Fuel based on available credit
6. Transaction is recorded and credit is updated

## Project Structure

```
src/
├── contexts/
│   ├── AuthContext.jsx    # Authentication & role management
│   └── DataContext.jsx      # Data storage & transactions
├── pages/
│   ├── Login.jsx            # Login page
│   ├── AdminDashboard.jsx   # Admin management
│   ├── TeamLeaderDashboard.jsx
│   ├── RiderDashboard.jsx
│   └── GasStationStaff.jsx
├── components/
│   └── ProtectedRoute.jsx   # Route protection by role
└── App.jsx                  # Main router
```

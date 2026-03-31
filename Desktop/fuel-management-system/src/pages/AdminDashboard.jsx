import { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import DashboardHome from '../components/admin/DashboardHome'
import UsersManagement from '../components/admin/UsersManagement'
import VehiclesManagement from '../components/admin/VehiclesManagement'
import FuelRequests from '../components/admin/FuelRequests'
import Reports from '../components/admin/Reports'

function AdminDashboard() {
  return (
    <Routes>
      <Route path="/" element={<DashboardHome />} />
      <Route path="/users" element={<UsersManagement />} />
      <Route path="/vehicles" element={<VehiclesManagement />} />
      <Route path="/requests" element={<FuelRequests />} />
      <Route path="/reports" element={<Reports />} />
    </Routes>
  )
}

export default AdminDashboard

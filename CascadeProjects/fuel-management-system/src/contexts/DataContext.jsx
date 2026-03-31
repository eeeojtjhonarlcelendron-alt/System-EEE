import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { fetchAllTeamLeaders, createTeamLeader } from '../services/adminService';
import { fetchAllRiders, createRider, updateRider as updateRiderDB, deleteRider as deleteRiderDB } from '../services/ridersService';

const DataContext = createContext(null);

// Initial demo data - only for data that doesn't come from Supabase
const INITIAL_DATA = {
  // riders removed - now fetched from Supabase
  hubs: [
    { id: 1, name: 'North Hub', location: 'North District' },
    { id: 2, name: 'South Hub', location: 'South District' },
  ],
  gasStations: [
    { id: 1, name: 'Shell Station 1', location: 'Main Street', partnerCode: 'SHELL001' },
    { id: 2, name: 'Petron Station 2', location: 'Highway Road', partnerCode: 'PETRON002' },
  ],
  fuelTransactions: [
    { id: 1, riderId: 1, riderName: 'John Rider', stationId: 1, stationName: 'Shell Station 1', amount: 50, type: 'credit', date: '2026-03-25', status: 'completed' },
    { id: 2, riderId: 2, riderName: 'Mike LH Rider', stationId: 1, stationName: 'Shell Station 1', amount: 100, type: 'full_tank', date: '2026-03-24', status: 'completed' },
  ],
};

export function DataProvider({ children }) {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('fuelData');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  // State for team leaders and riders from Supabase
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch data from Supabase on mount
  useEffect(() => {
    loadTeamLeaders();
    loadRiders();
  }, []);

  const loadTeamLeaders = async () => {
    setLoading(true);
    const { data: leaders, error } = await fetchAllTeamLeaders();
    if (leaders && !error) {
      // Map database structure to match expected format
      const mappedLeaders = leaders.map(leader => ({
        id: leader.id,
        name: leader.name,
        email: leader.email,
        hubId: leader.hub_id,
        status: leader.status,
      }));
      setTeamLeaders(mappedLeaders);
    }
    setLoading(false);
  };

  const loadRiders = async () => {
    setLoading(true);
    const { data: ridersData, error } = await fetchAllRiders();
    if (ridersData && !error) {
      const mappedRiders = ridersData.map(rider => ({
        id: rider.id,
        riderId: rider.rider_id,
        name: rider.name,
        email: rider.email,
        fleetType: rider.fleet_type,
        hubId: rider.hub_id,
        isLHDriver: rider.is_lh_driver,
        credit: rider.credit,
        qrCode: rider.qr_code,
        status: rider.status,
      }));
      setRiders(mappedRiders);
    }
    setLoading(false);
  };

  const saveData = useCallback((newData) => {
    setData(newData);
    localStorage.setItem('fuelData', JSON.stringify(newData));
  }, []);

  const addRider = useCallback(async (rider) => {
    const { data: newRider, error } = await createRider({
      rider_id: rider.riderId || rider.rider_id,
      name: rider.name,
      email: rider.email,
      fleet_type: rider.fleetType || rider.fleet_type || '2_wheels',
      hub_id: parseInt(rider.hubId || rider.hub_id),
      is_lh_driver: rider.isLHDriver || rider.is_lh_driver || false,
      credit: parseFloat(rider.credit) || 0,
    });
    if (newRider && !error) {
      await loadRiders();
    }
    return newRider;
  }, []);

  const updateRider = useCallback(async (id, updates) => {
    const { data: updatedRider, error } = await updateRiderDB(id, {
      name: updates.name,
      email: updates.email,
      fleet_type: updates.fleetType || updates.fleet_type,
      hub_id: updates.hubId !== undefined ? parseInt(updates.hubId) : undefined,
      is_lh_driver: updates.isLHDriver !== undefined ? updates.isLHDriver : updates.is_lh_driver,
      credit: updates.credit !== undefined ? parseFloat(updates.credit) : undefined,
      status: updates.status,
    });
    if (updatedRider && !error) {
      await loadRiders();
    }
    return updatedRider;
  }, []);

  const deleteRider = useCallback(async (id) => {
    const { error } = await deleteRiderDB(id);
    if (!error) {
      await loadRiders();
    }
    return !error;
  }, []);

  const addTeamLeader = useCallback(async (leader) => {
    const { data: newLeader, error } = await createTeamLeader({
      name: leader.name,
      email: leader.email,
      hub_id: parseInt(leader.hubId),
      status: 'active',
    });
    if (newLeader && !error) {
      await loadTeamLeaders();
    }
    return newLeader;
  }, []);

  const addGasStation = useCallback((station) => {
    const newStation = { ...station, id: Date.now() };
    const newData = {
      ...data,
      gasStations: [...data.gasStations, newStation],
    };
    saveData(newData);
    return newStation;
  }, [data, saveData]);

  const addFuelTransaction = useCallback((transaction) => {
    const newTransaction = { ...transaction, id: Date.now(), date: new Date().toISOString().split('T')[0] };
    const newData = {
      ...data,
      fuelTransactions: [newTransaction, ...data.fuelTransactions],
    };
    
    if (transaction.type === 'credit') {
      newData.riders = riders.map(r => 
        r.id === transaction.riderId 
          ? { ...r, credit: r.credit - transaction.amount }
          : r
      );
    }
    
    saveData(newData);
    return newTransaction;
  }, [data, saveData, riders]);

  const validateQRCode = useCallback((qrCode) => {
    const rider = riders.find(r => r.qrCode === qrCode);
    if (!rider) return { valid: false, error: 'Invalid QR code' };
    return { valid: true, rider };
  }, [riders]);

  const getRiderById = useCallback((id) => {
    return riders.find(r => r.id === id);
  }, [riders]);

  const getTransactionsByRider = useCallback((riderId) => {
    return data.fuelTransactions.filter(t => t.riderId === riderId);
  }, [data.fuelTransactions]);

  const getTransactionsByStation = useCallback((stationId) => {
    return data.fuelTransactions.filter(t => t.stationId === stationId);
  }, [data.fuelTransactions]);

  const getHubRiders = useCallback((hubId) => {
    return riders.filter(r => r.hubId === hubId);
  }, [riders]);

  const value = {
    data,
    riders,
    teamLeaders,
    hubs: data.hubs,
    gasStations: data.gasStations,
    fuelTransactions: data.fuelTransactions,
    loading,
    refreshTeamLeaders: loadTeamLeaders,
    refreshRiders: loadRiders,
    addRider,
    updateRider,
    deleteRider,
    addTeamLeader,
    addGasStation,
    addFuelTransaction,
    validateQRCode,
    getRiderById,
    getTransactionsByRider,
    getTransactionsByStation,
    getHubRiders,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}

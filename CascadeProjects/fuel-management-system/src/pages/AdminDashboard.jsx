import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Users, MapPin, UserCheck, Plus, Trash2, Edit2, X, Building2, Shield } from 'lucide-react';
import { fetchAllRiders, deleteRider as deleteRiderFromDB, createRider } from '../services/ridersService';
import { fetchAllUsers, createUser, deleteUser } from '../services/usersService';
import { deleteTeamLeader } from '../services/adminService';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const { teamLeaders, hubs, gasStations, addTeamLeader, addGasStation } = useData();
  const [activeTab, setActiveTab] = useState('riders');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({});
  
  // State for database riders and users
  const [dbRiders, setDbRiders] = useState([]);
  const [dbUsers, setDbUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch riders and users from database on mount
  useEffect(() => {
    loadRiders();
    loadUsers();
  }, []);

  const loadRiders = async () => {
    setLoading(true);
    const { data, error } = await fetchAllRiders();
    if (data && !error) {
      setDbRiders(data);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    const { data, error } = await fetchAllUsers();
    if (data && !error) {
      setDbUsers(data);
    }
  };

  const handleDeleteRider = async (riderId) => {
    const { error } = await deleteRiderFromDB(riderId);
    if (!error) {
      await loadRiders();
    }
  };

  const handleDeleteUser = async (userId) => {
    const { error } = await deleteUser(userId);
    if (!error) {
      await loadUsers();
    }
  };

  const handleDeleteTeamLeader = async (leaderId) => {
    const { error } = await deleteTeamLeader(leaderId);
    if (!error) {
      window.location.reload();
    }
  };

  const handleEdit = (type, item) => {
    setModalType(`edit-${type}`);
    setFormData(item);
    setShowModal(true);
  };

  const handleDeleteStation = (stationId) => {
    const newStations = gasStations.filter(s => s.id !== stationId);
    // Update via DataContext or localStorage
    const saved = localStorage.getItem('fuelData');
    if (saved) {
      const data = JSON.parse(saved);
      data.gasStations = newStations;
      localStorage.setItem('fuelData', JSON.stringify(data));
    }
    window.location.reload();
  };

  const handleAdd = (type) => {
    setModalType(type);
    setFormData({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (modalType === 'rider') {
      await createRider({
        rider_id: formData.riderId,
        name: formData.name,
        email: formData.email,
        fleet_type: formData.fleetType || '2_wheels',
        hub_id: parseInt(formData.hubId),
        is_lh_driver: formData.isLHDriver || false,
        credit: parseInt(formData.credit) || 0,
      });
      await loadRiders();
    } else if (modalType === 'edit-rider') {
      await updateRider(formData.id, {
        name: formData.name,
        email: formData.email,
        fleet_type: formData.fleetType,
        hub_id: parseInt(formData.hubId),
        is_lh_driver: formData.isLHDriver,
        credit: parseInt(formData.credit) || 0,
      });
      await loadRiders();
    } else if (modalType === 'leader') {
      addTeamLeader({ ...formData, hubId: parseInt(formData.hubId) });
    } else if (modalType === 'edit-leader') {
      // Update team leader via DataContext or API
      const saved = localStorage.getItem('fuelData');
      if (saved) {
        const data = JSON.parse(saved);
        const updatedLeaders = data.teamLeaders.map(l => 
          l.id === formData.id ? { ...formData, hubId: parseInt(formData.hubId) } : l
        );
        data.teamLeaders = updatedLeaders;
        localStorage.setItem('fuelData', JSON.stringify(data));
      }
      window.location.reload();
    } else if (modalType === 'station') {
      addGasStation(formData);
    } else if (modalType === 'edit-station') {
      // Update gas station
      const saved = localStorage.getItem('fuelData');
      if (saved) {
        const data = JSON.parse(saved);
        const updatedStations = data.gasStations.map(s => 
          s.id === formData.id ? { ...formData } : s
        );
        data.gasStations = updatedStations;
        localStorage.setItem('fuelData', JSON.stringify(data));
      }
      window.location.reload();
    } else if (modalType === 'user') {
      console.log('Creating user with data:', { name: formData.name, email: formData.email, role: formData.role, hub_id: formData.hubId });
      const { error } = await createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        hub_id: formData.hubId ? parseInt(formData.hubId) : null,
      });
      if (error) {
        console.error('Failed to create user:', error);
        alert('Failed to create user: ' + error.message);
        return;
      }
      console.log('User created successfully');
      await loadUsers();
    } else if (modalType === 'edit-user') {
      // User update logic would go here
      await loadUsers();
    }
    setShowModal(false);
    setFormData({});
  };

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {modalType.startsWith('edit-') ? 'Edit' : 'Add'} {modalType === 'rider' || modalType === 'edit-rider' ? 'Rider' : modalType === 'leader' || modalType === 'edit-leader' ? 'Team Leader' : modalType === 'user' || modalType === 'edit-user' ? 'User' : 'Gas Station'}
            </h3>
            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {modalType !== 'station' && modalType !== 'user' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  required
                />
              </div>
            )}

            {modalType === 'user' && formData.role === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  required
                />
              </div>
            )} 

            {modalType === 'user' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.role || ''}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="admin">Admin</option>
                    <option value="team_leader">Team Leader</option>
                    <option value="gasoline_staff">Gasoline Staff</option>
                  </select>
                </div>

                {formData.role === 'gasoline_staff' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        value={formData.password || ''}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        placeholder="Enter password"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                      <input
                        type="text"
                        value={formData.stationId || ''}
                        onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        placeholder="Enter station ID"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gas Name</label>
                      <input
                        type="text"
                        value={formData.stationName || ''}
                        onChange={(e) => setFormData({ ...formData, stationName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        placeholder="Enter gas station name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={formData.stationLocation || ''}
                        onChange={(e) => setFormData({ ...formData, stationLocation: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        placeholder="Enter location"
                        required
                      />
                    </div>
                  </>
                )}

                {(formData.role === 'admin' || formData.role === 'team_leader') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        value={formData.password || ''}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        placeholder="Enter password"
                        required
                      />
                    </div>
                    {formData.role === 'team_leader' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hub</label>
                        <input
                          type="text"
                          value={formData.hubId || ''}
                          onChange={(e) => setFormData({ ...formData, hubId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                          placeholder="Enter hub name"
                          required
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {(modalType === 'rider' || modalType === 'edit-rider') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rider ID</label>
                  <input
                    type="text"
                    value={formData.riderId || ''}
                    onChange={(e) => setFormData({ ...formData, riderId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    placeholder="e.g. RIDER001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hub</label>
                  <select
                    value={formData.hubId || ''}
                    onChange={(e) => setFormData({ ...formData, hubId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    required
                  >
                    <option value="">Select Hub</option>
                    {hubs.map(hub => (
                      <option key={hub.id} value={hub.id}>{hub.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fleet Type</label>
                  <select
                    value={formData.fleetType || '2_wheels'}
                    onChange={(e) => setFormData({ ...formData, fleetType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    required
                  >
                    <option value="2_wheels">2 Wheels</option>
                    <option value="3_wheels">3 Wheels</option>
                    <option value="4_wheels">4 Wheels</option>
                    <option value="LH">LH</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isLHDriver || false}
                      onChange={(e) => setFormData({ ...formData, isLHDriver: e.target.checked })}
                      className="w-4 h-4 text-primary rounded"
                    />
                    <span className="text-sm text-gray-700">LH Driver</span>
                  </label>
                </div>
                {!formData.isLHDriver && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credit Amount</label>
                    <input
                      type="number"
                      value={formData.credit || ''}
                      onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      placeholder="Enter credit amount"
                    />
                  </div>
                )}
              </>
            )}

            {(modalType === 'leader' || modalType === 'edit-leader') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hub</label>
                <select
                  value={formData.hubId || ''}
                  onChange={(e) => setFormData({ ...formData, hubId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  required
                >
                  <option value="">Select Hub</option>
                  {hubs.map(hub => (
                    <option key={hub.id} value={hub.id}>{hub.name}</option>
                  ))}
                </select>
              </div>
            )}

            {(modalType === 'station' || modalType === 'edit-station') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Partner Code</label>
                  <input
                    type="text"
                    value={formData.partnerCode || ''}
                    onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                {modalType.startsWith('edit-') ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Manage system users and stations</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'riders', label: 'Riders', icon: Users },
            { id: 'leaders', label: 'Team Leaders', icon: UserCheck },
            { id: 'stations', label: 'Gas Stations', icon: MapPin },
            { id: 'users', label: 'Users', icon: Shield },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === id
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === 'riders' && 'All Riders'}
              {activeTab === 'leaders' && 'Team Leaders'}
              {activeTab === 'stations' && 'Gas Stations'}
              {activeTab === 'users' && 'System Users'}
            </h2>
            {activeTab !== 'riders' && activeTab !== 'leaders' && activeTab !== 'stations' && (
              <button
                onClick={() => handleAdd(activeTab === 'users' ? 'user' : 'station')}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                <Plus className="w-4 h-4" />
                Add {activeTab === 'users' ? 'User' : 'Station'}
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {activeTab === 'riders' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rider ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rider Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fleet Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operator Hub</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </>
                  )}
                  {activeTab === 'leaders' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hub</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </>
                  )}
                  {activeTab === 'stations' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gas Station ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gas Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </>
                  )}
                  {activeTab === 'users' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hub</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeTab === 'riders' && dbRiders.map(rider => (
                  <tr key={rider.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{rider.rider_id}</td>
                    <td className="px-6 py-4 text-gray-600">{rider.name}</td>
                    <td className="px-6 py-4 text-gray-600">{rider.is_lh_driver ? 'N/A' : `₱${rider.credit}`}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rider.is_lh_driver ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {rider.fleet_type === '2_wheels' && '2 Wheels'}
                        {rider.fleet_type === '3_wheels' && '3 Wheels'}
                        {rider.fleet_type === '4_wheels' && '4 Wheels'}
                        {rider.fleet_type === 'LH' && 'LH'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{rider.hubs?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleEdit('rider', rider)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRider(rider.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {activeTab === 'leaders' && teamLeaders.map(leader => (
                  <tr key={leader.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-600">{leader.email}</td>
                    <td className="px-6 py-4 text-gray-600">{hubs.find(h => h.id === leader.hubId)?.name}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleEdit('leader', leader)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeamLeader(leader.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {activeTab === 'stations' && gasStations.map(station => (
                  <tr key={station.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{station.id}</td>
                    <td className="px-6 py-4 text-gray-600">{station.name}</td>
                    <td className="px-6 py-4 text-gray-600">{station.location}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleEdit('station', station)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStation(station.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {activeTab === 'users' && dbUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-100 text-red-700' :
                        user.role === 'team_leader' ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {user.role === 'admin' && 'Admin'}
                        {user.role === 'team_leader' && 'Team Leader'}
                        {user.role === 'gasoline_staff' && 'Gas Staff'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{hubs.find(h => h.id === Number(user.hub_id))?.name || user.hub_id || '-'}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleEdit('user', user)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {renderModal()}
    </div>
  );
}

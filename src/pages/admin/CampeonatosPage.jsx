import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Plus, Eye, X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CampeonatosPage = () => {
  const [campeonatos, setCampeonatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    C_CAMPEONATO: '',
    n_campeonato: '',
    q_partidos: '',
    r_partidos: ''
  });

  useEffect(() => {
    cargarCampeonatos();
  }, []);

  const cargarCampeonatos = async () => {
    try {
      const response = await api.get('/api/admin/campeonatos');
      setCampeonatos(response.data.data || []);
    } catch (error) {
      toast.error('Error al cargar campeonatos');
      //console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.C_CAMPEONATO.length !== 3) {
      toast.error('El código del campeonato debe tener exactamente 3 caracteres');
      return;
    }

    try {
      await api.post('/api/admin/campeonatos', {
        C_CAMPEONATO: formData.C_CAMPEONATO.toUpperCase(),
        n_campeonato: formData.n_campeonato,
        q_partidos: formData.q_partidos ? parseInt(formData.q_partidos) : null,
        r_partidos: formData.r_partidos ? parseInt(formData.r_partidos) : null
      });
      toast.success('Campeonato creado exitosamente');
      setShowModal(false);
      setFormData({ C_CAMPEONATO: '', n_campeonato: '', q_partidos: '', r_partidos: '' });
      cargarCampeonatos();
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al crear campeonato');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando campeonatos...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Campeonatos</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo Campeonato
        </button>
      </div>

      {campeonatos.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay campeonatos registrados</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 text-indigo-600 hover:underline"
          >
            Crear primer campeonato
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campeonatos.map((campeonato) => (
          <div key={campeonato.C_CAMPEONATO} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <Trophy className="h-8 w-8 text-white opacity-80" />
                <span className="bg-white/20 text-white px-2 py-1 rounded text-xs font-mono">
                  {campeonato.C_CAMPEONATO}
                </span>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">{campeonato.N_CAMPEONATO}</h3>
              <div className="flex gap-4 text-sm text-gray-500 mb-4">
                {campeonato.Q_PARTIDOS && (
                  <span>📊 {campeonato.Q_PARTIDOS} partidos</span>
                )}
                {campeonato.R_PARTIDOS && (
                  <span>✅ {campeonato.R_PARTIDOS} registrados</span>
                )}
              </div>
              <Link
                to={`/admin/campeonatos/${campeonato.C_CAMPEONATO}`}
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
              >
                <Eye className="h-4 w-4 mr-1" />
                Ver Detalle
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para crear campeonato */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Nuevo Campeonato</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código (3 caracteres) *
                </label>
                <input
                  type="text"
                  name="C_CAMPEONATO"
                  required
                  maxLength={3}
                  value={formData.C_CAMPEONATO}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                  placeholder="Ej: LGN, M26"
                />
                <p className="text-xs text-gray-400 mt-1">Ejemplo: LGN, M26, CL24</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Campeonato *
                </label>
                <input
                  type="text"
                  name="n_campeonato"
                  required
                  value={formData.n_campeonato}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ej: Liga Nacional"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Partidos
                  </label>
                  <input
                    type="number"
                    name="q_partidos"
                    value={formData.q_partidos}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ej: 38"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Partidos Registrados
                  </label>
                  <input
                    type="number"
                    name="r_partidos"
                    value={formData.r_partidos}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ej: 0"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Crear Campeonato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampeonatosPage;
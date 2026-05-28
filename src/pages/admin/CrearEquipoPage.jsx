import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const CrearEquipoPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingLigas, setLoadingLigas] = useState(false);
  const [ligas, setLigas] = useState([]);

  const [formData, setFormData] = useState({
    c_equipo: '',
    n_equipo: '',
    liga: '',
    e_nombre: '',
    banderas: '',
    url_bandera: ''
  });

  // Cargar ligas al montar el componente
  useEffect(() => {
    cargarLigas();
  }, []);

  const cargarLigas = async () => {
    setLoadingLigas(true);
    try {
      const response = await api.get('/api/equipos/ligas/campeonatos');
      setLigas(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar ligas:', error);
      toast.error('Error al cargar ligas');
    } finally {
      setLoadingLigas(false);
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
    setLoading(true);

    try {
      await api.post('/api/admin/equipos', formData);
      toast.success('Equipo creado exitosamente');
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al crear equipo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link
        to="/admin"
        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver al Panel
      </Link>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Crear Nuevo Equipo</h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Código + Nombre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código del Equipo * (2-3 caracteres)
              </label>
              <input
                type="text"
                name="c_equipo"
                required
                maxLength={3}
                minLength={2}
                value={formData.c_equipo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej: MEX, NYY, LAL"
              />
              <p className="text-xs text-gray-500 mt-1">
                Código único de 2 o 3 caracteres (ej: MX, MEX, AR, ARG, LAL, NYY)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Equipo *
              </label>
              <input
                type="text"
                name="n_equipo"
                required
                value={formData.n_equipo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej: México, Yankees, Lakers"
              />
            </div>
          </div>

          {/* Liga - DINÁMICO desde CAMPEONATO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Liga *
            </label>
            <select
              name="liga"
              required
              value={formData.liga}
              onChange={handleChange}
              disabled={loadingLigas}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
            >
              <option value="">{loadingLigas ? 'Cargando ligas...' : 'Seleccionar liga'}</option>
              {ligas.map((liga) => (
                <option key={liga.CODIGO} value={liga.CODIGO}>
                  {liga.NOMBRE}
                </option>
              ))}
            </select>
            {ligas.length === 0 && !loadingLigas && (
              <p className="text-xs text-yellow-500 mt-1">
                ⚠️ No hay ligas disponibles. Debes crear un campeonato primero.
              </p>
            )}
            {ligas.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Las ligas se obtienen de los campeonatos existentes
              </p>
            )}
          </div>

          {/* Estadio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Estadio
            </label>
            <input
              type="text"
              name="e_nombre"
              value={formData.e_nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ej: Estadio Azteca"
            />
          </div>

          {/* URL Bandera */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Bandera
            </label>
            <input
              type="url"
              name="url_bandera"
              value={formData.url_bandera}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="https://..."
            />
            <p className="text-xs text-gray-500 mt-1">
              URL de la bandera o logo del equipo
            </p>
          </div>

          {/* Botón */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || ligas.length === 0}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creando...' : 'Crear Equipo'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CrearEquipoPage;
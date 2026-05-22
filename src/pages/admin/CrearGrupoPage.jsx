import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const CrearGrupoPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [campeonatos, setCampeonatos] = useState([]);
  const [quinielas, setQuinielas] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    C_CAMPEONATO: '',
    id_quiniela: ''
  });

  // Cargar campeonatos al iniciar
  useEffect(() => {
    cargarCampeonatos();
  }, []);

  // Cargar quinielas cuando cambia el campeonato
  useEffect(() => {
    if (formData.C_CAMPEONATO) {
      cargarQuinielasPorCampeonato(formData.C_CAMPEONATO);
    } else {
      setQuinielas([]);
    }
  }, [formData.C_CAMPEONATO]);

  const cargarCampeonatos = async () => {
    try {
      const response = await api.get('/api/admin/campeonatos');
      setCampeonatos(response.data.data || []);
    } catch (error) {
      toast.error('Error al cargar campeonatos');
      //console.error(error);
    }
  };

  const cargarQuinielasPorCampeonato = async (C_CAMPEONATO) => {
    try {
      const response = await api.get(`/api/admin/campeonatos/${C_CAMPEONATO}/quinielas`);
      setQuinielas(response.data.data || []);
    } catch (error) {
      toast.error('Error al cargar quinielas');
      //console.error(error);
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
      // 🔥 CORREGIDO: Usar /api/grupos en lugar de /api/admin/grupos
      await api.post('/api/grupos', {
        nombre: formData.nombre,
        C_CAMPEONATO: formData.C_CAMPEONATO,
        id_quiniela: parseInt(formData.id_quiniela)
      });
      toast.success('Grupo creado exitosamente');
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al crear grupo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link to="/admin" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver al Panel
      </Link>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Crear Nuevo Grupo</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Grupo *
            </label>
            <input
              type="text"
              name="nombre"
              required
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ej: A, B, C"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campeonato *
            </label>
            <select
              name="C_CAMPEONATO"
              required
              value={formData.C_CAMPEONATO}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Selecciona un campeonato</option>
              {campeonatos.map((campeonato) => (
                <option key={campeonato.C_CAMPEONATO} value={campeonato.C_CAMPEONATO}>
                  {campeonato.N_CAMPEONATO} ({campeonato.C_CAMPEONATO})
                </option>
              ))}
            </select>
            {campeonatos.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                No hay campeonatos registrados. Crea uno primero.
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quiniela *
            </label>
            <select
              name="id_quiniela"
              required
              value={formData.id_quiniela}
              onChange={handleChange}
              disabled={!formData.C_CAMPEONATO}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Selecciona una quiniela</option>
              {quinielas.map((quiniela) => (
                <option key={quiniela.ID_QUINIELA} value={quiniela.ID_QUINIELA}>
                  {quiniela.NOMBRE} (ID: {quiniela.ID_QUINIELA})
                </option>
              ))}
            </select>
            {formData.C_CAMPEONATO && quinielas.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                No hay quinielas para este campeonato. Crea una primero.
              </p>
            )}
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !formData.C_CAMPEONATO || !formData.id_quiniela}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creando...' : 'Crear Grupo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearGrupoPage;
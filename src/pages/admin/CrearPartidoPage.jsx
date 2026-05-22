import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const CrearPartidoPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [campeonatos, setCampeonatos] = useState([]);
  const [quinielas, setQuinielas] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [formData, setFormData] = useState({
    C_CAMPEONATO: '',
    id_quiniela: '',
    EQUIPO_LOCAL: '',
    EQUIPO_VISITANTE: '',
    ID_GRUPO: '',
    FECHA: '',
    ACTUALIZADO_POR: ''
  });

  useEffect(() => {
    cargarCampeonatos();
  }, []);

  // Cargar equipos cuando cambia el campeonato (NO depende de la quiniela)
  useEffect(() => {
    if (formData.C_CAMPEONATO) {
      cargarEquipos(formData.C_CAMPEONATO);
      cargarQuinielas(formData.C_CAMPEONATO);
    } else {
      setEquipos([]);
      setQuinielas([]);
      setGrupos([]);
    }
  }, [formData.C_CAMPEONATO]);

  // Cargar grupos cuando cambia la quiniela
  useEffect(() => {
    if (formData.id_quiniela) {
      cargarGrupos(formData.id_quiniela);
    } else {
      setGrupos([]);
    }
  }, [formData.id_quiniela]);

  const cargarCampeonatos = async () => {
    try {
      const response = await api.get('/api/admin/campeonatos');
      //console.log('Campeonatos:', response.data.data);
      setCampeonatos(response.data.data || []);
    } catch (error) {
      toast.error('Error al cargar campeonatos');
    }
  };

  const cargarQuinielas = async (C_CAMPEONATO) => {
    try {
      const response = await api.get(`/api/admin/campeonatos/${C_CAMPEONATO}/quinielas`);
      //console.log('Quinielas para', C_CAMPEONATO, ':', response.data.data);
      setQuinielas(response.data.data || []);
    } catch (error) {
      toast.error('Error al cargar quinielas');
    }
  };

  const cargarEquipos = async (C_CAMPEONATO) => {
    try {
      //console.log('Cargando equipos para campeonato:', C_CAMPEONATO);
      const response = await api.get(`/api/equipos/campeonato/${C_CAMPEONATO}`);
      //console.log('Equipos recibidos:', response.data.data);
      setEquipos(response.data.data || []);
      if (response.data.data?.length === 0) {
        toast.warning(`No hay equipos para el campeonato ${C_CAMPEONATO}`);
      }
    } catch (error) {
      //console.error('Error al cargar equipos:', error);
      toast.error('Error al cargar equipos');
      setEquipos([]);
    }
  };

  const cargarGrupos = async (id_quiniela) => {
    try {
      //console.log('Cargando grupos para quiniela:', id_quiniela);
      const response = await api.get(`/api/grupos/quiniela/${id_quiniela}`);
      //console.log('Grupos recibidos:', response.data.data);
      setGrupos(response.data.data || []);
    } catch (error) {
      //console.error('Error al cargar grupos', error);
      setGrupos([]);
    }
  };

  const handleChange = (e) => {
    //console.log(`Cambio en ${e.target.name}:`, e.target.value);
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (formData.EQUIPO_LOCAL === formData.EQUIPO_VISITANTE) {
      toast.error('Los equipos deben ser diferentes');
      setLoading(false);
      return;
    }

    try {
      //console.log('Creando partido:', {
      //  C_CAMPEONATO: formData.C_CAMPEONATO,
      //  EQUIPO_LOCAL: formData.EQUIPO_LOCAL,
      //  EQUIPO_VISITANTE: formData.EQUIPO_VISITANTE,
      //  ID_GRUPO: formData.ID_GRUPO,
      //  FECHA: formData.FECHA,
      //  ACTUALIZADO_POR: formData.ACTUALIZADO_POR
      //});
      
      await api.post('/api/partidos', {
        C_CAMPEONATO: formData.C_CAMPEONATO,
        EQUIPO_LOCAL: formData.EQUIPO_LOCAL,
        EQUIPO_VISITANTE: formData.EQUIPO_VISITANTE,
        ID_GRUPO: formData.ID_GRUPO ? parseInt(formData.ID_GRUPO) : null,
        FECHA: formData.FECHA || null,
        ACTUALIZADO_POR: formData.ACTUALIZADO_POR || null
      });
      toast.success('Partido creado exitosamente');
      navigate('/admin');
    } catch (error) {
      //console.error('Error:', error.response?.data);
      toast.error(error.response?.data?.mensaje || 'Error al crear partido');
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
        <h1 className="text-2xl font-bold mb-6">Crear Nuevo Partido</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campeonato */}
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
          </div>
          
          {/* Quiniela */}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
            >
              <option value="">Selecciona una quiniela</option>
              {quinielas.map((quiniela) => (
                <option key={quiniela.ID_QUINIELA} value={quiniela.ID_QUINIELA}>
                  {quiniela.NOMBRE} (ID: {quiniela.ID_QUINIELA})
                </option>
              ))}
            </select>
          </div>
          
          {/* Equipos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipo Local *
              </label>
              <select
                name="EQUIPO_LOCAL"
                required
                value={formData.EQUIPO_LOCAL}
                onChange={handleChange}
                disabled={!formData.C_CAMPEONATO}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              >
                <option value="">Selecciona un equipo</option>
                {equipos.map((equipo) => (
                  <option key={equipo.C_EQUIPO} value={equipo.C_EQUIPO}>
                    {equipo.N_EQUIPO} ({equipo.C_EQUIPO})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipo Visitante *
              </label>
              <select
                name="EQUIPO_VISITANTE"
                required
                value={formData.EQUIPO_VISITANTE}
                onChange={handleChange}
                disabled={!formData.C_CAMPEONATO}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              >
                <option value="">Selecciona un equipo</option>
                {equipos.map((equipo) => (
                  <option key={equipo.C_EQUIPO} value={equipo.C_EQUIPO}>
                    {equipo.N_EQUIPO} ({equipo.C_EQUIPO})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Grupo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grupo *
            </label>
            <select
              name="ID_GRUPO"
              required
              value={formData.ID_GRUPO}
              onChange={handleChange}
              disabled={!formData.id_quiniela}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
            >
              <option value="">Selecciona un grupo</option>
              {grupos.map((grupo) => (
                <option key={grupo.ID_GRUPO} value={grupo.ID_GRUPO}>
                  Grupo {grupo.NOMBRE} (ID: {grupo.ID_GRUPO})
                </option>
              ))}
            </select>
          </div>
          
          {/* FECHA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              FECHA y Hora del Partido
            </label>
            <input
              type="datetime-local"
              name="FECHA"
              value={formData.FECHA}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          {/* Actualizado Por */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actualizado Por (código 5 caracteres)
            </label>
            <input
              type="text"
              name="ACTUALIZADO_POR"
              maxLength={5}
              value={formData.ACTUALIZADO_POR}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ej: 00656"
            />
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !formData.C_CAMPEONATO || !formData.id_quiniela || !formData.EQUIPO_LOCAL || !formData.EQUIPO_VISITANTE || !formData.ID_GRUPO}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creando...' : 'Crear Partido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearPartidoPage;
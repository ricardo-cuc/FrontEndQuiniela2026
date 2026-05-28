import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const CrearGrupoPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingEquipos, setLoadingEquipos] = useState(false);
  const [campeonatos, setCampeonatos] = useState([]);
  const [quinielas, setQuinielas] = useState([]);
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [equiposSeleccionados, setEquiposSeleccionados] = useState([]);
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
      cargarEquiposPorCampeonato(formData.C_CAMPEONATO);
    } else {
      setQuinielas([]);
      setEquiposDisponibles([]);
    }
  }, [formData.C_CAMPEONATO]);

  const cargarCampeonatos = async () => {
    try {
      const response = await api.get('/api/admin/campeonatos');
      setCampeonatos(response.data.data || []);
    } catch (error) {
      toast.error('Error al cargar campeonatos');
    }
  };

  const cargarQuinielasPorCampeonato = async (C_CAMPEONATO) => {
    try {
      const response = await api.get(`/api/admin/campeonatos/${C_CAMPEONATO}/quinielas`);
      setQuinielas(response.data.data || []);
    } catch (error) {
      toast.error('Error al cargar quinielas');
    }
  };

  const cargarEquiposPorCampeonato = async (C_CAMPEONATO) => {
    setLoadingEquipos(true);
    try {
      const response = await api.get(`/api/equipos/campeonato/${C_CAMPEONATO}`);
      setEquiposDisponibles(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      toast.error('Error al cargar equipos');
      setEquiposDisponibles([]);
    } finally {
      setLoadingEquipos(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const agregarEquipo = (equipoId) => {
    const equipo = equiposDisponibles.find(e => e.C_EQUIPO === equipoId);
    if (equipo && !equiposSeleccionados.find(e => e.C_EQUIPO === equipoId)) {
      setEquiposSeleccionados([...equiposSeleccionados, equipo]);
    }
  };

  const quitarEquipo = (equipoId) => {
    setEquiposSeleccionados(equiposSeleccionados.filter(e => e.C_EQUIPO !== equipoId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (equiposSeleccionados.length === 0) {
      toast.error('Debes seleccionar al menos un equipo para el grupo');
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. Crear el grupo
      const grupoResponse = await api.post('/api/grupos', {
        nombre: formData.nombre,
        C_CAMPEONATO: formData.C_CAMPEONATO,
        id_quiniela: parseInt(formData.id_quiniela)
      });
      
      const grupoId = grupoResponse.data.data?.ID_GRUPO || grupoResponse.data.ID_GRUPO;
      
      // 2. Asignar equipos al grupo
      for (const equipo of equiposSeleccionados) {
        await api.post(`/api/grupos/${grupoId}/equipos`, {
          C_EQUIPO: equipo.C_EQUIPO,
          C_CAMPEONATO: formData.C_CAMPEONATO
        });
      }
      
      toast.success(`Grupo creado con ${equiposSeleccionados.length} equipos asignados`);
      navigate('/admin');
    } catch (error) {
      console.error('Error:', error.response?.data);
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
          {/* Nombre del Grupo */}
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
              placeholder="Ej: A, B, C, Grupo 1"
            />
          </div>
          
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
          
          {/* Selección de Equipos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Equipos del Grupo *
            </label>
            <div className="flex gap-2">
              <select
                onChange={(e) => agregarEquipo(e.target.value)}
                disabled={!formData.C_CAMPEONATO || loadingEquipos}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                value=""
              >
                <option value="">{loadingEquipos ? 'Cargando equipos...' : 'Selecciona un equipo'}</option>
                {equiposDisponibles
                  .filter(e => !equiposSeleccionados.find(s => s.C_EQUIPO === e.C_EQUIPO))
                  .map((equipo) => (
                    <option key={equipo.C_EQUIPO} value={equipo.C_EQUIPO}>
                      {equipo.N_EQUIPO} ({equipo.C_EQUIPO})
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const select = document.querySelector('select[onchange*="agregarEquipo"]');
                  if (select && select.value) {
                    agregarEquipo(select.value);
                    select.value = '';
                  }
                }}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            {/* Lista de equipos seleccionados */}
            {equiposSeleccionados.length > 0 && (
              <div className="mt-3 border rounded-md p-3 bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Equipos asignados ({equiposSeleccionados.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {equiposSeleccionados.map((equipo) => (
                    <div
                      key={equipo.C_EQUIPO}
                      className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md text-sm"
                    >
                      {equipo.URL_BANDERA && (
                        <img 
                          src={equipo.URL_BANDERA} 
                          alt={equipo.N_EQUIPO}
                          className="w-4 h-3 object-cover rounded"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      )}
                      <span>{equipo.N_EQUIPO} ({equipo.C_EQUIPO})</span>
                      <button
                        type="button"
                        onClick={() => quitarEquipo(equipo.C_EQUIPO)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {formData.C_CAMPEONATO && equiposDisponibles.length === 0 && !loadingEquipos && (
              <p className="text-xs text-yellow-500 mt-1">
                ⚠️ No hay equipos disponibles para este campeonato. Crea equipos primero.
              </p>
            )}
          </div>
          
          {/* Botón submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !formData.C_CAMPEONATO || !formData.id_quiniela || equiposSeleccionados.length === 0}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creando...' : `Crear Grupo (${equiposSeleccionados.length} equipos)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearGrupoPage;
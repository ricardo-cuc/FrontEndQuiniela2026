import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const CrearQuinielaPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingCampeonatos, setLoadingCampeonatos] = useState(false);
  const [campeonatos, setCampeonatos] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    C_CAMPEONATO: '',
    FECHA_inicio: '',
    FECHA_fin: '',
    estado: 'ACTIVA',
    tipo: 'PUBLICA',           // ✅ CORREGIDO: PUBLICAtipo: 'PUBLICA',           // ✅ CORREGIDO: PUBLICA
    codigo_acceso: '',
    creada_por: ''
  });

  useEffect(() => {
    cargarCampeonatos();
  }, []);

  const cargarCampeonatos = async () => {
    setLoadingCampeonatos(true);
    try {
      const response = await api.get('/api/admin/campeonatos');
      setCampeonatos(response.data.data || []);
      if (response.data.data?.length === 0) {
        toast.warning('No hay campeonatos disponibles. Crea uno primero.');
      }
    } catch (error) {
      console.error('Error al cargar campeonatos:', error);
      toast.error('Error al cargar campeonatos');
    } finally {
      setLoadingCampeonatos(false);
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
    
    // Validaciones locales
    if (!formData.nombre.trim()) {
      toast.error('El nombre de la quiniela es requerido');
      return;
    }
    
    if (!formData.C_CAMPEONATO) {
      toast.error('Selecciona un campeonato');
      return;
    }
    
    if (!formData.FECHA_inicio || !formData.FECHA_fin) {
      toast.error('Las fechas de inicio y fin son requeridas');
      return;
    }
    
    if (new Date(formData.FECHA_inicio) > new Date(formData.FECHA_fin)) {
      toast.error('La fecha de inicio no puede ser mayor que la fecha de fin');
      return;
    }
    
    if (!formData.creada_por || formData.creada_por.length !== 5) {
      toast.error('El campo "Creada Por" debe tener exactamente 5 caracteres');
      return;
    }
    
    setLoading(true);
    
    try {
      // Enviar directamente formData
      await api.post('/api/admin/quinielas', formData);
      toast.success('Quiniela creada exitosamente');
      navigate('/admin');
    } catch (error) {
      console.error('Error:', error.response?.data);
      
      let mensajeError = 'Error al crear quiniela';
      
      if (error.response?.data?.mensaje) {
        mensajeError = error.response.data.mensaje;
      } else if (error.response?.data?.message) {
        mensajeError = error.response.data.message;
      } else if (error.response?.data?.error) {
        mensajeError = error.response.data.error;
      }
      
      // Mensajes específicos
      if (mensajeError.includes('duplicate') || mensajeError.includes('ya existe')) {
        mensajeError = 'Ya existe una quiniela con ese nombre para este campeonato';
      } else if (mensajeError.includes('campeonato')) {
        mensajeError = 'El campeonato seleccionado no existe';
      } else if (mensajeError.includes('TIPO')) {
        mensajeError = 'El tipo seleccionado no es válido. Use: PUBLICA, PRIVADA o POR_INVITACION';
      }
      
      toast.error(mensajeError);
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
        <h1 className="text-2xl font-bold mb-6">Crear Nueva Quiniela</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              name="nombre"
              required
              maxLength={100}
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ej: Quiniela Mundial 2026"
            />
          </div>
          
          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="descripcion"
              rows="3"
              maxLength={500}
              value={formData.descripcion}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Descripción opcional de la quiniela"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.descripcion.length}/500 caracteres
            </p>
          </div>
          
          {/* Campeonato - DROPDOWN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campeonato *
            </label>
            <select
              name="C_CAMPEONATO"
              required
              value={formData.C_CAMPEONATO}
              onChange={handleChange}
              disabled={loadingCampeonatos}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
            >
              <option value="">{loadingCampeonatos ? 'Cargando campeonatos...' : 'Selecciona un campeonato'}</option>
              {campeonatos.map((campeonato) => (
                <option key={campeonato.C_CAMPEONATO} value={campeonato.C_CAMPEONATO}>
                  {campeonato.N_CAMPEONATO} ({campeonato.C_CAMPEONATO})
                </option>
              ))}
            </select>
            {campeonatos.length === 0 && !loadingCampeonatos && (
              <p className="text-yellow-500 text-xs mt-1">
                ⚠️ No hay campeonatos disponibles. Debes crear un campeonato primero.
              </p>
            )}
          </div>
          
          {/* Creada Por */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Creada Por * (5 caracteres)
            </label>
            <input
              type="text"
              name="creada_por"
              required
              maxLength={5}
              value={formData.creada_por}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ej: 00656"
            />
            <p className="text-xs text-gray-500 mt-1">
              Código del usuario que crea la quiniela
            </p>
          </div>
          
          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicio *
              </label>
              <input
                type="date"
                name="FECHA_inicio"
                required
                value={formData.FECHA_inicio}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Fin *
              </label>
              <input
                type="date"
                name="FECHA_fin"
                required
                value={formData.FECHA_fin}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          {/* Estado y Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="ACTIVA">ACTIVA</option>
                <option value="INACTIVA">INACTIVA</option>
                <option value="FINALIZADA">FINALIZADA</option>
                <option value="CANCELADA">CANCELADA</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="PUBLICA">PÚBLICA</option>
                <option value="PRIVADA">PRIVADA</option>
                <option value="POR_INVITACION">POR INVITACIÓN</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                PÚBLICA: Cualquiera puede unirse | PRIVADA: Requiere código | POR INVITACIÓN: Solo invitados
              </p>
            </div>
          </div>
          
          {/* Código de Acceso (solo para PRIVADA) */}
          {formData.tipo === 'PRIVADA' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código de Acceso *
              </label>
              <input
                type="text"
                name="codigo_acceso"
                required={formData.tipo === 'PRIVADA'}
                value={formData.codigo_acceso}
                onChange={handleChange}
                maxLength={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Código de acceso para la quiniela privada"
              />
              <p className="text-xs text-gray-500 mt-1">
                Los usuarios necesitarán este código para unirse
              </p>
            </div>
          )}
          
          {/* Botón submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !campeonatos.length}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creando...' : 'Crear Quiniela'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearQuinielaPage;
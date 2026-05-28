import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Search, Check, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ============================================
// COMPONENTE: SearchableSelect (para equipos)
// ============================================
const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  label, 
  required,
  disabled,
  name
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const filteredOptions = options.filter(opt =>
    opt.N_EQUIPO?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opt.C_EQUIPO?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.C_EQUIPO === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      const selected = filteredOptions[highlightedIndex];
      if (selected) {
        onChange({ target: { name, value: selected.C_EQUIPO } });
        setIsOpen(false);
        setSearchTerm('');
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && '*'}
      </label>
      
      <div
        className={`w-full px-3 py-2 border border-gray-300 rounded-md bg-white flex items-center justify-between cursor-pointer ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-indigo-400'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {selectedOption ? (
          <div className="flex items-center gap-2">
            {selectedOption.URL_BANDERA && (
              <img 
                src={selectedOption.URL_BANDERA} 
                alt={selectedOption.N_EQUIPO}
                className="w-5 h-4 object-cover rounded"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
            <span className="text-gray-900">
              {selectedOption.N_EQUIPO} ({selectedOption.C_EQUIPO})
            </span>
          </div>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <Search className="h-4 w-4 text-gray-400" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar equipo..."
              className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
          </div>
          
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-center text-gray-500 text-sm">
              No se encontraron equipos
            </div>
          ) : (
            filteredOptions.map((option, idx) => (
              <div
                key={option.C_EQUIPO}
                className={`px-3 py-2 cursor-pointer flex items-center gap-2 hover:bg-indigo-50 ${
                  highlightedIndex === idx ? 'bg-indigo-50' : ''
                } ${value === option.C_EQUIPO ? 'bg-indigo-100' : ''}`}
                onClick={() => {
                  onChange({ target: { name, value: option.C_EQUIPO } });
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
              >
                {option.URL_BANDERA && (
                  <img 
                    src={option.URL_BANDERA} 
                    alt={option.N_EQUIPO}
                    className="w-5 h-4 object-cover rounded"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                )}
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{option.N_EQUIPO}</div>
                  <div className="text-xs text-gray-500">Código: {option.C_EQUIPO}</div>
                </div>
                {value === option.C_EQUIPO && (
                  <Check className="h-4 w-4 text-indigo-600" />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const CrearPartidoPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingFase, setLoadingFase] = useState(false);
  const [campeonatos, setCampeonatos] = useState([]);
  const [quinielas, setQuinielas] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [fases, setFases] = useState([]);
  const [grupos, setGrupos] = useState([]);
  
  // Estado para el modal de nueva fase
  const [showFaseModal, setShowFaseModal] = useState(false);
  const [nuevaFase, setNuevaFase] = useState({ nombre: '' });
  const [isSubmittingFase, setIsSubmittingFase] = useState(false);
  
  const [formData, setFormData] = useState({
    C_CAMPEONATO: '',
    id_quiniela: '',
    id_fase: '',
    EQUIPO_LOCAL: '',
    EQUIPO_VISITANTE: '',
    ID_GRUPO: '',
    FECHA: ''
  });

  useEffect(() => {
    cargarCampeonatos();
  }, []);

  useEffect(() => {
    if (formData.C_CAMPEONATO) {
      cargarEquipos(formData.C_CAMPEONATO);
      cargarQuinielas(formData.C_CAMPEONATO);
      cargarFases(formData.C_CAMPEONATO);
    } else {
      setEquipos([]);
      setQuinielas([]);
      setFases([]);
      setGrupos([]);
    }
  }, [formData.C_CAMPEONATO]);

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
      setCampeonatos(response.data.data || []);
    } catch (error) {
      toast.error('Error al cargar campeonatos');
    }
  };

  const cargarQuinielas = async (C_CAMPEONATO) => {
    try {
      const response = await api.get(`/api/admin/campeonatos/${C_CAMPEONATO}/quinielas`);
      setQuinielas(response.data.data || []);
    } catch (error) {
      toast.error('Error al cargar quinielas');
      setQuinielas([]);
    }
  };

  const cargarFases = async (C_CAMPEONATO) => {
    try {
      const response = await api.get(`/api/partidos/fases/campeonato/${C_CAMPEONATO}`);
      setFases(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar fases:', error);
      toast.error('Error al cargar fases');
      setFases([]);
    }
  };

  const cargarEquipos = async (C_CAMPEONATO) => {
    try {
      const response = await api.get(`/api/equipos/campeonato/${C_CAMPEONATO}`);
      setEquipos(response.data.data || []);
      if (response.data.data?.length === 0) {
        toast.warning(`No hay equipos para el campeonato ${C_CAMPEONATO}`);
      }
    } catch (error) {
      toast.error('Error al cargar equipos');
      setEquipos([]);
    }
  };

  const cargarGrupos = async (id_quiniela) => {
    try {
      console.log(`🔄 Cargando grupos para quiniela: ${id_quiniela}`);
      const response = await api.get(`/api/partidos/grupos/quiniela/${id_quiniela}`);
      console.log('✅ Grupos recibidos:', response.data);
      setGrupos(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar grupos:', error);
      setGrupos([]);
    }
  };

  // ============================================
  // CREAR NUEVA FASE
  // ============================================
  const crearFase = async (e) => {
    e.preventDefault();
    if (isSubmittingFase) return;
    if (!nuevaFase.nombre.trim()) {
      toast.error('El nombre de la fase es requerido');
      return;
    }
    if (!formData.C_CAMPEONATO) {
      toast.error('Primero selecciona un campeonato');
      return;
    }
    
    setIsSubmittingFase(true);
    try {
      await api.post('/api/admin/fases', {
        nombre: nuevaFase.nombre,
        C_CAMPEONATO: formData.C_CAMPEONATO
      });
      toast.success(`✅ Fase "${nuevaFase.nombre}" creada exitosamente`);
      setShowFaseModal(false);
      setNuevaFase({ nombre: '' });
      // Recargar las fases
      await cargarFases(formData.C_CAMPEONATO);
    } catch (error) {
      console.error('Error al crear fase:', error);
      toast.error(error.response?.data?.mensaje || 'Error al crear fase');
    } finally {
      setIsSubmittingFase(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.EQUIPO_LOCAL === formData.EQUIPO_VISITANTE) {
      toast.error('Los equipos deben ser diferentes');
      return;
    }

    setLoading(true);
    
    try {
      await api.post('/api/partidos', {
        C_CAMPEONATO: formData.C_CAMPEONATO,
        id_fase: parseInt(formData.id_fase),
        EQUIPO_LOCAL: formData.EQUIPO_LOCAL,
        EQUIPO_VISITANTE: formData.EQUIPO_VISITANTE,
        ID_GRUPO: formData.ID_GRUPO ? parseInt(formData.ID_GRUPO) : null,
        FECHA: formData.FECHA || null
      });
      
      toast.success('Partido creado exitosamente');
      navigate('/admin');
    } catch (error) {
      console.error('Error:', error.response?.data);
      toast.error(error.response?.data?.mensaje || 'Error al crear partido');
    } finally {
      setLoading(false);
    }
  };

  const esFaseDeGrupos = () => {
    const faseSeleccionada = fases.find(f => f.ID === parseInt(formData.id_fase));
    return faseSeleccionada?.TIPO === 'GRUPOS';
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

          {/* Fase - CON BOTÓN PARA CREAR NUEVA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fase del Torneo *
            </label>
            <div className="flex gap-2">
              <select
                name="id_fase"
                required
                value={formData.id_fase}
                onChange={handleChange}
                disabled={!formData.id_quiniela}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              >
                <option value="">Selecciona una fase</option>
                {fases.map((fase) => (
                  <option key={fase.ID} value={fase.ID}>
                    {fase.NOMBRE} {fase.TIPO && `(${fase.TIPO})`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowFaseModal(true)}
                className="bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 flex items-center gap-1"
                title="Crear nueva fase"
              >
                <Plus className="h-4 w-4" />
                Nueva
              </button>
            </div>
          </div>
          
          {/* Equipos con Searchable Select */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchableSelect
              name="EQUIPO_LOCAL"
              options={equipos}
              value={formData.EQUIPO_LOCAL}
              onChange={handleChange}
              placeholder="Buscar equipo local..."
              label="Equipo Local"
              required
              disabled={!formData.C_CAMPEONATO}
            />
            
            <SearchableSelect
              name="EQUIPO_VISITANTE"
              options={equipos}
              value={formData.EQUIPO_VISITANTE}
              onChange={handleChange}
              placeholder="Buscar equipo visitante..."
              label="Equipo Visitante"
              required
              disabled={!formData.C_CAMPEONATO}
            />
          </div>
          
          {/* Grupo - Solo visible si es fase de grupos */}
          {esFaseDeGrupos() && grupos.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grupo *
              </label>
              <select
                name="ID_GRUPO"
                required={esFaseDeGrupos()}
                value={formData.ID_GRUPO}
                onChange={handleChange}
                disabled={!formData.id_quiniela}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              >
                <option value="">Selecciona un grupo</option>
                {grupos.map((grupo) => (
                  <option key={grupo.ID_GRUPO} value={grupo.ID_GRUPO}>
                    Grupo {grupo.NOMBRE} ({grupo.TotalEquipos || 0} equipos)
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha y Hora del Partido
            </label>
            <input
              type="datetime-local"
              name="FECHA"
              value={formData.FECHA}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !formData.C_CAMPEONATO || !formData.id_quiniela || !formData.id_fase || !formData.EQUIPO_LOCAL || !formData.EQUIPO_VISITANTE || (esFaseDeGrupos() && !formData.ID_GRUPO)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creando...' : 'Crear Partido'}
            </button>
          </div>
        </form>
      </div>

      {/* MODAL PARA CREAR NUEVA FASE */}
      {showFaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Crear Nueva Fase</h2>
              <button onClick={() => setShowFaseModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={crearFase}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Fase *
                </label>
                <input
                  type="text"
                  required
                  value={nuevaFase.nombre}
                  onChange={(e) => setNuevaFase({ nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: Fase de grupos, Octavos, Semifinal, Final"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  La fase se creará para el campeonato: {formData.C_CAMPEONATO}
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowFaseModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFase}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {isSubmittingFase ? 'Creando...' : 'Crear Fase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrearPartidoPage;
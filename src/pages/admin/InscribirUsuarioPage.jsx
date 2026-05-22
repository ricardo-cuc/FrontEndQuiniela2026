import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const InscribirUsuarioPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [quinielas, setQuinielas] = useState([]);
  const [formData, setFormData] = useState({
    id_quiniela: '',
    U_CODIGO: '',
    estado: 'ACTIVO'
  });

  // Cargar quinielas al iniciar
  useEffect(() => {
    cargarQuinielas();
  }, []);

  const cargarQuinielas = async () => {
    try {
      const response = await api.get('/api/quinielas');
      setQuinielas(response.data.data || []);
    } catch (error) {
      toast.error('Error al cargar quinielas');
      console.error(error);
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
    
    // Validar que el código tenga 5 caracteres
    if (formData.U_CODIGO.trim().length !== 5) {
      toast.error('El código de usuario debe tener exactamente 5 caracteres');
      setLoading(false);
      return;
    }

    try {
      await api.post(`/api/admin/quinielas/${formData.id_quiniela}/usuarios`, {
        U_CODIGO: formData.U_CODIGO.trim(),
        estado: formData.estado
      });
      toast.success('✅ Usuario inscrito exitosamente');
      navigate('/admin');
    } catch (error) {
      // 🔥 Mostrar el mensaje exacto del servidor
      const mensaje = error.response?.data?.mensaje || 
                      error.response?.data?.message || 
                      error.response?.data?.error ||
                      'Error al inscribir usuario';
      toast.error(`❌ ${mensaje}`);
      console.error('Error detallado:', error.response?.data);
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
        <h1 className="text-2xl font-bold mb-6">Inscribir Usuario a Quiniela</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quiniela *
            </label>
            <select
              name="id_quiniela"
              required
              value={formData.id_quiniela}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Selecciona una quiniela</option>
              {quinielas.map((quiniela) => (
                <option key={quiniela.ID_QUINIELA} value={quiniela.ID_QUINIELA}>
                  {quiniela.NOMBRE} (ID: {quiniela.ID_QUINIELA}) - {quiniela.C_CAMPEONATO}
                </option>
              ))}
            </select>
            {quinielas.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                No hay quinielas disponibles. Crea una primero.
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código de Usuario * (5 caracteres)
            </label>
            <input
              type="text"
              name="U_CODIGO"
              required
              maxLength={5}
              value={formData.U_CODIGO}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ej: 00656, U0001, ADMIN"
            />
            <p className="text-xs text-gray-400 mt-1">
              Ingresa el código de 5 caracteres del usuario (ej: 00656, U0001, ADMIN)
            </p>
          </div>
          
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
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !formData.id_quiniela || !formData.U_CODIGO}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {loading ? 'Inscribiendo...' : 'Inscribir Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InscribirUsuarioPage;